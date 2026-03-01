import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 15000
});

async function applyMigration() {
  try {
    console.log('📦 Applying migration: add-company-fields-to-users.sql\n');
    
    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations', 'add-company-fields-to-users.sql'),
      'utf-8'
    );
    
    console.log('🔄 Executing migration...\n');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!\n');
    
    // Verify the columns were added
    console.log('🔍 Verifying new columns...\n');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('address', 'is_company', 'company_name', 'ninea', 'raison_sociale', 'company_address', 'company_phone', 'bp')
      ORDER BY column_name
    `);
    
    console.log('Added columns:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();
