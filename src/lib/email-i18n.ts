/**
 * Socle bilingue FR/EN des notifications (emails et WhatsApp).
 *
 * Choix d'architecture : un seul message contient les deux langues (bloc français puis
 * bloc anglais), plutôt qu'une version par langue. La raison est concrète — une grande
 * partie des réservations est créée par des visiteurs non connectés dont on ne connaît
 * ni le compte ni la langue, et côté WhatsApp chaque langue supplémentaire exige un
 * template distinct approuvé par Meta. Un message bilingue évite les deux problèmes.
 *
 * Règles appliquées partout :
 *  - libellés de données : "Français / English" sur une ligne, la valeur n'est écrite qu'une fois
 *  - phrases : paragraphe FR puis paragraphe EN juste en dessous, en gris plus clair
 *  - dates : JJ/MM/AAAA HH:MM (non ambigu entre les deux langues, contrairement aux formats locaux)
 *  - montants : FCFA (la tarification est en francs CFA, pas en euros)
 */

export const BRAND_GREEN = '#1F5245';
export const TEXT_DARK = '#1f2937';
export const TEXT_MUTED = '#6b7280';
export const BORDER_LIGHT = '#e5e7eb';

/** Libellé bilingue d'un champ : "Départ / Pick-up". */
export function bi(fr: string, en: string): string {
  return fr === en ? fr : `${fr} / ${en}`;
}

/** Sujet d'email bilingue : "Réservation confirmée #128 · Booking confirmed #128". */
export function biSubject(fr: string, en: string): string {
  return `${fr} · ${en}`;
}

/**
 * Date au format JJ/MM/AAAA HH:MM, en heure de Dakar.
 *
 * `date` peut arriver en chaîne ISO quand le job a transité par la file de retry : le
 * payload y est sérialisé en JSON, ce qui ne préserve pas le type Date.
 */
export function formatDateTimeBilingual(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Dakar',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

/** Date seule, JJ/MM/AAAA. */
export function formatDateBilingual(date: Date | string): string {
  return formatDateTimeBilingual(date).split(' ')[0];
}

/** Montant en francs CFA, séparateur d'espace insécable : "25 000 FCFA". */
export function formatFCFA(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '—';
  const n = typeof amount === 'number' ? amount : parseFloat(String(amount));
  if (!Number.isFinite(n)) return String(amount);
  return `${Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`;
}

/** Statuts de vol, bilingues : "Prévu / Scheduled". */
export const FLIGHT_STATUS_LABELS_BILINGUAL: Record<string, string> = {
  scheduled: bi('Prévu', 'Scheduled'),
  active: bi('En vol', 'In flight'),
  landed: bi('Atterri', 'Landed'),
  cancelled: bi('Annulé', 'Cancelled'),
  incident: bi('Incident', 'Incident'),
  diverted: bi('Dérouté', 'Diverted'),
  unknown: bi('Inconnu', 'Unknown'),
};

export function flightStatusBilingual(status: string | null | undefined): string {
  if (!status) return bi('Non renseigné', 'Not provided');
  return FLIGHT_STATUS_LABELS_BILINGUAL[status] || status;
}

/** "2 valises / 2 bags". */
export function luggageBilingual(count: number): string {
  return `${count} valise${count > 1 ? 's' : ''} / ${count} bag${count > 1 ? 's' : ''}`;
}

export function passengersBilingual(count: number): string {
  return `${count} passager${count > 1 ? 's' : ''} / ${count} passenger${count > 1 ? 's' : ''}`;
}

export const NOT_PROVIDED = bi('Non renseigné', 'Not provided');

// ---------------------------------------------------------------------------
// Fragments HTML partagés par les templates email
// ---------------------------------------------------------------------------

/** Échappe une valeur avant interpolation dans le HTML d'un email. */
export function esc(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Titre bilingue : ligne FR en gros, ligne EN en dessous, plus discrète. */
export function headingBlock(emoji: string, fr: string, en: string): string {
  return `
    <div style="margin-bottom: 24px;">
      <p style="color: ${BRAND_GREEN}; font-size: 22px; font-weight: bold; margin: 0;">
        ${emoji} ${esc(fr)}
      </p>
      <p style="color: ${TEXT_MUTED}; font-size: 16px; margin: 4px 0 0 0;">${esc(en)}</p>
    </div>`;
}

/** Paragraphe FR suivi de sa traduction EN en gris. */
export function paragraphBlock(fr: string, en: string): string {
  return `
    <p style="color: ${TEXT_DARK}; font-size: 15px; line-height: 1.6; margin: 0 0 6px 0;">${esc(fr)}</p>
    <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">${esc(en)}</p>`;
}

export interface DataRow {
  fr: string;
  en: string;
  value: string | number | null | undefined;
}

/**
 * Tableau récapitulatif à libellés bilingues. Les valeurs (adresses, dates, montants)
 * n'y figurent qu'une fois — seul le libellé est dupliqué.
 */
export function dataTable(rows: DataRow[], title?: { fr: string; en: string }): string {
  const body = rows
    .filter((r) => r.value !== undefined)
    .map(
      (r) => `
      <tr>
        <td style="padding: 8px 0; color: ${TEXT_DARK}; font-weight: bold; width: 46%; vertical-align: top;">
          ${esc(r.fr)} <span style="color: ${TEXT_MUTED}; font-weight: normal;">/ ${esc(r.en)}</span>
        </td>
        <td style="padding: 8px 0; color: ${TEXT_DARK};">${esc(r.value)}</td>
      </tr>`
    )
    .join('');

  const heading = title
    ? `<h3 style="color: ${TEXT_DARK}; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid #d1d5db; font-size: 16px;">
         ${esc(title.fr)} <span style="color: ${TEXT_MUTED}; font-weight: normal;">/ ${esc(title.en)}</span>
       </h3>`
    : '';

  return `
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
      ${heading}
      <table style="width: 100%; border-collapse: collapse;">${body}</table>
    </div>`;
}

/** Encart de référence de réservation. */
export function referenceBlock(reference: string | number): string {
  return `
    <div style="background: rgba(31,82,69,.08); border: 1px solid rgba(31,82,69,.3); border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
      <p style="color: ${BRAND_GREEN}; font-size: 12px; font-weight: bold; margin: 0 0 6px 0; letter-spacing: 0.1em; text-transform: uppercase;">
        Référence / Reference
      </p>
      <p style="color: ${BRAND_GREEN}; font-size: 22px; font-weight: bold; margin: 0;">${esc(reference)}</p>
    </div>`;
}

/** Bouton d'action au libellé bilingue. */
export function ctaButton(url: string, fr: string, en: string): string {
  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="background: ${BRAND_GREEN}; color: white; padding: 14px 36px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px;">
        ${esc(fr)} / ${esc(en)}
      </a>
    </div>`;
}

/** En-tête de marque commun à tous les emails. */
export function emailHeader(): string {
  return `
    <div style="background: ${BRAND_GREEN}; padding: 28px 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 26px; letter-spacing: 0.02em;">Navette Xpress</h1>
      <p style="color: rgba(255,255,255,.75); margin: 6px 0 0 0; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;">
        Sûreté · Assistance
      </p>
    </div>`;
}

/**
 * Pied de page bilingue. `audience` ajuste la dernière ligne (mention "administrateur"
 * pour les emails internes), sans changer le reste.
 */
export function emailFooter(audience: 'customer' | 'admin' = 'customer'): string {
  const year = new Date().getFullYear();
  const signature =
    audience === 'admin'
      ? `<p style="text-align: center; color: ${TEXT_MUTED}; font-size: 13px; margin: 6px 0;">Système NavetteXpress / NavetteXpress system</p>`
      : `<p style="text-align: center; color: ${TEXT_MUTED}; font-size: 13px; margin: 6px 0;">Cordialement, l'équipe NavetteXpress</p>
         <p style="text-align: center; color: ${TEXT_MUTED}; font-size: 13px; margin: 0 0 6px 0;">Best regards, the NavetteXpress team</p>`;

  const audienceNote =
    audience === 'admin'
      ? `<p style="text-align: center; color: #9ca3af; font-size: 11px; margin: 12px 0 0 0;">Vous recevez cet email en tant qu'administrateur. / You are receiving this email as an administrator.</p>`
      : `<p style="text-align: center; color: #9ca3af; font-size: 11px; margin: 12px 0 0 0;">Cet email a été envoyé automatiquement. / This email was sent automatically.</p>`;

  return `
    <hr style="border: none; border-top: 1px solid ${BORDER_LIGHT}; margin: 28px 0;">
    ${signature}
    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin: 16px 0 4px 0;">NavetteXpress — Cité Magistrats, Dakar, Sénégal</p>
    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin: 0;">© ${year} NavetteXpress. Tous droits réservés. / All rights reserved.</p>
    ${audienceNote}`;
}

/** Gabarit complet : en-tête de marque + contenu + pied de page. */
export function emailShell(content: string, audience: 'customer' | 'admin' = 'customer'): string {
  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body style="margin: 0; padding: 20px; font-family: Arial, Helvetica, sans-serif; background: #F7F3EC;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E2DACD; border-radius: 8px; overflow: hidden;">
      ${emailHeader()}
      <div style="padding: 28px 24px;">
        ${content}
        ${emailFooter(audience)}
      </div>
    </div>
  </body>
</html>`;
}
