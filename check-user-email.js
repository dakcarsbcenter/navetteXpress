const { Client } = require('pg');

const destUrl = "postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress";

async function checkUser() {
  const client = new Client({ 
    connectionString: destUrl,
    ssl: false
  });

  try {
    console.log('🔌 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté\n');

    const email = 'ntabjeanoubi@gmail.com';
    
    // Rechercher l'utilisateur exact
    console.log(`🔍 Recherche de l'utilisateur: ${email}`);
    const exactUser = await client.query(`
      SELECT id, name, email, role, is_active, created_at 
      FROM users 
      WHERE email = $1
    `, [email]);

    if (exactUser.rows.length > 0) {
      console.log('\n✅ Utilisateur trouvé:');
      console.table(exactUser.rows);
    } else {
      console.log('\n❌ Aucun utilisateur trouvé avec cet email exact\n');
    }

    // Rechercher des emails similaires (insensible à la casse)
    console.log('🔍 Recherche d\'emails similaires (insensible à la casse):');
    const similarUsers = await client.query(`
      SELECT id, name, email, role, is_active, created_at 
      FROM users 
      WHERE LOWER(email) = LOWER($1)
    `, [email]);

    if (similarUsers.rows.length > 0) {
      console.log('\n✅ Utilisateurs avec email similaire:');
      console.table(similarUsers.rows);
    } else {
      console.log('\n❌ Aucun utilisateur avec email similaire\n');
    }

    // Afficher tous les emails dans la base
    console.log('📋 Tous les emails dans la base:');
    const allEmails = await client.query(`
      SELECT id, name, email, role 
      FROM users 
      ORDER BY email
    `);
    console.table(allEmails.rows);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Connexion fermée');
  }
}

checkUser();
