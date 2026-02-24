import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface InvoiceEmailProps {
  invoiceNumber: string;
  customerName: string;
  service: string;
  amountHT: string;
  vatAmount: string;
  amountTTC: string;
  issueDate: string;
  dueDate: string;
  invoiceUrl: string;
}

export default function InvoiceEmail({
  invoiceNumber = 'INV-2025-00001',
  customerName = 'Jean Dupont',
  service = 'Transfert Aéroport - Hôtel',
  amountHT = '120,000 FCFA',
  vatAmount = '24,000 FCFA',
  amountTTC = '144,000 FCFA',
  issueDate = '15/11/2025',
  dueDate = '15/12/2025',
  invoiceUrl = 'https://navettexpress.com/invoices/{{invoiceNumber}}',
}: InvoiceEmailProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Nouvelle facture NavetteXpress - {invoiceNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header bordeaux NavetteXpress */}
          <Section style={header}>
            <Heading style={headerText}>Navette Express</Heading>
          </Section>

          <Heading style={h1}>🧾 Nouvelle Facture</Heading>

          <Text style={text}>Bonjour {customerName},</Text>

          <Text style={text}>
            Nous vous remercions pour votre confiance. Veuillez trouver ci-dessous les détails de votre facture :
          </Text>

          {/* Informations de la facture */}
          <Section style={invoiceBox}>
            <Text style={invoiceTitle}>📄 Facture {invoiceNumber}</Text>
            
            <Section style={invoiceDetails}>
              <Text style={detailRow}>
                <span style={detailLabel}>Service :</span>
                <span style={detailValue}>{service}</span>
              </Text>
              
              <Text style={detailRow}>
                <span style={detailLabel}>Date d&apos;émission :</span>
                <span style={detailValue}>{issueDate}</span>
              </Text>
              
              <Text style={detailRow}>
                <span style={detailLabel}>Date d&apos;échéance :</span>
                <span style={detailValue}>{dueDate}</span>
              </Text>
            </Section>
          </Section>

          {/* Détails des montants */}
          <Section style={amountBox}>
            <Text style={amountTitle}>💰 Détails des montants</Text>
            
            <Section style={amountDetails}>
              <Text style={amountRow}>
                <span style={amountLabel}>Montant HT :</span>
                <span style={amountValue}>{amountHT}</span>
              </Text>
              
              <Text style={amountRow}>
                <span style={amountLabel}>TVA (20%) :</span>
                <span style={amountValue}>{vatAmount}</span>
              </Text>
              
              <Section style={divider} />
              
              <Text style={totalRow}>
                <span style={totalLabel}>Montant TTC :</span>
                <span style={totalValue}>{amountTTC}</span>
              </Text>
            </Section>
          </Section>

          {/* Bouton de téléchargement */}
          <Section style={buttonContainer}>
            <Button style={button} href={invoiceUrl}>
              📥 Télécharger la facture
            </Button>
          </Section>

          {/* Informations de paiement */}
          <Section style={infoBox}>
            <Text style={infoTitle}>💳 Modalités de paiement</Text>
            <Text style={infoItem}>• Paiement par virement bancaire</Text>
            <Text style={infoItem}>• Paiement par carte bancaire</Text>
            <Text style={infoItem}>• Paiement en espèces</Text>
            <Text style={infoItem}>• Paiement par Mobile Money</Text>
          </Section>

          {/* Note importante */}
          <Section style={alertBox}>
            <Text style={alertText}>
              ⚠️ Cette facture est à régler avant le <strong>{dueDate}</strong>
            </Text>
          </Section>

          {/* Signature */}
          <Section style={hr} />
          <Text style={footer}>
            Cordialement,<br />
            <strong>L&apos;équipe NavetteXpress</strong>
          </Text>

          <Text style={footerSmall}>
            Pour toute question concernant cette facture, n&apos;hésitez pas à nous contacter.
          </Text>

          {/* Footer final */}
          <Section style={finalFooter}>
            <Text style={finalFooterText}>
              © 2025 NavetteXpress. Tous droits réservés.
            </Text>
            <Text style={finalFooterSmall}>
              [NavetteXpress SAS, 123 Rue de la Mobilité, 75001 Paris, France]
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#e8f0f8',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  border: '2px solid #93374d',
  borderRadius: '8px',
  overflow: 'hidden',
};

const header = {
  backgroundColor: '#93374d',
  padding: '32px 20px',
  textAlign: 'center' as const,
  margin: '0',
};

const headerText = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const h1 = {
  color: '#2c3e50',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '32px 24px 24px',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 24px',
};

const invoiceBox = {
  backgroundColor: '#f8f9fa',
  border: '2px solid #93374d',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 12px',
};

const invoiceTitle = {
  color: '#93374d',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const invoiceDetails = {
  margin: '0',
};

const detailRow = {
  fontSize: '15px',
  lineHeight: '28px',
  color: '#2c3e50',
  margin: '8px 0',
  display: 'flex',
  justifyContent: 'space-between',
};

const detailLabel = {
  fontWeight: '600',
  color: '#4a5568',
};

const detailValue = {
  color: '#2c3e50',
  fontWeight: 'normal',
};

const amountBox = {
  backgroundColor: '#dbeafe',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 12px',
};

const amountTitle = {
  color: '#1e3a8a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const amountDetails = {
  margin: '0',
};

const amountRow = {
  fontSize: '15px',
  lineHeight: '28px',
  color: '#1e3a8a',
  margin: '8px 0',
  display: 'flex',
  justifyContent: 'space-between',
};

const amountLabel = {
  fontWeight: '500',
  color: '#1e3a8a',
};

const amountValue = {
  color: '#1e3a8a',
  fontWeight: 'normal',
};

const divider = {
  borderTop: '1px solid #93c5fd',
  margin: '12px 0',
};

const totalRow = {
  fontSize: '18px',
  lineHeight: '32px',
  color: '#93374d',
  margin: '12px 0 0 0',
  display: 'flex',
  justifyContent: 'space-between',
  fontWeight: 'bold',
};

const totalLabel = {
  fontWeight: 'bold',
  color: '#93374d',
};

const totalValue = {
  color: '#93374d',
  fontWeight: 'bold',
};

const buttonContainer = {
  margin: '32px 24px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#93374d',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
};

const infoBox = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #22c55e',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 12px',
  fontSize: '15px',
  color: '#166534',
};

const infoTitle = {
  color: '#166534',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const infoItem = {
  color: '#166534',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '4px 0',
};

const alertBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #f59e0b',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 12px',
  textAlign: 'center' as const,
};

const alertText = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0',
};

const hr = {
  borderTop: '1px solid #e5e7eb',
  margin: '32px 24px',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '24px',
  textAlign: 'center' as const,
};

const footerSmall = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '16px 24px',
  textAlign: 'center' as const,
};

const finalFooter = {
  backgroundColor: '#f3f4f6',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '0',
};

const finalFooterText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 8px 0',
};

const finalFooterSmall = {
  color: '#9ca3af',
  fontSize: '11px',
  lineHeight: '16px',
  margin: '0',
};
