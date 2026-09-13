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

interface VerificationEmailProps {
  userName: string;
  verifyUrl: string;
  expiresIn?: string;
}

export default function VerificationEmail({
  userName = 'Utilisateur',
  verifyUrl,
  expiresIn = '24 heures',
}: VerificationEmailProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Activez votre compte NavetteXpress</Preview>
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
              <Text style={{ fontSize: '32px', margin: '0 0 16px', color: brand.gold }}>✉️</Text>
              <Heading style={shellStyles.heading}>Activez votre compte</Heading>
            </Section>

            <Section style={{ padding: '28px 40px 0' }}>
              <Text style={{ ...shellStyles.text, color: brand.textPrimary, fontSize: '16px', lineHeight: '28px' }}>Bonjour {userName},</Text>
              <Text style={{ ...shellStyles.text, marginTop: '16px' }}>
                Merci de votre inscription sur NavetteXpress. Pour finaliser la creation de votre compte et pouvoir vous connecter, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
              </Text>
            </Section>

            <Section style={{ textAlign: 'center', padding: '40px 40px' }}>
              <Button href={verifyUrl} style={shellStyles.cta}>Activer mon compte</Button>
              <Text style={{ fontFamily: fonts.body, fontSize: '12px', color: brand.textMuted, margin: '24px 0 0' }}>
                Ce lien expirera dans {expiresIn}.
              </Text>
            </Section>

            <Section style={{ padding: '0 40px 40px' }}>
              <Section style={{ backgroundColor: 'rgba(201,168,76,0.05)', borderRadius: '12px', padding: '20px', border: '1px dashed rgba(201,168,76,0.3)' }}>
                <Text style={{ ...shellStyles.text, fontSize: '13px', lineHeight: '20px' }}>
                  🛡️ <strong>Vous n&apos;etes pas a l&apos;origine de cette inscription ?</strong> Vous pouvez ignorer cet email en toute securite, aucun compte ne sera active sans confirmation.
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
