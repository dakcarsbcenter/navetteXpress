/**
 * Script pour générer les templates HTML prêts pour Resend
 * Ces fichiers peuvent être copiés directement dans le dashboard Resend
 */

import { render } from '@react-email/components';
import * as fs from 'fs';
import * as path from 'path';

// Import all email templates
import PasswordResetEmail from './src/emails/PasswordResetEmail';
import AccountLockedEmail from './src/emails/AccountLockedEmail';
import WelcomeEmail from './src/emails/WelcomeEmail';
import NewBookingRequestEmail from './src/emails/NewBookingRequestEmail';
import BookingAssignedEmail from './src/emails/BookingAssignedEmail';
import BookingConfirmedEmail from './src/emails/BookingConfirmedEmail';
import NewQuoteRequestEmail from './src/emails/NewQuoteRequestEmail';
import QuoteConfirmedEmail from './src/emails/QuoteConfirmedEmail';
import QuoteRejectedEmail from './src/emails/QuoteRejectedEmail';

async function generateResendTemplates() {
  console.log('🎨 Génération des templates pour Resend Dashboard\n');

  const outputDir = path.join(process.cwd(), 'resend-templates');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Template 1 : Password Reset avec variables Resend
  try {
    console.log('📧 Génération du template Password Reset...');
    
    const passwordResetHtml = await render(
      PasswordResetEmail({
        userName: '{{userName}}',  // Variable Resend
        resetUrl: '{{resetUrl}}',  // Variable Resend
        expiresIn: '1 heure'
      })
    );

    const templateInfo = `
<!--
TEMPLATE RESEND: password-reset
SUBJECT: Réinitialisation de votre mot de passe - NavetteXpress

VARIABLES REQUISES:
- userName (string) : Nom de l'utilisateur
- resetUrl (string) : Lien de réinitialisation complet

EXEMPLE D'UTILISATION:
await resend.emails.send({
  from: 'NavetteXpress <noreply@votredomaine.com>',
  to: ['user@example.com'],
  subject: 'Réinitialisation de votre mot de passe - NavetteXpress',
  html: await resend.templates.get('password-reset'),
  variables: {
    userName: 'Jean Dupont',
    resetUrl: 'https://app.com/reset?token=abc123'
  }
});
-->

${passwordResetHtml}
`;

    fs.writeFileSync(
      path.join(outputDir, 'password-reset.html'),
      templateInfo,
      'utf-8'
    );
    console.log('✅ password-reset.html créé');
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  }

  // Template 2 : Account Locked avec variables Resend
  try {
    console.log('\n📧 Génération du template Account Locked...');
    
    const accountLockedHtml = await render(
      AccountLockedEmail({
        userName: '{{userName}}',
        unlockTime: '{{unlockTime}}',
        resetUrl: '{{resetUrl}}'
      })
    );

    const templateInfo = `
<!--
TEMPLATE RESEND: account-locked
SUBJECT: 🔒 Alerte sécurité - Compte temporairement bloqué - NavetteXpress

VARIABLES REQUISES:
- userName (string) : Nom de l'utilisateur
- unlockTime (string) : Date/heure de déblocage formatée
- resetUrl (string) : Lien de réinitialisation

EXEMPLE D'UTILISATION:
await resend.emails.send({
  from: 'NavetteXpress <noreply@votredomaine.com>',
  to: ['user@example.com'],
  subject: '🔒 Alerte sécurité - Compte temporairement bloqué',
  html: await resend.templates.get('account-locked'),
  variables: {
    userName: 'Marie Martin',
    unlockTime: 'vendredi 15 novembre 2025 à 14:30',
    resetUrl: 'https://app.com/reset'
  }
});
-->

${accountLockedHtml}
`;

    fs.writeFileSync(
      path.join(outputDir, 'account-locked.html'),
      templateInfo,
      'utf-8'
    );
    console.log('✅ account-locked.html créé');
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  }

  // Template 3 : Welcome
  try {
    console.log('\n📧 Génération du template Welcome...');
    
    const welcomeHtml = await render(WelcomeEmail());

    const templateInfo = `
<!--
TEMPLATE RESEND: welcome
SUBJECT: 🎉 Bienvenue chez NavetteXpress !

VARIABLES REQUISES:
Aucune (ou ajoutez userName si vous voulez personnaliser)

EXEMPLE D'UTILISATION:
await resend.emails.send({
  from: 'NavetteXpress <noreply@votredomaine.com>',
  to: ['user@example.com'],
  subject: '🎉 Bienvenue chez NavetteXpress !',
  html: await resend.templates.get('welcome')
});
-->

${welcomeHtml}
`;

    fs.writeFileSync(
      path.join(outputDir, 'welcome.html'),
      templateInfo,
      'utf-8'
    );
    console.log('✅ welcome.html créé');
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Templates générés avec succès !');
  console.log(`\n📁 Fichiers disponibles dans : ${outputDir}`);
  console.log('\n📝 Prochaines étapes :');
  console.log('1. Allez sur https://resend.com/emails/templates');
  console.log('2. Créez un nouveau template pour chaque fichier');
  console.log('3. Copiez le contenu HTML (sans les commentaires en haut)');
  console.log('4. Notez les IDs des templates créés');
  console.log('5. Utilisez les IDs dans votre code (voir RESEND_TEMPLATES_USAGE.md)');
}

generateResendTemplates().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
