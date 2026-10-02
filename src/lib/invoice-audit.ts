/**
 * Journal interne des corrections de facture.
 *
 * Meme principe que le differentiel des reservations
 * (src/app/api/admin/bookings/[id]/route.ts) : on compare l'etat lu en base aux
 * valeurs qui vont etre ecrites, AVANT l'ecriture, et le meme tableau sert a la
 * fois la trace, la garde de notification et le message de retour.
 *
 * La trace est stockee dans `invoices.internal_notes` et non dans `notes` :
 * cette derniere est imprimee dans le pied legal du PDF client
 * (src/lib/invoice-pdf.ts) et renvoyee au client par /api/invoices.
 */

import type { InvoiceLineItem, SelectInvoice } from '@/schema';
import { round2 } from './invoice-validation';

/** Nombre d'entrees conservees. Au-dela, les plus anciennes sont tronquees. */
export const MAX_AUDIT_ENTRIES = 20;

/** Plafond de taille, pour que la modale reste lisible et le GET raisonnable. */
export const MAX_AUDIT_LENGTH = 8000;

const TRUNCATION_MARKER = '[...] entrees plus anciennes tronquees';

export interface InvoiceChange {
  labelFr: string;
  before: string;
  after: string;
}

/** Issue de l'envoi au client, documentee dans la trace. */
export type EmailOutcome =
  | 'none'
  | 'sent'
  | 'queued'
  | 'skipped-cancelled'
  | 'skipped-no-email';

const EMAIL_OUTCOME_LABELS: Record<EmailOutcome, string> = {
  none: '',
  sent: 'email client renvoye',
  queued: 'email en file de renvoi (echec immediat)',
  'skipped-cancelled': 'email non envoye (facture annulee)',
  'skipped-no-email': 'email non envoye (aucune adresse)',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'brouillon',
  pending: 'en attente',
  paid: 'payee',
  cancelled: 'annulee',
  overdue: 'en retard',
};

/** Champs traces. `items` est traite a part (resume, jamais le JSON brut). */
export const INVOICE_TRACKED_FIELDS = [
  { key: 'customerName', labelFr: 'Client', kind: 'text' },
  { key: 'customerEmail', labelFr: 'Email', kind: 'text' },
  { key: 'customerPhone', labelFr: 'Telephone', kind: 'text' },
  { key: 'customerAddress', labelFr: 'Adresse', kind: 'text' },
  { key: 'customerNinea', labelFr: 'NINEA', kind: 'text' },
  { key: 'service', labelFr: 'Service', kind: 'text' },
  { key: 'documentObject', labelFr: 'Objet', kind: 'text' },
  { key: 'quoteReference', labelFr: 'Ref. devis', kind: 'text' },
  { key: 'issueDate', labelFr: 'Emission', kind: 'date' },
  { key: 'dueDate', labelFr: 'Echeance', kind: 'date' },
  { key: 'paidDate', labelFr: 'Paiement', kind: 'date' },
  { key: 'amount', labelFr: 'Montant HT', kind: 'money' },
  { key: 'taxRate', labelFr: 'Taux de TVA', kind: 'rate' },
  { key: 'totalAmount', labelFr: 'Total', kind: 'money' },
  { key: 'status', labelFr: 'Statut', kind: 'status' },
  { key: 'paymentMethod', labelFr: 'Moyen de paiement', kind: 'text' },
  { key: 'notes', labelFr: 'Note client', kind: 'excerpt' },
] as const;

type TrackedKind = (typeof INVOICE_TRACKED_FIELDS)[number]['kind'];

function formatMoney(value: number): string {
  return value.toLocaleString('fr-FR');
}

export function displayInvoiceValue(kind: TrackedKind, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';

  switch (kind) {
    case 'date':
      return new Date(value as string | Date).toLocaleDateString('fr-FR');
    case 'money': {
      const parsed = parseFloat(String(value));
      return Number.isFinite(parsed) ? `${formatMoney(parsed)} FCFA` : String(value);
    }
    case 'rate': {
      const parsed = parseFloat(String(value));
      return Number.isFinite(parsed) ? `${parsed} %` : String(value);
    }
    case 'status':
      return STATUS_LABELS[String(value)] ?? String(value);
    case 'excerpt': {
      const text = String(value).replace(/\s+/g, ' ').trim();
      return text.length > 60 ? `${text.slice(0, 60)}...` : text;
    }
    default:
      return String(value);
  }
}

/**
 * Empreinte normalisee des lignes : insensible a `total` (recalcule serveur) et
 * a l'ordre des cles de l'objet, sensible a l'ordre des lignes (il s'imprime).
 */
export function itemsSignature(items: InvoiceLineItem[] | null | undefined): string {
  if (!items || items.length === 0) return '[]';
  return JSON.stringify(
    items.map((item) => [item.description, item.details ?? '', item.quantity, round2(item.price)])
  );
}

function itemsLabel(items: InvoiceLineItem[] | null | undefined): string {
  if (!items || items.length === 0) return 'aucune ligne';
  const total = round2(items.reduce((sum, item) => sum + item.total, 0));
  return `${items.length} ligne${items.length > 1 ? 's' : ''} (${formatMoney(total)} FCFA)`;
}

/**
 * Resume d'un changement de lignes. Jamais le JSON : illisible, et c'est lui qui
 * ferait exploser la taille du journal. On precise la ligne ajoutee ou retiree
 * quand il n'y en a qu'une, sinon on s'arrete au compte et au total.
 */
export function summarizeItems(
  before: InvoiceLineItem[] | null | undefined,
  after: InvoiceLineItem[] | null | undefined
): { before: string; after: string } {
  const beforeDescriptions = (before ?? []).map((item) => item.description);
  const afterDescriptions = (after ?? []).map((item) => item.description);

  const removed = beforeDescriptions.filter((d) => !afterDescriptions.includes(d));
  const added = afterDescriptions.filter((d) => !beforeDescriptions.includes(d));

  const detail: string[] = [];
  if (removed.length === 1) detail.push(`ligne retiree : "${removed[0]}"`);
  if (added.length === 1) detail.push(`ligne ajoutee : "${added[0]}"`);

  const afterLabel =
    detail.length > 0 ? `${itemsLabel(after)}, ${detail.join(', ')}` : itemsLabel(after);

  return { before: itemsLabel(before), after: afterLabel };
}

/**
 * Differentiel entre la facture en base et les valeurs a ecrire. Seuls les
 * champs reellement presents dans `updateData` sont examines, et un changement
 * purement de representation ('95000.00' vs '95000') n'en est pas un : les
 * montants sont compares en nombres, le reste sur le libelle affiche.
 */
export function buildInvoiceChanges(
  before: SelectInvoice,
  updateData: Partial<SelectInvoice>
): InvoiceChange[] {
  const changes: InvoiceChange[] = [];
  const previousRecord = before as unknown as Record<string, unknown>;
  const nextRecord = updateData as unknown as Record<string, unknown>;

  for (const field of INVOICE_TRACKED_FIELDS) {
    const next = nextRecord[field.key];
    if (next === undefined) continue;
    const previous = previousRecord[field.key];

    if (field.kind === 'money' || field.kind === 'rate') {
      const a = parseFloat(String(previous ?? ''));
      const b = parseFloat(String(next ?? ''));
      if (Number.isFinite(a) && Number.isFinite(b) && round2(a) === round2(b)) continue;
    }

    if (field.kind === 'date' && previous && next) {
      const a = new Date(previous as string | Date).getTime();
      const b = new Date(next as string | Date).getTime();
      if (a === b) continue;
    }

    const beforeLabel = displayInvoiceValue(field.kind, previous);
    const afterLabel = displayInvoiceValue(field.kind, next);
    if (beforeLabel === afterLabel) continue;

    changes.push({ labelFr: field.labelFr, before: beforeLabel, after: afterLabel });
  }

  if (updateData.items !== undefined) {
    if (itemsSignature(before.items) !== itemsSignature(updateData.items)) {
      const summary = summarizeItems(before.items, updateData.items);
      changes.push({ labelFr: 'Lignes', before: summary.before, after: summary.after });
    }
  }

  return changes;
}

function formatStamp(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()} ${hours}:${minutes}`;
}

/**
 * Ajoute une entree au journal, la plus recente en tete : la modale affiche le
 * dernier geste en premier, et la troncature se fait par la queue.
 *
 * Le journal n'a pas vocation a etre un audit complet (decision actee : pas de
 * table dediee) : la limite est assumee et ecrite dans le texte plutot que
 * masquee.
 */
export function appendInvoiceAuditEntry(
  existing: string | null | undefined,
  input: { actor: string; changes: InvoiceChange[]; emailOutcome?: EmailOutcome; now?: Date }
): string {
  const { actor, changes, emailOutcome = 'none', now = new Date() } = input;

  const body = changes
    .map((change) => `${change.labelFr} : ${change.before} -> ${change.after}`)
    .join(' · ');

  const suffix = EMAIL_OUTCOME_LABELS[emailOutcome];
  const entry = `[${formatStamp(now)}] ${actor} — ${body}${suffix ? ` — ${suffix}` : ''}`;

  const previousEntries = (existing ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line !== TRUNCATION_MARKER);

  let entries = [entry, ...previousEntries].slice(0, MAX_AUDIT_ENTRIES);
  let truncated = entries.length < previousEntries.length + 1;

  while (entries.length > 1 && entries.join('\n').length > MAX_AUDIT_LENGTH) {
    entries = entries.slice(0, -1);
    truncated = true;
  }

  return truncated ? [...entries, TRUNCATION_MARKER].join('\n') : entries.join('\n');
}
