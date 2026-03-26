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
import * as React from 'react';
import { brand, fonts, shellStyles } from './brand';

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
      <Preview>Recuperez l&apos;acces a votre compte NavetteXpress</Preview>
      <Body style={shellStyles.body}>
        <Section style={{ backgroundColor: brand.background, padding: '40px 16px 60px' }}>
          <Container style={shellStyles.container}>
            <Section
              style={{
                height: '4px',
                background: `linear-gradient(to right, ${brand.gold}, ${brand.goldLight}, transparent)`,
                fontSize: '0',
                lineHeight: '0',
              }}
            />

            <Section style={{ padding: '36px 40px 20px', textAlign: 'center' }}>
              <Text style={{ fontFamily: fonts.heading, fontSize: '22px', fontWeight: 700, letterSpacing: '0.04em', color: brand.textPrimary, margin: '0' }}>
                Navette <span style={{ color: brand.gold }}>Xpress</span>
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: brand.textMuted, margin: '6px 0 0' }}>
                Surete · Assistance
              </Text>
            </Section>

            <Section style={{ padding: '20px 40px 16px', textAlign: 'center' }}>
              <Text style={{ fontSize: '32px', margin: '0 0 16px', color: brand.gold }}>🔑</Text>
              <Heading style={shellStyles.heading}>Reinitialisation de mot de passe</Heading>
            </Section>

            <Section style={{ padding: '28px 40px 0' }}>
              <Text style={{ ...shellStyles.text, color: brand.textPrimary, fontSize: '16px', lineHeight: '28px' }}>Bonjour {userName},</Text>
              <Text style={{ ...shellStyles.text, marginTop: '16px' }}>
                Nous avons recu une demande de reinitialisation de mot de passe pour votre compte NavetteXpress. Si vous n&apos;etes pas a l&apos;origine de cette demande, vous pouvez ignorer cet email en toute securite.
              </Text>
            </Section>

            <Section style={{ textAlign: 'center', padding: '40px 40px' }}>
              <Button href={resetUrl} style={shellStyles.cta}>Changer mon mot de passe</Button>
              <Text style={{ fontFamily: fonts.body, fontSize: '12px', color: brand.textMuted, margin: '24px 0 0' }}>
                Ce lien expirera dans {expiresIn}.
              </Text>
            </Section>

            <Section style={{ padding: '0 40px 40px' }}>
              <Section style={{ backgroundColor: 'rgba(201,168,76,0.05)', borderRadius: '12px', padding: '20px', border: '1px dashed rgba(201,168,76,0.3)' }}>
                <Text style={{ ...shellStyles.text, fontSize: '13px', lineHeight: '20px' }}>
                  🛡️ <strong>Conseil :</strong> Choisissez un mot de passe unique contenant des lettres, des chiffres et des symboles pour une securite maximale.
                </Text>
              </Section>
            </Section>

            <Section style={{ padding: '0 40px 40px', textAlign: 'center' }}>
              <Section style={{ height: '1px', backgroundColor: brand.border, marginBottom: '32px' }} />
              <Text style={{ fontFamily: fonts.heading, fontSize: '15px', color: brand.gold, margin: '0 0 10px', fontStyle: 'italic' }}>
                Navette Xpress
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: '11px', lineHeight: '18px', color: brand.textMuted, margin: '0' }}>
                Pour toute assistance, contactez notre support client.
                <br />
                © 2025 NavetteXpress. Tous droits reserves.
              </Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}