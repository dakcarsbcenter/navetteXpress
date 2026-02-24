const { Client } = require('pg');

// Base source (Neon)
const sourceUrl = "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

// Base destination
const destUrl = "postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress";

async function migrateRolePermissions() {
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

    console.log('📋 Migration de la table: role_permissions');
    
    // Récupérer les données de la source
    const result = await sourceClient.query('SELECT * FROM role_permissions ORDER BY role_name, resource, action');
    const rows = result.rows;

    if (rows.length === 0) {
      console.log('⚠️  La table role_permissions est vide dans la base source\n');
      return;
    }

    console.log(`   Trouvé ${rows.length} ligne(s)`);

    // Vider la table destination d'abord
    await destClient.query('DELETE FROM role_permissions');
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
          `INSERT INTO role_permissions (${columnNames}) VALUES (${placeholders})`,
          values
        );
        inserted++;
      } catch (err) {
        console.log(`   ⚠️  Erreur pour une ligne:`, err.message);
        console.log(`   Données:`, row);
      }
    }

    console.log(`   ✅ ${inserted} ligne(s) insérée(s)\n`);

    // Afficher un aperçu des permissions migrées
    console.log('📊 Aperçu des permissions migrées:');
    const preview = await destClient.query(`
      SELECT role_name, COUNT(*) as count 
      FROM role_permissions 
      WHERE allowed = true
      GROUP BY role_name 
      ORDER BY role_name
    `);
    console.table(preview.rows);

    console.log('\n✅ Migration de role_permissions terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    await sourceClient.end();
    await destClient.end();
    console.log('\n🔌 Connexions fermées');
  }
}

migrateRolePermissions();
