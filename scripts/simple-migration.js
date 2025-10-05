const { neon } = require('@neondatabase/serverless');

async function runSimpleMigration() {
  console.log('🚀 Exécution de la migration simplifiée...');
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Étape 1: Ajouter la colonne role
    console.log('📝 Ajout de la colonne role...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'chauffeur'`;
    console.log('✅ Colonne role ajoutée');
    
    // Étape 2: Ajouter la colonne phone
    console.log('📝 Ajout de la colonne phone...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text`;
    console.log('✅ Colonne phone ajoutée');
    
    // Étape 3: Ajouter la colonne license_number
    console.log('📝 Ajout de la colonne license_number...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number text`;
    console.log('✅ Colonne license_number ajoutée');
    
    // Étape 4: Ajouter la colonne is_active
    console.log('📝 Ajout de la colonne is_active...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`;
    console.log('✅ Colonne is_active ajoutée');
    
    // Étape 5: Créer l'enum user_role
    console.log('📝 Création de l\'enum user_role...');
    try {
      await sql`CREATE TYPE user_role AS ENUM ('admin', 'chauffeur')`;
      console.log('✅ Enum user_role créé');
    } catch (error) {
      console.log('⚠️  Enum user_role existe déjà');
    }
    
    // Étape 6: Créer l'enum booking_status
    console.log('📝 Création de l\'enum booking_status...');
    try {
      await sql`CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')`;
      console.log('✅ Enum booking_status créé');
    } catch (error) {
      console.log('⚠️  Enum booking_status existe déjà');
    }
    
    // Étape 7: Créer l'enum vehicle_type
    console.log('📝 Création de l\'enum vehicle_type...');
    try {
      await sql`CREATE TYPE vehicle_type AS ENUM ('sedan', 'suv', 'van', 'luxury', 'bus')`;
      console.log('✅ Enum vehicle_type créé');
    } catch (error) {
      console.log('⚠️  Enum vehicle_type existe déjà');
    }
    
    // Étape 8: Ajouter les colonnes aux véhicules
    console.log('📝 Ajout des colonnes aux véhicules...');
    await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type vehicle_type DEFAULT 'sedan'`;
    await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS driver_id text`;
    console.log('✅ Colonnes véhicules ajoutées');
    
    // Étape 9: Ajouter les colonnes aux réservations
    console.log('📝 Ajout des colonnes aux réservations...');
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id text`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_id text`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status booking_status DEFAULT 'pending'`;
    console.log('✅ Colonnes réservations ajoutées');
    
    // Étape 10: Créer la table permissions
    console.log('📝 Création de la table permissions...');
    try {
      await sql`CREATE TABLE permissions (
        id SERIAL PRIMARY KEY,
        role user_role NOT NULL,
        resource text NOT NULL,
        action text NOT NULL,
        allowed boolean NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`;
      console.log('✅ Table permissions créée');
    } catch (error) {
      console.log('⚠️  Table permissions existe déjà');
    }
    
    // Étape 11: Créer la table reviews
    console.log('📝 Création de la table reviews...');
    try {
      await sql`CREATE TABLE reviews (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL,
        customer_id text NOT NULL,
        driver_id text NOT NULL,
        rating INTEGER NOT NULL,
        comment text,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT rating_check CHECK (rating >= 1 AND rating <= 5)
      )`;
      console.log('✅ Table reviews créée');
    } catch (error) {
      console.log('⚠️  Table reviews existe déjà');
    }
    
    console.log('🎉 Migration simplifiée terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  runSimpleMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runSimpleMigration };
