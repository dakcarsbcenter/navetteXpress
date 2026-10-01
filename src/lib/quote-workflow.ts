/**
 * Cycle de vie d'un devis, cote serveur comme cote admin.
 *
 * Jusqu'ici n'importe quel statut pouvait etre pousse par PUT /api/quotes/[id],
 * et deux valeurs de l'enum (`in_progress`, `expired`) n'etaient jamais ecrites
 * par aucun code : la colonne kanban « En cours de traitement » restait donc
 * vide en permanence. Cette table est la source unique des transitions, partagee
 * par l'API (qui refuse le reste) et par le selecteur d'etape du back-office.
 */

export type QuoteStatus =
  | 'pending'
  | 'in_progress'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired';

/** Etapes du pipeline commercial, dans l'ordre ou l'admin les parcourt. */
export const QUOTE_PIPELINE: readonly QuoteStatus[] = [
  'pending',
  'in_progress',
  'sent',
  'accepted',
];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: 'En attente',
  in_progress: 'En cours de traitement',
  sent: 'Devis envoyé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  expired: 'Expiré',
};

/**
 * Transitions autorisees. `accepted` est terminal : ce qui suit un accord n'est
 * plus le devis mais la facture, et les reservations qui en decoulent sont deja
 * parties chez les chauffeurs.
 */
export const QUOTE_TRANSITIONS: Record<QuoteStatus, readonly QuoteStatus[]> = {
  pending: ['in_progress', 'sent', 'rejected'],
  in_progress: ['pending', 'sent', 'rejected'],
  // Un client qui renegocie ramene le devis en chiffrage.
  sent: ['in_progress', 'accepted', 'rejected', 'expired'],
  accepted: [],
  rejected: ['pending'],
  expired: ['pending'],
};

export function canTransition(from: QuoteStatus, to: QuoteStatus): boolean {
  if (from === to) return true;
  return QUOTE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionError(from: QuoteStatus, to: QuoteStatus): string {
  const allowed = QUOTE_TRANSITIONS[from] ?? [];
  if (allowed.length === 0) {
    return `Un devis « ${QUOTE_STATUS_LABELS[from]} » ne peut plus changer d'étape.`;
  }
  const list = allowed.map((status) => QUOTE_STATUS_LABELS[status]).join(', ');
  return `Passage impossible de « ${QUOTE_STATUS_LABELS[from]} » à « ${QUOTE_STATUS_LABELS[to]} ». Étapes possibles : ${list}.`;
}
