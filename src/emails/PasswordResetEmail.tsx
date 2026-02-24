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

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  expiresIn?: string;
}

export default function PasswordResetEmail({
  userName = 'Utilisateur',
  resetUrl,
  expiresIn = '1 heure',
}: PasswordResetEmailProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Réinitialisez votre mot de passe NavetteXpress</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header bordeaux NavetteXpress */}
          <Section style={header}>
            <Heading style={headerText}>Navette Express</Heading>
          </Section>

          {/* Titre principal */}
          <Heading style={h1}>Réinitialisation de mot de passe</Heading>

          {/* Contenu */}
          <Text style={text}>Bonjour {userName},</Text>

          <Text style={text}>
            Vous avez demandé à réinitialiser votre mot de passe NavetteXpress. 
            Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
          </Text>

          {/* Bouton principal */}
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Réinitialiser mon mot de passe
            </Button>
          </Section>

          {/* Info expiration */}
          <Section style={infoBox}>
            <Text style={infoText}>
              Ce lien est valide pendant <strong>{expiresIn}</strong>.
            </Text>
          </Section>

          <Text style={text}>
            Si vous n&apos;êtes pas à l&apos;origine de cette demande, vous pouvez 
            ignorer cet email. Votre mot de passe actuel restera inchangé.
          </Text>

          {/* Lien de secours */}
          <Section style={fallbackSection}>
            <Text style={fallbackText}>
              Vous ne pouvez pas cliquer sur le bouton ? Copiez et collez ce lien 
              dans votre navigateur :
            </Text>
            <Text style={linkText}>{resetUrl}</Text>
          </Section>

          {/* Signature */}
          <Hr style={hr} />
          <Text style={footer}>
            Cordialement,<br />
            <strong>L&apos;équipe NavetteXpress</strong>
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
            <Text style={finalFooterSmall}>
              Vous recevez cet email car une action est requise sur votre compte.
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 12px',
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

const infoBox = {
  backgroundColor: '#e7f3ff',
  border: '2px solid #93374d',
  borderRadius: '5px',
  margin: '24px 12px',
  padding: '20px',
  textAlign: 'center' as const,
};

const infoText = {
  color: '#2c3e50',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const fallbackSection = {
  margin: '32px 24px',
  padding: '16px',
  backgroundColor: '#f8f9fa',
  borderRadius: '5px',
};

const fallbackText = {
  color: '#6c757d',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 8px',
};

const linkText = {
  color: '#93374d',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0',
  wordBreak: 'break-all' as const,
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
