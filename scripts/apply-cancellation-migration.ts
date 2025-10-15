import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { bookingsTable } from '../src/schema';

async function applyMigration() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'navetteXpress',
    user: 'postgres',
    password: 'postgres',
  });

  const db = drizzle(pool);

  try {
    console.log('🔄 Application de la migration pour les champs d\'annulation...');
    
    // Exécuter les commandes ALTER TABLE directement
    await pool.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
      ADD COLUMN IF NOT EXISTS cancelled_by TEXT,
      ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
    `);

    // Ajouter la contrainte de clé étrangère si elle n'existe pas
    try {
      await pool.query(`
        ALTER TABLE bookings 
        ADD CONSTRAINT fk_cancelled_by 
        FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL;
      `);
    } catch (error: any) {
      if (error.code === '42710') {
        console.log('⚠️ Contrainte fk_cancelled_by existe déjà');
      } else {
        throw error;
      }
    }
    
    console.log('✅ Migration appliquée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
  } finally {
    await pool.end();
  }
}

applyMigration();