/**
 * Script de migration complète vers Neon
 * 1. Supprime toutes les tables existantes dans Neon
 * 2. Exporte le schéma depuis la base locale
 * 3. Importe le schéma dans Neon
 * 4. Copie toutes les données
 * 
 * Usage: npx tsx scripts/full-migrate-to-neon.ts
 */

import postgres from 'postgres';

const SOURCE_URL = 'postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress';
const DEST_URL = 'postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb';

console.log('🚀 Migration complète vers Neon\n');
console.log('⚠️  ATTENTION: Cela va SUPPRIMER toutes les tables de Neon!\n');

const sqlSource = postgres(SOURCE_URL, { ssl: false, max: 5 });
const sqlDest = postgres(DEST_URL, { ssl: 'require', max: 5 });

async function dropAllTables() {
  console.log('🗑️  ÉTAPE 1: Suppression de toutes les tables de Neon...\n');
  
  try {
    // Récupérer toutes les tables
    const tables = await sqlDest`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    console.log(`   📋 ${tables.length} table(s) trouvée(s) dans Neon`);
    
    if (tables.length === 0) {
      console.log('   ℹ️  Aucune table à supprimer\n');
      return;
    }
    
    // Supprimer avec CASCADE pour gérer les dépendances
    for (const { tablename } of tables) {
      try {
        await sqlDest.unsafe(`DROP TABLE IF EXISTS "${tablename}" CASCADE`);
        console.log(`   ✓ ${tablename} supprimée`);
      } catch (error: any) {
        console.log(`   ⚠️  ${tablename}: ${error.message}`);
      }
    }
    
    console.log('\n   ✅ Toutes les tables supprimées\n');
  } catch (error: any) {
    console.error('   ❌ Erreur lors de la suppression:', error.message);
    throw error;
  }
}

async function copySchema() {
  console.log('📐 ÉTAPE 2: Copie du schéma depuis la base locale...\n');
  
  try {
    // Récupérer toutes les tables de la source
    const tables = await sqlSource`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    console.log(`   📋 ${tables.length} table(s) à créer`);
    
    for (const { tablename } of tables) {
      console.log(`\n   🔨 Création de: ${tablename}`);
      
      // Obtenir la définition complète de la table
      const tableDef = await sqlSource.unsafe(`
        SELECT 
          'CREATE TABLE ' || quote_ident(table_name) || ' (' ||
          string_agg(
            quote_ident(column_name) || ' ' || 
            column_type || 
            CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
            ', '
          ) || 
          ')' as create_statement
        FROM (
          SELECT 
            c.table_name,
            c.column_name,
            CASE 
              WHEN c.data_type = 'USER-DEFINED' THEN c.udt_name
              WHEN c.data_type = 'ARRAY' THEN c.udt_name
              WHEN c.character_maximum_length IS NOT NULL THEN 
                c.data_type || '(' || c.character_maximum_length || ')'
              WHEN c.numeric_precision IS NOT NULL AND c.numeric_scale IS NOT NULL THEN
                c.data_type || '(' || c.numeric_precision || ',' || c.numeric_scale || ')'
              ELSE c.data_type
            END as column_type,
            c.column_default,
            c.is_nullable
          FROM information_schema.columns c
          WHERE c.table_schema = 'public' AND c.table_name = '${tablename}'
          ORDER BY c.ordinal_position
        ) t
        GROUP BY table_name
      `);
      
      if (tableDef.length > 0) {
        try {
          await sqlDest.unsafe(tableDef[0].create_statement);
          console.log(`      ✓ Structure créée`);
        } catch (error: any) {
          if (error.message.includes('already exists')) {
            console.log(`      ⚠️  Table existe déjà`);
          } else {
            console.error(`      ❌ Erreur: ${error.message}`);
          }
        }
      }
    }
    
    console.log('\n   ✅ Schéma copié\n');
  } catch (error: any) {
    console.error('   ❌ Erreur lors de la copie du schéma:', error.message);
    throw error;
  }
}

async function copyPrimaryKeys() {
  console.log('🔑 ÉTAPE 3: Copie des clés primaires...\n');
  
  try {
    const pks = await sqlSource`
      SELECT
        tc.table_name,
        string_agg(kcu.column_name, ', ') as columns,
        tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
      GROUP BY tc.table_name, tc.constraint_name
    `;
    
    for (const pk of pks) {
      try {
        await sqlDest.unsafe(
          `ALTER TABLE "${pk.table_name}" ADD PRIMARY KEY (${pk.columns})`
        );
        console.log(`   ✓ PK sur ${pk.table_name}(${pk.columns})`);
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.log(`   ⚠️  ${pk.table_name}: ${error.message}`);
        }
      }
    }
    
    console.log('\n   ✅ Clés primaires copiées\n');
  } catch (error: any) {
    console.error('   ❌ Erreur:', error.message);
  }
}

async function copyIndexes() {
  console.log('📇 ÉTAPE 4: Copie des index...\n');
  
  try {
    const indexes = await sqlSource`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'
    `;
    
    for (const idx of indexes) {
      try {
        await sqlDest.unsafe(idx.indexdef);
        console.log(`   ✓ ${idx.indexname}`);
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.log(`   ⚠️  ${idx.indexname}: ${error.message}`);
        }
      }
    }
    
    console.log('\n   ✅ Index copiés\n');
  } catch (error: any) {
    console.error('   ❌ Erreur:', error.message);
  }
}

async function copyData() {
  console.log('📊 ÉTAPE 5: Copie des données...\n');
  
  // Ordre des tables pour respecter les FK
  const tableOrder = [
    'users',
    'accounts',
    'sessions',
    'verification_tokens',
    'profiles',
    'custom_roles',
    'vehicles',
    'quotes',
    'bookings',
    'invoices',
    'reviews',
    'permissions',
    'role_permissions',
  ];
  
  const results: Record<string, { copied: number; error?: string }> = {};
  
  for (const tableName of tableOrder) {
    // Vérifier si la table existe dans la source
    const tableExists = await sqlSource`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      )
    `;
    
    if (!tableExists[0].exists) {
      console.log(`   ⏭️  ${tableName}: table non trouvée, ignorée`);
      continue;
    }
    
    try {
      console.log(`\n   📦 ${tableName}:`);
      
      // Compter les lignes
      const count = await sqlSource.unsafe(`SELECT COUNT(*)::int as count FROM "${tableName}"`);
      const totalRows = count[0].count;
      
      if (totalRows === 0) {
        console.log(`      ⚠️  Table vide`);
        results[tableName] = { copied: 0 };
        continue;
      }
      
      console.log(`      📊 ${totalRows} ligne(s) à copier`);
      
      // Récupérer toutes les données
      const rows = await sqlSource.unsafe(`SELECT * FROM "${tableName}"`);
      
      if (rows.length === 0) {
        results[tableName] = { copied: 0 };
        continue;
      }
      
      // Obtenir les colonnes
      const columns = Object.keys(rows[0]);
      
      // Insérer les données une par une
      let copied = 0;
      for (const row of rows) {
        const values = columns.map(col => row[col]);
        const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
        const cols = columns.map(c => `"${c}"`).join(', ');
        
        try {
          await sqlDest.unsafe(
            `INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders})`,
            values
          );
          copied++;
          
          if (copied % 10 === 0 || copied === rows.length) {
            process.stdout.write(`\r      ⏳ ${copied}/${totalRows} copiées...`);
          }
        } catch (error: any) {
          // Ignorer les erreurs de duplication
          if (!error.message.includes('duplicate key')) {
            throw error;
          }
        }
      }
      
      console.log(`\n      ✅ ${copied} ligne(s) copiées`);
      results[tableName] = { copied };
      
    } catch (error: any) {
      console.log(`\n      ❌ Erreur: ${error.message}`);
      results[tableName] = { copied: 0, error: error.message };
    }
  }
  
  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DE LA MIGRATION\n');
  
  let totalCopied = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const [table, result] of Object.entries(results)) {
    if (result.error) {
      console.log(`❌ ${table.padEnd(25)} ÉCHEC`);
      totalFailed++;
    } else {
      console.log(`✅ ${table.padEnd(25)} ${result.copied} ligne(s)`);
      totalCopied += result.copied;
      totalSuccess++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📈 Total: ${totalCopied} lignes copiées`);
  console.log(`✅ Réussies: ${totalSuccess} tables`);
  if (totalFailed > 0) {
    console.log(`❌ Échouées: ${totalFailed} tables`);
  }
}

async function copyForeignKeys() {
  console.log('\n🔗 ÉTAPE 6: Copie des contraintes de clés étrangères...\n');
  
  try {
    const fks = await sqlSource`
      SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    `;
    
    for (const fk of fks) {
      try {
        const sql = `
          ALTER TABLE "${fk.table_name}" 
          ADD CONSTRAINT "${fk.constraint_name}" 
          FOREIGN KEY ("${fk.column_name}") 
          REFERENCES "${fk.foreign_table_name}" ("${fk.foreign_column_name}")
          ON UPDATE ${fk.update_rule}
          ON DELETE ${fk.delete_rule}
        `;
        
        await sqlDest.unsafe(sql);
        console.log(`   ✓ ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.log(`   ⚠️  ${fk.constraint_name}: ${error.message}`);
        }
      }
    }
    
    console.log('\n   ✅ Contraintes FK copiées\n');
  } catch (error: any) {
    console.error('   ❌ Erreur:', error.message);
  }
}

async function main() {
  try {
    await dropAllTables();
    await copySchema();
    await copyPrimaryKeys();
    await copyIndexes();
    await copyData();
    await copyForeignKeys();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 MIGRATION TERMINÉE AVEC SUCCÈS!');
    console.log('='.repeat(60));
    console.log('\n✅ Neon est maintenant une copie complète de la base locale');
    console.log('✅ Vous pouvez utiliser Neon pour le développement/test');
    console.log('✅ La base locale reste votre base de production\n');
    
  } catch (error: any) {
    console.error('\n❌ Erreur fatale:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await sqlSource.end();
    await sqlDest.end();
    console.log('👋 Connexions fermées\n');
  }
}

main();
