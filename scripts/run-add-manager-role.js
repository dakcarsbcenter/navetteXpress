const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🚀 Connexion à la base de données...');
    
    // Lire le fichier SQL
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add-manager-role.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Exécution de la migration: add-manager-role.sql');
    console.log('---');
    
    // Exécuter la migration
    await pool.query(migrationSQL);
    
    console.log('---');
    console.log('✅ Migration exécutée avec succès !');
    console.log('✨ Le rôle "manager" a été ajouté à l\'enum user_role');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
