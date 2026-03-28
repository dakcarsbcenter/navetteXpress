const postgres = require('postgres');
require('dotenv').config();
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
async function run() {
    const users = await sql`SELECT email, role, name FROM users`;
    console.log('--- ALL USERS ---');
    users.forEach(u => console.log(`EMAIL: ${u.email} | ROLE: ${u.role} | NAME: ${u.name}`));
    process.exit(0);
}
run();
