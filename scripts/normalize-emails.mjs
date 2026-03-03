// Normalize all user emails to lowercase in the database
// Run with: node scripts/normalize-emails.mjs

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Pool } = require("@neondatabase/serverless");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function normalizeEmails() {
  const client = await pool.connect();
  try {
    // Count affected rows first
    const { rows: preview } = await client.query(
      "SELECT id, email FROM users WHERE email != lower(email)"
    );

    if (preview.length === 0) {
      console.log("✅ All emails are already lowercase. Nothing to do.");
      return;
    }

    console.log(`🔧 Found ${preview.length} email(s) to normalize:`);
    for (const row of preview) {
      console.log(`   ${row.email}  →  ${row.email.toLowerCase()}`);
    }

    // Apply normalization
    const result = await client.query(
      "UPDATE users SET email = lower(email) WHERE email != lower(email)"
    );
    console.log(`✅ Normalized ${result.rowCount} email(s) successfully.`);
  } finally {
    client.release();
    await pool.end();
  }
}

normalizeEmails().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
