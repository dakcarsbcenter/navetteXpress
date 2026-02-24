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

interface QuoteRejectedEmailProps {
  customerName: string;
  quoteId: string;
  pickupLocation: string;
  dropoffLocation: string;
  reason?: string;
  newQuoteUrl: string;
  supportUrl: string;
}

export default function QuoteRejectedEmail({
  customerName = 'Client',
  quoteId = 'DEV-001',
  pickupLocation = 'Aéroport Charles de Gaulle',
  dropoffLocation = 'Paris Centre',
  reason,
  newQuoteUrl = 'https://example.com/quotes/new',
  supportUrl = 'https://example.com/support',
}: QuoteRejectedEmailProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Demande de devis non disponible - {quoteId}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header bordeaux NavetteXpress */}
          <Section style={header}>
            <Heading style={headerText}>Navette Express</Heading>
          </Section>

          {/* Titre principal */}
          <Heading style={h1}>Information concernant votre demande</Heading>

          {/* Contenu */}
          <Text style={text}>Bonjour {customerName},</Text>

          <Text style={text}>
            Nous vous remercions de votre confiance et de l&apos;intérêt porté à nos services.
          </Text>

          {/* Alert box */}
          <Section style={alertBox}>
            <Text style={alertIcon}>ℹ️</Text>
            <Text style={alertText}>
              Malheureusement, nous ne pouvons pas donner suite à votre demande de devis pour le trajet suivant :
            </Text>
          </Section>

          {/* Détails de la demande */}
          <Section style={detailsSection}>
            <Text style={detailTitle}>Référence : {quoteId}</Text>
            
            <Text style={detailItem}>
              <strong>Départ :</strong> {pickupLocation}
            </Text>
            <Text style={detailItem}>
              <strong>Arrivée :</strong> {dropoffLocation}
            </Text>
            
            {reason && (
              <>
                <Hr style={hrInternal} />
                <Text style={reasonTitle}>Raison :</Text>
                <Text style={reasonText}>{reason}</Text>
              </>
            )}
          </Section>

          {/* Info box */}
          <Section style={infoBox}>
            <Text style={infoText}>
              💡 Nous restons à votre disposition pour étudier une alternative ou répondre à vos questions
            </Text>
          </Section>

          {/* Boutons */}
          <Section style={buttonContainer}>
            <Button style={button} href={newQuoteUrl}>
              Faire une nouvelle demande
            </Button>
          </Section>

          <Section style={secondaryButtonContainer}>
            <Button style={secondaryButton} href={supportUrl}>
              Contacter le support
            </Button>
          </Section>

          <Text style={textSmall}>
            Nous vous invitons à modifier votre demande ou à nous contacter directement 
            pour trouver la meilleure solution adaptée à vos besoins.
          </Text>

          {/* Signature */}
          <Hr style={hr} />
          <Text style={footer}>
            En vous remerciant de votre compréhension,<br />
            <strong>L&apos;équipe NavetteXpress</strong>
          </Text>

          <Text style={footerSmall}>
            Besoin d&apos;aide ? Contactez-nous au [Numéro de téléphone] ou par email.
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
  fontSize: '14px',
  lineHeight: '22px',
  margin: '16px 24px',
  fontStyle: 'italic' as const,
};

const alertBox = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffc107',
  borderRadius: '5px',
  margin: '24px',
  padding: '20px',
  textAlign: 'center' as const,
};

const alertIcon = {
  fontSize: '36px',
  margin: '0 0 12px',
};

const alertText = {
  color: '#856404',
  fontSize: '15px',
  lineHeight: '24px',
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
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

const detailItem = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
};

const hrInternal = {
  borderColor: '#e6ebf1',
  margin: '16px 0',
};

const reasonTitle = {
  color: '#2c3e50',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '8px 0',
};

const reasonText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
  padding: '12px',
  backgroundColor: '#ffffff',
  border: '1px solid #dee2e6',
  borderRadius: '4px',
};

const infoBox = {
  backgroundColor: '#e7f3ff',
  border: '1px solid #93374d',
  borderRadius: '5px',
  margin: '24px',
  padding: '16px',
  textAlign: 'center' as const,
};

const infoText = {
  color: '#2c3e50',
  fontSize: '14px',
  lineHeight: '22px',
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
  padding: '12px 32px',
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
