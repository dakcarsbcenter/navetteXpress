const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function checkNeonSchema() {
    try {
        console.log('🔍 Checking Neon Schema...');

        // Check tables
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
        console.log('📋 Tables in Neon:', tables.map(t => t.table_name).join(', '));

        // Check columns for 'users'
        const userColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `;
        console.log('\n👤 Columns in "users" table:');
        userColumns.forEach(c => console.log(`   - ${c.column_name} (${c.data_type})`));

        // Check if driver_availability exists
        const hasAvailability = tables.some(t => t.table_name === 'driver_availability');
        console.log(`\n🚗 table "driver_availability" exists: ${hasAvailability ? '✅' : '❌'}`);

    } catch (error) {
        console.error('❌ Error checking schema:', error);
    } finally {
        await sql.end();
    }
}

checkNeonSchema();
