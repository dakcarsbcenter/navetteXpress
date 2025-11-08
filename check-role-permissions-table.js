const { Client } = require('pg');

const destUrl = "postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress";

async function checkPermissions() {
  const client = new Client({ 
    connectionString: destUrl,
    ssl: false
  });

  try {
    console.log('🔌 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté\n');

    // Vérifier les permissions existantes
    console.log('📊 Permissions actuelles dans role_permissions:');
    const perms = await client.query(`
      SELECT role_name, resource, action, allowed 
      FROM role_permissions 
      ORDER BY role_name, resource, action
      LIMIT 20
    `);
    
    if (perms.rows.length === 0) {
      console.log('⚠️  Aucune permission trouvée dans la table role_permissions!\n');
      
      // Vérifier si la table existe
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'role_permissions'
        );
      `);
      
      console.log('Table role_permissions existe:', tableExists.rows[0].exists);
      
      if (tableExists.rows[0].exists) {
        console.log('\n💡 La table existe mais est vide. Vous devez peut-être ré-insérer les permissions.');
      }
    } else {
      console.table(perms.rows);
      console.log(`\n✅ ${perms.rows.length} permissions trouvées (affichage limité à 20)`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Connexion fermée');
  }
}

checkPermissions();
