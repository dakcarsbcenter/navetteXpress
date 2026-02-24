/**
 * Script de test pour vérifier l'envoi d'emails avec les templates Resend
 * 
 * Usage:
 *   npm run test:email votre@email.com
 *   npm run test:email votre@email.com password-reset
 *   npm run test:email votre@email.com account-locked
 *   npm run test:email votre@email.com welcome
 */

import { 
  sendPasswordResetEmail,
  sendAccountLockedEmail,
  sendPasswordChangedEmail,
  sendWelcomeEmail,
  testResendConfiguration
} from './src/lib/email-resend-templates';

async function main() {
  const testEmail = process.argv[2];
  const templateType = process.argv[3] || 'password-reset';
  
  console.log('🧪 Test d\'envoi d\'emails avec templates Resend\n');
  
  // Vérifier la configuration
  console.log('1️⃣ Vérification de la configuration...');
  const isConfigured = await testResendConfiguration();
  
  if (!isConfigured) {
    console.error('\n❌ Configuration Resend incorrecte.');
    console.log('\n📝 Vérifiez que vous avez :');
    console.log('   - RESEND_API_KEY dans .env.local');
    console.log('   - RESEND_FROM_EMAIL dans .env.local');
    console.log('   - Les templates créés dans Resend Dashboard');
    process.exit(1);
  }
  
  console.log('\n✅ Configuration OK\n');
  
  // Vérifier qu'un email est fourni
  if (!testEmail) {
    console.error('❌ Veuillez fournir un email de test\n');
    console.log('Usage:');
    console.log('  npm run test:email votre@email.com');
    console.log('  npm run test:email votre@email.com password-reset');
    console.log('  npm run test:email votre@email.com account-locked');
    console.log('  npm run test:email votre@email.com welcome');
    console.log('  npm run test:email votre@email.com password-changed');
    process.exit(1);
  }
  
  console.log(`2️⃣ Envoi d'un email de test à : ${testEmail}`);
  console.log(`   Type de template : ${templateType}\n`);
  
  try {
    switch (templateType) {
      case 'password-reset':
        console.log('📧 Envoi du template "Password Reset"...');
        await sendPasswordResetEmail(
          testEmail,
          'test-token-abc123',
          'Test User'
        );
        break;
        
      case 'account-locked':
        console.log('🔒 Envoi du template "Account Locked"...');
        const unlockDate = new Date(Date.now() + 15 * 60 * 1000); // Dans 15 minutes
        await sendAccountLockedEmail(
          testEmail,
          'Test User',
          unlockDate
        );
        break;
        
      case 'welcome':
        console.log('🎉 Envoi du template "Welcome"...');
        await sendWelcomeEmail(
          testEmail,
          'Test User'
        );
        break;
        
      case 'password-changed':
        console.log('✅ Envoi du template "Password Changed"...');
        await sendPasswordChangedEmail(
          testEmail,
          'Test User'
        );
        break;
        
      default:
        console.error(`❌ Type de template inconnu: ${templateType}`);
        console.log('\nTypes disponibles:');
        console.log('  - password-reset');
        console.log('  - account-locked');
        console.log('  - welcome');
        console.log('  - password-changed');
        process.exit(1);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Email envoyé avec succès !');
    console.log('\n📬 Vérifiez votre boîte de réception à : ' + testEmail);
    console.log('💡 Si vous ne le voyez pas, vérifiez les spams');
    console.log('\n📊 Détails disponibles sur : https://resend.com/emails');
    
  } catch (error: any) {
    console.error('\n❌ Erreur lors de l\'envoi de l\'email:');
    console.error('   ' + error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Vérifiez que RESEND_API_KEY est configurée dans .env.local');
    } else if (error.message.includes('template')) {
      console.log('\n💡 Vérifiez que les templates sont créés dans Resend Dashboard');
      console.log('   https://resend.com/emails/templates');
    }
    
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
