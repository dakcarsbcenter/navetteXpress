// Charger les variables d'environnement manuellement
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

import { db } from '../src/db';

async function applyMigration() {
  try {
    console.log('🔄 Application de la migration pour les champs d\'annulation...');
    
    // Ajouter les nouvelles colonnes une par une
    console.log('Ajout de cancellation_reason...');
    await db.execute(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;`);
    console.log('✅ Colonne cancellation_reason ajoutée');

    console.log('Ajout de cancelled_by...');
    await db.execute(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by TEXT;`);
    console.log('✅ Colonne cancelled_by ajoutée');

    console.log('Ajout de cancelled_at...');
    await db.execute(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;`);
    console.log('✅ Colonne cancelled_at ajoutée');

    // Ajouter la contrainte de clé étrangère
    console.log('Ajout de la contrainte de clé étrangère...');
    try {
      await db.execute(`
        ALTER TABLE bookings 
        ADD CONSTRAINT IF NOT EXISTS bookings_cancelled_by_fkey 
        FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL;
      `);
      console.log('✅ Contrainte de clé étrangère ajoutée');
    } catch (e: any) {
      console.log('⚠️ Contrainte probablement déjà existante:', e.message);
    }
    
    console.log('✅ Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
  }
}

applyMigration().then(() => {
  console.log('Migration terminée');
  process.exit(0);
}).catch((error) => {
  console.error('Erreur critique:', error);
  process.exit(1);
});