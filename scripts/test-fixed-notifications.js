const path = require('path');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const { 
  sendNewBookingNotificationToAdmin,
  sendDriverAssignmentNotification,
  sendBookingApprovalNotificationToCustomer
} = require('../src/lib/brevo-email.ts');

async function testNotificationsFixes() {
  console.log('🧪 TEST DES CORRECTIONS - NOTIFICATIONS DE RÉSERVATION\n');
  console.log('═'.repeat(65));

  // Vérifier la configuration
  if (!process.env.BREVO_API_KEY) {
    console.log('❌ BREVO_API_KEY non configurée dans .env.local');
    return;
  }

  if (!process.env.ADMIN_EMAIL) {
    console.log('⚠️ ADMIN_EMAIL non configurée dans .env.local');
    console.log('   Utilisation de admin@navette-xpress.sn par défaut');
  }

  console.log('✅ Configuration Brevo vérifiée');
  console.log(`📧 Email admin: ${process.env.ADMIN_EMAIL || 'admin@navette-xpress.sn'}`);
  console.log(`👤 Nom expéditeur: ${process.env.BREVO_SENDER_NAME || 'Navette Xpress'}`);
  console.log(`📨 Email expéditeur: ${process.env.BREVO_SENDER_EMAIL || 'Non configuré'}`);

  console.log('\n🎯 TESTS DES 3 NOTIFICATIONS AUTOMATIQUES\n');

  // Test de données simulant un flux complet
  const bookingData = {
    id: 987654,
    customerName: 'Laurent Dubois',
    customerEmail: 'laurent.dubois@email.fr',
    customerPhone: '+33 6 98 76 54 32',
    pickupAddress: '25 Place Vendôme, Dakar',
    dropoffAddress: 'Aéroport Charles de Gaulle, Terminal 2F, 95700 Roissy',
    scheduledDateTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // Dans 6h
    price: '195',
    notes: `Service: Transport Aéroport Business
Passagers: 2 adultes
Durée: 1h30
Services: WiFi Premium, Journaux, Eau
Vol: Air France AF1245 - Départ 14h30
Demandes: Véhicule premium, siège enfant`
  };

  // 📧 Test 1: Notification Admin
  console.log('1️⃣ 📧 Test Notification Admin (nouvelle réservation)...');
  try {
    const adminResult = await sendNewBookingNotificationToAdmin(
      process.env.ADMIN_EMAIL || 'admin@navette-xpress.sn',
      bookingData
    );

    if (adminResult.success) {
      console.log(`   ✅ SUCCÈS - Message ID: ${adminResult.messageId}`);
      console.log(`   📤 Envoyé à: ${process.env.ADMIN_EMAIL || 'admin@navette-xpress.sn'}`);
    } else {
      console.log(`   ❌ ÉCHEC: ${adminResult.error}`);
      return;
    }
  } catch (error) {
    console.log(`   ❌ EXCEPTION: ${error.message}`);
    return;
  }

  // Pause entre les tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 📧 Test 2: Notification Chauffeur  
  console.log('\n2️⃣ 🚖 Test Notification Chauffeur (assignation)...');
  try {
    const driverResult = await sendDriverAssignmentNotification(
      process.env.ADMIN_EMAIL || 'admin@navette-xpress.sn', // Utilisez votre email pour test
      'Pierre Martin', // Nom du chauffeur
      {
        id: bookingData.id,
        customerName: bookingData.customerName,
        customerPhone: bookingData.customerPhone,
        pickupAddress: bookingData.pickupAddress,
        dropoffAddress: bookingData.dropoffAddress,
        scheduledDateTime: bookingData.scheduledDateTime,
        price: bookingData.price,
        notes: bookingData.notes
      }
    );

    if (driverResult.success) {
      console.log(`   ✅ SUCCÈS - Message ID: ${driverResult.messageId}`);
      console.log(`   📤 Envoyé à: ${process.env.ADMIN_EMAIL || 'admin@navette-xpress.sn'}`);
    } else {
      console.log(`   ❌ ÉCHEC: ${driverResult.error}`);
      return;
    }
  } catch (error) {
    console.log(`   ❌ EXCEPTION: ${error.message}`);
    return;
  }

  // Pause entre les tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 📧 Test 3: Notification Client
  console.log('\n3️⃣ ✅ Test Notification Client (approbation chauffeur)...');
  try {
    const customerResult = await sendBookingApprovalNotificationToCustomer(
      process.env.ADMIN_EMAIL || 'admin@navette-xpress.sn', // Utilisez votre email pour test
      bookingData.customerName,
      {
        id: bookingData.id,
        driverName: 'Pierre Martin',
        driverPhone: '+33 6 55 77 88 99',
        pickupAddress: bookingData.pickupAddress,
        dropoffAddress: bookingData.dropoffAddress,
        scheduledDateTime: bookingData.scheduledDateTime,
        price: bookingData.price,
        vehicleInfo: 'Mercedes Classe S Premium - Berline Noire',
        notes: bookingData.notes
      }
    );

    if (customerResult.success) {
      console.log(`   ✅ SUCCÈS - Message ID: ${customerResult.messageId}`);
      console.log(`   📤 Envoyé à: ${process.env.ADMIN_EMAIL || 'admin@navette-xpress.sn'}`);
    } else {
      console.log(`   ❌ ÉCHEC: ${customerResult.error}`);
      return;
    }
  } catch (error) {
    console.log(`   ❌ EXCEPTION: ${error.message}`);
    return;
  }

  console.log('\n' + '═'.repeat(65));
  console.log('🎉 TOUS LES TESTS RÉUSSIS !');
  console.log('\n📧 Vérifiez votre boîte email, vous devriez avoir reçu 3 notifications :');
  console.log('   1️⃣ 🚗 Nouvelle réservation #987654 (Admin)');
  console.log('   2️⃣ 🚖 Nouvelle course assignée #987654 (Chauffeur)');
  console.log('   3️⃣ ✅ Réservation confirmée #987654 (Client)');

  console.log('\n✨ VOS NOTIFICATIONS AUTOMATIQUES SONT OPÉRATIONNELLES !');
  console.log('\n🔄 Flux automatique configuré :');
  console.log('   Client soumet → 📧 Admin reçoit notification');
  console.log('   Admin assigne → 📧 Chauffeur reçoit notification'); 
  console.log('   Chauffeur approuve → 📧 Client reçoit confirmation');

  console.log('\n🚀 Votre système de réservation avec notifications est maintenant complet !');
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Erreur non gérée:', error.message);
  process.exit(1);
});

// Lancer les tests
testNotificationsFixes().catch(console.error);
