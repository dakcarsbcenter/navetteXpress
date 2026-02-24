import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

const DATABASE_URL = 'postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

async function runMigration() {
  console.log('🔌 Connexion à la base de données...');
  
  const client = postgres(DATABASE_URL, { ssl: 'require' });
  const db = drizzle(client);

  try {
    console.log('✅ Connecté avec succès\n');
    console.log('📄 Exécution de la migration pour ajouter les colonnes d\'approbation de prix...\n');

    // Ajouter les colonnes
    await db.execute(sql`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS price_proposed_at TIMESTAMP;
    `);
    console.log('✅ Colonne price_proposed_at ajoutée');

    await db.execute(sql`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS client_response TEXT;
    `);
    console.log('✅ Colonne client_response ajoutée');

    await db.execute(sql`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS client_response_at TIMESTAMP;
    `);
    console.log('✅ Colonne client_response_at ajoutée');

    await db.execute(sql`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS client_response_message TEXT;
    `);
    console.log('✅ Colonne client_response_message ajoutée\n');

    // Ajouter les commentaires
    await db.execute(sql`
      COMMENT ON COLUMN bookings.price_proposed_at IS 'Date et heure à laquelle l''admin a proposé un prix';
    `);
    
    await db.execute(sql`
      COMMENT ON COLUMN bookings.client_response IS 'Réponse du client: pending, accepted, rejected';
    `);
    
    await db.execute(sql`
      COMMENT ON COLUMN bookings.client_response_at IS 'Date et heure de la réponse du client';
    `);
    
    await db.execute(sql`
      COMMENT ON COLUMN bookings.client_response_message IS 'Message du client lors du rejet';
    `);
    console.log('✅ Commentaires ajoutés\n');

    // Vérifier les colonnes ajoutées
    console.log('🔍 Vérification des colonnes ajoutées...');
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      AND column_name IN ('price_proposed_at', 'client_response', 'client_response_at', 'client_response_message')
      ORDER BY column_name;
    `);

    if (result && result.length > 0) {
      console.log('\n📊 Colonnes créées:');
      console.table(result);
    }

    console.log('\n✅ Migration terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    console.error('\nDétails:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Déconnecté de la base de données');
  }
}

runMigration();
