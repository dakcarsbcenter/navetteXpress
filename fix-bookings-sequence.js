// Réparer la séquence d'ID des bookings
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function fixSequence() {
  try {
    console.log('\n🔧 Réparation de la séquence d\'ID des bookings...\n');
    
    // Trouver le plus grand ID actuel
    const maxId = await sql`
      SELECT COALESCE(MAX(id), 0) as max_id FROM bookings
    `;
    
    const currentMaxId = maxId[0].max_id;
    console.log(`📊 Plus grand ID actuel: ${currentMaxId}`);
    
    // Réinitialiser la séquence
    const nextId = currentMaxId + 1;
    await sql`
      SELECT setval('bookings_id_seq', ${nextId}, false)
    `;
    
    console.log(`✅ Séquence réinitialisée au prochain ID: ${nextId}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    console.error('   Message:', error.message);
  }
}

fixSequence();
