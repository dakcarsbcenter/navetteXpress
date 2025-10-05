const path = require('path');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Configuration dynamique pour importer du TypeScript
const tsNode = require('ts-node');
tsNode.register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'es2017',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    resolveJsonModule: true,
    moduleResolution: 'node'
  }
});

const { 
  sendQuoteEmail, 
  sendNotificationEmail, 
  sendVehicleReportEmail,
  testBrevoConnection 
} = require('../src/lib/brevo-email.ts');

async function testBrevoConfiguration() {
  console.log('🚀 CONFIGURATION BREVO - TESTS\n');
  console.log('═'.repeat(50));

  // Vérifier les variables d'environnement
  console.log('📋 1. Vérification des variables d\'environnement...');
  
  const requiredEnvs = [
    'BREVO_API_KEY',
    'BREVO_SENDER_EMAIL', 
    'BREVO_SENDER_NAME'
  ];

  let allEnvsPresent = true;
  requiredEnvs.forEach(env => {
    if (process.env[env]) {
      console.log(`   ✅ ${env}: ${env === 'BREVO_API_KEY' ? 'xkeysib-***' : process.env[env]}`);
    } else {
      console.log(`   ❌ ${env}: MANQUANT`);
      allEnvsPresent = false;
    }
  });

  if (!allEnvsPresent) {
    console.log('\n❌ Des variables d\'environnement sont manquantes. Vérifiez votre fichier .env.local');
    return;
  }

  console.log('\n📡 2. Test de connexion à Brevo...');
  const connectionTest = await testBrevoConnection();
  
  if (connectionTest.success) {
    console.log('   ✅ Connexion réussie !');
    console.log(`   👤 Compte: ${connectionTest.data?.email}`);
    if (connectionTest.data?.credits) {
      connectionTest.data.credits.forEach(credit => {
        console.log(`   💳 ${credit.type}: ${credit.credits} crédits`);
      });
    }
  } else {
    console.log(`   ❌ Erreur de connexion: ${connectionTest.error}`);
    console.log('\n💡 Vérifiez que votre clé API Brevo est correcte.');
    return;
  }

  // Demander l'email de test
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const testEmail = await new Promise((resolve) => {
    rl.question('\n📮 Entrez votre email pour recevoir les emails de test: ', (answer) => {
      resolve(answer);
      rl.close();
    });
  });

  if (!testEmail || !testEmail.includes('@')) {
    console.log('❌ Email invalide. Test arrêté.');
    return;
  }

  console.log(`\n🧪 3. Envoi d'emails de test vers ${testEmail}...\n`);

  // Test 1: Notification simple
  console.log('   📤 Test 1: Notification simple...');
  try {
    const notifResult = await sendNotificationEmail(
      testEmail,
      '🧪 Test Brevo - Navette Xpress',
      'Test de Configuration',
      'Félicitations ! Votre configuration Brevo fonctionne parfaitement. Cet email confirme que l\'intégration est réussie.',
      'https://navette-xpress.sn',
      'Visiter le site'
    );
    
    if (notifResult.success) {
      console.log(`      ✅ Envoyé - ID: ${notifResult.messageId}`);
    } else {
      console.log(`      ❌ Erreur: ${notifResult.error}`);
    }
  } catch (error) {
    console.log(`      ❌ Exception: ${error.message}`);
  }

  // Test 2: Email de devis
  console.log('   📤 Test 2: Email de devis...');
  try {
    const quoteResult = await sendQuoteEmail(
      testEmail,
      'Jean Dupont',
      {
        id: 123,
        service: 'Transport Aéroport AIBD → Dakar Centre',
        estimatedPrice: '185',
        adminNotes: 'Transport premium avec véhicule Mercedes Classe S. Chauffeur en costume.',
        preferredDate: new Date().toISOString()
      }
    );

    if (quoteResult.success) {
      console.log(`      ✅ Envoyé - ID: ${quoteResult.messageId}`);
    } else {
      console.log(`      ❌ Erreur: ${quoteResult.error}`);
    }
  } catch (error) {
    console.log(`      ❌ Exception: ${error.message}`);
  }

  // Test 3: Rapport véhicule
  console.log('   📤 Test 3: Rapport véhicule...');
  try {
    const reportResult = await sendVehicleReportEmail(
      testEmail,
      {
        id: 456,
        title: 'Problème de climatisation',
        description: 'La climatisation du véhicule ne fonctionne plus correctement. L\'air froid ne sort pas, même en réglant au maximum. Le problème a été remarqué ce matin lors de la première course.',
        category: 'Mécanique',
        severity: 'medium',
        driverName: 'Marie Martin',
        vehicleInfo: {
          make: 'Mercedes',
          model: 'Classe S',
          plateNumber: 'AB-123-CD'
        },
        reportedAt: new Date().toISOString()
      }
    );

    if (reportResult.success) {
      console.log(`      ✅ Envoyé - ID: ${reportResult.messageId}`);
    } else {
      console.log(`      ❌ Erreur: ${reportResult.error}`);
    }
  } catch (error) {
    console.log(`      ❌ Exception: ${error.message}`);
  }

  console.log('\n' + '═'.repeat(50));
  console.log('🎉 TESTS TERMINÉS !');
  console.log('\n📬 Vérifiez votre boîte email (et le dossier spam si nécessaire)');
  console.log('💡 Si vous avez reçu les 3 emails, votre configuration est parfaite !');
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Erreur non gérée:', error.message);
  process.exit(1);
});

// Lancer les tests
testBrevoConfiguration().catch(console.error);
