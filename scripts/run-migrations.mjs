import { readdir, readFile } from "fs/promises";
import path from "path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const MIGRATIONS_FOLDER = "./migrations";

/**
 * Applique les fichiers `migrations/seed-*.sql`, apres les migrations de schema.
 *
 * Drizzle ne joue que les fichiers enregistres dans migrations/meta/_journal.json :
 * un seed de DONNEES (pas de schema) n'y a pas sa place, mais doit quand meme
 * partir en production sans intervention manuelle. D'ou cette passe dediee, qui
 * ne ramasse QUE le prefixe `seed-` : les autres .sql hors journal du dossier
 * (add-*, fix-*, restructure-*) sont des rattrapages ponctuels deja appliques et
 * ne doivent surtout pas etre rejoues.
 *
 * CONTRAT : un seed est rejoue a CHAQUE demarrage du conteneur, il doit donc etre
 * idempotent (ON CONFLICT DO NOTHING, INSERT ... WHERE NOT EXISTS, etc.).
 */
async function runSeeds(sql) {
  const entries = await readdir(MIGRATIONS_FOLDER);
  const seeds = entries.filter((f) => f.startsWith("seed-") && f.endsWith(".sql")).sort();

  if (seeds.length === 0) {
    return;
  }

  for (const file of seeds) {
    const content = await readFile(path.join(MIGRATIONS_FOLDER, file), "utf8");
    // Une transaction par fichier : un seed en echec n'en laisse pas la moitie posee.
    await sql.begin((tx) => [tx.unsafe(content)]);
    console.log(`Seed applique: ${file}`);
  }
}

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
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    console.log("Migrations appliquees avec succes.");
    await runSeeds(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("Echec des migrations:", error);
  process.exit(1);
});
