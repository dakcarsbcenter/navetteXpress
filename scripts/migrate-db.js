/**
 * Script de migration de base de données Neon → PostgreSQL Coolify
 * 
 * Ce script copie toutes les données de votre base Neon vers Coolify
 * en respectant les contraintes de clés étrangères.
 * 
 * Usage:
 *   node scripts/migrate-db.js
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Configuration des connexions
const NEON_URL = "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";
const COOLIFY_URL = process.env.DATABASE_URL || "postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@db-navettexpress:5432/postgres";

// Tables à migrer dans l'ordre (respectant les contraintes FK)
const TABLES_ORDER = [
  'verification_tokens',
  'users',
  'accounts',
  'sessions',
  'vehicles',
  'bookings',
  'reviews',
  'quotes',
  'permissions',
  'custom_roles',
  'role_permissions',
];

async function migrateDatabase() {
  const sourceClient = new Client({ connectionString: NEON_URL });
  const targetClient = new Client({ connectionString: COOLIFY_URL });

  try {
    console.log('🔌 Connexion à Neon (source)...');
    await sourceClient.connect();
    console.log('✅ Connecté à Neon\n');

    console.log('🔌 Connexion à Coolify PostgreSQL (cible)...');
    await targetClient.connect();
    console.log('✅ Connecté à Coolify\n');

    // Désactiver temporairement les contraintes FK pour l'import
    console.log('⚙️  Désactivation des contraintes de clés étrangères...');
    await targetClient.query('SET session_replication_role = replica;');

    for (const table of TABLES_ORDER) {
      console.log(`\n📦 Migration de la table: ${table}`);
      
      // Vérifier si la table existe dans la source
      const tableExists = await sourceClient.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
        [table]
      );
      
      if (!tableExists.rows[0].exists) {
        console.log(`⚠️  Table ${table} n'existe pas dans Neon, skip...`);
        continue;
      }

      // Compter les enregistrements source
      const countSource = await sourceClient.query(`SELECT COUNT(*) FROM "${table}"`);
      const sourceCount = parseInt(countSource.rows[0].count);
      console.log(`   Source: ${sourceCount} enregistrements`);

      if (sourceCount === 0) {
        console.log(`   ℹ️  Table vide, skip...`);
        continue;
      }

      // Récupérer toutes les données
      const data = await sourceClient.query(`SELECT * FROM "${table}"`);
      
      if (data.rows.length === 0) {
        console.log(`   ℹ️  Aucune donnée à migrer`);
        continue;
      }

      // Obtenir les colonnes
      const columns = Object.keys(data.rows[0]);
      const columnNames = columns.map(c => `"${c}"`).join(', ');
      
      // Vider la table cible (au cas où)
      await targetClient.query(`TRUNCATE TABLE "${table}" CASCADE`);

      // Insérer les données par batch
      const batchSize = 100;
      let inserted = 0;

      for (let i = 0; i < data.rows.length; i += batchSize) {
        const batch = data.rows.slice(i, i + batchSize);
        
        for (const row of batch) {
          const values = columns.map(col => row[col]);
          const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
          
          const insertQuery = `
            INSERT INTO "${table}" (${columnNames})
            VALUES (${placeholders})
            ON CONFLICT DO NOTHING
          `;
          
          try {
            await targetClient.query(insertQuery, values);
            inserted++;
          } catch (err) {
            console.error(`   ❌ Erreur insertion ligne ${inserted + 1}:`, err.message);
          }
        }
        
        console.log(`   ⏳ Progression: ${Math.min(i + batchSize, data.rows.length)}/${data.rows.length}`);
      }

      // Vérifier le count cible
      const countTarget = await targetClient.query(`SELECT COUNT(*) FROM "${table}"`);
      const targetCount = parseInt(countTarget.rows[0].count);
      console.log(`   ✅ Cible: ${targetCount} enregistrements insérés`);

      // Réinitialiser les séquences si la table a un ID auto-increment
      try {
        await targetClient.query(`
          SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), 
                        COALESCE(MAX(id), 1), 
                        MAX(id) IS NOT NULL) 
          FROM "${table}"
        `);
        console.log(`   🔄 Séquence réinitialisée`);
      } catch (err) {
        // Pas grave si la table n'a pas de séquence
      }
    }

    // Réactiver les contraintes FK
    console.log('\n⚙️  Réactivation des contraintes de clés étrangères...');
    await targetClient.query('SET session_replication_role = DEFAULT;');

    console.log('\n✅ Migration terminée avec succès! 🎉');
    console.log('\n📊 Résumé:');
    
    for (const table of TABLES_ORDER) {
      try {
        const count = await targetClient.query(`SELECT COUNT(*) FROM "${table}"`);
        console.log(`   - ${table}: ${count.rows[0].count} enregistrements`);
      } catch (err) {
        // Table n'existe pas
      }
    }

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await sourceClient.end();
    await targetClient.end();
    console.log('\n🔌 Connexions fermées');
  }
}

// Lancer la migration
if (require.main === module) {
  console.log('🚀 Démarrage de la migration de base de données\n');
  console.log('Source: Neon PostgreSQL');
  console.log('Cible:  Coolify PostgreSQL\n');
  
  migrateDatabase()
    .then(() => {
      console.log('\n✨ Migration réussie!');
      console.log('\n📝 Prochaines étapes:');
      console.log('   1. Vérifier les données dans Coolify');
      console.log('   2. Mettre à jour DATABASE_URL dans Coolify');
      console.log('   3. Redéployer l\'application');
      console.log('   4. Tester la connexion et les fonctionnalités');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Échec de la migration:', error.message);
      process.exit(1);
    });
}

module.exports = { migrateDatabase };
