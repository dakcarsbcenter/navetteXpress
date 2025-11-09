const { Client } = require('pg');

const destUrl = "postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress";

async function deleteUser() {
  const client = new Client({ 
    connectionString: destUrl,
    ssl: false
  });

  try {
    console.log('🔌 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté\n');

    const email = 'ntabjeanoubi@gmail.com';
    
    console.log(`🗑️  Suppression de l'utilisateur: ${email}`);
    
    const result = await client.query(`
      DELETE FROM users 
      WHERE email = $1
      RETURNING id, name, email, role
    `, [email]);

    if (result.rows.length > 0) {
      console.log('\n✅ Utilisateur supprimé:');
      console.table(result.rows);
    } else {
      console.log('\n❌ Aucun utilisateur supprimé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Connexion fermée');
  }
}

// Exécuter la suppression
deleteUser();
