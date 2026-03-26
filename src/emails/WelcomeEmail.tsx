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

interface WelcomeEmailProps {
  userName?: string;
  dashboardUrl?: string;
}

export default function WelcomeEmail({
  userName = 'Utilisateur',
  dashboardUrl = '{{dashboardUrl}}',
}: WelcomeEmailProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Bienvenue chez NavetteXpress</Preview>
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
              <Text style={{ fontFamily: fonts.heading, fontSize: '22px', fontWeight: 700, color: brand.textPrimary, margin: '0', letterSpacing: '0.04em' }}>
                Navette <span style={{ color: brand.gold }}>Xpress</span>
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: brand.textMuted, margin: '6px 0 0' }}>
                Premium · Mobilite
              </Text>
            </Section>

            <Section style={{ padding: '34px 40px 14px', textAlign: 'center' }}>
              <Text style={{ fontSize: '32px', margin: '0 0 16px', color: brand.gold }}>🎉</Text>
              <Heading style={shellStyles.heading}>Bienvenue chez NavetteXpress</Heading>
            </Section>

            <Section style={{ padding: '24px 40px 0' }}>
              <Text style={{ ...shellStyles.text, color: brand.textPrimary, fontSize: '16px', lineHeight: '28px' }}>Bonjour {userName},</Text>
              <Text style={{ ...shellStyles.text, marginTop: '16px' }}>
                Votre compte est maintenant actif. Vous pouvez reserver vos trajets premium, suivre vos demandes et gerer vos informations depuis votre espace client.
              </Text>
            </Section>

            <Section style={{ textAlign: 'center', padding: '36px 40px 28px' }}>
              <Button href={dashboardUrl} style={shellStyles.cta}>Acceder a mon espace</Button>
            </Section>

            <Section style={{ padding: '0 40px 34px' }}>
              <Section style={{ backgroundColor: brand.panel, border: `1px solid ${brand.border}`, borderRadius: '12px', padding: '20px' }}>
                <Text style={{ fontFamily: fonts.heading, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.15em', color: brand.gold, margin: '0 0 12px' }}>
                  Vos avantages
                </Text>
                <Text style={{ ...shellStyles.text, fontSize: '14px', lineHeight: '22px', marginBottom: '8px' }}>• Reservation rapide et suivi temps reel</Text>
                <Text style={{ ...shellStyles.text, fontSize: '14px', lineHeight: '22px', marginBottom: '8px' }}>• Espace client pour vos factures et devis</Text>
                <Text style={{ ...shellStyles.text, fontSize: '14px', lineHeight: '22px' }}>• Support reactif 24/7</Text>
              </Section>
            </Section>

            <Section style={{ padding: '0 40px 40px', textAlign: 'center' }}>
              <Text style={{ fontFamily: fonts.heading, fontSize: '15px', color: brand.gold, margin: '0 0 10px', fontStyle: 'italic' }}>
                L&apos;equipe NavetteXpress
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: '11px', lineHeight: '18px', color: brand.textMuted, margin: '0' }}>
                Besoin d&apos;aide ? Repondez simplement a cet email.
              </Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}