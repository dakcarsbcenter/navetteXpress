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

interface BookingAssignedEmailProps {
  driverName: string;
  bookingId: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  customerName: string;
  passengers: number;
  vehicleType: string;
  dashboardUrl: string;
}

export default function BookingAssignedEmail({
  driverName = 'Chauffeur',
  bookingId = 'RES-001',
  pickupLocation = 'Aeroport Charles de Gaulle',
  dropoffLocation = 'Paris Centre',
  pickupDate = '20 novembre 2025',
  pickupTime = '14:30',
  customerName = 'M. Dupont',
  passengers = 2,
  vehicleType = 'Berline',
  dashboardUrl = 'https://example.com/driver/bookings',
}: BookingAssignedEmailProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Nouvelle course assignee - {bookingId}</Preview>
      <Body style={shellStyles.body}>
        <Section style={{ backgroundColor: brand.background, padding: '40px 16px 60px' }}>
          <Container style={shellStyles.container}>
            <Section style={{ height: '4px', background: `linear-gradient(to right, ${brand.gold}, ${brand.goldLight}, transparent)` }} />

            <Section style={{ padding: '36px 40px 20px', textAlign: 'center' }}>
              <Text style={brandTitle}>Navette <span style={{ color: brand.gold }}>Xpress</span></Text>
              <Text style={brandSubtitle}>Service Chauffeur · Dakar</Text>
            </Section>

            <Section style={{ padding: '40px 40px 16px', textAlign: 'center' }}>
              <Text style={heroIcon}>🚗</Text>
              <Heading style={shellStyles.heading}>Nouvelle mission assignee</Heading>
              <Text style={chip}>Course Ref: {bookingId}</Text>
            </Section>

            <Section style={{ padding: '28px 40px 0' }}>
              <Text style={{ ...shellStyles.text, color: brand.textPrimary, fontSize: '16px', lineHeight: '28px' }}>Bonjour {driverName},</Text>
              <Text style={{ ...shellStyles.text, marginTop: '16px' }}>
                Une nouvelle course vous a ete assignee par notre service de regulation.
              </Text>
            </Section>

            <Section style={{ padding: '32px 40px' }}>
              <Section style={panel}>
                <Text style={row}><strong>Client:</strong> {customerName}</Text>
                <Text style={row}><strong>Depart:</strong> {pickupLocation}</Text>
                <Text style={row}><strong>Destination:</strong> {dropoffLocation}</Text>
                <Text style={row}><strong>Date:</strong> {pickupDate}</Text>
                <Text style={row}><strong>Heure:</strong> {pickupTime}</Text>
                <Text style={row}><strong>Passagers:</strong> {passengers}</Text>
                <Text style={{ ...row, marginBottom: '0' }}><strong>Vehicule:</strong> {vehicleType}</Text>
              </Section>
            </Section>

            <Section style={{ textAlign: 'center', padding: '0 40px 40px' }}>
              <Button style={shellStyles.cta} href={dashboardUrl}>Voir dans mon tableau de bord</Button>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}

const brandTitle = {
  fontFamily: fonts.heading,
  fontSize: '22px',
  color: brand.textPrimary,
  margin: '0',
  letterSpacing: '0.04em',
};

const brandSubtitle = {
  fontFamily: fonts.body,
  fontSize: '10px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: brand.textMuted,
  margin: '6px 0 0',
};

const heroIcon = {
  fontSize: '32px',
  margin: '0 0 20px',
  color: brand.gold,
};

const chip = {
  fontFamily: fonts.body,
  fontSize: '11px',
  color: brand.gold,
  border: '1px solid rgba(201,168,76,0.25)',
  backgroundColor: 'rgba(201,168,76,0.10)',
  borderRadius: '20px',
  margin: '12px auto 0',
  display: 'inline-block',
  padding: '5px 16px',
  letterSpacing: '0.15em',
  textTransform: 'uppercase' as const,
};

const panel = {
  backgroundColor: brand.panel,
  border: `1px solid ${brand.border}`,
  borderRadius: '12px',
  padding: '24px',
};

const row = {
  fontFamily: fonts.body,
  fontSize: '15px',
  lineHeight: '24px',
  color: brand.textSecondary,
  margin: '0 0 8px',
};
