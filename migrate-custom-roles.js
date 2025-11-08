const { Client } = require('pg');

// Base source (Neon)
const sourceUrl = "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

// Base destination
const destUrl = "postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress";

async function migrateCustomRoles() {
  const sourceClient = new Client({ connectionString: sourceUrl });
  const destClient = new Client({ 
    connectionString: destUrl,
    ssl: false
  });

  try {
    console.log('🔌 Connexion aux bases de données...');
    await sourceClient.connect();
    await destClient.connect();
    console.log('✅ Connexions établies\n');

    // Vérifier si la table existe dans la source
    const checkTable = await sourceClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'custom_roles'
      );
    `);

    if (!checkTable.rows[0].exists) {
      console.log('❌ La table custom_roles n\'existe pas dans la base source');
      console.log('\n💡 Création des rôles par défaut...');
      
      // Créer les rôles par défaut dans la destination
      const defaultRoles = [
        { name: 'admin', description: 'Administrateur système', is_system: true },
        { name: 'manager', description: 'Gestionnaire', is_system: true },
        { name: 'driver', description: 'Chauffeur', is_system: true },
        { name: 'customer', description: 'Client', is_system: true }
      ];

      for (const role of defaultRoles) {
        await destClient.query(`
          INSERT INTO custom_roles (name, description, is_system, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          ON CONFLICT (name) DO NOTHING
        `, [role.name, role.description, role.is_system]);
        console.log(`   ✅ Rôle ${role.name} créé`);
      }

      console.log('\n✅ Rôles par défaut créés avec succès!');
      return;
    }

    console.log('📋 Migration de la table: custom_roles');
    
    // Récupérer les données de la source
    const result = await sourceClient.query('SELECT * FROM custom_roles ORDER BY name');
    const rows = result.rows;

    if (rows.length === 0) {
      console.log('⚠️  La table custom_roles est vide dans la base source\n');
      return;
    }

    console.log(`   Trouvé ${rows.length} ligne(s)`);

    // Vider la table destination d'abord
    await destClient.query('DELETE FROM custom_roles');
    console.log('   🗑️  Table destination vidée');

    // Récupérer les colonnes
    const columns = Object.keys(rows[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = columns.join(', ');

    // Insérer les données
    let inserted = 0;
    for (const row of rows) {
      const values = columns.map(col => row[col]);
      
      try {
        await destClient.query(
          `INSERT INTO custom_roles (${columnNames}) VALUES (${placeholders})
           ON CONFLICT (name) DO UPDATE SET
           description = EXCLUDED.description,
           is_system = EXCLUDED.is_system,
           updated_at = EXCLUDED.updated_at`,
          values
        );
        inserted++;
      } catch (err) {
        console.log(`   ⚠️  Erreur pour une ligne:`, err.message);
        console.log(`   Données:`, row);
      }
    }

    console.log(`   ✅ ${inserted} ligne(s) insérée(s)\n`);

    // Afficher les rôles migrés
    console.log('📊 Rôles migrés:');
    const rolesTable = await destClient.query('SELECT name, description, is_system FROM custom_roles ORDER BY name');
    console.table(rolesTable.rows);

    console.log('\n✅ Migration de custom_roles terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    await sourceClient.end();
    await destClient.end();
    console.log('\n🔌 Connexions fermées');
  }
}

migrateCustomRoles();
