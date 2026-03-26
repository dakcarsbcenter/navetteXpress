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
  amount = '150 000 FCFA',
  pickupLocation = 'Aeroport Charles de Gaulle',
  dropoffLocation = 'Paris Centre',
  pickupDate = '20 novembre 2025',
  dashboardUrl = 'https://example.com/bookings',
}: QuoteAcceptedEmailProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Devis accepte - {quoteId}</Preview>
      <Body style={shellStyles.body}>
        <Section style={{ backgroundColor: brand.background, padding: '40px 16px 60px' }}>
          <Container style={shellStyles.container}>
            <Section style={{ height: '4px', background: `linear-gradient(to right, ${brand.gold}, ${brand.goldLight}, transparent)` }} />

            <Section style={{ padding: '36px 40px 20px', textAlign: 'center' }}>
              <Text style={title}>Navette <span style={{ color: brand.gold }}>Xpress</span></Text>
              <Text style={subtitle}>Confirmation · Devis</Text>
            </Section>

            <Section style={{ padding: '34px 40px 14px', textAlign: 'center' }}>
              <Text style={icon}>🎉</Text>
              <Heading style={shellStyles.heading}>Devis accepte</Heading>
              <Text style={chip}>Reservation: {bookingId}</Text>
            </Section>

            <Section style={{ padding: '24px 40px 0' }}>
              <Text style={{ ...shellStyles.text, color: brand.textPrimary, fontSize: '16px', lineHeight: '28px' }}>Bonjour {customerName},</Text>
            </Section>

            <Section style={{ padding: '24px 40px 0' }}>
              <Section style={panel}>
                <Text style={row}><strong>Devis:</strong> {quoteId}</Text>
                <Text style={row}><strong>Montant:</strong> {amount}</Text>
                <Text style={row}><strong>Depart:</strong> {pickupLocation}</Text>
                <Text style={row}><strong>Arrivee:</strong> {dropoffLocation}</Text>
                <Text style={{ ...row, marginBottom: '0' }}><strong>Date:</strong> {pickupDate}</Text>
              </Section>
            </Section>

            <Section style={{ textAlign: 'center', padding: '34px 40px 40px' }}>
              <Button style={shellStyles.cta} href={dashboardUrl}>Gerer ma reservation</Button>
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
