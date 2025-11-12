/**
 * Test de connexion directe avec postgres-js (sans Drizzle)
 * Usage: node scripts/test-postgres-raw.mjs
 */

import postgres from 'postgres';

const DATABASE_URL = 'postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress';

console.log('🔍 Test de connexion postgres-js (sans Drizzle)...\n');

try {
  const sql = postgres(DATABASE_URL, {
    ssl: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    debug: true, // Activer les logs de debug
  });

  console.log('✅ Client postgres créé');
  console.log('🔍 Test 1: Requête simple...\n');

  const result1 = await sql`SELECT NOW() as current_time`;
  console.log('✅ Test 1 réussi:', result1[0].current_time);

  console.log('\n🔍 Test 2: Lister les tables...\n');
  
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
  console.log('✅ Tables trouvées:', tables.map(t => t.table_name).join(', '));

  console.log('\n🔍 Test 3: Compter les factures...\n');
  
  const count = await sql`SELECT COUNT(*) as count FROM invoices`;
  console.log('✅ Nombre de factures:', count[0].count);

  console.log('\n🔍 Test 4: Sélectionner une facture...\n');
  
  const invoices = await sql`
    SELECT 
      id, 
      invoice_number, 
      customer_name, 
      amount, 
      status 
    FROM invoices 
    LIMIT 1
  `;
  
  if (invoices.length > 0) {
    console.log('✅ Facture trouvée:');
    console.log(JSON.stringify(invoices[0], null, 2));
  } else {
    console.log('⚠️ Aucune facture trouvée');
  }

  await sql.end();
  console.log('\n✅ Tous les tests réussis!');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  console.error('Code:', error.code);
  console.error('Detail:', error.detail);
  console.error('\nStack:', error.stack);
  process.exit(1);
}
