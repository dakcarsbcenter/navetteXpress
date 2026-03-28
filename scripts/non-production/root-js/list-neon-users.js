const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not defined in .env');
    process.exit(1);
}

console.log('🔍 Connecting to:', databaseUrl.split('@')[1]); // Log host only for safety

const sql = postgres(databaseUrl, { ssl: 'require' });
const db = drizzle(sql);

async function listUsers() {
    try {
        console.log('👥 Fetching users from Neon...');
        const users = await sql`SELECT id, email, name, role, login_attempts FROM users`;

        console.log('---USERS_START---');
        console.log(JSON.stringify(users, null, 2));
        console.log('---USERS_END---');

        if (users.length === 0) {
            console.log('⚠️ No users found in the database.');
        }
    } catch (error) {
        console.error('❌ Error fetching users:', error);
    } finally {
        await sql.end();
    }
}

listUsers();
