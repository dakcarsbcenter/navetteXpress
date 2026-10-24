import type { Resend } from 'resend';

type Emails = Resend['emails'];

/**
 * Enveloppe `resend.emails` : un envoi sans destinataire est ignoré au lieu
 * d'être tenté.
 *
 * Depuis le 24/10/2026, un visiteur peut réserver avec son seul téléphone
 * (bookings.customer_email = ''). Tous les emails « client » (confirmation,
 * annulation, prix proposé...) partiraient alors vers une adresse vide : Resend
 * les refuse, sendWithRetry les met en file et les rejoue, et le panneau de
 * santé des notifications se remplit de faux échecs. Le client est déjà
 * prévenu par WhatsApp. On répond donc un succès explicite, sans appel réseau.
 */
export function skipBlankRecipients(emails: Emails): Emails {
  return new Proxy(emails, {
    get(target, prop) {
      const value = Reflect.get(target, prop, target);
      if (typeof value !== 'function') return value;
      if (prop !== 'send') return value.bind(target);
      return (async (payload: Parameters<Emails['send']>[0], ...rest: unknown[]) => {
        const recipients = Array.isArray(payload?.to) ? payload.to : [payload?.to];
        if (recipients.every((to) => typeof to !== 'string' || to.trim() === '')) {
          console.info(`✉️ Email « ${String(payload?.subject ?? '')} » ignoré : aucun destinataire (client sans email)`);
          return { data: { id: 'skipped-no-recipient' }, error: null, headers: null };
        }
        return (value as (...args: unknown[]) => unknown).call(target, payload, ...rest);
      }) as Emails['send'];
    },
  });
}
