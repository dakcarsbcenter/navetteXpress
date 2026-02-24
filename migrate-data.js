const { Client } = require('pg');

// Base source (Neon)
const sourceUrl = "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

// Base destination
const destUrl = "postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress";

async function migrateData() {
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

    // Liste des tables dans l'ordre de dépendances
    const tables = [
      'users',
      'customers',
      'vehicles',
      'bookings',
      'payments',
      'reviews',
      'notifications',
      'activity_logs'
    ];

    for (const table of tables) {
      try {
        console.log(`📋 Migration de la table: ${table}`);
        
        // Vérifier si la table existe dans la source
        const checkTable = await sourceClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);

        if (!checkTable.rows[0].exists) {
          console.log(`⚠️  Table ${table} n'existe pas dans la source, ignorée\n`);
          continue;
        }

        // Récupérer les données
        const result = await sourceClient.query(`SELECT * FROM ${table}`);
        const rows = result.rows;

        if (rows.length === 0) {
          console.log(`ℹ️  Table ${table} est vide\n`);
          continue;
        }

        console.log(`   Trouvé ${rows.length} ligne(s)`);

        // Récupérer les colonnes
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const columnNames = columns.join(', ');

        // Désactiver temporairement les contraintes de clés étrangères
        if (table === 'users') {
          await destClient.query('SET session_replication_role = replica;');
        }

        // Insérer les données
        let inserted = 0;
        for (const row of rows) {
          const values = columns.map(col => row[col]);
          
          try {
            await destClient.query(
              `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders})
               ON CONFLICT DO NOTHING`,
              values
            );
            inserted++;
          } catch (err) {
            console.log(`   ⚠️  Erreur pour une ligne: ${err.message}`);
          }
        }

        console.log(`   ✅ ${inserted} ligne(s) insérée(s)\n`);

        // Réactiver les contraintes après la dernière table
        if (table === tables[tables.length - 1]) {
          await destClient.query('SET session_replication_role = DEFAULT;');
        }

        // Mettre à jour les séquences
        const sequenceQuery = await destClient.query(`
          SELECT column_name, column_default
          FROM information_schema.columns
          WHERE table_name = $1 
          AND column_default LIKE 'nextval%'
        `, [table]);

        for (const seq of sequenceQuery.rows) {
          const seqName = seq.column_default.match(/nextval\('([^']+)'/)?.[1];
          if (seqName) {
            const maxId = await destClient.query(`SELECT MAX(${seq.column_name}) as max_id FROM ${table}`);
            const maxIdValue = maxId.rows[0].max_id || 0;
            await destClient.query(`SELECT setval('${seqName}', ${maxIdValue}, true)`);
            console.log(`   🔢 Séquence ${seqName} mise à jour à ${maxIdValue}`);
          }
        }
        
      } catch (err) {
        console.error(`❌ Erreur avec la table ${table}:`, err.message);
      }
    }

    console.log('\n✅ Migration des données terminée avec succès!');

  } catch (err) {
    console.error('❌ Erreur lors de la migration:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await sourceClient.end();
    await destClient.end();
    console.log('\n🔌 Connexions fermées');
  }
}

// Exécuter la migration
migrateData();
