const postgres = require('postgres');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function run() {
    const email = 'contact@navettexpress.com';
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log(`🔍 Checking if ${email} exists...`);
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;

    if (existing.length > 0) {
        console.log('🔄 User exists, updating password and role to admin...');
        await sql`
      UPDATE users 
      SET password = ${hashedPassword}, 
          role = 'admin',
          login_attempts = 0,
          account_locked_until = NULL
      WHERE email = ${email}
    `;
        console.log('✅ User updated successfully.');
    } else {
        console.log('✨ User does not exist, creating new admin user...');
        try {
            await sql`
        INSERT INTO users (id, name, email, password, role, login_attempts, created_at, updated_at)
        VALUES (
          ${crypto.randomUUID ? crypto.randomUUID() : 'admin-' + Date.now()}, 
          'Administrateur', 
          ${email}, 
          ${hashedPassword}, 
          'admin', 
          0, 
          NOW(), 
          NOW()
        )
      `;
            console.log('✅ Admin user created successfully.');
        } catch (e) {
            console.error('❌ Error creating user:', e);
            // Fallback if randomUUID is not available or failed
            const id = 'admin-' + Math.random().toString(36).substr(2, 9);
            await sql`
        INSERT INTO users (id, name, email, password, role, login_attempts, created_at, updated_at)
        VALUES (${id}, 'Administrateur', ${email}, ${hashedPassword}, 'admin', 0, NOW(), NOW())
      `;
            console.log('✅ Admin user created successfully (fallback ID).');
        }
    }

    process.exit(0);
}

run();
