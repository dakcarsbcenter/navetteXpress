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

interface NewQuoteRequestEmailProps {
  customerName: string;
  quoteId: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  passengers: number;
  message?: string;
  dashboardUrl: string;
}

export default function NewQuoteRequestEmail({
  customerName = 'Client',
  quoteId = 'DEV-001',
  pickupLocation = 'Aéroport Charles de Gaulle',
  dropoffLocation = 'Paris Centre',
  pickupDate = '20 novembre 2025',
  passengers = 2,
  message,
  dashboardUrl = 'https://example.com/admin/quotes',
}: NewQuoteRequestEmailProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Nouvelle demande de devis de {customerName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header bordeaux NavetteXpress */}
          <Section style={header}>
            <Heading style={headerText}>Navette Express</Heading>
          </Section>

          {/* Titre principal */}
          <Heading style={h1}>💼 Nouvelle demande de devis</Heading>

          {/* Contenu */}
          <Text style={text}>Bonjour,</Text>

          <Text style={text}>
            Une nouvelle demande de devis vient d&apos;être soumise et nécessite votre attention.
          </Text>

          {/* Info box */}
          <Section style={infoBox}>
            <Text style={infoLabel}>Référence du devis</Text>
            <Text style={infoValue}>{quoteId}</Text>
          </Section>

          {/* Détails de la demande */}
          <Section style={detailsSection}>
            <Text style={detailTitle}>Détails de la demande :</Text>
            
            <Text style={detailItem}>
              <strong>Client :</strong> {customerName}
            </Text>
            <Text style={detailItem}>
              <strong>Départ :</strong> {pickupLocation}
            </Text>
            <Text style={detailItem}>
              <strong>Arrivée :</strong> {dropoffLocation}
            </Text>
            <Text style={detailItem}>
              <strong>Date souhaitée :</strong> {pickupDate}
            </Text>
            <Text style={detailItem}>
              <strong>Nombre de passagers :</strong> {passengers} personne(s)
            </Text>
            
            {message && (
              <>
                <Text style={detailSubtitle}>Message du client :</Text>
                <Text style={messageBox}>{message}</Text>
              </>
            )}
          </Section>

          {/* Alert box */}
          <Section style={alertBox}>
            <Text style={alertText}>
              ⏰ Merci de traiter cette demande dans les 24 heures
            </Text>
          </Section>

          {/* Bouton principal */}
          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Créer le devis
            </Button>
          </Section>

          {/* Signature */}
          <Hr style={hr} />
          <Text style={footer}>
            Cordialement,<br />
            <strong>Système NavetteXpress</strong>
          </Text>

          <Text style={footerSmall}>
            Cet email a été envoyé automatiquement. Merci de ne pas répondre à ce message.
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
};

const detailItem = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
};

const detailSubtitle = {
  color: '#2c3e50',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '16px 0 8px',
};

const messageBox = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0 0',
  padding: '12px',
  backgroundColor: '#ffffff',
  border: '1px solid #dee2e6',
  borderRadius: '4px',
  fontStyle: 'italic' as const,
};

const alertBox = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffc107',
  borderRadius: '5px',
  margin: '24px 12px',
  padding: '16px',
  textAlign: 'center' as const,
};

const alertText = {
  color: '#856404',
  fontSize: '15px',
  fontWeight: 'bold',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
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
