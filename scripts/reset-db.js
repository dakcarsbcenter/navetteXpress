const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function resetDatabase() {
  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🧹 Nettoyage de la base de données...');
    
    // Supprimer toutes les tables dans l'ordre correct
    await sql`DROP TABLE IF EXISTS "bookings" CASCADE`;
    await sql`DROP TABLE IF EXISTS "reviews" CASCADE`;
    await sql`DROP TABLE IF EXISTS "vehicles" CASCADE`;
    await sql`DROP TABLE IF EXISTS "permissions" CASCADE`;
    await sql`DROP TABLE IF EXISTS "sessions" CASCADE`;
    await sql`DROP TABLE IF EXISTS "accounts" CASCADE`;
    await sql`DROP TABLE IF EXISTS "verification_tokens" CASCADE`;
    await sql`DROP TABLE IF EXISTS "users" CASCADE`;
    
    // Supprimer les types ENUM
    await sql`DROP TYPE IF EXISTS "user_role" CASCADE`;
    await sql`DROP TYPE IF EXISTS "booking_status" CASCADE`;
    await sql`DROP TYPE IF EXISTS "vehicle_type" CASCADE`;
    
    console.log('✅ Base de données nettoyée avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    throw error;
  }
}

resetDatabase()
  .then(() => {
    console.log('🎉 Nettoyage terminé. Vous pouvez maintenant exécuter: npm run db:push');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Échec du nettoyage:', error);
    process.exit(1);
  });
