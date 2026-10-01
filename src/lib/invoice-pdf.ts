/**
 * PDF de la facture officielle, conforme au modele valide
 * (NavetteXpress_Modele_Facture_officiel).
 *
 * La papeterie est celle de src/lib/pdf/layout.ts, partagee avec le devis : les
 * deux documents ne different que par le titre, le bandeau meta, les zones de
 * signature et les mentions legales.
 *
 * L'API publique (generateInvoicePDF / downloadInvoicePDF / previewInvoicePDF)
 * est inchangee : les quatre vues qui l'utilisent n'ont pas eu a bouger.
 */

import { COLORS, COMPANY_INFO, DEFAULT_TAX_RATE, TAX_EXEMPT_MENTION } from './pdf/brand';
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
} from './pdf/layout';

interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  /** Adresse postale et NINEA du client, affiches dans l'encart CLIENT. */
  customerAddress?: string | null;
  customerNinea?: string | null;
  service: string;
  amountHT: number;
  vatAmount: number;
  amountTTC: number;
  taxRate: number;
  /** Deja formatees en JJ/MM/AAAA par les appelants. */
  issueDate: string;
  dueDate: string;
  status: string;
  /** Objet de la facture, ex: "Transferts chauffeur prive". */
  object?: string | null;
  /** Reference du devis d'origine, case "REF. DEVIS" du modele. */
  quoteReference?: string | null;
  items?: DocumentItem[];
  notes?: string;
}

const STATUS_BADGES: Record<string, DocumentBadge> = {
  paid: { label: 'Payée', fill: COLORS.accent, text: COLORS.white },
  pending: { label: 'En attente de paiement', fill: COLORS.earth, text: COLORS.white },
  overdue: { label: 'En retard', fill: COLORS.danger, text: COLORS.white },
  cancelled: { label: 'Annulée', fill: COLORS.muted, text: COLORS.white },
  draft: { label: 'Brouillon', fill: COLORS.border, text: COLORS.text },
};

const LEGAL_MENTIONS =
  "Facture payable à réception ou à l'échéance indiquée. Toute contestation doit être signalée " +
  'sous 7 jours. CGV : navettexpress.com/cgv';

export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<PdfDoc> {
  const doc = await createDocument();

  let y = drawHeader(doc, {
    kind: 'Facture',
    number: invoiceData.invoiceNumber,
    badge: STATUS_BADGES[(invoiceData.status || 'pending').toLowerCase()] ?? STATUS_BADGES.pending,
  });

  y = drawCorridor(doc, y) + 10;

  const clientLines = [
    invoiceData.customerAddress,
    invoiceData.customerPhone,
    invoiceData.customerEmail,
    invoiceData.customerNinea ? `NINEA : ${invoiceData.customerNinea}` : null,
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
    client: { name: invoiceData.customerName, lines: clientLines },
  });

  // La case "REF. DEVIS" n'apparait que sur les factures issues d'un devis.
  const metaFields = [
    { label: "Date d'émission", value: invoiceData.issueDate },
    { label: 'Échéance', value: invoiceData.dueDate },
    { label: 'Objet', value: invoiceData.object || invoiceData.service },
  ];
  if (invoiceData.quoteReference) {
    metaFields.push({ label: 'Réf. devis', value: invoiceData.quoteReference });
  }

  y = drawMetaRow(doc, y + 12, metaFields);

  const items: DocumentItem[] =
    invoiceData.items && invoiceData.items.length > 0
      ? invoiceData.items
      : [
          {
            description: invoiceData.service,
            quantity: 1,
            price: invoiceData.amountHT,
            total: invoiceData.amountHT,
          },
        ];

  y = drawItemsTable(doc, y + 8, items);

  y = drawPaymentAndTotals(doc, y + 12, {
    subtotal: invoiceData.amountHT,
    taxRate: invoiceData.taxRate ?? DEFAULT_TAX_RATE,
    taxAmount: invoiceData.vatAmount,
    total: invoiceData.amountTTC,
  });

  drawSignatures(doc, y + 14, ['Cachet et signature Navette Xpress', 'Reçu / payé le :']);

  // Sans TVA, le document doit le dire explicitement.
  const taxRate = invoiceData.taxRate ?? DEFAULT_TAX_RATE;
  const legal = taxRate === 0 ? `${TAX_EXEMPT_MENTION} ${LEGAL_MENTIONS}` : LEGAL_MENTIONS;
  const mentions = invoiceData.notes ? `${invoiceData.notes}\n${legal}` : legal;
  drawLegalFooter(doc, mentions);

  return doc;
}

/** Sortie serveur : binaire a servir en reponse HTTP ou a joindre a un email. */
export async function renderInvoicePDFBuffer(invoiceData: InvoiceData): Promise<Buffer> {
  const doc = await generateInvoicePDF(invoiceData);
  return Buffer.from(doc.output('arraybuffer'));
}

export async function downloadInvoicePDF(invoiceData: InvoiceData): Promise<void> {
  const doc = await generateInvoicePDF(invoiceData);
  doc.save(`${invoiceData.invoiceNumber}.pdf`);
}

export async function previewInvoicePDF(invoiceData: InvoiceData): Promise<void> {
  const doc = await generateInvoicePDF(invoiceData);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
