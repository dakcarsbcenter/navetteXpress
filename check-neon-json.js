const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const columns = await client.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'");

        console.log('DATA_START');
        console.log(JSON.stringify({
            tables: tables.rows.map(r => r.table_name),
            columns: columns.rows
        }));
        console.log('DATA_END');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
