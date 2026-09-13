/**
 * Validation des adresses email à l'inscription. Source de vérité côté
 * serveur (voir src/app/api/auth/register/route.ts) — deux mécanismes
 * complémentaires :
 *
 * 1. Liste statique : domaines jetables/spam connus + détection de l'astuce
 *    "points Gmail" (gmail.com ignore les points dans la partie locale, ce
 *    qui permet de générer un nombre illimité de fausses identités pointant
 *    vers la même boîte réelle — utilisé pour la fraude/multi-comptes).
 * 2. Liste dynamique (table blocked_emails) : alimentée automatiquement par
 *    le webhook Resend (src/app/api/webhooks/resend/route.ts) quand un email
 *    envoyé par le système fait l'objet d'un vrai rebond ("hard bounce").
 */

import { db } from '@/db';
import { blockedEmailsTable } from '@/schema';
import { eq } from 'drizzle-orm';

// Domaines jetables/spam connus. Liste non exhaustive : à compléter au besoin.
const DISPOSABLE_DOMAINS = new Set([
  'eu-24x7.com',
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'guerrillamail.biz',
  'guerrillamail.de',
  'sharklasers.com',
  '10minutemail.com',
  '10minutemail.net',
  'tempmail.com',
  'temp-mail.org',
  'yopmail.com',
  'yopmail.fr',
  'throwawaymail.com',
  'trashmail.com',
  'getnada.com',
  'dispostable.com',
  'maildrop.cc',
  'fakeinbox.com',
  'mailnesia.com',
  'mintemail.com',
  'moakt.com',
  'mohmal.com',
  'discard.email',
  'emailondeck.com',
  'crazymailing.com',
]);

const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com']);

// Un email légitime contient rarement plus de 2 points dans sa partie locale.
const MAX_GMAIL_DOTS = 3;

export interface EmailValidationResult {
  allowed: boolean;
  reason?: string;
}

function splitEmail(email: string): { local: string; domain: string } | null {
  const at = email.lastIndexOf('@');
  if (at === -1) return null;
  return { local: email.slice(0, at), domain: email.slice(at + 1) };
}

function checkStaticRules(normalizedEmail: string): EmailValidationResult {
  const parts = splitEmail(normalizedEmail);
  if (!parts) return { allowed: false, reason: 'invalid_format' };

  if (DISPOSABLE_DOMAINS.has(parts.domain)) {
    return { allowed: false, reason: 'disposable_domain' };
  }

  if (GMAIL_DOMAINS.has(parts.domain)) {
    const dotCount = (parts.local.match(/\./g) || []).length;
    if (dotCount >= MAX_GMAIL_DOTS) {
      return { allowed: false, reason: 'gmail_dot_abuse' };
    }
  }

  return { allowed: true };
}

/**
 * Vérifie une adresse email au moment de l'inscription. Ne lève jamais
 * d'exception : une erreur de lecture de la liste dynamique ne doit pas
 * bloquer l'inscription (fail-open sur cette partie, la liste statique
 * reste appliquée).
 */
export async function validateEmailForRegistration(email: string): Promise<EmailValidationResult> {
  const normalized = email.toLowerCase().trim();

  const staticResult = checkStaticRules(normalized);
  if (!staticResult.allowed) return staticResult;

  try {
    const blocked = await db
      .select({ id: blockedEmailsTable.id })
      .from(blockedEmailsTable)
      .where(eq(blockedEmailsTable.email, normalized))
      .limit(1);

    if (blocked.length > 0) {
      return { allowed: false, reason: 'previously_bounced' };
    }
  } catch (error) {
    console.error('❌ [EmailValidation] Erreur lors de la vérification de la liste noire dynamique:', error);
  }

  return { allowed: true };
}
