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

interface QuoteRejectedEmailProps {
  customerName: string;
  quoteId: string;
  amount: string;
  pickupLocation: string;
  dropoffLocation: string;
  rejectionReason?: string;
  dashboardUrl: string;
}

export default function QuoteRejectedEmail({
  customerName = 'Client',
  quoteId = 'DEV-001',
  amount = '150 000 FCFA',
  pickupLocation = 'Aeroport Charles de Gaulle',
  dropoffLocation = 'Paris Centre',
  rejectionReason,
  dashboardUrl = 'https://example.com/dashboard',
}: QuoteRejectedEmailProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Devis decline - {quoteId}</Preview>
      <Body style={shellStyles.body}>
        <Section style={{ backgroundColor: brand.background, padding: '40px 16px 60px' }}>
          <Container style={shellStyles.container}>
            <Section style={{ height: '4px', background: `linear-gradient(to right, ${brand.textMuted}, ${brand.border}, transparent)` }} />

            <Section style={{ padding: '36px 40px 20px', textAlign: 'center' }}>
              <Text style={title}>Navette <span style={{ color: brand.gold }}>Xpress</span></Text>
            </Section>

            <Section style={{ padding: '34px 40px 14px', textAlign: 'center' }}>
              <Text style={icon}>📋</Text>
              <Heading style={shellStyles.heading}>Devis non retenu</Heading>
              <Text style={chip}>Ref: {quoteId}</Text>
            </Section>

            <Section style={{ padding: '24px 40px 0' }}>
              <Text style={{ ...shellStyles.text, color: brand.textPrimary, fontSize: '16px', lineHeight: '28px' }}>Bonjour {customerName},</Text>
            </Section>

            <Section style={{ padding: '24px 40px 0' }}>
              <Section style={panel}>
                <Text style={row}><strong>Trajet:</strong> {pickupLocation} → {dropoffLocation}</Text>
                <Text style={row}><strong>Montant:</strong> {amount}</Text>
                {rejectionReason ? <Text style={{ ...row, marginBottom: '0' }}><strong>Motif:</strong> {rejectionReason}</Text> : null}
              </Section>
            </Section>

            <Section style={{ textAlign: 'center', padding: '34px 40px 40px' }}>
              <Button style={secondaryCta} href={dashboardUrl}>Decouvrir d'autres options</Button>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}

const title = { fontFamily: fonts.heading, fontSize: '22px', fontWeight: 700, color: brand.textPrimary, margin: '0', letterSpacing: '0.04em' };
const icon = { fontSize: '32px', margin: '0 0 16px', color: brand.textSecondary };
const chip = { fontFamily: fonts.body, fontSize: '11px', color: brand.textSecondary, border: '1px solid rgba(138,135,153,0.35)', backgroundColor: 'rgba(138,135,153,0.10)', borderRadius: '20px', margin: '12px auto 0', display: 'inline-block', padding: '5px 16px', letterSpacing: '0.15em', textTransform: 'uppercase' as const };
const panel = { backgroundColor: 'rgba(138,135,153,0.05)', border: `1px solid ${brand.border}`, borderRadius: '12px', padding: '20px' };
const row = { fontFamily: fonts.body, fontSize: '14px', lineHeight: '22px', color: brand.textSecondary, margin: '0 0 8px' };
const secondaryCta = {
  fontFamily: fonts.body,
  fontSize: '15px',
  fontWeight: '700',
  color: brand.gold,
  textDecoration: 'none',
  display: 'inline-block',
  padding: '14px 36px',
  border: `1px solid ${brand.gold}`,
  borderRadius: '10px',
};
