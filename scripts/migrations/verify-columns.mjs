import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as fs from 'fs';
import * as path from 'path';

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  }
}

loadEnvFile();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const client = neon(DATABASE_URL);
const db = drizzle({ client });

async function verifyColumns() {
  try {
    const result = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' 
      AND column_name IN ('login_attempts', 'account_locked_until', 'last_failed_login')
    `);
    
    if (result.rows.length === 3) {
      console.log('✅ All three columns exist:');
      result.rows.forEach(row => console.log('   -', row.column_name));
    } else {
      console.log('❌ Missing columns. Found:', result.rows.length);
      result.rows.forEach(row => console.log('   -', row.column_name));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

verifyColumns();
