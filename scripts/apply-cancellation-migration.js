const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'navetteXpress',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '..', 'migrations', '0008_add_cancellation_fields.sql'),
      'utf8'
    );

    console.log('🔄 Application de la migration...');
    await pool.query(migrationSQL);
    console.log('✅ Migration appliquée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
  } finally {
    await pool.end();
  }
}

applyMigration();