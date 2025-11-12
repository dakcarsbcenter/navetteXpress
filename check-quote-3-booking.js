require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function checkQuote3() {
  try {
    console.log('\n🔍 Vérification du devis #3 et de sa réservation...\n');
    
    // 1. Récupérer le devis
    const quote = await sql`
      SELECT * FROM quotes WHERE id = 3
    `;
    
    if (quote.length === 0) {
      console.log('❌ Devis #3 non trouvé');
      return;
    }
    
    const q = quote[0];
    console.log('📋 Devis #3:');
    console.log(`   Client: ${q.customer_name} (${q.customer_email})`);
    console.log(`   Statut: ${q.status}`);
    console.log(`   Prix estimé: ${q.estimated_price} FCFA`);
    console.log(`   Service: ${q.service}`);
    console.log(`   Date préférée: ${q.preferred_date || 'Non définie'}`);
    console.log(`   Créé le: ${new Date(q.created_at).toLocaleString('fr-FR')}`);
    console.log(`   Mis à jour: ${new Date(q.updated_at).toLocaleString('fr-FR')}`);
    
    console.log('\n📝 Message du devis:');
    console.log('─'.repeat(60));
    console.log(q.message);
    console.log('─'.repeat(60));
    
    // 2. Chercher les réservations pour ce client
    console.log('\n🔍 Recherche de réservations pour ce client...');
    const bookings = await sql`
      SELECT * FROM bookings 
      WHERE customer_email = ${q.customer_email}
      ORDER BY created_at DESC
    `;
    
    console.log(`\n📊 ${bookings.length} réservation(s) trouvée(s) pour ${q.customer_email}:\n`);
    
    if (bookings.length === 0) {
      console.log('❌ AUCUNE RÉSERVATION TROUVÉE !');
      console.log('\n🔍 Analyse:');
      console.log(`   • Devis accepté le: ${new Date(q.updated_at).toLocaleString('fr-FR')}`);
      console.log(`   • Prix estimé: ${q.estimated_price ? '✅ Défini' : '❌ Manquant'}`);
      console.log(`   • Statut actuel: ${q.status}`);
      
      console.log('\n💡 Raisons possibles:');
      console.log('   1. Le devis a été accepté AVANT la mise en place de la fonctionnalité');
      console.log('   2. Une erreur s\'est produite lors de la création (vérifier les logs serveur)');
      console.log('   3. Le prix estimé manquait au moment de l\'acceptation');
      
      console.log('\n✅ Solution: Créer manuellement la réservation');
      console.log('   → Connectez-vous en admin');
      console.log('   → Gestion des Réservations → Nouvelle Réservation');
      console.log('   → Utilisez ces informations:');
      console.log(`      - Client: ${q.customer_name}`);
      console.log(`      - Email: ${q.customer_email}`);
      console.log(`      - Prix: ${q.estimated_price} FCFA`);
      console.log(`      - Statut: CONFIRMED`);
      console.log(`      - Service: ${q.service}`);
      
    } else {
      bookings.forEach((booking, index) => {
        const isLinked = booking.notes && booking.notes.includes('devis #3');
        console.log(`${isLinked ? '✅' : '⚠️ '} Réservation #${booking.id}:`);
        console.log(`   Statut: ${booking.status}`);
        console.log(`   De: ${booking.pickup_address}`);
        console.log(`   À: ${booking.dropoff_address}`);
        console.log(`   Date: ${booking.scheduled_date_time ? new Date(booking.scheduled_date_time).toLocaleString('fr-FR') : 'Non définie'}`);
        console.log(`   Prix: ${booking.price} FCFA`);
        console.log(`   Créée le: ${new Date(booking.created_at).toLocaleString('fr-FR')}`);
        console.log(`   ${isLinked ? 'LIÉE AU DEVIS #3' : 'Non liée au devis #3'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    console.error('   Message:', error.message);
  }
}

checkQuote3();
