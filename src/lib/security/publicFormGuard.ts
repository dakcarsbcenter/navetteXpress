/**
 * Garde commune aux formulaires publics qui écrivent en base et déclenchent
 * des emails (demande de devis, demande de convention).
 *
 * Ces endpoints sont par nature ouverts : aucune session n'est requise. Le
 * seul garde-fou en place était le rate limit global de src/proxy.ts (30
 * req/min/IP), insuffisant pour des routes qui envoient deux emails par
 * requête acceptée — d'où les demandes de devis générées par des bots
 * (noms aléatoires, adresses Gmail à points).
 *
 * Les briques sont celles déjà présentes dans src/lib/security ; ce module
 * ne fait que les enchaîner dans le bon ordre et factoriser les trois
 * contrôles propres aux formulaires (honeypot, délai de remplissage, origine).
 */

import { NextResponse } from 'next/server';
import { getClientIp } from './ip';
import { consumeRateLimit } from './rateLimiter';
import { addToBlacklist } from './blacklist';
import { logSecurityEvent } from './logger';
import { validatePublicEmail } from './email-validation';
import { isAuthorizedPublicApiCall } from './appToken';

/** Champs anti-bot attendus dans le corps de toute soumission publique. */
export interface PublicFormAntiBotFields {
  /** Honeypot : invisible à l'écran, seul un robot le remplit. */
  companyWebsite?: unknown;
  /** Date (ms) de montage du formulaire, posée côté client. */
  formStartedAt?: unknown;
}

/** Un humain ne remplit pas un formulaire de plusieurs champs en moins de 3 s. */
const MIN_FILL_MS = 3_000;

const DEFAULT_IP_LIMIT = { limit: 5, windowMs: 10 * 60_000 };
const DEFAULT_EMAIL_LIMIT = { limit: 3, windowMs: 60 * 60_000 };

export interface PublicFormGuardOptions {
  /** Préfixe des clés de rate limit et des logs, ex. 'quote' ou 'convention'. */
  scope: string;
  /** Email saisi, déjà extrait du corps (non normalisé). */
  email: string;
  body: PublicFormAntiBotFields;
  /**
   * Réponse renvoyée au robot quand le honeypot est déclenché : elle doit être
   * indiscernable d'un succès, sans quoi le robot ajuste sa charge utile.
   */
  decoyResponse: () => NextResponse;
  ipLimit?: { limit: number; windowMs: number };
  emailLimit?: { limit: number; windowMs: number };
}

export type PublicFormGuardResult =
  | { ok: true; ip: string; normalizedEmail: string }
  | { ok: false; response: NextResponse };

/**
 * Le site répond sur l'apex et sur www : un visiteur arrivé sur
 * navettexpress.com ne doit pas être refusé parce que NEXT_PUBLIC_APP_URL
 * pointe sur www.navettexpress.com.
 */
function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '');
}

function reject(status: number, error: string): PublicFormGuardResult {
  return { ok: false, response: NextResponse.json({ success: false, error }, { status }) };
}

/**
 * Vérifie une soumission de formulaire public. À appeler AVANT toute écriture
 * en base et avant tout envoi d'email.
 */
export async function guardPublicFormSubmission(
  request: Request,
  options: PublicFormGuardOptions
): Promise<PublicFormGuardResult> {
  const { scope, body, decoyResponse } = options;
  const ip = getClientIp(request);
  const path = new URL(request.url).pathname;

  // 1. Honeypot : réponse de succès factice + bannissement de l'IP.
  if (typeof body.companyWebsite === 'string' && body.companyWebsite.trim() !== '') {
    logSecurityEvent('honeypot_hit', { ip, path, scope, field: 'companyWebsite' });
    addToBlacklist(ip);
    return { ok: false, response: decoyResponse() };
  }

  // 2. Délai de remplissage. Une horloge client en avance donne un écart
  //    négatif : on laisse passer plutôt que de bloquer un vrai visiteur.
  const startedAt = Number(body.formStartedAt);
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    logSecurityEvent('rate_limit_exceeded', { ip, path, scope, reason: 'missing_form_started_at' });
    return reject(400, 'Soumission invalide. Merci de recharger la page et de réessayer.');
  }
  const elapsed = Date.now() - startedAt;
  if (elapsed >= 0 && elapsed < MIN_FILL_MS) {
    logSecurityEvent('rate_limit_exceeded', { ip, path, scope, reason: 'too_fast', elapsed });
    return reject(400, 'Soumission trop rapide. Merci de réessayer dans quelques instants.');
  }

  // 3. Origine : la requête doit venir du site. Inactif si NEXT_PUBLIC_APP_URL
  //    n'est pas configuré (local, CI) — même parti pris que appToken.ts.
  const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL;
  if (expectedOrigin) {
    const origin = request.headers.get('origin') || request.headers.get('referer');
    let sameOrigin = false;
    if (origin) {
      try {
        sameOrigin = normalizeHost(new URL(origin).host) === normalizeHost(new URL(expectedOrigin).host);
      } catch {
        sameOrigin = false;
      }
    }
    if (!sameOrigin) {
      logSecurityEvent('public_api_rejected', { ip, path, scope, reason: 'bad_origin', origin });
      return reject(403, 'Requête refusée.');
    }
  }

  // 4. Token applicatif léger : filtre les appels qui n'ont jamais chargé le site.
  if (!(await isAuthorizedPublicApiCall(request))) {
    return reject(403, 'Requête refusée.');
  }

  // 5. Rate limit par IP. Si l'IP n'est pas identifiable (en-tête
  //    X-Forwarded-For absent), tous les visiteurs partageraient le même
  //    compteur : mieux vaut s'en remettre au quota par email que de bloquer
  //    tout le monde au bout de cinq demandes.
  const ipLimit = options.ipLimit ?? DEFAULT_IP_LIMIT;
  const byIp = ip === 'unknown'
    ? { allowed: true, remaining: ipLimit.limit, retryAfterSec: 0 }
    : consumeRateLimit(`${scope}:ip:${ip}`, ipLimit.limit, ipLimit.windowMs);
  if (!byIp.allowed) {
    logSecurityEvent('rate_limit_exceeded', { ip, path, scope, by: 'ip', ...ipLimit });
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Trop de demandes envoyées. Merci de réessayer plus tard.' },
        { status: 429, headers: { 'Retry-After': String(byIp.retryAfterSec) } }
      ),
    };
  }

  // 6. Adresse email : format, domaines jetables, astuce des points Gmail et
  //    adresses ayant déjà rebondi (liste alimentée par le webhook Resend).
  const normalizedEmail = options.email.toLowerCase().trim();
  const emailCheck = await validatePublicEmail(normalizedEmail);
  if (!emailCheck.allowed) {
    logSecurityEvent('public_api_rejected', { ip, path, scope, reason: emailCheck.reason });
    return reject(400, 'Cette adresse email ne peut pas être utilisée. Merci d\u2019en saisir une autre.');
  }

  // 7. Rate limit par email, pour le cas d'un robot distribué sur plusieurs IP.
  const emailLimit = options.emailLimit ?? DEFAULT_EMAIL_LIMIT;
  const byEmail = consumeRateLimit(`${scope}:email:${normalizedEmail}`, emailLimit.limit, emailLimit.windowMs);
  if (!byEmail.allowed) {
    logSecurityEvent('rate_limit_exceeded', { ip, path, scope, by: 'email', ...emailLimit });
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Trop de demandes envoyées. Merci de réessayer plus tard.' },
        { status: 429, headers: { 'Retry-After': String(byEmail.retryAfterSec) } }
      ),
    };
  }

  return { ok: true, ip, normalizedEmail };
}
