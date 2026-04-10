import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 15000
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...\n');
    
    // Test 1: Check if users table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ ERROR: users table does not exist!');
      pool.end();
      return;
    }
    
    console.log('✅ Users table exists\n');
    
    // Test 2: Get table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Users table structure:');
    console.log(JSON.stringify(columns.rows, null, 2));
    console.log('\n');
    
    // Test 3: Try to query the specific user
    console.log('🔍 Searching for user: ntabjeanoubi@gmail.com\n');
    const userQuery = await pool.query(
      'SELECT id, email, role FROM users WHERE email = $1 LIMIT 1',
      ['ntabjeanoubi@gmail.com']
    );
    
    if (userQuery.rows.length > 0) {
      console.log('✅ User found:', userQuery.rows[0]);
    } else {
      console.log('⚠️  User not found in database');
    }
    
  } catch (err) {
    console.error('❌ Database error:', err.message);
    console.error('Full error:', err);
  } finally {
    await pool.end();
  }
}

testConnection();
