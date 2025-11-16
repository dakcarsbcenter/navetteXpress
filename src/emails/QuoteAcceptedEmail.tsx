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

interface QuoteAcceptedEmailProps {
  customerName: string;
  quoteId: string;
  bookingId: string;
  amount: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  dashboardUrl: string;
}

export default function QuoteAcceptedEmail({
  customerName = 'Client',
  quoteId = 'DEV-001',
  bookingId = 'RES-001',
  amount = '150',
  pickupLocation = 'Aéroport Charles de Gaulle',
  dropoffLocation = 'Paris Centre',
  pickupDate = '20 novembre 2025',
  dashboardUrl = 'https://example.com/bookings',
}: QuoteAcceptedEmailProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Votre devis {quoteId} a été accepté !</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header bordeaux NavetteXpress */}
          <Section style={header}>
            <Heading style={headerText}>Navette Express</Heading>
          </Section>

          {/* Titre principal */}
          <Heading style={h1}>🎉 Devis accepté !</Heading>

          {/* Contenu */}
          <Text style={text}>Bonjour {customerName},</Text>

          <Text style={text}>
            Excellente nouvelle ! Votre devis a été accepté et une réservation a automatiquement été créée pour vous.
          </Text>

          {/* Info box - Devis accepté */}
          <Section style={successBox}>
            <Text style={successIcon}>✓</Text>
            <Text style={successLabel}>Devis accepté</Text>
            <Text style={successValue}>{quoteId}</Text>
          </Section>

          {/* Info box - Nouvelle réservation */}
          <Section style={infoBox}>
            <Text style={infoLabel}>Votre nouvelle réservation</Text>
            <Text style={infoValue}>{bookingId}</Text>
          </Section>

          {/* Détails */}
          <Section style={detailsSection}>
            <Text style={detailTitle}>Récapitulatif :</Text>
            
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
              <strong>Montant convenu :</strong> {amount} €
            </Text>
          </Section>

          {/* Prochaines étapes */}
          <Section style={nextStepsBox}>
            <Text style={nextStepsTitle}>📝 Prochaines étapes :</Text>
            <Text style={nextStepsItem}>1. Vous recevrez une confirmation de réservation par email</Text>
            <Text style={nextStepsItem}>2. Un chauffeur vous sera assigné sous peu</Text>
            <Text style={nextStepsItem}>3. Vous serez informé de tous les détails avant le départ</Text>
          </Section>

          {/* Bouton principal */}
          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Voir ma réservation
            </Button>
          </Section>

          {/* Signature */}
          <Hr style={hr} />
          <Text style={footer}>
            Merci pour votre confiance,<br />
            <strong>L&apos;équipe NavetteXpress</strong>
          </Text>

          <Text style={footerSmall}>
            Des questions ? N&apos;hésitez pas à nous contacter.
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

const successBox = {
  backgroundColor: '#d4edda',
  border: '2px solid #28a745',
  borderRadius: '5px',
  margin: '24px 12px',
  padding: '24px',
  textAlign: 'center' as const,
};

const successIcon = {
  fontSize: '48px',
  color: '#28a745',
  margin: '0 0 12px',
};

const successLabel = {
  color: '#155724',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 8px',
};

const successValue = {
  color: '#28a745',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
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

const nextStepsBox = {
  backgroundColor: '#f0f8ff',
  border: '1px solid #93374d',
  borderRadius: '5px',
  margin: '24px 12px',
  padding: '20px',
};

const nextStepsTitle = {
  color: '#2c3e50',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const nextStepsItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
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
