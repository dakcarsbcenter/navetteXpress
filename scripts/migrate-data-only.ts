import postgres from 'postgres';
import 'dotenv/config';

// Connexions
const localDb = postgres('postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress', {
  ssl: false,
  max: 1
});

const neonDb = postgres('postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require', {
  ssl: 'require',
  max: 1
});

// Tables dans l'ordre de dépendance (pour les FK)
const tables = [
  'users',
  'custom_roles',
  'permissions',
  'role_permissions',
  'vehicles',
  'quotes',
  'bookings',
  'invoices',
  'reviews',
  'accounts',
  'sessions',
  'verification_tokens'
];

interface CopyResult {
  table: string;
  success: boolean;
  rows: number;
  error?: string;
}

async function copyTableData(tableName: string): Promise<CopyResult> {
  try {
    console.log(`\n   📦 ${tableName}:`);
    
    // Vérifier si la table existe dans les deux DBs
    const [sourceExists] = await localDb`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      )
    `;
    
    const [targetExists] = await neonDb`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      )
    `;

    if (!sourceExists.exists) {
      console.log(`      ⏭️  Table source non trouvée, ignorée`);
      return { table: tableName, success: true, rows: 0 };
    }

    if (!targetExists.exists) {
      console.log(`      ⚠️  Table cible n'existe pas dans Neon, ignorée`);
      return { table: tableName, success: false, rows: 0, error: 'Table does not exist in Neon' };
    }

    // Compter les lignes source
    const [count] = await localDb`SELECT COUNT(*) as count FROM ${localDb(tableName)}`;
    const rowCount = parseInt(count.count);

    if (rowCount === 0) {
      console.log(`      ⚠️  Table vide`);
      return { table: tableName, success: true, rows: 0 };
    }

    console.log(`      📊 ${rowCount} ligne(s) à copier`);

    // Vider la table cible d'abord (CASCADE pour gérer les FK)
    await neonDb`TRUNCATE TABLE ${neonDb(tableName)} CASCADE`;

    // Lire toutes les données source
    const sourceData = await localDb`SELECT * FROM ${localDb(tableName)}`;

    if (sourceData.length === 0) {
      console.log(`      ⚠️  Aucune donnée trouvée`);
      return { table: tableName, success: true, rows: 0 };
    }

    // Insérer par batch de 100 lignes
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < sourceData.length; i += batchSize) {
      const batch = sourceData.slice(i, i + batchSize);
      
      // Désactiver les triggers et contraintes pour cette insertion
      await neonDb.begin(async sql => {
        await sql`SET CONSTRAINTS ALL DEFERRED`;
        await sql`INSERT INTO ${sql(tableName)} ${sql(batch)}`;
        totalInserted += batch.length;
        console.log(`      ⏳ ${totalInserted}/${sourceData.length} copiées...`);
      });
    }

    console.log(`      ✅ ${totalInserted} ligne(s) copiées`);
    return { table: tableName, success: true, rows: totalInserted };

  } catch (error: any) {
    console.log(`\n      ❌ Erreur: ${error.message}`);
    return { table: tableName, success: false, rows: 0, error: error.message };
  }
}

async function main() {
  console.log('🚀 Migration des données vers Neon\n');
  console.log('📋 Prérequis: Le schéma doit déjà exister dans Neon');
  console.log('   → Exécutez d\'abord: npm run db:push\n');

  const results: CopyResult[] = [];

  // Désactiver temporairement les FK pour la copie
  console.log('🔓 Désactivation temporaire des contraintes FK...\n');
  
  try {
    await neonDb`SET session_replication_role = 'replica'`;
  } catch (error: any) {
    console.log('⚠️  Note: session_replication_role non disponible sur Neon (normal)\n');
  }

  console.log('📊 Copie des données...\n');

  for (const table of tables) {
    const result = await copyTableData(table);
    results.push(result);
  }

  // Réactiver les FK
  console.log('\n🔒 Réactivation des contraintes FK...');
  try {
    await neonDb`SET session_replication_role = 'origin'`;
  } catch (error) {
    // Ignoré
  }

  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DE LA MIGRATION');
  console.log('='.repeat(60) + '\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalRows = results.reduce((sum, r) => sum + r.rows, 0);

  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const status = result.success 
      ? `${result.rows} ligne(s)`
      : `ÉCHEC: ${result.error}`;
    console.log(`${icon} ${result.table.padEnd(25)} ${status}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`📈 Total: ${totalRows} lignes copiées`);
  console.log(`✅ Réussies: ${successful.length} tables`);
  console.log(`❌ Échouées: ${failed.length} tables`);
  console.log('='.repeat(60));

  if (failed.length === 0) {
    console.log('\n🎉 MIGRATION RÉUSSIE!\n');
    console.log('✅ Toutes les données ont été copiées vers Neon');
    console.log('✅ Vous pouvez maintenant utiliser Neon pour le développement\n');
  } else {
    console.log('\n⚠️  MIGRATION PARTIELLE\n');
    console.log('Certaines tables ont échoué. Vérifiez les erreurs ci-dessus.\n');
  }

  // Fermer les connexions
  await localDb.end();
  await neonDb.end();
  console.log('👋 Connexions fermées\n');
}

main().catch(console.error);
