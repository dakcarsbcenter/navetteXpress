import { config } from 'dotenv';
config(); // Charger les variables d'environnement

import { db } from '../src/db';

async function applyMigration() {
  try {
    console.log('🔄 Application de la migration pour les champs d\'annulation...');
    
    // Ajouter les nouvelles colonnes une par une pour éviter les erreurs
    try {
      await db.execute(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;`);
      console.log('✅ Colonne cancellation_reason ajoutée');
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        throw e;
      }
      console.log('⚠️ Colonne cancellation_reason existe déjà');
    }

    try {
      await db.execute(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by TEXT;`);
      console.log('✅ Colonne cancelled_by ajoutée');
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        throw e;
      }
      console.log('⚠️ Colonne cancelled_by existe déjà');
    }

    try {
      await db.execute(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;`);
      console.log('✅ Colonne cancelled_at ajoutée');
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        throw e;
      }
      console.log('⚠️ Colonne cancelled_at existe déjà');
    }

    // Ajouter la contrainte de clé étrangère
    try {
      await db.execute(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'bookings_cancelled_by_fkey'
          ) THEN
            ALTER TABLE bookings 
            ADD CONSTRAINT bookings_cancelled_by_fkey 
            FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL;
          END IF;
        END $$;
      `);
      console.log('✅ Contrainte de clé étrangère ajoutée');
    } catch (e: any) {
      console.log('⚠️ Erreur contrainte (peut être ignorée):', e.message);
    }
    
    console.log('✅ Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
  }
  
  process.exit(0);
}

applyMigration();