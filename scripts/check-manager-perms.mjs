import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

async function checkPermissions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('📊 État actuel des permissions Manager:\n');
    
    const result = await pool.query(`
      SELECT 
        resource,
        action,
        allowed
      FROM role_permissions
      WHERE role_name = 'manager'
      ORDER BY resource, action
    `);

    console.table(result.rows);

    console.log('\n🎯 Permissions attendues selon PERMISSIONS_MATRIX_SUMMARY.md:\n');
    console.log('👥 USERS:      read=✅  create=❌  update=❌  delete=❌');
    console.log('🚗 VEHICLES:   read=✅  create=✅  update=✅  delete=✅');
    console.log('📅 BOOKINGS:   read=✅  create=✅  update=✅  delete=✅');
    console.log('📋 QUOTES:     read=✅  create=✅  update=✅  delete=✅');
    console.log('⭐ REVIEWS:    read=✅  create=✅  update=✅  delete=✅');

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkPermissions();
