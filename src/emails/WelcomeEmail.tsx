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

export default function WelcomeEmail() {
  return (
    <Html>
      <Head />
      <Preview>Bienvenue chez NavetteXpress !</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 Bienvenue chez NavetteXpress !</Heading>
          
          <Text style={text}>
            Bonjour et bienvenue !
          </Text>
          
          <Text style={text}>
            Nous sommes ravis de vous compter parmi nos utilisateurs. 
            NavetteXpress est votre solution de transport professionnel.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href="http://localhost:3000">
              Accéder à mon compte
            </Button>
          </Section>

          <Section style={featuresBox}>
            <Text style={featureTitle}>✨ Ce que vous pouvez faire :</Text>
            <Text style={featureItem}>🚗 Réserver des courses facilement</Text>
            <Text style={featureItem}>📱 Suivre vos réservations en temps réel</Text>
            <Text style={featureItem}>💳 Gérer vos paiements</Text>
            <Text style={featureItem}>⭐ Noter vos chauffeurs</Text>
          </Section>

          <Text style={text}>
            Si vous avez des questions, n&apos;hésitez pas à nous contacter.
          </Text>

          <Section style={divider} />

          <Text style={footer}>
            Cordialement,<br />
            <strong>L&apos;équipe NavetteXpress</strong>
          </Text>

          <Text style={footerSmall}>
            Cet email a été envoyé automatiquement. Merci de ne pas répondre à ce message.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '8px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 30px',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 24px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#0070f3',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const featuresBox = {
  backgroundColor: '#f8f9fa',
  border: '2px solid #e74c3c',
  borderRadius: '5px',
  margin: '24px 12px',
  padding: '20px',
};

const featureTitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const featureItem = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '4px 0',
};

const divider = {
  borderTop: '1px solid #e6ebf1',
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
