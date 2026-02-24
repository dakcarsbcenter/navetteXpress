/**
 * Script pour générer TOUS les templates HTML pour Resend Dashboard  
 * Inclut les templates d'authentification, réservations et devis
 */

import { render } from '@react-email/components';
import * as fs from 'fs';
import * as path from 'path';

// Import des templates
import PasswordResetEmail from './src/emails/PasswordResetEmail';
import AccountLockedEmail from './src/emails/AccountLockedEmail';
import WelcomeEmail from './src/emails/WelcomeEmail';
import NewBookingRequestEmail from './src/emails/NewBookingRequestEmail';
import BookingAssignedEmail from './src/emails/BookingAssignedEmail';
import BookingConfirmedEmail from './src/emails/BookingConfirmedEmail';
import NewQuoteRequestEmail from './src/emails/NewQuoteRequestEmail';
import QuoteConfirmedEmail from './src/emails/QuoteConfirmedEmail';
import QuoteAcceptedEmail from './src/emails/QuoteAcceptedEmail';
import QuoteRejectedEmail from './src/emails/QuoteRejectedEmail';
import InvoiceEmail from './src/emails/InvoiceEmail';

async function generateAllResendTemplates() {
  console.log('\n🎨 Génération de TOUS les templates pour Resend Dashboard\n');
  console.log('='.repeat(70) + '\n');

  const outputDir = path.join(process.cwd(), 'resend-templates');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;

  const templates = [
    {
      name: 'password-reset',
      subject: 'Réinitialisation de votre mot de passe - NavetteXpress',
      component: PasswordResetEmail({ userName: '{{userName}}', resetUrl: '{{resetUrl}}', expiresIn: '1 heure' }),
      variables: ['userName', 'resetUrl'],
      category: 'Authentification'
    },
    {
      name: 'account-locked',
      subject: '🔒 Alerte sécurité - Compte temporairement bloqué',
      component: AccountLockedEmail({ userName: '{{userName}}', unlockTime: '{{unlockTime}}', resetUrl: '{{resetUrl}}' }),
      variables: ['userName', 'unlockTime', 'resetUrl'],
      category: 'Authentification'
    },
    {
      name: 'welcome',
      subject: '🎉 Bienvenue chez NavetteXpress !',
      component: WelcomeEmail(),
      variables: [],
      category: 'Authentification'
    },
    {
      name: 'new-booking-request',
      subject: '📋 Nouvelle demande de réservation',
      component: NewBookingRequestEmail({
        customerName: '{{customerName}}',
        bookingId: '{{bookingId}}',
        pickupLocation: '{{pickupLocation}}',
        dropoffLocation: '{{dropoffLocation}}',
        pickupDate: '{{pickupDate}}',
        pickupTime: '{{pickupTime}}',
        passengers: 2,
        dashboardUrl: '{{dashboardUrl}}'
      }),
      variables: ['customerName', 'bookingId', 'pickupLocation', 'dropoffLocation', 'pickupDate', 'pickupTime', 'passengers', 'dashboardUrl'],
      category: 'Réservation'
    },
    {
      name: 'booking-assigned',
      subject: '🚗 Nouvelle course assignée',
      component: BookingAssignedEmail({
        driverName: '{{driverName}}',
        bookingId: '{{bookingId}}',
        customerName: '{{customerName}}',
        pickupLocation: '{{pickupLocation}}',
        dropoffLocation: '{{dropoffLocation}}',
        pickupDate: '{{pickupDate}}',
        pickupTime: '{{pickupTime}}',
        passengers: 2,
        vehicleType: '{{vehicleType}}',
        dashboardUrl: '{{dashboardUrl}}'
      }),
      variables: ['driverName', 'bookingId', 'customerName', 'pickupLocation', 'dropoffLocation', 'pickupDate', 'pickupTime', 'passengers', 'vehicleType', 'dashboardUrl'],
      category: 'Réservation'
    },
    {
      name: 'booking-confirmed',
      subject: '✅ Réservation confirmée',
      component: BookingConfirmedEmail({
        customerName: '{{customerName}}',
        bookingId: '{{bookingId}}',
        pickupLocation: '{{pickupLocation}}',
        dropoffLocation: '{{dropoffLocation}}',
        pickupDate: '{{pickupDate}}',
        pickupTime: '{{pickupTime}}',
        passengers: 2,
        vehicleType: '{{vehicleType}}',
        driverName: '{{driverName}}',
        dashboardUrl: '{{dashboardUrl}}'
      }),
      variables: ['customerName', 'bookingId', 'pickupLocation', 'dropoffLocation', 'pickupDate', 'pickupTime', 'passengers', 'vehicleType', 'driverName', 'dashboardUrl'],
      category: 'Réservation'
    },
    {
      name: 'new-quote-request',
      subject: '💼 Nouvelle demande de devis',
      component: NewQuoteRequestEmail({
        customerName: '{{customerName}}',
        quoteId: '{{quoteId}}',
        pickupLocation: '{{pickupLocation}}',
        dropoffLocation: '{{dropoffLocation}}',
        pickupDate: '{{pickupDate}}',
        passengers: 2,
        message: '{{message}}',
        dashboardUrl: '{{dashboardUrl}}'
      }),
      variables: ['customerName', 'quoteId', 'pickupLocation', 'dropoffLocation', 'pickupDate', 'passengers', 'message', 'dashboardUrl'],
      category: 'Devis'
    },
    {
      name: 'quote-confirmed',
      subject: '💰 Votre devis est prêt',
      component: QuoteConfirmedEmail({
        customerName: '{{customerName}}',
        quoteId: '{{quoteId}}',
        amount: '{{amount}}',
        pickupLocation: '{{pickupLocation}}',
        dropoffLocation: '{{dropoffLocation}}',
        pickupDate: '{{pickupDate}}',
        acceptUrl: '{{acceptUrl}}',
        rejectUrl: '{{rejectUrl}}'
      }),
      variables: ['customerName', 'quoteId', 'amount', 'pickupLocation', 'dropoffLocation', 'pickupDate', 'acceptUrl', 'rejectUrl'],
      category: 'Devis'
    },
    {
      name: 'quote-accepted',
      subject: '🎉 Devis accepté',
      component: QuoteAcceptedEmail({
        customerName: '{{customerName}}',
        quoteId: '{{quoteId}}',
        bookingId: '{{bookingId}}',
        amount: '{{amount}}',
        pickupLocation: '{{pickupLocation}}',
        dropoffLocation: '{{dropoffLocation}}',
        pickupDate: '{{pickupDate}}',
        dashboardUrl: '{{dashboardUrl}}'
      }),
      variables: ['customerName', 'quoteId', 'bookingId', 'amount', 'pickupLocation', 'dropoffLocation', 'pickupDate', 'dashboardUrl'],
      category: 'Devis'
    },
    {
      name: 'quote-rejected',
      subject: '📋 Devis décliné',
      component: QuoteRejectedEmail({
        customerName: '{{customerName}}',
        quoteId: '{{quoteId}}',
        amount: '{{amount}}',
        pickupLocation: '{{pickupLocation}}',
        dropoffLocation: '{{dropoffLocation}}',
        rejectionReason: '{{rejectionReason}}',
        dashboardUrl: '{{dashboardUrl}}'
      }),
      variables: ['customerName', 'quoteId', 'amount', 'pickupLocation', 'dropoffLocation', 'rejectionReason', 'dashboardUrl'],
      category: 'Devis'
    },
    {
      name: 'invoice',
      subject: '🧾 Nouvelle facture NavetteXpress',
      component: InvoiceEmail({
        invoiceNumber: '{{invoiceNumber}}',
        customerName: '{{customerName}}',
        service: '{{service}}',
        amountHT: '{{amountHT}}',
        vatAmount: '{{vatAmount}}',
        amountTTC: '{{amountTTC}}',
        issueDate: '{{issueDate}}',
        dueDate: '{{dueDate}}',
        invoiceUrl: '{{invoiceUrl}}'
      }),
      variables: ['invoiceNumber', 'customerName', 'service', 'amountHT', 'vatAmount', 'amountTTC', 'issueDate', 'dueDate', 'invoiceUrl'],
      category: 'Facturation'
    }
  ];

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    
    try {
      console.log(`   [${i + 1}/10] ${template.name}...`);
      
      const html = await render(template.component);
      
      const content = `<!--
TEMPLATE RESEND: ${template.name}
SUJET: ${template.subject}

VARIABLES: ${template.variables.length > 0 ? template.variables.join(', ') : 'Aucune'}

CATEGORIE: ${template.category}
-->

${html}`;

      fs.writeFileSync(path.join(outputDir, `${template.name}.html`), content, 'utf-8');
      console.log(`   ✅ ${template.name}.html créé\n`);
      successCount++;
    } catch (error: any) {
      console.error(`   ❌ Erreur: ${error.message}\n`);
      errorCount++;
    }
  }

  // Résumé
  console.log('\n' + '='.repeat(70));
  console.log(`\n✅ ${successCount}/10 templates générés avec succès`);
  if (errorCount > 0) console.log(`❌ ${errorCount} erreur(s)`);
  console.log(`\n📁 Fichiers : ${outputDir}\n`);
  console.log('='.repeat(70) + '\n');
}

generateAllResendTemplates().catch(error => {
  console.error('❌ ERREUR:', error);
  process.exit(1);
});
