// Créer manuellement la réservation pour le devis #3
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function createBookingForQuote3() {
  try {
    console.log('\n📅 Création manuelle de la réservation pour le devis #3...\n');
    
    // Créer la réservation (ID sera généré automatiquement par la séquence)
    const booking = await sql`
      INSERT INTO bookings (
        customer_name,
        customer_email,
        customer_phone,
        pickup_address,
        dropoff_address,
        scheduled_date_time,
        status,
        price,
        passengers,
        luggage,
        notes,
        created_at,
        updated_at
      ) VALUES (
        'NACAMPIA JEAN OUBI NTAB',
        'dakcarsbcenter@gmail.com',
        '',
        'FOIRE',
        'AIBD',
        '2025-11-16 14:00:00',
        'confirmed',
        '25000.00',
        4,
        2,
        'Réservation créée manuellement suite à l''acceptation du devis #3

Service: airport

Détails du devis:
Demande de devis pour 4 personne(s).
Services: airport
Durée: 1 jour(s)
Départ: FOIRE
Destination: AIBD
Bagages cabine: 2
Bagages soute: 0
Mode de paiement souhaité: cash

Description: TEST CREATION DEMANDE DE RESERVATION APRES ACCEPTATION DEVIS',
        NOW(),
        NOW()
      )
      RETURNING *
    `;
    
    if (booking.length > 0) {
      const b = booking[0];
      console.log('✅ Réservation créée avec succès !');
      console.log(`   ID: ${b.id}`);
      console.log(`   Statut: ${b.status}`);
      console.log(`   Client: ${b.customer_name}`);
      console.log(`   De: ${b.pickup_address}`);
      console.log(`   À: ${b.dropoff_address}`);
      console.log(`   Date: ${new Date(b.scheduled_date_time).toLocaleString('fr-FR')}`);
      console.log(`   Prix: ${b.price} FCFA`);
      console.log(`   Passagers: ${b.passengers}`);
      console.log(`   Bagages: ${b.luggage}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    console.error('   Message:', error.message);
  }
}

createBookingForQuote3();
