const postgres = require('postgres');
require('dotenv').config();
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
async function run() {
    const emails = ['contact@navettexpress.com', 'admin@navettehub.com', 'ntabjeanoubi@gmail.com'];
    for (const email of emails) {
        const user = await sql`SELECT email, role FROM users WHERE email = ${email}`;
        if (user.length > 0) {
            console.log(`FOUND: ${email} (Role: ${user[0].role})`);
        } else {
            console.log(`NOT FOUND: ${email}`);
        }
    }
    process.exit(0);
}
run();
