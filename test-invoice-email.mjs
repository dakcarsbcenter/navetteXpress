/**
 * Script de test pour l'envoi d'emails de facture
 * Usage: node test-invoice-email.mjs votre@email.com
 */

import { Resend } from 'resend';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NavetteXpress <onboarding@resend.dev>';

async function testInvoiceEmail(recipientEmail) {
  console.log('🧪 Test d\'envoi d\'email de facture\n');
  console.log('📧 Destinataire:', recipientEmail);
  console.log('📤 Expéditeur:', FROM_EMAIL);
  console.log('🔑 API Key:', process.env.RESEND_API_KEY?.substring(0, 10) + '...\n');

  try {
    console.log('📬 Envoi de l\'email de test...');

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [recipientEmail],
      subject: '🧾 Nouvelle facture INV-2025-TEST - NavetteXpress',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
          <head>
            <meta charset="UTF-8">
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #e8f0f8; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border: 2px solid #93374d; border-radius: 8px; overflow: hidden;">
              <!-- Header -->
              <div style="background-color: #93374d; padding: 32px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Navette Express</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 32px 24px;">
                <h2 style="color: #2c3e50; text-align: center; margin-bottom: 24px;">🧾 Nouvelle Facture</h2>
                
                <p style="color: #4a5568; font-size: 16px; line-height: 26px;">
                  Bonjour <strong>Client Test</strong>,
                </p>
                
                <p style="color: #4a5568; font-size: 16px; line-height: 26px;">
                  Nous vous remercions pour votre confiance. Veuillez trouver ci-dessous les détails de votre facture :
                </p>
                
                <!-- Invoice Info -->
                <div style="background: #f8f9fa; border: 2px solid #93374d; border-radius: 8px; padding: 20px; margin: 24px 12px;">
                  <h3 style="color: #93374d; text-align: center; margin-top: 0;">📄 Facture INV-2025-TEST</h3>
                  <p style="margin: 8px 0;"><strong>Service :</strong> Transfert Aéroport - Hôtel</p>
                  <p style="margin: 8px 0;"><strong>Date d'émission :</strong> 17/11/2025</p>
                  <p style="margin: 8px 0;"><strong>Date d'échéance :</strong> 17/12/2025</p>
                </div>
                
                <!-- Amounts -->
                <div style="background: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 24px 12px;">
                  <h3 style="color: #1e3a8a; text-align: center; margin-top: 0;">💰 Détails des montants</h3>
                  <p style="color: #1e3a8a; margin: 8px 0;"><strong>Montant HT :</strong> 120,000 FCFA</p>
                  <p style="color: #1e3a8a; margin: 8px 0;"><strong>TVA (20%) :</strong> 24,000 FCFA</p>
                  <hr style="border: none; border-top: 1px solid #93c5fd; margin: 12px 0;">
                  <p style="color: #93374d; font-size: 18px; font-weight: bold; margin: 12px 0;"><strong>Montant TTC :</strong> 144,000 FCFA</p>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="https://navettexpress.com/invoices/test" 
                     style="background: #93374d; color: white; padding: 14px 40px; text-decoration: none; 
                            border-radius: 5px; font-weight: bold; display: inline-block;">
                    📥 Télécharger la facture
                  </a>
                </div>
                
                <!-- Payment Methods -->
                <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 16px; margin: 24px 12px;">
                  <h3 style="color: #166534; margin-top: 0;">💳 Modalités de paiement</h3>
                  <p style="color: #166534; font-size: 14px; margin: 4px 0;">• Paiement par virement bancaire</p>
                  <p style="color: #166534; font-size: 14px; margin: 4px 0;">• Paiement par carte bancaire</p>
                  <p style="color: #166534; font-size: 14px; margin: 4px 0;">• Paiement en espèces</p>
                  <p style="color: #166534; font-size: 14px; margin: 4px 0;">• Paiement par Mobile Money</p>
                </div>
                
                <!-- Alert -->
                <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 12px; text-align: center;">
                  <p style="color: #92400e; font-weight: 600; margin: 0;">
                    ⚠️ Cette facture est à régler avant le <strong>17/12/2025</strong>
                  </p>
                </div>
                
                <!-- Footer -->
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                <p style="color: #6b7280; font-size: 14px; text-align: center;">
                  Cordialement,<br>
                  <strong>L'équipe NavetteXpress</strong>
                </p>
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  Pour toute question concernant cette facture, n'hésitez pas à nous contacter.
                </p>
              </div>
              
              <!-- Final Footer -->
              <div style="background: #f3f4f6; padding: 24px; text-align: center;">
                <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">© 2025 NavetteXpress. Tous droits réservés.</p>
                <p style="color: #9ca3af; font-size: 11px; margin: 0;">[NavetteXpress SAS, 123 Rue de la Mobilité, 75001 Paris, France]</p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ Erreur lors de l\'envoi:', error);
      process.exit(1);
    }

    console.log('\n✅ Email envoyé avec succès !');
    console.log('📨 ID de l\'email:', data?.id);
    console.log('\n📊 Vérifiez votre boîte de réception à:', recipientEmail);
    console.log('💡 Si vous ne le voyez pas, vérifiez les spams');
    console.log('\n🔗 Dashboard Resend: https://resend.com/emails');

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Vérifiez que RESEND_API_KEY est configurée dans .env.local');
    }
    
    process.exit(1);
  }
}

// Main
const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error('❌ Veuillez fournir une adresse email');
  console.error('Usage: node test-invoice-email.mjs votre@email.com');
  process.exit(1);
}

if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY n\'est pas configurée dans .env.local');
  process.exit(1);
}

testInvoiceEmail(recipientEmail);
