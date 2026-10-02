/**
 * Primitives de mise en page des documents officiels (devis et facture).
 *
 * Les deux modeles valides sont la meme papeterie a trois differences pres :
 * le titre, le contenu du bandeau meta et les zones de signature. Tout le reste
 * (en-tete, corridor kilometrique, encarts emetteur/client, tableau des
 * prestations, totaux, pied de page) est dessine ici une seule fois.
 *
 * Chaque primitive recoit un `y` et renvoie le `y` suivant : les appelants
 * composent le document de haut en bas sans calculer de coordonnees absolues.
 *
 * Ces fonctions tournent aussi bien dans le navigateur que dans Node (routes
 * API) : ne jamais y toucher a `window` ni a `document`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  COLORS,
  COMPANY_INFO,
  CORRIDOR,
  PAGE,
  PAYMENT_METHODS,
  formatAmount,
  type RGB,
} from './brand';

/** jsPDF n'expose pas de type utilisable cote serveur : on reste volontairement lache. */
export type PdfDoc = any;

export interface DocumentParty {
  name: string;
  lines: string[];
}

export interface DocumentBadge {
  label: string;
  fill: RGB;
  text: RGB;
}

export interface DocumentItem {
  description: string;
  /** Deuxieme ligne en petit sous le libelle, ex: "Berline confort - 47 km". */
  details?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface DocumentTotals {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

/**
 * Cree un document A4 sur fond creme. `import('jspdf')` (et non le build
 * `jspdf.es.min.js`, oriente navigateur) pour rester utilisable en Node.
 */
export async function createDocument(): Promise<PdfDoc> {
  const [mod, autoTableMod] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const JsPDF = (mod as any).jsPDF ?? (mod as any).default;
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  // autoTable s'utilise en appel fonctionnel : on memorise le module sur le doc.
  (doc as any).__autoTable = (autoTableMod as any).default ?? autoTableMod;

  doc.setFillColor(...COLORS.cream);
  doc.rect(0, 0, PAGE.width, PAGE.height, 'F');
  return doc;
}

/** Filet horizontal fin, couleur bordure. */
export function drawRule(doc: PdfDoc, y: number, from = PAGE.marginX, to = PAGE.right): void {
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.4);
  doc.line(from, y, to, y);
}

/** Label mono en majuscules espacees : la signature visuelle de la marque. */
function drawLabel(doc: PdfDoc, text: string, x: number, y: number, align: 'left' | 'right' = 'left'): void {
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(text.toUpperCase(), x, y, { align });
}

/**
 * En-tete : logo NX + wordmark a gauche, nature du document, numero et badge de
 * statut a droite.
 */
export function drawHeader(
  doc: PdfDoc,
  options: { kind: string; number: string; badge?: DocumentBadge },
): number {
  const { kind, number, badge } = options;

  doc.setFillColor(...COLORS.text);
  doc.roundedRect(PAGE.marginX, 16, 12, 12, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.cream);
  doc.text('NX', PAGE.marginX + 6, 23.6, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.text);
  doc.text(COMPANY_INFO.name, PAGE.marginX + 16, 22.5);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text(COMPANY_INFO.tagline, PAGE.marginX + 16, 27);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.text);
  doc.text(kind.toUpperCase(), PAGE.right, 23, { align: 'right' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(`N° ${number}`, PAGE.right, 28.5, { align: 'right' });

  if (badge) {
    const label = badge.label.toUpperCase();
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    const width = doc.getTextWidth(label) + 6;
    const height = 5.5;
    doc.setFillColor(...badge.fill);
    doc.rect(PAGE.right - width, 31, width, height, 'F');
    doc.setTextColor(...badge.text);
    doc.text(label, PAGE.right - 3, 34.8, { align: 'right' });
  }

  return 42;
}

/** Bande de reperes kilometriques, encadree de deux filets. */
export function drawCorridor(doc: PdfDoc, y: number): number {
  drawRule(doc, y);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(CORRIDOR, PAGE.width / 2, y + 6, { align: 'center' });
  drawRule(doc, y + 10);
  return y + 10;
}

/**
 * Encarts emetteur et client cote a cote. Les lignes vides (client sans NINEA,
 * sans adresse) sont omises plutot que rendues comme des tirets.
 */
export function drawParties(
  doc: PdfDoc,
  y: number,
  parties: { issuer: DocumentParty; client: DocumentParty },
): number {
  const gap = 6;
  const boxWidth = (PAGE.contentWidth - gap) / 2;
  const maxLines = Math.max(parties.issuer.lines.length, parties.client.lines.length);
  const boxHeight = 16 + maxLines * 4.6 + 4;

  const columns: Array<{ party: DocumentParty; label: string; x: number }> = [
    { party: parties.issuer, label: 'Émetteur', x: PAGE.marginX },
    { party: parties.client, label: 'Client', x: PAGE.marginX + boxWidth + gap },
  ];

  for (const { party, label, x } of columns) {
    doc.setFillColor(...COLORS.panel);
    doc.rect(x, y, boxWidth, boxHeight, 'F');

    drawLabel(doc, label, x + 5, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...COLORS.text);
    doc.text(party.name, x + 5, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.body);
    party.lines.forEach((line, index) => {
      doc.text(line, x + 5, y + 18.5 + index * 4.6);
    });
  }

  return y + boxHeight;
}

/**
 * Bandeau meta : 2 a 4 colonnes label / valeur. Sert aux dates d'emission et de
 * validite, a l'objet, et a la reference du devis sur une facture.
 */
export function drawMetaRow(
  doc: PdfDoc,
  y: number,
  fields: Array<{ label: string; value: string }>,
): number {
  const columnWidth = PAGE.contentWidth / fields.length;
  let maxHeight = 0;

  fields.forEach((field, index) => {
    const x = PAGE.marginX + index * columnWidth;
    drawLabel(doc, field.label, x, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    const lines: string[] = doc.splitTextToSize(field.value, columnWidth - 5);
    doc.text(lines, x, y + 6);
    maxHeight = Math.max(maxHeight, 6 + lines.length * 4.6);
  });

  return y + maxHeight;
}

/**
 * Tableau des prestations : theme `plain`, pas de zebrage ni de bordures
 * verticales. Le sous-titre de chaque ligne est dessine a la main dans le
 * padding bas de la cellule, ce qui permet deux graisses dans une meme cellule.
 */
/**
 * Tableau des prestations. autoTable pagine de lui-meme : au-dela de ~7 lignes
 * a libelle long, le tableau et tout ce qui suit (totaux, signatures, pied
 * legal) basculent en page 2. Le fond creme n'etant peint qu'a la creation du
 * document, cette page suivante sortait blanche : on la repeint ici, avant que
 * la suite du tableau ne s'y dessine.
 */
export function drawItemsTable(doc: PdfDoc, y: number, items: DocumentItem[]): number {
  const autoTable = (doc as any).__autoTable;
  const firstPage = doc.getNumberOfPages();
  const detailsByRow = new Map<number, string>();
  items.forEach((item, index) => {
    if (item.details) detailsByRow.set(index, item.details);
  });

  let endY = y;

  autoTable(doc, {
    startY: y,
    margin: { left: PAGE.marginX, right: PAGE.width - PAGE.right },
    head: [['PRESTATION', 'QTÉ', 'PRIX UNITAIRE', 'TOTAL']],
    body: items.map((item) => [
      item.description,
      String(item.quantity),
      formatAmount(item.price),
      formatAmount(item.total),
    ]),
    theme: 'plain',
    styles: { font: 'helvetica', lineColor: COLORS.border },
    headStyles: {
      font: 'courier',
      fontSize: 7.5,
      fontStyle: 'bold',
      fillColor: COLORS.panel,
      textColor: COLORS.text,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.text,
      lineWidth: { bottom: 0.2 },
      lineColor: COLORS.border,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: 88, fontStyle: 'bold' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 33, halign: 'right' },
      3: { cellWidth: 33, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data: any) => {
      // Reserve la place du sous-titre sous le libelle de la prestation.
      if (data.section === 'body' && detailsByRow.has(data.row.index)) {
        data.cell.styles.cellPadding = { top: 4, bottom: 9, left: 3, right: 3 };
      }
    },
    didDrawCell: (data: any) => {
      if (data.section !== 'body' || data.column.index !== 0) return;
      const details = detailsByRow.get(data.row.index);
      if (!details) return;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.muted);
      doc.text(details, data.cell.x + 3, data.cell.y + data.cell.height - 4);
    },
    willDrawPage: () => {
      // Jamais sur la premiere page : l'en-tete y est deja dessine, un aplat
      // plein par-dessus l'effacerait.
      if (doc.getNumberOfPages() <= firstPage) return;
      doc.setFillColor(...COLORS.cream);
      doc.rect(0, 0, PAGE.width, PAGE.height, 'F');
    },
    didDrawPage: (data: any) => {
      endY = data.cursor?.y ?? endY;
    },
  });

  return (doc as any).lastAutoTable?.finalY ?? endY;
}

/**
 * Moyens de paiement a gauche, totaux a droite. Le TTC est un bandeau plein
 * lagune, seul aplat de couleur du document.
 */
export function drawPaymentAndTotals(doc: PdfDoc, y: number, totals: DocumentTotals): number {
  drawLabel(doc, 'Modes de paiement', PAGE.marginX, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  doc.text(PAYMENT_METHODS.title, PAGE.marginX, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.muted);
  PAYMENT_METHODS.lines.forEach((line, index) => {
    doc.text(line, PAGE.marginX, y + 12 + index * 4.4);
  });

  const totalsX = 112;
  let cursor = y + 2;

  const row = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.body);
    doc.text(label, totalsX + 4, cursor);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text(value, PAGE.right - 4, cursor, { align: 'right' });
    cursor += 4;
    drawRule(doc, cursor, totalsX, PAGE.right);
    cursor += 6;
  };

  row('Sous-total HT', formatAmount(totals.subtotal));
  // La ligne reste affichee a 0 % : le client doit voir que la TVA a bien ete
  // traitee, et non qu'on l'a oubliee. Le pied legal porte la mention.
  row(`TVA (${totals.taxRate} %)`, formatAmount(totals.taxAmount));

  const bannerHeight = 12;
  doc.setFillColor(...COLORS.accent);
  doc.rect(totalsX, cursor - 4, PAGE.right - totalsX, bannerHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.white);
  // Sans TVA, le total n'est pas un TTC : on ne peut pas l'appeler ainsi.
  doc.text(totals.taxRate === 0 ? 'Total à payer' : 'Total TTC', totalsX + 4, cursor + 4);
  doc.text(formatAmount(totals.total), PAGE.right - 4, cursor + 4, { align: 'right' });

  const totalsBottom = cursor - 4 + bannerHeight;
  const paymentBottom = y + 12 + PAYMENT_METHODS.lines.length * 4.4;
  return Math.max(totalsBottom, paymentBottom);
}

/**
 * Bande verticale dans laquelle vivent les traits de signature.
 *
 * Plancher : les signatures restent au meme endroit d'un document a l'autre
 * meme quand le tableau est court. Plafond : elles ne descendent jamais sur le
 * bloc de mentions legales, ancre lui aussi au bas de page.
 *
 * Au-dela d'une dizaine de prestations le tableau pagine et le pied de page
 * reste sur la premiere page : MAX_QUOTE_TRIPS vaut 10, on ne traite pas ce cas.
 */
const SIGNATURES_MIN_Y = 240;
const SIGNATURES_MAX_Y = 252;

/** Deux traits de signature avec leur libelle mono. */
export function drawSignatures(doc: PdfDoc, y: number, labels: [string, string]): number {
  const gap = 10;
  const width = (PAGE.contentWidth - gap) / 2;
  const lineY = Math.min(Math.max(y, SIGNATURES_MIN_Y), SIGNATURES_MAX_Y);

  doc.setDrawColor(...COLORS.text);
  doc.setLineWidth(0.5);
  doc.line(PAGE.marginX, lineY, PAGE.marginX + width, lineY);
  doc.line(PAGE.marginX + width + gap, lineY, PAGE.right, lineY);

  drawLabel(doc, labels[0], PAGE.marginX, lineY + 5);
  drawLabel(doc, labels[1], PAGE.marginX + width + gap, lineY + 5);

  return lineY + 5;
}

/**
 * Mentions legales puis barre de contact sur fond panneau.
 *
 * Le bloc de mentions est ancre au bas de page et non au flux : c'est ce qui
 * garantit l'ecart avec les libelles de signature, qui remontaient dessus.
 */
export function drawLegalFooter(doc: PdfDoc, mentions: string): void {
  const barHeight = 9;
  const barY = PAGE.height - 22;
  const mentionsTop = barY - 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.muted);
  const lines: string[] = doc.splitTextToSize(mentions, PAGE.contentWidth);
  doc.text(lines, PAGE.marginX, mentionsTop - (lines.length - 1) * 3.2);

  doc.setFillColor(...COLORS.panel);
  doc.rect(PAGE.marginX, barY, PAGE.contentWidth, barHeight, 'F');
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    `SUPPORT 24/7 · ${COMPANY_INFO.phone}     ${COMPANY_INFO.email.toUpperCase()}     ${COMPANY_INFO.website.toUpperCase()}`,
    PAGE.width / 2,
    barY + 5.8,
    { align: 'center' },
  );

  doc.setFontSize(7);
  doc.text(
    `NINEA : ${COMPANY_INFO.ninea}  ·  RCCM : ${COMPANY_INFO.rccm}`,
    PAGE.width / 2,
    barY + barHeight + 5,
    { align: 'center' },
  );
}
