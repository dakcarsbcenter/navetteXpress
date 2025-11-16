/**
 * Script pour prévisualiser et construire les templates d'emails
 * Usage: npx tsx preview-email-templates.ts
 */

import { render } from '@react-email/components';
import * as fs from 'fs';
import * as path from 'path';
import PasswordResetEmail from './src/emails/PasswordResetEmail';
import AccountLockedEmail from './src/emails/AccountLockedEmail';
import WelcomeEmail from './src/emails/WelcomeEmail';

async function previewTemplates() {
  console.log('🎨 Prévisualisation des templates d\'emails\n');

  const outputDir = path.join(process.cwd(), 'email-previews');
  
  // Créer le dossier de sortie
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;

  // Template 1 : Réinitialisation de mot de passe
  try {
    console.log('📧 Génération de PasswordResetEmail...');
    
    const passwordResetHtml = await render(
      PasswordResetEmail({
        userName: 'Jean Dupont',
        resetUrl: 'http://localhost:3000/auth/reset-password/confirm?token=abc123example456def789',
        expiresIn: '1 heure'
      })
    );

    fs.writeFileSync(
      path.join(outputDir, 'PasswordResetEmail.html'),
      passwordResetHtml,
      'utf-8'
    );
    console.log('✅ PasswordResetEmail.html créé');
    successCount++;
  } catch (error: any) {
    console.error('❌ Erreur PasswordResetEmail:', error.message);
    errorCount++;
  }

  // Template 2 : Compte bloqué
  try {
    console.log('\n📧 Génération de AccountLockedEmail...');
    
    const accountLockedHtml = await render(
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
    successCount++;
  } catch (error: any) {
    console.error('❌ Erreur AccountLockedEmail:', error.message);
    errorCount++;
  }

  // Template 3 : Bienvenue
  try {
    console.log('\n📧 Génération de WelcomeEmail...');
    
    const welcomeHtml = await render(WelcomeEmail());

    fs.writeFileSync(
      path.join(outputDir, 'WelcomeEmail.html'),
      welcomeHtml,
      'utf-8'
    );
    console.log('✅ WelcomeEmail.html créé');
    successCount++;
  } catch (error: any) {
    console.error('❌ Erreur WelcomeEmail:', error.message);
    errorCount++;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Résumé :');
  console.log(`✅ ${successCount} template(s) généré(s) avec succès`);
  if (errorCount > 0) {
    console.log(`❌ ${errorCount} erreur(s)`);
  }
  console.log(`\n📁 Fichiers HTML disponibles dans : ${outputDir}`);
  console.log('💡 Ouvrez ces fichiers dans un navigateur pour prévisualiser les emails\n');
  
  // Afficher les chemins des fichiers
  if (successCount > 0) {
    console.log('📄 Fichiers générés :');
    const files = fs.readdirSync(outputDir);
    files.forEach(file => {
      console.log(`   - ${path.join(outputDir, file)}`);
    });
  }
}

previewTemplates().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
