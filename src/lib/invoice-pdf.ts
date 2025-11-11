import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

// Logo PNG NavetteXpress en base64 (cercle bleu avec NX et lignes de vitesse)
const LOGO_BASE64 = 'data:image/png;base64,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';

export function generateInvoicePDF(
  invoiceData: InvoiceData,
  companyInfo: CompanyInfo = DEFAULT_COMPANY_INFO
): jsPDF {
  const doc = new jsPDF();
  
  // Couleurs basées sur le design minimaliste de la facture
  const brandBlue: [number, number, number] = [99, 102, 241]; // #6366f1 - Bleu du logo
  const darkText: [number, number, number] = [15, 23, 42]; // #0f172a - Texte noir
  const grayText: [number, number, number] = [100, 116, 139]; // #64748b - Texte gris
  const lightGray: [number, number, number] = [226, 232, 240]; // #e2e8f0 - Lignes séparatrices
  
  let yPosition = 20;

  // === HEADER avec LOGO + TEXTE ===
  // Dessiner le logo NavetteXpress (cercle bleu avec gradient et NX)
  const logoX = 27;
  const logoY = 24;
  const logoRadius = 8;
  
  // Cercle bleu principal avec dégradé simulé
  doc.setFillColor(67, 97, 238); // Bleu vif
  doc.circle(logoX, logoY, logoRadius, 'F');
  
  // Ajouter un effet de dégradé avec un cercle plus clair au centre
  doc.setFillColor(89, 125, 247); // Bleu plus clair
  doc.circle(logoX - 2, logoY - 2, logoRadius * 0.6, 'F');
  
  // Lignes de vitesse (à gauche du cercle)
  doc.setDrawColor(255, 255, 255); // Blanc
  doc.setLineWidth(0.8);
  const lineStartX = logoX - logoRadius - 5;
  
  // 3 lignes horizontales avec opacité simulée
  doc.setDrawColor(220, 230, 255); // Blanc légèrement bleuté
  doc.line(lineStartX, logoY - 4, lineStartX + 4, logoY - 4);
  doc.setDrawColor(200, 220, 255);
  doc.line(lineStartX - 1, logoY - 1, lineStartX + 5, logoY - 1);
  doc.setDrawColor(220, 230, 255);
  doc.line(lineStartX, logoY + 2, lineStartX + 4, logoY + 2);
  
  // Lettres "NX" en blanc et gras au centre
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255); // Blanc
  doc.text('NX', logoX, logoY + 3.5, { align: 'center' });
  
  // Texte "NAVETTE XPRESS" en gras à côté du logo
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandBlue);
  doc.text('NAVETTE XPRESS', 38, 26);
  
  yPosition = 50;

  // === TITRE FACTURE (très grand, noir, sans cadre) ===
  doc.setFontSize(56);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text('Facture', 20, yPosition + 25);
  
  yPosition += 40;
  
  // Numéro de facture
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayText);
  doc.text(`Numéro de Facture: ${invoiceData.invoiceNumber}`, 20, yPosition);
  
  yPosition += 20;

  // === FACTURÉ À ===
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text('Facturé à:', 20, yPosition);
  
  yPosition += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayText);
  doc.text(`Nom client: ${invoiceData.customerName}`, 20, yPosition);
  yPosition += 5;
  doc.text(`Numero Téléphone: ${invoiceData.customerPhone || ''}`, 20, yPosition);
  yPosition += 5;
  doc.text(`Email: ${invoiceData.customerEmail}`, 20, yPosition);
  
  yPosition += 15;

  // === SEPARATOR LINE ===
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, 190, yPosition);
  
  yPosition += 10;

  // === TABLE DES ITEMS ===
  const tableData = invoiceData.items && invoiceData.items.length > 0 
    ? invoiceData.items.map(item => [
        item.description,
        item.quantity.toString(),
        `${item.price.toLocaleString('fr-FR')} FCFA`,
        `${item.total.toLocaleString('fr-FR')} FCFA`
      ])
    : [
        [invoiceData.service, '1', `${invoiceData.amountHT.toLocaleString('fr-FR')} FCFA`, `${invoiceData.amountHT.toLocaleString('fr-FR')} FCFA`]
      ];

  autoTable(doc, {
    startY: yPosition,
    head: [['DESCRIPTION', 'QTE', 'PRIX', 'TOTAL']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [15, 23, 42], // darkText
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left'
    },
    bodyStyles: {
      textColor: [60, 60, 60],
      fontSize: 9,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    },
    didDrawPage: (data) => {
      yPosition = data.cursor?.y || yPosition;
    }
  });

  yPosition += 10;

  // === SEPARATOR LINE ===
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, 190, yPosition);
  
  yPosition += 10;

  // === TOTAL (simple, aligné à droite, sans cadre) ===
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text('TOTAL', 150, yPosition);
  doc.text(`${invoiceData.amountHT.toLocaleString('fr-FR')} FCFA`, 190, yPosition, { align: 'right' });

  // === FOOTER (informations de contact centrées en bas) ===
  const footerY = 270;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  
  // Nom de l'entreprise en gras
  let currentY = footerY;
  let textWidth = doc.getTextWidth('Navette Xpress');
  let xPos = (doc.internal.pageSize.width - textWidth) / 2;
  doc.text('Navette Xpress', xPos, currentY);
  currentY += 5;
  
  // Autres informations en normal
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayText);
  
  const footerLines = [
    'www.navettexpress.com',
    'contact@navettexpress.com',
    'NINEA: 012269115',
    'RCCM: SN DKR 2014 A 5816'
  ];
  
  footerLines.forEach(line => {
    textWidth = doc.getTextWidth(line);
    xPos = (doc.internal.pageSize.width - textWidth) / 2;
    doc.text(line, xPos, currentY);
    currentY += 4;
  });

  return doc;
}

export function downloadInvoicePDF(
  invoiceData: InvoiceData,
  companyInfo?: CompanyInfo
): void {
  const doc = generateInvoicePDF(invoiceData, companyInfo);
  doc.save(`${invoiceData.invoiceNumber}.pdf`);
}

export function previewInvoicePDF(
  invoiceData: InvoiceData,
  companyInfo?: CompanyInfo
): void {
  const doc = generateInvoicePDF(invoiceData, companyInfo);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
