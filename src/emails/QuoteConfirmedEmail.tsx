import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Hr,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface QuoteConfirmedEmailProps {
  customerName: string;
  quoteId: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  vehicleType: string;
  totalPrice: string;
  validUntil: string;
  acceptUrl: string;
  dashboardUrl: string;
}

export default function QuoteConfirmedEmail({
  customerName = 'Client',
  quoteId = 'DEV-001',
  pickupLocation = 'Aéroport Charles de Gaulle',
  dropoffLocation = 'Paris Centre',
  pickupDate = '20 novembre 2025',
  pickupTime = '14:30',
  vehicleType = 'Berline',
  totalPrice = '75,00 €',
  validUntil = '25 novembre 2025',
  acceptUrl = 'https://example.com/quotes/accept',
  dashboardUrl = 'https://example.com/dashboard/quotes',
}: QuoteConfirmedEmailProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Votre devis NavetteXpress est prêt - {quoteId}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header bordeaux NavetteXpress */}
          <Section style={header}>
            <Heading style={headerText}>Navette Express</Heading>
          </Section>

          {/* Titre principal */}
          <Heading style={h1}>📄 Votre devis est prêt</Heading>

          {/* Contenu */}
          <Text style={text}>Bonjour {customerName},</Text>

          <Text style={text}>
            Nous avons le plaisir de vous transmettre votre devis personnalisé pour votre trajet.
          </Text>

          {/* Info box */}
          <Section style={infoBox}>
            <Text style={infoLabel}>Référence du devis</Text>
            <Text style={infoValue}>{quoteId}</Text>
          </Section>

          {/* Détails du devis */}
          <Section style={detailsSection}>
            <Text style={detailTitle}>Détails de votre trajet :</Text>
            
            <Text style={detailItem}>
              <strong>Départ :</strong> {pickupLocation}
            </Text>
            <Text style={detailItem}>
              <strong>Arrivée :</strong> {dropoffLocation}
            </Text>
            <Text style={detailItem}>
              <strong>Date :</strong> {pickupDate}
            </Text>
            <Text style={detailItem}>
              <strong>Heure :</strong> {pickupTime}
            </Text>
            <Text style={detailItem}>
              <strong>Type de véhicule :</strong> {vehicleType}
            </Text>
            
            {/* Prix */}
            <Text style={priceSection}>
              <Text style={priceLabel}>Prix total :</Text>
              <Text style={priceValue}>{totalPrice}</Text>
            </Text>
          </Section>

          {/* Validité */}
          <Section style={validityBox}>
            <Text style={validityText}>
              ⏳ Ce devis est valable jusqu&apos;au <strong>{validUntil}</strong>
            </Text>
          </Section>

          {/* Bouton principal */}
          <Section style={buttonContainer}>
            <Button style={button} href={acceptUrl}>
              Accepter le devis
            </Button>
          </Section>

          <Section style={secondaryButtonContainer}>
            <Button style={secondaryButton} href={dashboardUrl}>
              Voir les détails
            </Button>
          </Section>

          <Text style={textSmall}>
            En acceptant ce devis, vous confirmez votre réservation et nos conditions générales de vente.
          </Text>

          {/* Signature */}
          <Hr style={hr} />
          <Text style={footer}>
            Nous restons à votre disposition,<br />
            <strong>L&apos;équipe NavetteXpress</strong>
          </Text>

          <Text style={footerSmall}>
            Des questions ? Contactez-nous au [Numéro de téléphone] ou répondez à cet email.
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

const textSmall = {
  color: '#6c757d',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '16px 24px',
  fontStyle: 'italic' as const,
};

const infoBox = {
  backgroundColor: '#e7f3ff',
  border: '2px solid #93374d',
  borderRadius: '5px',
  margin: '24px 12px',
  padding: '20px',
  textAlign: 'center' as const,
};

const infoLabel = {
  color: '#6c757d',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 8px',
};

const infoValue = {
  color: '#93374d',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const detailsSection = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e6ebf1',
  borderRadius: '5px',
  margin: '24px 12px',
  padding: '20px',
};

const detailTitle = {
  color: '#2c3e50',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  borderBottom: '2px solid #93374d',
  paddingBottom: '8px',
};

const detailItem = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
};

const priceSection = {
  margin: '20px 0 0',
  padding: '16px 0 0',
  borderTop: '2px solid #93374d',
  textAlign: 'center' as const,
};

const priceLabel = {
  color: '#2c3e50',
  fontSize: '16px',
  fontWeight: 'bold',
  display: 'block',
  margin: '0 0 8px',
};

const priceValue = {
  color: '#93374d',
  fontSize: '32px',
  fontWeight: 'bold',
  display: 'block',
  margin: '0',
};

const validityBox = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffc107',
  borderRadius: '5px',
  margin: '24px',
  padding: '16px',
  textAlign: 'center' as const,
};

const validityText = {
  color: '#856404',
  fontSize: '15px',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0 16px',
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

const secondaryButtonContainer = {
  textAlign: 'center' as const,
  margin: '0 0 32px',
};

const secondaryButton = {
  backgroundColor: 'transparent',
  borderRadius: '5px',
  color: '#93374d',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 24px',
  border: '2px solid #93374d',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 24px',
};

const footer = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '24px 24px 8px',
};

const footerSmall = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 24px 32px',
};

const finalFooter = {
  backgroundColor: '#f6f9fc',
  padding: '24px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e6ebf1',
};

const finalFooterText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '4px 0',
};

const finalFooterSmall = {
  color: '#a0aec0',
  fontSize: '11px',
  lineHeight: '16px',
  margin: '4px 0',
};
