/**
 * Migration des données avec Drizzle ORM
 * Copie les données de la base locale vers Neon
 * Usage: npx tsx scripts/migrate-with-drizzle.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/schema';

// Base source (locale)
const SOURCE_URL = 'postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress';

// Base destination (Neon)
const DEST_URL = 'postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

console.log('🚀 Migration avec Drizzle ORM\n');

// Créer les connexions
const sqlSource = postgres(SOURCE_URL, { ssl: false, max: 5 });
const sqlDest = postgres(DEST_URL, { ssl: 'require', max: 5 });

const dbSource = drizzle(sqlSource, { schema });
const dbDest = drizzle(sqlDest, { schema });

interface MigrationResult {
  success: boolean;
  copied?: number;
  error?: string;
}

async function migrateTable<T extends keyof typeof schema>(
  tableName: T,
  table: any
): Promise<MigrationResult> {
  console.log(`\n📦 ${String(tableName)}:`);
  
  try {
    // Récupérer les données de la source
    const sourceData = await dbSource.select().from(table);
    
    if (sourceData.length === 0) {
      console.log(`   ⚠️ Table vide, ignorée`);
      return { success: true, copied: 0 };
    }
    
    console.log(`   📊 ${sourceData.length} ligne(s) à copier`);
    
    // Vider la table destination
    await dbDest.delete(table);
    console.log(`   🗑️ Table destination vidée`);
    
    // Insérer les données par batch
    const batchSize = 50;
    let copied = 0;
    
    for (let i = 0; i < sourceData.length; i += batchSize) {
      const batch = sourceData.slice(i, i + batchSize);
      await dbDest.insert(table).values(batch as any);
      copied += batch.length;
      process.stdout.write(`\r   ⏳ ${copied}/${sourceData.length} copiées...`);
    }
    
    console.log(`\n   ✅ ${copied} ligne(s) copiées`);
    return { success: true, copied };
    
  } catch (error: any) {
    console.log(`\n   ❌ Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  const results: Record<string, MigrationResult> = {};
  
  try {
    // Migration dans l'ordre pour respecter les FK
    console.log('📋 Ordre de migration:');
    console.log('   1. users');
    console.log('   2. vehicles');
    console.log('   3. quotes');
    console.log('   4. bookings');
    console.log('   5. invoices ⭐');
    console.log('   6. reviews');
    console.log('   7. role_permissions\n');
    
    // 1. Users
    results['users'] = await migrateTable('users', schema.users);
    
    // 2. Vehicles
    results['vehicles'] = await migrateTable('vehiclesTable', schema.vehiclesTable);
    
    // 3. Quotes
    results['quotes'] = await migrateTable('quotesTable', schema.quotesTable);
    
    // 4. Bookings
    results['bookings'] = await migrateTable('bookingsTable', schema.bookingsTable);
    
    // 5. Invoices ⭐
    results['invoices'] = await migrateTable('invoicesTable', schema.invoicesTable);
    
    // 6. Reviews
    results['reviews'] = await migrateTable('reviewsTable', schema.reviewsTable);
    
    // 7. Role Permissions
    results['role_permissions'] = await migrateTable('rolePermissionsTable', schema.rolePermissionsTable);
    
    // Résumé
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ DE LA MIGRATION\n');
    
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalCopied = 0;
    
    for (const [table, result] of Object.entries(results)) {
      if (result.success) {
        console.log(`✅ ${table.padEnd(20)} ${result.copied || 0} ligne(s)`);
        totalSuccess++;
        totalCopied += result.copied || 0;
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
    
  } catch (error: any) {
    console.error('\n❌ Erreur fatale:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sqlSource.end();
    await sqlDest.end();
    console.log('👋 Connexions fermées\n');
  }
}

main();
