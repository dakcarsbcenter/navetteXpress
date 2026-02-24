import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

async function checkManagerDeletePermission() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Vérification de la permission DELETE pour Manager sur USERS\n');

    const result = await pool.query(`
      SELECT 
        role_name,
        resource,
        action,
        allowed
      FROM role_permissions
      WHERE role_name = 'manager' 
        AND resource = 'users'
        AND action = 'delete'
    `);

    if (result.rows.length === 0) {
      console.log('❌ Aucune ligne trouvée pour manager/users/delete');
    } else {
      const perm = result.rows[0];
      console.log('📊 État actuel:');
      console.log(`   Rôle: ${perm.role_name}`);
      console.log(`   Ressource: ${perm.resource}`);
      console.log(`   Action: ${perm.action}`);
      console.log(`   Autorisé: ${perm.allowed ? '✅ TRUE (PROBLÈME!)' : '❌ FALSE (CORRECT)'}`);
      
      if (perm.allowed === true) {
        console.log('\n❌ PROBLÈME DÉTECTÉ: Manager a la permission de supprimer les users!');
        console.log('   Cette permission devrait être FALSE selon la nouvelle politique.\n');
      } else {
        console.log('\n✅ CORRECT: Manager n\'a pas la permission de supprimer les users.\n');
      }
    }

    // Afficher toutes les permissions Manager sur users
    console.log('📋 Toutes les permissions Manager sur USERS:');
    const allPerms = await pool.query(`
      SELECT action, allowed
      FROM role_permissions
      WHERE role_name = 'manager' AND resource = 'users'
      ORDER BY 
        CASE action
          WHEN 'create' THEN 1
          WHEN 'read' THEN 2
          WHEN 'update' THEN 3
          WHEN 'delete' THEN 4
        END
    `);

    allPerms.rows.forEach(p => {
      const status = p.allowed ? '✅' : '❌';
      const expected = (p.action === 'read' || p.action === 'update') ? '✅' : '❌';
      const match = (p.allowed ? '✅' : '❌') === expected ? '✓' : '✗';
      console.log(`   ${status} ${p.action.padEnd(10)} (attendu: ${expected}) ${match}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkManagerDeletePermission();
