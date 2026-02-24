/**
 * Script simplifié de copie des données vers Neon
 * Usage: node scripts/copy-data-to-neon.mjs
 */

import postgres from 'postgres';

const SOURCE_URL = 'postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress';
const DEST_URL = 'postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb';

console.log('🚀 Copie des données vers Neon...\n');

const sqlSource = postgres(SOURCE_URL, { ssl: false, max: 5 });
const sqlDest = postgres(DEST_URL, { ssl: 'require', max: 5 });

// Tables dans l'ordre pour respecter les FK
const tables = [
  'users',
  'profiles', 
  'vehicles',
  'quotes',
  'bookings',
  'invoices',
  'reviews',
  'permissions',
  'role_permissions',
];

async function copyTable(tableName) {
  console.log(`\n📦 ${tableName}:`);
  
  try {
    // Compter les lignes source
    const countSrc = await sqlSource`SELECT COUNT(*)::int as count FROM ${sqlSource(tableName)}`;
    const totalRows = countSrc[0].count;
    
    if (totalRows === 0) {
      console.log(`   ⚠️ Table vide, ignorée`);
      return { success: true, copied: 0 };
    }
    
    console.log(`   📊 ${totalRows} ligne(s) à copier`);
    
    // Vider la table destination
    await sqlDest`TRUNCATE TABLE ${sqlDest(tableName)} CASCADE`;
    console.log(`   🗑️ Table vidée`);
    
    // Récupérer toutes les données
    const rows = await sqlSource`SELECT * FROM ${sqlSource(tableName)}`;
    
    if (rows.length === 0) {
      console.log(`   ✅ Aucune donnée`);
      return { success: true, copied: 0 };
    }
    
    // Obtenir les colonnes
    const columns = Object.keys(rows[0]);
    
    // Insérer les données une par une
    let copied = 0;
    for (const row of rows) {
      const values = columns.map(col => row[col]);
      const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
      const cols = columns.join(', ');
      
      await sqlDest.unsafe(
        `INSERT INTO ${tableName} (${cols}) VALUES (${placeholders})`,
        values
      );
      
      copied++;
      if (copied % 10 === 0 || copied === rows.length) {
        process.stdout.write(`\r   ⏳ ${copied}/${totalRows} copiées...`);
      }
    }
    
    console.log(`\n   ✅ ${copied} ligne(s) copiées`);
    return { success: true, copied };
    
  } catch (error) {
    console.log(`\n   ❌ Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  const results = {};
  
  for (const table of tables) {
    results[table] = await copyTable(table);
  }
  
  // Résumé
  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSUMÉ DE LA MIGRATION\n');
  
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalCopied = 0;
  
  for (const [table, result] of Object.entries(results)) {
    if (result.success) {
      console.log(`✅ ${table.padEnd(20)} ${result.copied} ligne(s)`);
      totalSuccess++;
      totalCopied += result.copied;
    } else {
      console.log(`❌ ${table.padEnd(20)} ÉCHEC: ${result.error}`);
      totalFailed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📈 Total: ${totalCopied} lignes copiées`);
  console.log(`✅ Réussies: ${totalSuccess} tables`);
  if (totalFailed > 0) {
    console.log(`❌ Échouées: ${totalFailed} tables`);
  }
  console.log('\n🎉 Migration terminée!\n');
}

try {
  await main();
} catch (error) {
  console.error('\n❌ Erreur fatale:', error);
} finally {
  await sqlSource.end();
  await sqlDest.end();
}
