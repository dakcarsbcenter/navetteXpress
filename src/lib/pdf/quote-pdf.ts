/**
 * PDF du devis officiel, conforme au modele valide
 * (NavetteXpress_Modele_Devis-officiel).
 *
 * Isomorphe : la route API l'appelle en Node pour servir le fichier et le
 * joindre a l'email, l'admin l'appelle dans le navigateur pour l'apercu.
 */

import { COLORS, DEFAULT_TAX_RATE, COMPANY_INFO, formatDocumentDate } from './brand';
import {
  createDocument,
  drawCorridor,
  drawHeader,
  drawItemsTable,
  drawLegalFooter,
  drawMetaRow,
  drawParties,
  drawPaymentAndTotals,
  drawSignatures,
  type DocumentBadge,
  type DocumentItem,
  type PdfDoc,
} from './layout';

export interface QuoteDocumentData {
  reference: string;
  status: string;
  issueDate: Date | string;
  validUntil: Date | string | null;
  object: string;
  customer: {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    ninea?: string | null;
  };
  items: DocumentItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

/**
 * Un devis envoye et un devis encore en chiffrage portent le meme message pour
 * le client : rien n'est engage tant qu'il n'a pas signe.
 */
const STATUS_BADGES: Record<string, DocumentBadge> = {
  pending: { label: "En attente d'accord", fill: COLORS.earth, text: COLORS.white },
  in_progress: { label: "En attente d'accord", fill: COLORS.earth, text: COLORS.white },
  sent: { label: "En attente d'accord", fill: COLORS.earth, text: COLORS.white },
  accepted: { label: 'Accepté', fill: COLORS.accent, text: COLORS.white },
  rejected: { label: 'Refusé', fill: COLORS.muted, text: COLORS.white },
  expired: { label: 'Expiré', fill: COLORS.muted, text: COLORS.white },
};

const LEGAL_MENTIONS =
  "Prix fixes, péage et carburant compris. Attente gratuite à l'aéroport en cas de retard de vol. " +
  "Annulation gratuite jusqu'à 24 h avant la prise en charge. Devis valable 30 jours. " +
  'CGV : navettexpress.com/cgv';

export async function generateQuotePDF(data: QuoteDocumentData): Promise<PdfDoc> {
  const doc = await createDocument();

  let y = drawHeader(doc, {
    kind: 'Devis',
    number: data.reference,
    badge: STATUS_BADGES[data.status] ?? STATUS_BADGES.pending,
  });

  y = drawCorridor(doc, y) + 10;

  // Les coordonnees absentes (client particulier sans NINEA ni adresse) sont
  // omises plutot que rendues comme des champs vides.
  const clientLines = [
    data.customer.address,
    data.customer.phone,
    data.customer.email,
    data.customer.ninea ? `NINEA : ${data.customer.ninea}` : null,
  ].filter((line): line is string => Boolean(line));

  y = drawParties(doc, y, {
    issuer: {
      name: COMPANY_INFO.name,
      lines: [
        COMPANY_INFO.address,
        COMPANY_INFO.phone,
        COMPANY_INFO.email,
        `NINEA : ${COMPANY_INFO.ninea}`,
      ],
    },
    client: { name: data.customer.name, lines: clientLines },
  });

  y = drawMetaRow(doc, y + 12, [
    { label: "Date d'émission", value: formatDocumentDate(data.issueDate) },
    { label: "Valable jusqu'au", value: formatDocumentDate(data.validUntil) },
    { label: 'Objet', value: data.object },
  ]);

  y = drawItemsTable(doc, y + 8, data.items);

  y = drawPaymentAndTotals(doc, y + 12, {
    subtotal: data.subtotal,
    taxRate: data.taxRate,
    taxAmount: data.taxAmount,
    total: data.total,
  });

  drawSignatures(doc, y + 14, [
    'Bon pour accord — nom, date et signature du client',
    'Cachet et signature Navette Xpress',
  ]);

  drawLegalFooter(doc, LEGAL_MENTIONS);

  return doc;
}

/** Sortie serveur : le binaire a servir en reponse HTTP ou a joindre a un email. */
export async function renderQuotePDFBuffer(data: QuoteDocumentData): Promise<Buffer> {
  const doc = await generateQuotePDF(data);
  return Buffer.from(doc.output('arraybuffer'));
}

export { DEFAULT_TAX_RATE };
