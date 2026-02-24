import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

async function testUsersReadPermission() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Test de la permission READ sur users pour Manager\n');

    // Test 1: Vérifier la permission en base
    const perm = await pool.query(`
      SELECT role_name, resource, action, allowed
      FROM role_permissions
      WHERE role_name = 'manager'
        AND resource = 'users'
        AND action = 'read'
    `);

    console.log('📊 Permission en base:');
    console.table(perm.rows);

    if (perm.rows.length === 0) {
      console.log('❌ PROBLÈME: Aucune permission READ trouvée pour manager/users');
    } else if (perm.rows[0].allowed === false) {
      console.log('❌ PROBLÈME: Permission READ est FALSE');
    } else {
      console.log('✅ Permission READ est TRUE\n');
    }

    // Test 2: Simuler la requête de l'API
    console.log('🔍 Simulation de la requête API hasUsersPermission(manager, read):\n');
    
    const apiQuery = await pool.query(`
      SELECT *
      FROM role_permissions
      WHERE role_name = 'manager'
        AND resource = 'users'
        AND action = 'read'
        AND allowed = true
    `);

    console.log('Résultat de la requête API:');
    console.table(apiQuery.rows);
    console.log(`Nombre de résultats: ${apiQuery.rows.length}`);
    console.log(`API devrait retourner: ${apiQuery.rows.length > 0 ? '✅ TRUE' : '❌ FALSE'}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

testUsersReadPermission();
