const { Client } = require('pg');

const prodConfig = {
  host: '109.199.101.247',
  port: 5432,
  database: 'navettexpress',
  user: 'postgres',
  password: 'iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY',
  ssl: false
};

async function applyMigration() {
  const client = new Client(prodConfig);
  
  try {
    console.log('🚀 MIGRATION DE LA BASE DE DONNÉES PRODUCTION\n');
    console.log('='.repeat(80));
    
    await client.connect();
    console.log('✅ Connecté à la base PROD (109.199.101.247)\n');
    
    // 1. Créer la table driver_availability
    console.log('📋 Étape 1/4: Création de la table driver_availability...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "driver_availability" (
        "id" SERIAL PRIMARY KEY,
        "driver_id" TEXT NOT NULL,
        "day_of_week" INTEGER NOT NULL,
        "start_time" TEXT NOT NULL,
        "end_time" TEXT NOT NULL,
        "is_available" BOOLEAN NOT NULL DEFAULT true,
        "specific_date" TIMESTAMP WITHOUT TIME ZONE,
        "notes" TEXT,
        "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT fk_driver FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table driver_availability créée\n');
    
    // 2. Ajouter login_attempts
    console.log('📋 Étape 2/4: Ajout de la colonne login_attempts...');
    await client.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "login_attempts" INTEGER NOT NULL DEFAULT 0
    `);
    console.log('✅ Colonne login_attempts ajoutée\n');
    
    // 3. Ajouter account_locked_until
    console.log('📋 Étape 3/4: Ajout de la colonne account_locked_until...');
    await client.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "account_locked_until" TIMESTAMP WITHOUT TIME ZONE
    `);
    console.log('✅ Colonne account_locked_until ajoutée\n');
    
    // 4. Ajouter last_failed_login
    console.log('📋 Étape 4/4: Ajout de la colonne last_failed_login...');
    await client.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "last_failed_login" TIMESTAMP WITHOUT TIME ZONE
    `);
    console.log('✅ Colonne last_failed_login ajoutée\n');
    
    // Vérification
    console.log('='.repeat(80));
    console.log('\n🔍 Vérification de la structure de la table users...\n');
    
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('login_attempts', 'account_locked_until', 'last_failed_login')
      ORDER BY column_name
    `);
    
    console.log('📋 Colonnes ajoutées:');
    result.rows.forEach(col => {
      console.log(`   ✅ ${col.column_name} (${col.data_type}) - DEFAULT: ${col.column_default || 'NULL'}`);
    });
    
    // Vérifier la table driver_availability
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'driver_availability'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('\n✅ Table driver_availability créée avec succès');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS!\n');
    
    await client.end();
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error.message);
    console.error('Stack:', error.stack);
    await client.end();
    process.exit(1);
  }
}

applyMigration().then(() => {
  console.log('✅ Script terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
