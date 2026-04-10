/**
 * Script pour prévisualiser les templates d'emails
 * Usage: node preview-email-templates.mjs
 */

import { render } from '@react-email/components';
import * as fs from 'fs';
import * as path from 'path';

// Importation dynamique des templates
async function previewTemplates() {
  console.log('🎨 Prévisualisation des templates d\'emails\n');

  const outputDir = path.join(process.cwd(), 'email-previews');
  
  // Créer le dossier de sortie
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Template 1 : Réinitialisation de mot de passe
  try {
    const { default: PasswordResetEmail } = await import('./src/emails/PasswordResetEmail.tsx');
    
    const passwordResetHtml = render(
      PasswordResetEmail({
        userName: 'Jean Dupont',
        resetUrl: 'http://localhost:3000/auth/reset-password/confirm?token=abc123example',
        expiresIn: '1 heure'
      })
    );

    fs.writeFileSync(
      path.join(outputDir, 'PasswordResetEmail.html'),
      passwordResetHtml,
      'utf-8'
    );
    console.log('✅ PasswordResetEmail.html créé');
  } catch (error) {
    console.error('❌ Erreur PasswordResetEmail:', error.message);
  }

  // Template 2 : Compte bloqué
  try {
    const { default: AccountLockedEmail } = await import('./src/emails/AccountLockedEmail.tsx');
    
    const accountLockedHtml = render(
      AccountLockedEmail({
        userName: 'Marie Martin',
        unlockTime: 'vendredi 15 novembre 2025 à 14:30',
        resetUrl: 'http://localhost:3000/auth/reset-password'
      })
    );

    fs.writeFileSync(
      path.join(outputDir, 'AccountLockedEmail.html'),
      accountLockedHtml,
      'utf-8'
    );
    console.log('✅ AccountLockedEmail.html créé');
  } catch (error) {
    console.error('❌ Erreur AccountLockedEmail:', error.message);
  }

  // Template 3 : Bienvenue
  try {
    const { default: WelcomeEmail } = await import('./src/emails/WelcomeEmail.tsx');
    
    const welcomeHtml = render(WelcomeEmail());

    fs.writeFileSync(
      path.join(outputDir, 'WelcomeEmail.html'),
      welcomeHtml,
      'utf-8'
    );
    console.log('✅ WelcomeEmail.html créé');
  } catch (error) {
    console.error('❌ Erreur WelcomeEmail:', error.message);
  }

  console.log(`\n📁 Fichiers HTML créés dans : ${outputDir}`);
  console.log('💡 Ouvrez ces fichiers dans un navigateur pour prévisualiser les emails');
  console.log('\n🌐 Pour lancer le serveur de prévisualisation React Email :');
  console.log('   npm run email');
}

previewTemplates();
