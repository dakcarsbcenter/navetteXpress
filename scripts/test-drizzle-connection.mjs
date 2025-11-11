/**
 * Test rapide de connexion avec Drizzle
 * Usage: node scripts/test-drizzle-connection.mjs
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { invoicesTable } from "../src/schema.ts";

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress';

console.log('🔍 Test de connexion Drizzle...\n');

try {
  const sql = postgres(DATABASE_URL, {
    ssl: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  
  const db = drizzle(sql);

  console.log('✅ Client postgres créé');
  console.log('🔍 Tentative de requête SELECT...\n');

  const result = await db.select().from(invoicesTable).limit(5);
  
  console.log('✅ Requête réussie!');
  console.log(`📊 ${result.length} facture(s) trouvée(s)\n`);
  
  if (result.length > 0) {
    console.log('Première facture:');
    console.log(JSON.stringify(result[0], null, 2));
  }

  await sql.end();
  console.log('\n✅ Test réussi!');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
