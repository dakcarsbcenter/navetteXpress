import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL n'est pas defini.");
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 15,
  });

  try {
    const db = drizzle(sql);
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("Migrations appliquees avec succes.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("Echec des migrations:", error);
  process.exit(1);
});
