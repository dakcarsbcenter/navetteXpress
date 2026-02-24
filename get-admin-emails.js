const postgres = require('postgres');
require('dotenv').config();
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
async function run() {
    const admins = await sql`SELECT email FROM users WHERE role = 'admin'`;
    admins.forEach(a => console.log('EMAIL_START:' + a.email + ':EMAIL_END'));
    process.exit(0);
}
run();
