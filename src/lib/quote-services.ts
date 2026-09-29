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

/** Une ligne du tableau de trajets d'une demande de devis multi-trajets. */
export interface QuoteTripInput {
  service: string;
  departure: string;
  destination: string;
  /** ISO ou `datetime-local` ; null quand le client ne connait pas encore l'heure. */
  scheduledDateTime?: string | null;
  passengers: number;
  luggage: number;
  note?: string | null;
}

/** Nombre maximum de trajets acceptes dans une meme demande (formulaire public et saisie admin). */
export const MAX_QUOTE_TRIPS = 10;

function formatTripDateTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Compose la colonne `quotes.message` pour une demande multi-trajets.
 *
 * La source de verite est desormais la table `quote_trips` : ce texte reste la
 * trace lisible affichee dans la fiche admin et dans les e-mails. Le trajet 1
 * expose volontairement `Depart:` / `Destination:` / `N personne(s)` pour rester
 * compatible avec parseQuoteMessage et avec les devis anterieurs.
 */
export function buildMultiTripQuoteMessage(details: {
  trips: QuoteTripInput[];
  paymentMode?: string;
  description?: string;
  passengerName?: string | null;
  passengerPhone?: string | null;
  enteredBy?: string;
}): string {
  const { trips } = details;
  const lines: string[] = [
    `Demande de devis — ${trips.length} trajet(s).`,
  ];

  if (details.passengerName) {
    const phone = details.passengerPhone ? ` (${details.passengerPhone})` : '';
    lines.push(`Passager: ${details.passengerName}${phone}`);
  }

  trips.forEach((trip, index) => {
    lines.push('', `Trajet ${index + 1} — ${getQuoteServiceLabel(trip.service)}`);
    lines.push(`Départ: ${trip.departure}`);
    lines.push(`Destination: ${trip.destination}`);
    const when = formatTripDateTime(trip.scheduledDateTime);
    lines.push(`Prise en charge: ${when || 'À définir'}`);
    lines.push(`${trip.passengers} personne(s), ${trip.luggage} bagage(s)`);
    if (trip.note) lines.push(`Note: ${trip.note}`);
  });

  lines.push('', `Mode de paiement souhaité: ${details.paymentMode || 'Non spécifié'}`);
  lines.push('', `Description: ${details.description || ''}`);

  if (details.enteredBy) {
    lines.push('', `Saisie: par ${details.enteredBy} pour le compte du client (téléphone)`);
  }

  return lines.join('\n');
}
