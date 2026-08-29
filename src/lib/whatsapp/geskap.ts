/**
 * Client générique pour l'API WhatsApp Geskap (wrapper HTTP/JSON au-dessus de
 * l'API Cloud officielle de Meta) — voir docs/GESKAP_WHATSAPP.md.
 *
 * Remplace l'ancien service OpenWA (whatsapp-web.js non officiel, numéro
 * bloqué par Meta le 2026-08-29, cf. git log) : ici on passe par un numéro
 * WhatsApp Business vérifié et des templates pré-approuvés par Meta, donc pas
 * de risque de blocage pour usage non conforme aux conditions de Meta.
 */

const API_BASE_URL = process.env.GESKAP_API_BASE_URL || 'https://api-meta.geskap.com';

interface SendTemplateParams {
  to: string;
  template: string;
  variables: string[];
  idempotencyKey: string;
}

interface SendTemplateResult {
  id: string;
  status: string;
  creditsRemaining?: number;
}

/** Un champ optionnel vide n'est jamais envoyé tel quel : Meta rejette les variables vides. */
export function orDash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}

/**
 * Normalise un numéro local en E.164. Les numéros chauffeurs/clients sont
 * historiquement stockés sans indicatif pays (9 chiffres, Sénégal) — voir
 * project-driver-booking-response-flows (même bug rencontré côté OpenWA).
 */
export function toGeskapPhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (raw.trim().startsWith('+')) return `+${digits}`;
  if (digits.length === 9) return `+221${digits}`;
  if (digits.startsWith('221')) return `+${digits}`;
  return `+${digits}`;
}

function maskPhone(phone: string): string {
  return phone.length > 4 ? `${phone.slice(0, -4).replace(/\d/g, '*')}${phone.slice(-4)}` : phone;
}

// Throttle simple : Geskap limite à 5 req/s. Au volume actuel (<500/mois) ceci
// n'entre quasiment jamais en jeu, mais évite un pic (ex: rappels envoyés en
// rafale par le cron) de se faire rate-limiter.
let lastRequestAt = 0;
const MIN_INTERVAL_MS = 250;

async function throttle() {
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();
}

/**
 * Envoie un message WhatsApp basé sur un template pré-approuvé par Meta.
 * Lève une exception en cas d'échec (cohérent avec resend-mailer.ts) —
 * sendWithRetry() (notification-queue.ts) capture et met en file pour retry.
 */
export async function sendWhatsAppTemplate({
  to,
  template,
  variables,
  idempotencyKey,
}: SendTemplateParams): Promise<SendTemplateResult> {
  const apiKey = process.env.GESKAP_API_KEY;
  if (!apiKey) {
    throw new Error('GESKAP_API_KEY is not defined in environment variables');
  }

  const phone = toGeskapPhone(to);
  // Contrainte Meta : une variable vide fait rejeter tout le message.
  const safeVariables = variables.map((v) => orDash(v));

  await throttle();

  const response = await fetch(`${API_BASE_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      to: phone,
      template,
      variables: safeVariables,
      idempotency_key: idempotencyKey,
    }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    // Le template peut ne pas être encore APPROVED par Meta (24-48h après
    // soumission) : on ne suppose jamais qu'il l'est déjà.
    const errorMessage = body?.error || body?.message || `Geskap a répondu ${response.status}`;
    console.error(
      `❌ [WhatsApp/Geskap] Échec envoi "${template}" → ${maskPhone(phone)}: ${errorMessage}`
    );
    throw new Error(errorMessage);
  }

  console.log(
    `✅ [WhatsApp/Geskap] "${template}" → ${maskPhone(phone)} (id=${body?.id}, crédits restants=${body?.credits_remaining ?? '?'})`
  );

  return {
    id: body?.id,
    status: body?.status,
    creditsRemaining: body?.credits_remaining,
  };
}
