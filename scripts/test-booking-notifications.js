const path = require('path');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const { 
  sendNewBookingNotificationToAdmin,
  sendDriverAssignmentNotification,
  sendBookingApprovalNotificationToCustomer
} = require('../src/lib/brevo-email.ts');

async function testBookingNotifications() {
  console.log('🚀 TEST DES NOTIFICATIONS DE RÉSERVATION\n');
  console.log('═'.repeat(60));

  // Vérifier la configuration
  if (!process.env.BREVO_API_KEY) {
    console.log('❌ BREVO_API_KEY non configurée dans .env.local');
    process.exit(1);
  }

  // Demander l'email de test
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const testEmail = await new Promise((resolve) => {
    rl.question('\n📧 Entrez votre email pour recevoir les 3 notifications de test: ', (answer) => {
      resolve(answer);
      rl.close();
    });
  });

  if (!testEmail || !testEmail.includes('@')) {
    console.log('❌ Email invalide. Test arrêté.');
    return;
  }

  console.log(`\n🎯 Envoi des 3 notifications vers: ${testEmail}\n`);

  // Test 1: Notification Admin - Nouvelle Réservation
  console.log('📤 1. Test Notification Admin (Nouvelle Réservation)...');
  try {
    const adminResult = await sendNewBookingNotificationToAdmin(testEmail, {
      id: 12345,
      customerName: 'Jean Dupont',
      customerEmail: 'jean.dupont@email.com',
      customerPhone: '+33 6 12 34 56 78',
      pickupAddress: '123 Avenue des Champs-Élysées, Dakar',
      dropoffAddress: 'Aéroport Charles de Gaulle, Terminal 2E, 95700 Roissy-en-France',
      scheduledDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
      price: '185',
      notes: `Service: Transport Aéroport
Passagers: 2 adultes + 1 enfant
Durée estimée: 1h15
Services additionnels: WiFi, Siège enfant, Journaux
Demandes spéciales: Véhicule premium, arrivée 2h avant le vol`
    });

    if (adminResult.success) {
      console.log(`   ✅ Envoyé - Message ID: ${adminResult.messageId}`);
    } else {
      console.log(`   ❌ Erreur: ${adminResult.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }

  // Pause entre les envois
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Notification Chauffeur - Assignation
  console.log('\n📤 2. Test Notification Chauffeur (Assignation)...');
  try {
    const driverResult = await sendDriverAssignmentNotification(
      testEmail,
      'Marie Martin', // Nom du chauffeur
      {
        id: 67890,
        customerName: 'Sophie Dubois',
        customerPhone: '+33 6 98 76 54 32',
        pickupAddress: 'Hôtel Le Meurice, 228 Rue de Rivoli, Dakar',
        dropoffAddress: 'Gare de Lyon, Place Louis Armand, Dakar',
        scheduledDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Dans 2h
        price: '95',
        notes: `Transport Business VIP
Réunion importante à 15h00
Client habituel - Service premium
Véhicule propre et silencieux requis`
      }
    );

    if (driverResult.success) {
      console.log(`   ✅ Envoyé - Message ID: ${driverResult.messageId}`);
    } else {
      console.log(`   ❌ Erreur: ${driverResult.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }

  // Pause entre les envois
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Notification Client - Approbation
  console.log('\n📤 3. Test Notification Client (Approbation Chauffeur)...');
  try {
    const customerResult = await sendBookingApprovalNotificationToCustomer(
      testEmail,
      'Pierre Martin', // Nom du client
      {
        id: 11111,
        driverName: 'Ahmed Benali',
        driverPhone: '+33 6 55 77 88 99',
        pickupAddress: '15 Place Vendôme, Dakar',
        dropoffAddress: 'Aéroport d\'Orly, Terminal Sud, 94390 Orly',
        scheduledDateTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // Dans 4h
        price: '155',
        vehicleInfo: 'Mercedes Classe S - Berline Noire Premium',
        notes: `Vol Air France AF1234 - Départ 18h30
Terminal Sud - Porte 12
2 bagages en soute
Arrivée recommandée: 16h30`
      }
    );

    if (customerResult.success) {
      console.log(`   ✅ Envoyé - Message ID: ${customerResult.messageId}`);
    } else {
      console.log(`   ❌ Erreur: ${customerResult.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('🎉 TESTS TERMINÉS !');
  console.log(`\n📬 Vérifiez votre boîte email: ${testEmail}`);
  console.log('📋 Vous devriez avoir reçu 3 emails :');
  console.log('   1️⃣ 🚗 Nouvelle réservation (pour Admin)');
  console.log('   2️⃣ 🚖 Course assignée (pour Chauffeur)'); 
  console.log('   3️⃣ ✅ Réservation confirmée (pour Client)');
  console.log('\n💡 Si tous les emails sont arrivés, vos notifications sont parfaitement configurées !');
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Erreur non gérée:', error.message);
  process.exit(1);
});

// Lancer les tests
testBookingNotifications().catch(console.error);
