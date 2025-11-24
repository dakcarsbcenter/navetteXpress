const { neon } = require('@neondatabase/serverless');
const { Client } = require('pg');

// Connexions
const neonUrl = 'postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';
const prodConfig = {
  host: '109.199.101.247',
  port: 5432,
  database: 'navettexpress',
  user: 'postgres',
  password: 'iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY',
  ssl: false
};

const neonSql = neon(neonUrl);

async function getTableStructureNeon() {
  try {
    console.log(`\n🔍 Analyse de la base NEON (DEV)...\n`);
    
    const tables = await neonSql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`📊 Tables trouvées: ${tables.length}`);
    tables.forEach((t, i) => console.log(`   ${i + 1}. ${t.table_name}`));
    
    const structure = {};
    
    for (const table of tables) {
      const tableName = table.table_name;
      
      const columns = await neonSql`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
        ORDER BY ordinal_position
      `;
      
      structure[tableName] = {
        columns: columns.map(c => ({
          name: c.column_name,
          type: c.data_type,
          nullable: c.is_nullable === 'YES',
          default: c.column_default,
          maxLength: c.character_maximum_length
        }))
      };
    }
    
    return structure;
  } catch (error) {
    console.error(`❌ Erreur NEON:`, error.message);
    throw error;
  }
}

async function getTableStructureProd() {
  const client = new Client(prodConfig);
  
  try {
    console.log(`\n🔍 Analyse de la base PROD (Local)...\n`);
    
    await client.connect();
    console.log('✅ Connecté à la base PROD\n');
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows;
    
    console.log(`📊 Tables trouvées: ${tables.length}`);
    tables.forEach((t, i) => console.log(`   ${i + 1}. ${t.table_name}`));
    
    const structure = {};
    
    for (const table of tables) {
      const tableName = table.table_name;
      
      const columnsResult = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      structure[tableName] = {
        columns: columnsResult.rows.map(c => ({
          name: c.column_name,
          type: c.data_type,
          nullable: c.is_nullable === 'YES',
          default: c.column_default,
          maxLength: c.character_maximum_length
        }))
      };
    }
    
    await client.end();
    return structure;
  } catch (error) {
    console.error(`❌ Erreur PROD:`, error.message);
    await client.end();
    throw error;
  }
}

function compareStructures(neonStruct, prodStruct) {
  console.log('\n\n🔍 COMPARAISON DES STRUCTURES\n');
  console.log('='.repeat(80));
  
  const differences = [];
  
  const neonTables = Object.keys(neonStruct).sort();
  const prodTables = Object.keys(prodStruct).sort();
  
  const missingInProd = neonTables.filter(t => !prodTables.includes(t));
  const missingInNeon = prodTables.filter(t => !neonTables.includes(t));
  
  if (missingInProd.length > 0) {
    console.log('\n❌ Tables manquantes dans PRODUCTION:');
    missingInProd.forEach(t => {
      console.log(`   - ${t}`);
      differences.push({
        type: 'MISSING_TABLE',
        table: t,
        severity: 'HIGH'
      });
    });
  }
  
  if (missingInNeon.length > 0) {
    console.log('\n⚠️  Tables supplémentaires dans PRODUCTION:');
    missingInNeon.forEach(t => console.log(`   - ${t}`));
  }
  
  const commonTables = neonTables.filter(t => prodTables.includes(t));
  
  console.log(`\n📋 Comparaison des ${commonTables.length} tables communes:\n`);
  
  let hasTableDiff = false;
  
  for (const tableName of commonTables) {
    const neonCols = neonStruct[tableName].columns;
    const prodCols = prodStruct[tableName].columns;
    
    const neonColNames = neonCols.map(c => c.name);
    const prodColNames = prodCols.map(c => c.name);
    
    const missingColsInProd = neonColNames.filter(c => !prodColNames.includes(c));
    const extraColsInProd = prodColNames.filter(c => !neonColNames.includes(c));
    
    if (missingColsInProd.length > 0 || extraColsInProd.length > 0) {
      hasTableDiff = true;
      console.log(`\n⚠️  Table: ${tableName}`);
      
      if (missingColsInProd.length > 0) {
        console.log('   ❌ Colonnes manquantes dans PROD:');
        missingColsInProd.forEach(col => {
          const colInfo = neonCols.find(c => c.name === col);
          console.log(`      - ${col} (${colInfo.type})`);
          differences.push({
            type: 'MISSING_COLUMN',
            table: tableName,
            column: col,
            columnInfo: colInfo,
            severity: 'MEDIUM'
          });
        });
      }
      
      if (extraColsInProd.length > 0) {
        console.log('   ⚠️  Colonnes supplémentaires dans PROD:');
        extraColsInProd.forEach(col => {
          const colInfo = prodCols.find(c => c.name === col);
          console.log(`      - ${col} (${colInfo.type})`);
        });
      }
    }
  }
  
  if (!hasTableDiff && missingInProd.length === 0) {
    console.log('✅ Toutes les tables communes ont les mêmes colonnes');
  }
  
  return differences;
}

function generateMigrationSQL(differences, neonStruct) {
  console.log('\n\n📝 GÉNÉRATION DU SCRIPT DE MIGRATION\n');
  console.log('='.repeat(80));
  
  const sqlStatements = [];
  
  // Tables manquantes
  const missingTables = differences.filter(d => d.type === 'MISSING_TABLE');
  
  if (missingTables.length > 0) {
    console.log('\n-- =================================================');
    console.log('-- TABLES MANQUANTES');
    console.log('-- =================================================\n');
    
    for (const diff of missingTables) {
      const tableName = diff.table;
      const tableStruct = neonStruct[tableName];
      
      console.log(`-- Table: ${tableName}`);
      console.log(`CREATE TABLE IF NOT EXISTS "${tableName}" (`);
      
      const colDefs = tableStruct.columns.map(col => {
        let def = `  "${col.name}" ${col.type.toUpperCase()}`;
        if (col.maxLength) def += `(${col.maxLength})`;
        if (!col.nullable) def += ' NOT NULL';
        if (col.default) def += ` DEFAULT ${col.default}`;
        return def;
      });
      
      console.log(colDefs.join(',\n'));
      console.log(`);\n`);
    }
  }
  
  // Colonnes manquantes
  const missingColumns = differences.filter(d => d.type === 'MISSING_COLUMN');
  
  if (missingColumns.length > 0) {
    console.log('\n-- =================================================');
    console.log('-- COLONNES MANQUANTES');
    console.log('-- =================================================\n');
    
    for (const diff of missingColumns) {
      let sql = `ALTER TABLE "${diff.table}" ADD COLUMN IF NOT EXISTS "${diff.column}" ${diff.columnInfo.type}`;
      
      if (diff.columnInfo.maxLength) {
        sql += `(${diff.columnInfo.maxLength})`;
      }
      
      if (!diff.columnInfo.nullable) {
        sql += ' NOT NULL';
      }
      
      if (diff.columnInfo.default) {
        sql += ` DEFAULT ${diff.columnInfo.default}`;
      }
      
      sql += ';';
      
      console.log(sql);
      sqlStatements.push(sql);
    }
  }
  
  return sqlStatements;
}

async function main() {
  try {
    console.log('🚀 COMPARAISON DES BASES DE DONNÉES\n');
    console.log('DEV (Neon):  postgresql://...neon.tech/neondb');
    console.log('PROD (Local): postgres://109.199.101.247:5432/navettexpress\n');
    console.log('='.repeat(80));
    
    const neonStruct = await getTableStructureNeon();
    const prodStruct = await getTableStructureProd();
    
    const differences = compareStructures(neonStruct, prodStruct);
    
    if (differences.length === 0) {
      console.log('\n\n✅ Les deux bases sont IDENTIQUES!\n');
    } else {
      console.log(`\n\n⚠️  ${differences.length} différence(s) détectée(s)\n`);
      const sqlStatements = generateMigrationSQL(differences, neonStruct);
      
      console.log('\n\n='.repeat(80));
      console.log('💾 SCRIPT DE MIGRATION GÉNÉRÉ\n');
      
      if (sqlStatements.length > 0) {
        console.log('-- Exécuter ces commandes sur la base PRODUCTION:\n');
        console.log(sqlStatements.join('\n'));
      }
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  }
}

main().then(() => {
  console.log('\n✅ Comparaison terminée');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
