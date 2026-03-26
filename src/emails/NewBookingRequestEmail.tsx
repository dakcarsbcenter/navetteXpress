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

interface NewBookingRequestEmailProps {
  customerName: string;
  bookingId: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  passengers: number;
  dashboardUrl: string;
}

export default function NewBookingRequestEmail({
  customerName = 'Client',
  bookingId = 'RES-001',
  pickupLocation = 'Aeroport Charles de Gaulle',
  dropoffLocation = 'Paris Centre',
  pickupDate = '20 novembre 2025',
  pickupTime = '14:30',
  passengers = 2,
  dashboardUrl = 'https://example.com/admin/bookings',
}: NewBookingRequestEmailProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Nouvelle demande de reservation - {bookingId}</Preview>
      <Body style={shellStyles.body}>
        <Section style={{ backgroundColor: brand.background, padding: '40px 16px 60px' }}>
          <Container style={shellStyles.container}>
            <Section style={{ height: '4px', background: `linear-gradient(to right, ${brand.gold}, ${brand.goldLight}, transparent)` }} />

            <Section style={{ padding: '36px 40px 20px', textAlign: 'center' }}>
              <Text style={title}>Navette <span style={{ color: brand.gold }}>Xpress</span></Text>
              <Text style={subtitle}>Administration</Text>
            </Section>

            <Section style={{ padding: '34px 40px 14px', textAlign: 'center' }}>
              <Text style={icon}>📋</Text>
              <Heading style={shellStyles.heading}>Nouvelle demande de reservation</Heading>
              <Text style={chip}>Ref: {bookingId}</Text>
            </Section>

            <Section style={{ padding: '24px 40px 0' }}>
              <Section style={panel}>
                <Text style={row}><strong>Client:</strong> {customerName}</Text>
                <Text style={row}><strong>Depart:</strong> {pickupLocation}</Text>
                <Text style={row}><strong>Arrivee:</strong> {dropoffLocation}</Text>
                <Text style={row}><strong>Date:</strong> {pickupDate}</Text>
                <Text style={row}><strong>Heure:</strong> {pickupTime}</Text>
                <Text style={{ ...row, marginBottom: '0' }}><strong>Passagers:</strong> {passengers}</Text>
              </Section>
            </Section>

            <Section style={{ textAlign: 'center', padding: '34px 40px 40px' }}>
              <Button style={shellStyles.cta} href={dashboardUrl}>Creer le devis</Button>
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
