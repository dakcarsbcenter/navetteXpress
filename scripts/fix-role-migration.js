const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function runMigration() {
  console.log('🔄 MIGRATION MANUELLE DES RÔLES\n');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL non trouvée dans .env.local');
    process.exit(1);
  }

  const sql = neon(dbUrl);

  try {
    console.log('1️⃣ Conversion des rôles "chauffeur" vers "driver"...');
    
    // Convertir users
    const usersUpdate = await sql`UPDATE users SET role = 'driver' WHERE role = 'chauffeur'`;
    console.log(`   ✅ ${usersUpdate.count || 0} utilisateurs convertis`);

    // Convertir permissions
    const permissionsUpdate = await sql`UPDATE permissions SET role = 'driver' WHERE role = 'chauffeur'`;
    console.log(`   ✅ ${permissionsUpdate.count || 0} permissions converties`);

    console.log('\n2️⃣ Suppression de la contrainte future_date_check...');
    try {
      await sql`ALTER TABLE bookings DROP CONSTRAINT IF EXISTS future_date_check`;
      console.log('   ✅ Contrainte supprimée');
    } catch (error) {
      console.log('   ⚠️ Contrainte déjà supprimée ou inexistante');
    }

    console.log('\n3️⃣ Mise à jour de l\'enum user_role...');
    
    // Convertir temporairement en text
    await sql`ALTER TABLE users ALTER COLUMN role SET DATA TYPE text`;
    await sql`ALTER TABLE permissions ALTER COLUMN role SET DATA TYPE text`;
    console.log('   ✅ Colonnes converties en text');

    // Recréer l'enum
    await sql`DROP TYPE IF EXISTS user_role CASCADE`;
    await sql`CREATE TYPE user_role AS ENUM('admin', 'driver', 'customer')`;
    console.log('   ✅ Enum user_role recréé');

    // Reconvertir vers l'enum (supprimer d'abord la valeur par défaut)
    await sql`ALTER TABLE users ALTER COLUMN role DROP DEFAULT`;
    await sql`ALTER TABLE users ALTER COLUMN role SET DATA TYPE user_role USING role::user_role`;
    await sql`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer'::user_role`;
    await sql`ALTER TABLE permissions ALTER COLUMN role SET DATA TYPE user_role USING role::user_role`;
    console.log('   ✅ Colonnes reconverties vers l\'enum');

    console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS !');
    console.log('✅ Les rôles ont été convertis de "chauffeur" vers "driver"');
    console.log('✅ La contrainte future_date_check a été supprimée');
    console.log('✅ L\'enum user_role a été mis à jour');

    // Vérification
    console.log('\n🔍 Vérification des rôles actuels...');
    const roleCheck = await sql`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY role
    `;
    
    roleCheck.forEach(row => {
      console.log(`   ${row.role}: ${row.count} utilisateur(s)`);
    });

  } catch (error) {
    console.error('\n❌ ERREUR DURANT LA MIGRATION:');
    console.error(error);
    process.exit(1);
  }
}

// Exécuter la migration
runMigration().catch(console.error);
