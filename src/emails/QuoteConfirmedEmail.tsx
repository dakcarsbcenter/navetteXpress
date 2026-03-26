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

interface QuoteConfirmedEmailProps {
  customerName: string;
  quoteId: string;
  amount: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  acceptUrl: string;
  rejectUrl: string;
}

export default function QuoteConfirmedEmail({
  customerName = 'Client',
  quoteId = 'DEV-001',
  amount = '150 000 FCFA',
  pickupLocation = 'Aeroport Charles de Gaulle',
  dropoffLocation = 'Paris Centre',
  pickupDate = '20 novembre 2025',
  acceptUrl = 'https://example.com/quotes/accept',
  rejectUrl = 'https://example.com/quotes/reject',
}: QuoteConfirmedEmailProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Votre devis est pret - {quoteId}</Preview>
      <Body style={shellStyles.body}>
        <Section style={{ backgroundColor: brand.background, padding: '40px 16px 60px' }}>
          <Container style={shellStyles.container}>
            <Section style={{ height: '4px', background: `linear-gradient(to right, ${brand.gold}, ${brand.goldLight}, transparent)` }} />

            <Section style={{ padding: '36px 40px 20px', textAlign: 'center' }}>
              <Text style={title}>Navette <span style={{ color: brand.gold }}>Xpress</span></Text>
              <Text style={subtitle}>Devis</Text>
            </Section>

            <Section style={{ padding: '34px 40px 14px', textAlign: 'center' }}>
              <Text style={icon}>💰</Text>
              <Heading style={shellStyles.heading}>Votre devis est pret</Heading>
              <Text style={chip}>Ref: {quoteId}</Text>
            </Section>

            <Section style={{ padding: '24px 40px 0' }}>
              <Text style={{ ...shellStyles.text, color: brand.textPrimary, fontSize: '16px', lineHeight: '28px' }}>Bonjour {customerName},</Text>
            </Section>

            <Section style={{ padding: '24px 40px 0' }}>
              <Section style={panel}>
                <Text style={row}><strong>Depart:</strong> {pickupLocation}</Text>
                <Text style={row}><strong>Arrivee:</strong> {dropoffLocation}</Text>
                <Text style={row}><strong>Date:</strong> {pickupDate}</Text>
                <Text style={{ ...row, marginBottom: '0' }}><strong>Montant:</strong> {amount}</Text>
              </Section>
            </Section>

            <Section style={{ padding: '28px 40px 40px' }}>
              <Section style={{ display: 'flex', gap: '12px' }}>
                <Button style={{ ...shellStyles.cta, width: '100%', textAlign: 'center' as const }} href={acceptUrl}>Accepter le devis</Button>
                <Button style={secondaryCta} href={rejectUrl}>Decliner</Button>
              </Section>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}

const title = { fontFamily: fonts.heading, fontSize: '22px', fontWeight: 700, color: brand.textPrimary, margin: '0', letterSpacing: '0.04em' };
const subtitle = { fontFamily: fonts.body, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: brand.textMuted, margin: '6px 0 0' };
const icon = { fontSize: '32px', margin: '0 0 16px', color: brand.gold };
const chip = { fontFamily: fonts.body, fontSize: '11px', color: brand.gold, border: '1px solid rgba(201,168,76,0.25)', backgroundColor: 'rgba(201,168,76,0.10)', borderRadius: '20px', margin: '12px auto 0', display: 'inline-block', padding: '5px 16px', letterSpacing: '0.15em', textTransform: 'uppercase' as const };
const panel = { backgroundColor: brand.panel, border: `1px solid ${brand.border}`, borderRadius: '12px', padding: '20px' };
const row = { fontFamily: fonts.body, fontSize: '14px', lineHeight: '22px', color: brand.textSecondary, margin: '0 0 8px' };
const secondaryCta = {
  fontFamily: fonts.body,
  fontSize: '15px',
  fontWeight: '600',
  color: brand.textSecondary,
  textDecoration: 'none',
  display: 'inline-block',
  padding: '14px 20px',
  backgroundColor: 'transparent',
  border: `1px solid ${brand.border}`,
  borderRadius: '10px',
};
