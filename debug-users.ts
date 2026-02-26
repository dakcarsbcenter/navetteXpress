import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "./src/schema";
import ws from "ws";
import dotenv from "dotenv";

dotenv.config();

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function main() {
  const allUsers = await db.select().from(schema.users);
  console.log("--- USERS IN DATABASE ---");
  allUsers.forEach(u => {
    console.log(`Email: ${u.email} | Role: ${u.role} | Attempts: ${u.loginAttempts} | LockedUntil: ${u.accountLockedUntil}`);
  });
  console.log("------------------------");
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
