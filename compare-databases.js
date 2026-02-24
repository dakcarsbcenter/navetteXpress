require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

// Connexion à Neon (PROD)
const NEON_URL = 'postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Connexion au serveur local (DEV)
const LOCAL_URL = 'postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress';

async function compareSchemas() {
  try {
    console.log('🔍 Comparaison des schémas de base de données\n');
    console.log('=' .repeat(80));
    
    // Connexion à Neon
    console.log('\n📊 BASE DE DONNÉES NEON (PRODUCTION)\n');
    const neonSql = neon(NEON_URL);
    
    // Récupérer toutes les tables de Neon
    const neonTables = await neonSql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`✅ Tables trouvées: ${neonTables.length}`);
    neonTables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });
    
    // Récupérer les colonnes de chaque table importante
    const importantTables = ['users', 'bookings', 'role_permissions', 'vehicles', 'quotes', 'reviews'];
    const neonSchema = {};
    
    for (const tableName of importantTables) {
      const columns = await neonSql`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
        ORDER BY ordinal_position
      `;
      neonSchema[tableName] = columns;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 BASE DE DONNÉES LOCALE (DÉVELOPPEMENT)\n');
    const localSql = neon(LOCAL_URL);
    
    // Récupérer toutes les tables locales
    const localTables = await localSql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`✅ Tables trouvées: ${localTables.length}`);
    localTables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });
    
    // Récupérer les colonnes de chaque table importante
    const localSchema = {};
    
    for (const tableName of importantTables) {
      const columns = await localSql`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
        ORDER BY ordinal_position
      `;
      localSchema[tableName] = columns;
    }
    
    // Comparer les tables
    console.log('\n' + '='.repeat(80));
    console.log('\n🔍 COMPARAISON DES TABLES\n');
    
    const neonTableNames = new Set(neonTables.map(t => t.table_name));
    const localTableNames = new Set(localTables.map(t => t.table_name));
    
    // Tables manquantes dans Neon
    const missingInNeon = [...localTableNames].filter(t => !neonTableNames.has(t));
    if (missingInNeon.length > 0) {
      console.log('❌ Tables manquantes dans NEON (PROD):');
      missingInNeon.forEach(table => {
        console.log(`   - ${table}`);
      });
    } else {
      console.log('✅ Aucune table manquante dans NEON');
    }
    
    // Tables manquantes dans Local
    const missingInLocal = [...neonTableNames].filter(t => !localTableNames.has(t));
    if (missingInLocal.length > 0) {
      console.log('\n❌ Tables manquantes dans LOCAL (DEV):');
      missingInLocal.forEach(table => {
        console.log(`   - ${table}`);
      });
    } else {
      console.log('\n✅ Aucune table manquante dans LOCAL');
    }
    
    // Comparer les colonnes des tables importantes
    console.log('\n' + '='.repeat(80));
    console.log('\n🔍 COMPARAISON DES COLONNES\n');
    
    for (const tableName of importantTables) {
      console.log(`\n📋 Table: ${tableName}`);
      console.log('-'.repeat(80));
      
      if (!neonSchema[tableName] || neonSchema[tableName].length === 0) {
        console.log(`❌ Table ${tableName} n'existe pas dans NEON!`);
        continue;
      }
      
      if (!localSchema[tableName] || localSchema[tableName].length === 0) {
        console.log(`❌ Table ${tableName} n'existe pas dans LOCAL!`);
        continue;
      }
      
      const neonColumns = new Map(neonSchema[tableName].map(c => [c.column_name, c]));
      const localColumns = new Map(localSchema[tableName].map(c => [c.column_name, c]));
      
      // Colonnes manquantes dans Neon
      const missingColsInNeon = [...localColumns.keys()].filter(c => !neonColumns.has(c));
      if (missingColsInNeon.length > 0) {
        console.log('  ❌ Colonnes manquantes dans NEON:');
        missingColsInNeon.forEach(colName => {
          const col = localColumns.get(colName);
          console.log(`     - ${colName} (${col.data_type}, nullable: ${col.is_nullable})`);
        });
      }
      
      // Colonnes manquantes dans Local
      const missingColsInLocal = [...neonColumns.keys()].filter(c => !localColumns.has(c));
      if (missingColsInLocal.length > 0) {
        console.log('  ❌ Colonnes manquantes dans LOCAL:');
        missingColsInLocal.forEach(colName => {
          const col = neonColumns.get(colName);
          console.log(`     - ${colName} (${col.data_type}, nullable: ${col.is_nullable})`);
        });
      }
      
      // Colonnes avec des types différents
      const commonColumns = [...neonColumns.keys()].filter(c => localColumns.has(c));
      const differentTypes = commonColumns.filter(colName => {
        const neonCol = neonColumns.get(colName);
        const localCol = localColumns.get(colName);
        return neonCol.data_type !== localCol.data_type || 
               neonCol.is_nullable !== localCol.is_nullable;
      });
      
      if (differentTypes.length > 0) {
        console.log('  ⚠️  Colonnes avec des différences:');
        differentTypes.forEach(colName => {
          const neonCol = neonColumns.get(colName);
          const localCol = localColumns.get(colName);
          console.log(`     - ${colName}:`);
          console.log(`       NEON:  ${neonCol.data_type} (nullable: ${neonCol.is_nullable})`);
          console.log(`       LOCAL: ${localCol.data_type} (nullable: ${localCol.is_nullable})`);
        });
      }
      
      if (missingColsInNeon.length === 0 && missingColsInLocal.length === 0 && differentTypes.length === 0) {
        console.log('  ✅ Schéma identique');
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Comparaison terminée\n');
    
  } catch (error) {
    console.error('❌ Erreur lors de la comparaison:', error);
    console.error(error);
  }
}

compareSchemas().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
