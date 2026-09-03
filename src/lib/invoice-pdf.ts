interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  service: string;
  amountHT: number;
  vatAmount: number;
  amountTTC: number;
  taxRate: number;
  issueDate: string;
  dueDate: string;
  status: string;
  items?: Array<{
    description: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  notes?: string;
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
}

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'NavetteXpress',
  address: '123 Anywhere St., Any City',
  phone: '+123-456-7890',
  email: 'contact@navettexpress.com',
  website: 'www.navettexpress.com',
  bankName: 'Fauget Bank',
  accountName: 'NavetteXpress',
  accountNumber: '0123 4567 8901',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente de paiement',
  paid: 'Payée',
  cancelled: 'Annulée',
  overdue: 'En retard',
};

// Formate un montant sans le séparateur "narrow no-break space" (non supporté
// par les polices standard de jsPDF, ce qui produisait un artefact "25/000 FCFA")
function formatAmount(value: number): string {
  const rounded = Math.round(value || 0);
  const withSpaces = rounded.toLocaleString('en-US').replace(/,/g, ' ');
  return `${withSpaces} FCFA`;
}

export function generateInvoicePDF(
  invoiceData: InvoiceData,
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO
): Promise<any> {
  return (async () => {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    // @ts-expect-error jspdf's ESM build has no type declarations; the shape matches the main 'jspdf' export
    import('jspdf/dist/jspdf.es.min.js'),
    import('jspdf-autotable')
  ]);

  const doc = new jsPDF();

  // Palette alignée sur le design du site (fond crème, texte quasi-noir, accent sarcelle)
  const cream: [number, number, number] = [247, 243, 236]; // #F7F3EC
  const darkText: [number, number, number] = [18, 16, 14]; // #12100E
  const mutedText: [number, number, number] = [110, 106, 99]; // #6E6A63
  const accent: [number, number, number] = [31, 82, 69]; // #1F5245
  const border: [number, number, number] = [222, 216, 204]; // proche de rgba(18,16,14,0.08) sur fond crème

  const statusColors: Record<string, { fill: [number, number, number]; text: [number, number, number] }> = {
    paid: { fill: accent, text: [255, 255, 255] },
    pending: { fill: [180, 100, 58], text: [255, 255, 255] },
    overdue: { fill: [185, 28, 28], text: [255, 255, 255] },
    cancelled: { fill: mutedText, text: [255, 255, 255] },
    draft: { fill: border, text: darkText },
  };

  const marginX = 20;
  const pageRight = 190;

  // === HEADER : logo carré + wordmark, à droite numéro + statut ===
  doc.setFillColor(...darkText);
  doc.roundedRect(marginX, 16, 10, 10, 1.5, 1.5, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...cream);
  doc.text('NX', marginX + 5, 22.7, { align: 'center' });

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text('NAVETTE XPRESS', marginX + 14, 23);

  doc.setFontSize(8);
  doc.setFont('courier', 'normal');
  doc.setTextColor(...mutedText);
  doc.text('FACTURE', pageRight, 18, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text(`N° ${invoiceData.invoiceNumber}`, pageRight, 25, { align: 'right' });

  const statusKey = (invoiceData.status || 'pending').toLowerCase();
  const statusLabel = (STATUS_LABELS[statusKey] || invoiceData.status || '').toUpperCase();
  const statusStyle = statusColors[statusKey] || statusColors.pending;
  doc.setFontSize(8);
  doc.setFont('courier', 'normal');
  const badgeTextWidth = doc.getTextWidth(statusLabel);
  const badgePaddingX = 3;
  const badgeWidth = badgeTextWidth + badgePaddingX * 2;
  const badgeHeight = 6;
  const badgeX = pageRight - badgeWidth;
  const badgeY = 29;
  doc.setFillColor(...statusStyle.fill);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1, 1, 'F');
  doc.setTextColor(...statusStyle.text);
  doc.text(statusLabel, pageRight - badgePaddingX, badgeY + 4.2, { align: 'right' });

  doc.setDrawColor(...border);
  doc.setLineWidth(0.4);
  doc.line(marginX, 42, pageRight, 42);

  // === META : facturé à / dates ===
  const metaY = 52;
  doc.setFontSize(8);
  doc.setFont('courier', 'normal');
  doc.setTextColor(...mutedText);
  doc.text('FACTURÉ À', marginX, metaY);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text(invoiceData.customerName, marginX, metaY + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedText);
  let clientLineY = metaY + 12;
  if (invoiceData.customerPhone) {
    doc.text(invoiceData.customerPhone, marginX, clientLineY);
    clientLineY += 5;
  }
  doc.text(invoiceData.customerEmail, marginX, clientLineY);

  const metaColX = 125;
  doc.setFontSize(8);
  doc.setFont('courier', 'normal');
  doc.setTextColor(...mutedText);
  doc.text('ÉMISE LE', metaColX, metaY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkText);
  doc.text(invoiceData.issueDate, metaColX, metaY + 6);

  doc.setFontSize(8);
  doc.setFont('courier', 'normal');
  doc.setTextColor(...mutedText);
  doc.text('ÉCHÉANCE', metaColX, metaY + 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkText);
  doc.text(invoiceData.dueDate, metaColX, metaY + 22);

  doc.setDrawColor(...border);
  doc.setLineWidth(0.4);
  doc.line(marginX, 84, pageRight, 84);

  // === TABLE DES PRESTATIONS ===
  const tableData = invoiceData.items && invoiceData.items.length > 0
    ? invoiceData.items.map(item => [
        item.description,
        item.quantity.toString(),
        formatAmount(item.price),
        formatAmount(item.total)
      ])
    : [
        [invoiceData.service, '1', formatAmount(invoiceData.amountHT), formatAmount(invoiceData.amountHT)]
      ];

  let cursorY = 92;
  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: doc.internal.pageSize.width - pageRight },
    head: [['PRESTATION', 'QTE', 'PRIX UNIT.', 'TOTAL HT']],
    body: tableData,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      lineColor: border,
    },
    headStyles: {
      fillColor: cream,
      textColor: darkText,
      fontStyle: 'bold',
      fontSize: 8,
      font: 'courier',
      halign: 'left',
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
    },
    bodyStyles: {
      textColor: darkText,
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      lineWidth: { bottom: 0.2 },
      lineColor: border,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    },
    didDrawPage: (data) => {
      cursorY = data.cursor?.y || cursorY;
    }
  });

  cursorY += 12;

  // === TOTAUX (HT / TVA / TTC) ===
  const totalsLabelX = 135;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedText);
  doc.text('Sous-total HT', totalsLabelX, cursorY);
  doc.setTextColor(...darkText);
  doc.text(formatAmount(invoiceData.amountHT), pageRight, cursorY, { align: 'right' });

  cursorY += 7;
  doc.setTextColor(...mutedText);
  doc.text(`TVA (${invoiceData.taxRate}%)`, totalsLabelX, cursorY);
  doc.setTextColor(...darkText);
  doc.text(formatAmount(invoiceData.vatAmount), pageRight, cursorY, { align: 'right' });

  cursorY += 5;
  doc.setDrawColor(...border);
  doc.setLineWidth(0.4);
  doc.line(totalsLabelX, cursorY, pageRight, cursorY);

  cursorY += 9;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accent);
  doc.text('TOTAL TTC', totalsLabelX, cursorY);
  doc.text(formatAmount(invoiceData.amountTTC), pageRight, cursorY, { align: 'right' });

  cursorY += 14;

  // === NOTES ===
  if (invoiceData.notes) {
    doc.setFontSize(8);
    doc.setFont('courier', 'normal');
    doc.setTextColor(...mutedText);
    doc.text('NOTES', marginX, cursorY);

    cursorY += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkText);
    const noteLines = doc.splitTextToSize(invoiceData.notes, pageRight - marginX);
    doc.text(noteLines, marginX, cursorY);
  }

  // === FOOTER ===
  const footerTop = 262;
  doc.setDrawColor(...border);
  doc.setLineWidth(0.4);
  doc.line(marginX, footerTop, pageRight, footerTop);

  const pageWidth = doc.internal.pageSize.width;
  let footerY = footerTop + 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text('Navette Xpress', pageWidth / 2, footerY, { align: 'center' });

  footerY += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedText);

  const footerLines = [
    `${companyInfo.website || 'www.navettexpress.com'}  •  ${companyInfo.email}`,
    'NINEA: 012269115  •  RCCM: SN DKR 2014 A 5816'
  ];

  footerLines.forEach(line => {
    doc.text(line, pageWidth / 2, footerY, { align: 'center' });
    footerY += 4;
  });

  return doc;
  })();
}

export function downloadInvoicePDF(
  invoiceData: InvoiceData,
  companyInfo?: CompanyInfo
): Promise<void> {
  return (async () => {
  const doc = await generateInvoicePDF(invoiceData, companyInfo);
  doc.save(`${invoiceData.invoiceNumber}.pdf`);
  })();
}

export function previewInvoicePDF(
  invoiceData: InvoiceData,
  companyInfo?: CompanyInfo
): Promise<void> {
  return (async () => {
  const doc = await generateInvoicePDF(invoiceData, companyInfo);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  })();
}
