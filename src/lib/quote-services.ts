/**
 * Vocabulaire unique des services proposés dans les demandes de devis.
 *
 * Une seule liste pour le formulaire de devis, le formulaire de contact,
 * l'allowlist de validation serveur et l'affichage admin. Avant ce module,
 * /contact et /quote-request envoyaient chacun leur propre libellé dans la
 * même colonne `quotes.service` ("Transfert Aéroport AIBD Dakar" d'un côté,
 * "transport, vip" de l'autre) : l'admin voyait des valeurs incohérentes et
 * aucune icône ne correspondait jamais.
 */

export const QUOTE_SERVICES = [
  { id: 'airport', label: 'Transfert aéroport' },
  { id: 'transport', label: 'Transport standard' },
  { id: 'vip', label: 'Transport VIP' },
  { id: 'tour', label: 'Tour & Excursion' },
  { id: 'rental', label: 'Location avec chauffeur' },
  { id: 'event', label: 'Transport événementiel' },
] as const;

export type QuoteServiceId = (typeof QUOTE_SERVICES)[number]['id'];

/**
 * Demande de convention entreprise (/entreprises). Volontairement hors de
 * QUOTE_SERVICES : elle n'est jamais proposée dans les listes déroulantes
 * publiques, mais elle est acceptée côté serveur et affichée dans le pipeline
 * commercial comme les autres demandes.
 */
export const CONVENTION_SERVICE_ID = 'convention';

const LABELS: Record<string, string> = {
  ...Object.fromEntries(QUOTE_SERVICES.map((s) => [s.id, s.label])),
  [CONVENTION_SERVICE_ID]: 'Convention entreprise',
};

/** Ids acceptés à l'écriture (allowlist de validation serveur, tuple pour z.enum). */
export const QUOTE_SERVICE_IDS = QUOTE_SERVICES.map((s) => s.id) as [QuoteServiceId, ...QuoteServiceId[]];

/**
 * Libellé affichable. Les lignes créées avant l'unification contiennent des
 * chaînes libres ("Transfert Aéroport Thies", "transport, vip") : on les rend
 * telles quelles plutôt que d'afficher un vide.
 */
export function getQuoteServiceLabel(service: string | null | undefined): string {
  if (!service) return '—';
  return LABELS[service] ?? service;
}

/** Champs métier d'une demande de devis, stockés dans la colonne `message`. */
export interface QuoteMessageDetails {
  service: string;
  numberOfPeople: number | string;
  duration: number | string;
  departure: string;
  destination: string;
  paymentMode?: string;
  description?: string;
  /** Ligne de traçabilité ajoutée quand c'est l'admin qui saisit pour le client. */
  enteredBy?: string;
}

/**
 * Compose la colonne `quotes.message`.
 *
 * Le format n'est pas décoratif : l'acceptation d'un devis par le client
 * reconstruit une réservation en relisant ces lignes à la regex
 * (`Départ:` / `Destination:` / `N personne`, voir
 * src/app/api/quotes/client/actions/route.ts). Le formulaire public et la
 * saisie admin doivent donc écrire exactement la même chose — d'où ce
 * constructeur unique.
 */
export function buildQuoteMessage(details: QuoteMessageDetails): string {
  const lines = [
    `Demande de devis pour ${details.numberOfPeople} personne(s).`,
    `Service: ${getQuoteServiceLabel(details.service)}`,
    `Durée: ${details.duration} jour(s)`,
    `Départ: ${details.departure}`,
    `Destination: ${details.destination}`,
    `Mode de paiement souhaité: ${details.paymentMode || 'Non spécifié'}`,
    '',
    `Description: ${details.description || ''}`,
  ];
  if (details.enteredBy) {
    lines.push('', `Saisie: par ${details.enteredBy} pour le compte du client (téléphone)`);
  }
  return lines.join('\n');
}

/**
 * Relit les champs métier d'un `message` composé par buildQuoteMessage.
 * Tolérant : les devis antérieurs à l'unification n'ont pas toutes les lignes.
 */
export function parseQuoteMessage(message: string | null | undefined) {
  const text = message || '';
  const pick = (re: RegExp) => text.match(re)?.[1]?.trim() || null;
  return {
    departure: pick(/Départ:\s*(.+?)(?:\n|$)/i),
    destination: pick(/Destination:\s*(.+?)(?:\n|$)/i),
    numberOfPeople: pick(/(\d+)\s*personne/i),
  };
}
