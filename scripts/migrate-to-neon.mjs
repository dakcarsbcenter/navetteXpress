/**
 * Script de migration de base de données
 * Copie les données de la base source vers Neon
 * PRÉREQUIS: Les tables doivent déjà exister dans Neon (via drizzle-kit push)
 * Usage: node scripts/migrate-to-neon.mjs
 */

import postgres from 'postgres';

// Base de données source (locale)
const SOURCE_URL = 'postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress';

// Base de données destination (Neon)
const DEST_URL = 'postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

console.log('🚀 Démarrage de la migration vers Neon...\n');

const sqlSource = postgres(SOURCE_URL, {
  ssl: false,
  max: 10,
});

const sqlDest = postgres(DEST_URL, {
  ssl: 'require',
  max: 10,
});

try {
  // ===============================================
  // ÉTAPE 1: Récupérer la liste des tables
  // ===============================================
  console.log('📋 ÉTAPE 1: Récupération de la liste des tables...');
  
  const tables = await sqlSource`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  
  console.log(`   ✅ ${tables.length} table(s) trouvée(s):`);
  tables.forEach(t => console.log(`      - ${t.table_name}`));

  // ===============================================
  // ÉTAPE 2: Récupérer le schéma de chaque table
  // ===============================================
  console.log('\n📐 ÉTAPE 2: Récupération du schéma des tables...');
  
  const schemas = {};
  for (const table of tables) {
    const tableName = table.table_name;
    
    // Récupérer la structure de la table
    const columns = await sqlSource`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        column_default,
        is_nullable,
        udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
      ORDER BY ordinal_position
    `;
    
    schemas[tableName] = columns;
    console.log(`   ✅ ${tableName}: ${columns.length} colonne(s)`);
  }

  // ===============================================
  // ÉTAPE 3: Créer les tables dans Neon
  // ===============================================
  console.log('\n🔨 ÉTAPE 3: Création des tables dans Neon...');
  
  for (const tableName of tables.map(t => t.table_name)) {
    console.log(`\n   📦 Traitement de la table: ${tableName}`);
    
    // Supprimer la table si elle existe déjà
    try {
      await sqlDest`DROP TABLE IF EXISTS ${sqlDest(tableName)} CASCADE`;
      console.log(`      ✓ Table supprimée (si existante)`);
    } catch (e) {
      console.log(`      ⚠️ Impossible de supprimer la table: ${e.message}`);
    }
    
    // Récupérer la commande CREATE TABLE complète
    const createTableSQL = await sqlSource`
      SELECT 
        'CREATE TABLE ' || table_name || ' (' ||
        string_agg(
          column_name || ' ' || 
          CASE 
            WHEN data_type = 'USER-DEFINED' THEN udt_name
            WHEN data_type = 'character varying' THEN 'varchar(' || character_maximum_length || ')'
            WHEN data_type = 'character' THEN 'char(' || character_maximum_length || ')'
            ELSE data_type
          END ||
          CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END ||
          CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
          ', '
        ) || ')' as create_statement
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${tableName}
      GROUP BY table_name
    `;
    
    if (createTableSQL.length > 0) {
      try {
        // Créer la table avec une requête SQL brute
        const statement = createTableSQL[0].create_statement;
        console.log(`      SQL: ${statement.substring(0, 100)}...`);
        await sqlDest.unsafe(statement);
        console.log(`      ✅ Table créée`);
      } catch (e) {
        console.error(`      ❌ Erreur création: ${e.message}`);
      }
    }
  }

  // ===============================================
  // ÉTAPE 4: Copier les données
  // ===============================================
  console.log('\n📊 ÉTAPE 4: Copie des données...');
  
  // Ordre de copie pour respecter les contraintes de clés étrangères
  const tableOrder = [
    'users',
    'vehicles',
    'quotes',
    'bookings',
    'invoices',
    'reviews',
    'permissions',
    'role_permissions',
    'profiles',
  ];
  
  for (const tableName of tableOrder) {
    if (!tables.find(t => t.table_name === tableName)) {
      console.log(`   ⏭️  Table ${tableName} non trouvée, ignorée`);
      continue;
    }
    
    console.log(`\n   📦 Copie des données: ${tableName}`);
    
    try {
      // Compter les lignes
      const countResult = await sqlSource`SELECT COUNT(*) as count FROM ${sqlSource(tableName)}`;
      const count = parseInt(countResult[0].count);
      
      if (count === 0) {
        console.log(`      ⚠️ Table vide, aucune donnée à copier`);
        continue;
      }
      
      console.log(`      📊 ${count} ligne(s) à copier`);
      
      // Récupérer toutes les données
      const data = await sqlSource`SELECT * FROM ${sqlSource(tableName)}`;
      
      if (data.length > 0) {
        // Récupérer les noms de colonnes
        const columns = Object.keys(data[0]);
        
        // Insérer les données par batch de 100
        const batchSize = 100;
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          
          for (const row of batch) {
            const values = columns.map(col => row[col]);
            const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
            const columnNames = columns.join(', ');
            
            await sqlDest.unsafe(
              `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`,
              values
            );
          }
          
          console.log(`      ✓ ${Math.min(i + batchSize, data.length)}/${count} lignes copiées`);
        }
        
        console.log(`      ✅ Toutes les données copiées`);
      }
    } catch (e) {
      console.error(`      ❌ Erreur lors de la copie: ${e.message}`);
    }
  }

  // ===============================================
  // ÉTAPE 5: Recréer les contraintes et index
  // ===============================================
  console.log('\n🔗 ÉTAPE 5: Recréation des contraintes...');
  
  // Récupérer les contraintes de clés primaires
  const primaryKeys = await sqlSource`
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
  `;
  
  for (const pk of primaryKeys) {
    try {
      await sqlDest.unsafe(
        `ALTER TABLE ${pk.table_name} ADD PRIMARY KEY (${pk.column_name})`
      );
      console.log(`   ✅ PK ajoutée sur ${pk.table_name}(${pk.column_name})`);
    } catch (e) {
      console.log(`   ⚠️ PK déjà existante sur ${pk.table_name}`);
    }
  }

  // ===============================================
  // ÉTAPE 6: Vérification
  // ===============================================
  console.log('\n✅ ÉTAPE 6: Vérification des données...');
  
  for (const tableName of tableOrder) {
    if (!tables.find(t => t.table_name === tableName)) continue;
    
    try {
      const sourceCount = await sqlSource`SELECT COUNT(*) as count FROM ${sqlSource(tableName)}`;
      const destCount = await sqlDest`SELECT COUNT(*) as count FROM ${sqlDest(tableName)}`;
      
      const src = parseInt(sourceCount[0].count);
      const dst = parseInt(destCount[0].count);
      
      if (src === dst) {
        console.log(`   ✅ ${tableName}: ${src} lignes (OK)`);
      } else {
        console.log(`   ⚠️ ${tableName}: Source=${src}, Destination=${dst} (DIFFÉRENT)`);
      }
    } catch (e) {
      console.log(`   ❌ ${tableName}: Erreur vérification - ${e.message}`);
    }
  }

  console.log('\n🎉 Migration terminée avec succès!');

} catch (error) {
  console.error('\n❌ Erreur lors de la migration:', error.message);
  console.error('Stack:', error.stack);
} finally {
  await sqlSource.end();
  await sqlDest.end();
  console.log('\n👋 Connexions fermées');
}
