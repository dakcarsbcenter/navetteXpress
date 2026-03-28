require('dotenv').config();
const { Client } = require('pg');

async function verifyDatabase() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ Erreur: DATABASE_URL n\'est pas défini dans le fichier .env');
    process.exit(1);
  }

  const client = new Client({ 
    connectionString,
    ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔌 Connexion à la base de données (Neon)...');
    await client.connect();
    console.log('✅ Connecté\n');

    // Vérifier les rôles
    console.log('📊 Rôles dans custom_roles:');
    const roles = await client.query(`
      SELECT name, description, is_system 
      FROM custom_roles 
      ORDER BY name
    `);
    console.table(roles.rows);

    // Vérifier les permissions
    console.log('\n📊 Permissions par rôle:');
    const perms = await client.query(`
      SELECT role_name, COUNT(*) as total_permissions, 
             SUM(CASE WHEN allowed = true THEN 1 ELSE 0 END) as allowed_permissions
      FROM role_permissions 
      GROUP BY role_name 
      ORDER BY role_name
    `);
    console.table(perms.rows);

    // Vérifier les utilisateurs
    console.log('\n📊 Utilisateurs par rôle:');
    const users = await client.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY role
    `);
    console.table(users.rows);

    // Vérifier les données principales
    console.log('\n📊 Statistiques des tables:');
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM vehicles) as vehicles_count,
        (SELECT COUNT(*) FROM bookings) as bookings_count,
        (SELECT COUNT(*) FROM reviews) as reviews_count,
        (SELECT COUNT(*) FROM custom_roles) as roles_count,
        (SELECT COUNT(*) FROM role_permissions) as permissions_count
    `);
    console.table(stats.rows);

    console.log('\n✅ Vérification terminée !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Connexion fermée');
  }
}

verifyDatabase();
