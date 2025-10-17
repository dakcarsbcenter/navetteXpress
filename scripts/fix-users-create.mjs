import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

async function fixUserCreate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Correction de users.create pour Manager...\n');

    // Vérifier avant
    const before = await pool.query(`
      SELECT * FROM role_permissions 
      WHERE role_name = 'manager' AND resource = 'users' AND action = 'create'
    `);
    console.log('Avant:', before.rows);

    // Appliquer la correction
    const result = await pool.query(`
      UPDATE role_permissions 
      SET allowed = false 
      WHERE role_name = 'manager' 
        AND resource = 'users' 
        AND action = 'create'
      RETURNING *
    `);
    
    console.log('\n✅ Correction appliquée:', result.rows);

    // Vérifier après
    const after = await pool.query(`
      SELECT * FROM role_permissions 
      WHERE role_name = 'manager' AND resource = 'users'
      ORDER BY action
    `);
    
    console.log('\n📊 Toutes les permissions Manager sur users:');
    console.table(after.rows);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

fixUserCreate();
