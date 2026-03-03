const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  // Use DATABASE_URL env var if available, otherwise build from individual env vars
  const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'navetteXpress',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
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