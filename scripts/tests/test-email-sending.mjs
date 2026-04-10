/**
 * Script de test pour l'envoi d'emails avec Resend
 * Usage: node test-email-sending.mjs votre@email.com
 */

import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

// Fonction pour lire le fichier .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Le fichier .env.local n\'existe pas');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  }
}

// Charger les variables d'environnement
loadEnvFile();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NavetteXpress <onboarding@resend.dev>';

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY n\'est pas définie dans .env.local');
  console.error('💡 Ajoutez : RESEND_API_KEY=re_votre_clé_api');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

async function testEmailSending() {
  const testEmail = process.argv[2];

  if (!testEmail) {
    console.error('❌ Veuillez fournir une adresse email');
    console.error('Usage: node test-email-sending.mjs votre@email.com');
    process.exit(1);
  }

  console.log('🧪 Test d\'envoi d\'email avec Resend\n');
  console.log('📧 Email de test:', testEmail);
  console.log('📤 Depuis:', FROM_EMAIL);
  console.log('🔑 API Key:', RESEND_API_KEY.substring(0, 10) + '...\n');

  try {
    console.log('📬 Envoi de l\'email de test...');

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [testEmail],
      subject: '🧪 Test NavetteXpress - Email de Réinitialisation',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px;">
              <h1 style="color: #333; font-size: 24px; text-align: center;">🎉 Test Réussi !</h1>
              
              <p style="color: #333; font-size: 16px; line-height: 26px;">
                Félicitations ! Votre configuration Resend fonctionne parfaitement.
              </p>

              <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 16px; margin: 24px 0;">
                <p style="color: #155724; margin: 0; text-align: center;">
                  ✅ Les emails de NavetteXpress seront envoyés avec succès
                </p>
              </div>

              <h2 style="color: #333; font-size: 18px; margin-top: 32px;">
                Types d'emails configurés :
              </h2>

              <ul style="color: #333; font-size: 16px; line-height: 26px;">
                <li>🔐 Réinitialisation de mot de passe</li>
                <li>🔒 Notification de compte bloqué</li>
                <li>✅ Confirmation de changement de mot de passe</li>
              </ul>

              <p style="color: #666; font-size: 14px; margin-top: 32px;">
                Cet email de test a été envoyé depuis NavetteXpress pour vérifier la configuration Resend.
              </p>

              <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 32px 0;">

              <p style="color: #8898aa; font-size: 12px; margin: 0;">
                NavetteXpress - Système de gestion de transport
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('\n❌ Erreur lors de l\'envoi:', error);
      
      if (error.message && error.message.includes('Invalid API key')) {
        console.error('\n💡 Vérifiez que votre RESEND_API_KEY est correcte');
        console.error('   Elle doit commencer par "re_"');
      }
      
      if (error.message && error.message.includes('Domain not verified')) {
        console.error('\n💡 Votre domaine n\'est pas vérifié');
        console.error('   Pour les tests, utilisez: RESEND_FROM_EMAIL=NavetteXpress <onboarding@resend.dev>');
      }
      
      process.exit(1);
    }

    console.log('\n✅ Email envoyé avec succès !');
    console.log('📋 ID de l\'email:', data.id);
    console.log('\n🎉 Configuration Resend validée !');
    console.log('\n📱 Prochaines étapes :');
    console.log('   1. Vérifiez votre boîte de réception');
    console.log('   2. Vérifiez le dossier spam si nécessaire');
    console.log('   3. Testez la réinitialisation de mot de passe sur /auth/reset-password');
    console.log('\n💡 Consultez RESEND_EMAIL_SETUP.md pour plus d\'informations');

  } catch (error) {
    console.error('\n❌ Erreur inattendue:', error);
    process.exit(1);
  }
}

testEmailSending();
