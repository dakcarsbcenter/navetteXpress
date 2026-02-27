import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

async function resetAttempts() {
    const sql = neon(DATABASE_URL);
    await sql`UPDATE users SET login_attempts = 0, account_locked_until = NULL, last_failed_login = NULL WHERE email = 'ntabjeanoubi@gmail.com'`;
    console.log("Reset login attempts for ntabjeanoubi@gmail.com");
}

resetAttempts();
