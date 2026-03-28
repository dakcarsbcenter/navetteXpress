const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function testConnection(name, ssl) {
    console.log(`\n🔍 Testing: ${name}`);
    const client = new Client({ connectionString, ssl, connectionTimeoutMillis: 5000 });
    try {
        const start = Date.now();
        await client.connect();
        console.log(`✅ ${name}: SUCCESS in ${Date.now() - start}ms`);
        await client.end();
        return true;
    } catch (e) {
        console.log(`❌ ${name}: FAILED - ${e.message}`);
        try { await client.end(); } catch { }
        return false;
    }
}

async function run() {
    console.log('🚀 DB Connection Troubleshooting Script');
    console.log('Host:', connectionString.split('@')[1].split('/')[0]);

    await testConnection('SSL OFF', false);
    await testConnection('SSL REQUIRE (ignore unauthorized)', { rejectUnauthorized: false });
    await testConnection('SSL REQUIRE (strict)', true);

    process.exit(0);
}

run();
