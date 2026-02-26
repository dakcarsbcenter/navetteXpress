const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkNeonWithPg() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔍 Checking Neon Schema with pg...');
        await client.connect();
        console.log('✅ Connected to Neon');

        // Tables
        const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log('📋 Tables:', tables.join(', '));

        // Users columns
        const columnsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
        console.log('\n👤 Users columns:');
        columnsRes.rows.forEach(c => console.log(`   - ${c.column_name} (${c.data_type})`));

        // Check availability
        const hasAvailability = tables.includes('driver_availability');
        console.log(`\n🚗 table "driver_availability" exists: ${hasAvailability ? '✅' : '❌'}`);

    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await client.end();
    }
}

checkNeonWithPg();
