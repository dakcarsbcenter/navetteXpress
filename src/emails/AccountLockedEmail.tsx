import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components';
import * as React from 'react';

interface AccountLockedEmailProps {
  userName: string;
  unlockTime: string;
  resetUrl: string;
}

export default function AccountLockedEmail({
  userName = 'Utilisateur',
  unlockTime,
  resetUrl,
}: AccountLockedEmailProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Votre compte NavetteXpress a été temporairement bloqué</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header bordeaux NavetteXpress */}
          <Section style={header}>
            <Heading style={headerText}>Navette Express</Heading>
          </Section>

          {/* Titre principal */}
          <Heading style={h1}>🔒 Compte temporairement bloqué</Heading>
          
          {/* Contenu */}
          <Text style={text}>Bonjour {userName},</Text>
          
          <Section style={alertBox}>
            <Text style={alertText}>
              ⚠️ Votre compte a été temporairement bloqué suite à <strong>3 tentatives de connexion échouées</strong>.
            </Text>
          </Section>

          <Text style={text}>
            Par mesure de sécurité, votre compte sera automatiquement débloqué le :
          </Text>

          <Section style={timeBox}>
            <Text style={timeText}>{unlockTime}</Text>
          </Section>

          <Text style={text}>
            Si vous n&apos;êtes pas à l&apos;origine de ces tentatives, nous vous recommandons 
            vivement de <strong>réinitialiser votre mot de passe immédiatement</strong>.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Réinitialiser mon mot de passe
            </Button>
          </Section>

          <Section style={infoBox}>
            <Text style={infoTitle}>💡 Conseils de sécurité :</Text>
            <Text style={infoItem}>• Utilisez un mot de passe unique et complexe</Text>
            <Text style={infoItem}>• Ne partagez jamais votre mot de passe</Text>
            <Text style={infoItem}>• Activez l&apos;authentification à deux facteurs si disponible</Text>
          </Section>

          {/* Signature */}
          <Section style={hr} />
          <Text style={footer}>
            Cordialement,<br />
            <strong>L&apos;équipe NavetteXpress</strong>
          </Text>

          <Text style={footerSmall}>
            Si vous avez des questions, contactez-nous immédiatement.
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

const alertBox = {
  backgroundColor: '#fee2e2',
  border: '2px solid #ef4444',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 12px',
  textAlign: 'center' as const,
};

const alertText = {
  color: '#991b1b',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0',
};

const timeBox = {
  backgroundColor: '#fff3cd',
  border: '1px solid #856404',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 12px',
  fontSize: '14px',
  color: '#856404',
};

const timeText = {
  color: '#856404',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
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
  backgroundColor: '#dbeafe',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 12px',
  fontSize: '15px',
  color: '#1e3a8a',
};

const infoTitle = {
  color: '#1e3a8a',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const infoItem = {
  color: '#1e3a8a',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '4px 0',
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
