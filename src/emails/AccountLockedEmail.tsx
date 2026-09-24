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
import { brand, fonts, shellStyles } from './brand';

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
      <Preview>Votre compte NavetteXpress a été temporairement bloqué · Your account is temporarily locked</Preview>
      <Body style={shellStyles.body}>
        <Section style={{ backgroundColor: brand.background, padding: '40px 16px 60px' }}>
          <Container style={shellStyles.container}>
            <Section
              style={{
                height: '4px',
                background: `linear-gradient(to right, ${brand.danger}, ${brand.gold}, transparent)`,
                fontSize: '0',
                lineHeight: '0',
              }}
            />

            <Section style={{ padding: '36px 40px 20px', textAlign: 'center' }}>
              <Text style={{ fontFamily: fonts.heading, fontSize: '22px', color: brand.textPrimary, margin: '0', letterSpacing: '0.04em' }}>
                Navette <span style={{ color: brand.gold }}>Xpress</span>
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: brand.textMuted, margin: '6px 0 0' }}>
                Alerte sécurité · Security alert
              </Text>
            </Section>

            <Section style={{ padding: '40px 40px 16px', textAlign: 'center' }}>
              <Text style={{ fontSize: '32px', margin: '0 0 20px', color: brand.danger }}>🔒</Text>
              <Heading style={shellStyles.heading}>Accès temporairement restreint</Heading>
              <Text style={shellStyles.headingEn}>Access temporarily restricted</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: '11px', color: brand.danger, border: `1px solid rgba(239,68,68,0.25)`, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '20px', margin: '12px auto 0', display: 'inline-block', padding: '5px 16px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Compte bloqué / Account locked
              </Text>
            </Section>

            <Section style={{ padding: '28px 40px 0' }}>
              <Text style={{ ...shellStyles.text, color: brand.textPrimary, fontSize: '16px', lineHeight: '28px' }}>
                Bonjour {userName}, / Hello {userName},
              </Text>
              <Text style={{ ...shellStyles.text, marginTop: '16px' }}>
                Par mesure de sécurité, nous avons temporairement suspendu l&apos;accès à votre compte suite à <span style={{ color: brand.textPrimary, fontWeight: 600 }}>3 tentatives de connexion échouées</span>.
              </Text>
              <Text style={shellStyles.textEn}>
                As a security measure, we have temporarily suspended access to your account after <span style={{ fontWeight: 600 }}>3 failed login attempts</span>.
              </Text>
            </Section>

            <Section style={{ padding: '24px 40px' }}>
              <Section style={{ backgroundColor: brand.panel, border: `1px solid ${brand.border}`, borderRadius: '12px' }}>
                <Text style={{ fontFamily: fonts.body, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: brand.textMuted, margin: '0 0 8px', textAlign: 'center', padding: '20px 20px 0' }}>
                  Réactivation automatique prévue le / Automatic reactivation on
                </Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: '18px', fontWeight: 'bold', color: brand.gold, margin: '0', textAlign: 'center', padding: '0 20px 20px' }}>
                  {unlockTime}
                </Text>
              </Section>
            </Section>

            <Section style={{ padding: '0 40px 10px' }}>
              <Text style={shellStyles.text}>
                Si vous n&apos;êtes pas à l&apos;origine de ces tentatives, nous vous recommandons de réinitialiser votre mot de passe immédiatement.
              </Text>
              <Text style={shellStyles.textEn}>
                If these attempts were not made by you, we recommend resetting your password immediately.
              </Text>
            </Section>

            <Section style={{ textAlign: 'center', padding: '36px 40px' }}>
              <Button href={resetUrl} style={shellStyles.cta}>Réinitialiser mon mot de passe / Reset my password</Button>
            </Section>

            <Section style={{ padding: '0 40px' }}>
              <Section style={{ height: '1px', backgroundColor: brand.border }} />
            </Section>

            <Section style={{ padding: '36px 40px' }}>
              <Text style={{ fontFamily: fonts.heading, fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', color: brand.gold, margin: '0 0 16px' }}>
                Conseils de sécurité / Security tips
              </Text>
              <Text style={tipStyle}>• Utilisez un mot de passe unique et complexe / Use a unique, strong password</Text>
              <Text style={tipStyle}>• Ne partagez jamais votre mot de passe / Never share your password</Text>
              <Text style={{ ...tipStyle, marginBottom: '0' }}>• Activez l&apos;authentification à deux facteurs / Enable two-factor authentication</Text>
            </Section>

            <Section style={{ padding: '0 40px 40px', textAlign: 'center' }}>
              <Text style={{ fontFamily: fonts.heading, fontSize: '15px', color: brand.gold, margin: '0 0 20px', fontStyle: 'italic' }}>
                L&apos;équipe NavetteXpress / The NavetteXpress team
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: '11px', lineHeight: '18px', color: brand.textMuted, margin: '0' }}>
                Si vous avez des questions, contactez-nous immédiatement.
                <br />
                If you have any questions, contact us immediately.
              </Text>
            </Section>
          </Container>

          <Container style={{ maxWidth: '600px', margin: '24px auto 0' }}>
            <Text style={{ fontFamily: fonts.body, fontSize: '11px', color: brand.textMuted, margin: '0', textAlign: 'center', lineHeight: '18px' }}>
              © 2025 NavetteXpress · Dakar, Sénégal
            </Text>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}

const tipStyle = {
  backgroundColor: 'rgba(255,255,255,0.02)',
  borderRadius: '10px',
  padding: '12px 16px',
  fontFamily: fonts.body,
  fontSize: '14px',
  color: brand.textSecondary,
  margin: '0 0 8px',
};
