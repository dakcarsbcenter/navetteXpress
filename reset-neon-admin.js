const postgres = require('postgres');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load .env
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not defined in .env');
    process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: 'require' });

async function resetAdmin() {
    try {
        const newPassword = 'Admin123!';
        console.log(`🔐 Hashing new password...`);
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        console.log('🔄 Identifying admins in Neon...');
        const admins = await sql`SELECT id, email FROM users WHERE role = 'admin'`;

        if (admins.length === 0) {
            console.log('❌ No admin users found in the database.');
            return;
        }

        console.log(`🔍 Found ${admins.length} admin(s). Updating passwords...`);

        for (const admin of admins) {
            await sql`
        UPDATE users 
        SET password = ${hashedPassword}, 
            login_attempts = 0, 
            account_locked_until = NULL 
        WHERE id = ${admin.id}
      `;
            console.log(`✅ Updated: ${admin.email}`);
        }

        console.log('\n🎉 Success! All admin accounts has been reset to:');
        console.log('🔑 Password: Admin123!');
        console.log('\n(Use the emails listed above to log in)');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sql.end();
    }
}

resetAdmin();
