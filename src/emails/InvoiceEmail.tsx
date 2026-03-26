import * as React from 'react';
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
import { brand, fonts, shellStyles } from './brand';

interface InvoiceEmailProps {
  invoiceNumber: string;
  customerName: string;
  service: string;
  amountHT: string;
  vatAmount: string;
  amountTTC: string;
  issueDate: string;
  dueDate: string;
  invoiceUrl: string;
}

export default function InvoiceEmail({
  invoiceNumber = 'INV-2025-00001',
  customerName = 'Jean Dupont',
  service = 'Transfert Aeroport - Hotel',
  amountHT = '120 000 FCFA',
  vatAmount = '24 000 FCFA',
  amountTTC = '144 000 FCFA',
  issueDate = '15/11/2025',
  dueDate = '15/12/2025',
  invoiceUrl = 'https://navettexpress.com/invoices/INV-2025-00001',
}: InvoiceEmailProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Nouvelle facture NavetteXpress - {invoiceNumber}</Preview>
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
                Facturation · Service premium
              </Text>
            </Section>

            <Section style={{ padding: '28px 40px 16px', textAlign: 'center' }}>
              <Text style={{ fontSize: '32px', margin: '0 0 18px', color: brand.gold }}>🧾</Text>
              <Heading style={shellStyles.heading}>Nouvelle facture</Heading>
            </Section>

            <Section style={{ padding: '24px 40px 0' }}>
              <Text style={{ ...shellStyles.text, color: brand.textPrimary, fontSize: '16px', lineHeight: '28px' }}>Bonjour {customerName},</Text>
              <Text style={{ ...shellStyles.text, marginTop: '16px' }}>
                Merci pour votre confiance. Retrouvez ci-dessous le recapitulatif de votre facture.
              </Text>
            </Section>

            <Section style={{ padding: '24px 40px 0' }}>
              <Section style={{ backgroundColor: brand.panel, border: `1px solid ${brand.border}`, borderRadius: '12px', padding: '20px' }}>
                <Text style={{ fontFamily: fonts.body, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: brand.textMuted, margin: '0 0 8px' }}>
                  Facture
                </Text>
                <Text style={{ fontFamily: fonts.heading, fontSize: '24px', color: brand.gold, margin: '0 0 18px' }}>{invoiceNumber}</Text>
                <Text style={rowLabel}>Service</Text>
                <Text style={rowValue}>{service}</Text>
                <Text style={rowLabel}>Date d&apos;emission</Text>
                <Text style={rowValue}>{issueDate}</Text>
                <Text style={rowLabel}>Date d&apos;echeance</Text>
                <Text style={rowValue}>{dueDate}</Text>
              </Section>
            </Section>

            <Section style={{ padding: '20px 40px 0' }}>
              <Section style={{ backgroundColor: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '12px', padding: '20px' }}>
                <Text style={{ fontFamily: fonts.body, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: brand.gold, margin: '0 0 12px' }}>
                  Details des montants
                </Text>
                <Text style={priceLine}><span style={priceLabel}>Montant HT</span><span style={priceValue}>{amountHT}</span></Text>
                <Text style={priceLine}><span style={priceLabel}>TVA</span><span style={priceValue}>{vatAmount}</span></Text>
                <Section style={{ height: '1px', backgroundColor: 'rgba(201,168,76,0.25)', margin: '10px 0' }} />
                <Text style={totalLine}><span style={totalLabel}>Montant TTC</span><span style={totalValue}>{amountTTC}</span></Text>
              </Section>
            </Section>

            <Section style={{ textAlign: 'center', padding: '34px 40px 30px' }}>
              <Button href={invoiceUrl} style={shellStyles.cta}>Telecharger la facture</Button>
            </Section>

            <Section style={{ padding: '0 40px 24px' }}>
              <Section style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px dashed rgba(239,68,68,0.35)', borderRadius: '10px', padding: '14px 16px' }}>
                <Text style={{ ...shellStyles.text, fontSize: '13px', lineHeight: '21px', color: '#f3b3b3' }}>
                  ⚠️ Cette facture est a regler avant le <strong>{dueDate}</strong>.
                </Text>
              </Section>
            </Section>

            <Section style={{ padding: '0 40px 40px', textAlign: 'center' }}>
              <Text style={{ fontFamily: fonts.heading, fontSize: '15px', color: brand.gold, margin: '0 0 10px', fontStyle: 'italic' }}>
                L&apos;equipe NavetteXpress
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: '11px', lineHeight: '18px', color: brand.textMuted, margin: '0' }}>
                Pour toute question concernant cette facture, contactez notre support.
              </Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}

const rowLabel = {
  fontFamily: fonts.body,
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: brand.textMuted,
  margin: '0 0 2px',
};

const rowValue = {
  fontFamily: fonts.body,
  fontSize: '15px',
  lineHeight: '22px',
  color: brand.textPrimary,
  margin: '0 0 10px',
};

const priceLine = {
  fontFamily: fonts.body,
  fontSize: '15px',
  lineHeight: '24px',
  color: brand.textPrimary,
  margin: '0 0 6px',
  display: 'flex',
  justifyContent: 'space-between',
};

const totalLine = {
  ...priceLine,
  fontSize: '18px',
  margin: '0',
};

const priceLabel = {
  color: brand.textSecondary,
};

const priceValue = {
  color: brand.textPrimary,
};

const totalLabel = {
  color: brand.gold,
  fontWeight: 700,
};

const totalValue = {
  color: brand.gold,
  fontWeight: 700,
};