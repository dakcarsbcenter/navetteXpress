// Normalise les téléphones stockés au format international E.164 (+221…, +33…).
//
// En local          : npm run phones:normalize          (aperçu)
//                     npm run phones:normalize:apply    (écriture)
// Dans le conteneur : docker compose exec app node scripts/normalize-phones.mjs
//                     docker compose exec app node scripts/normalize-phones.mjs --apply
//
// Rattrapage du bug de la réservation #7 : un numéro saisi "0033680264157" était
// stocké tel quel, puis converti en "+0033680264157" à l'envoi WhatsApp — rejeté par
// Geskap, donc confirmation jamais reçue par le client.
//
// Client `postgres` (et non @neondatabase/serverless comme normalize-emails.mjs, qui
// date de l'époque Neon) : c'est celui de src/db.ts et de run-migrations.mjs, le seul
// qui parle au Postgres du docker-compose de production.
//
// toE164() ci-dessous est un MIROIR de toGeskapPhone() (src/lib/whatsapp/geskap.ts) :
// les scripts tournent en Node brut, sans résolution des alias TypeScript. Toute
// évolution des règles doit être reportée des deux côtés.

import postgres from "postgres";

// dotenv n'est qu'une devDependency : absent de l'image de production, où
// DATABASE_URL est déjà dans l'environnement du conteneur. Chargement best-effort.
try {
  const dotenv = await import("dotenv");
  dotenv.config({ path: ".env.local" });
  dotenv.config({ path: ".env" });
} catch {
  // Pas de dotenv : on compte sur les variables déjà présentes.
}

const APPLY = process.argv.includes("--apply");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL n'est pas défini.");
  process.exit(1);
}

const E164 = /^\+[1-9]\d{7,14}$/;

function toE164(raw) {
  const trimmed = String(raw).trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.length === 9) return `+221${digits}`;
  if (digits.startsWith("221")) return `+${digits}`;
  return `+${digits}`;
}

// Colonnes portant un numéro réellement joignable par WhatsApp. `users.company_phone`
// est volontairement exclu : purement documentaire, jamais utilisé comme destinataire.
const TARGETS = [
  { table: "users", idColumn: "id", column: "phone" },
  { table: "bookings", idColumn: "id", column: "customer_phone" },
  { table: "bookings", idColumn: "id", column: "passenger_phone" },
];

const sql = postgres(DATABASE_URL, { max: 1, idle_timeout: 20, connect_timeout: 15 });

async function normalizePhones() {
  let totalChanges = 0;
  let totalUnresolved = 0;

  try {
    for (const { table, idColumn, column } of TARGETS) {
      // sql.unsafe() car table/colonne sont des identifiants, pas des valeurs — ils
      // viennent de TARGETS (constante du fichier), jamais d'une entrée utilisateur.
      const rows = await sql.unsafe(
        `SELECT ${idColumn} AS id, ${column} AS value FROM ${table} WHERE ${column} IS NOT NULL AND ${column} <> ''`
      );

      const changes = [];
      const unresolved = [];

      for (const row of rows) {
        const next = toE164(row.value);
        if (!E164.test(next)) {
          // Pays non devinable (ex: national étranger sans indicatif) : on ne touche
          // pas, une supposition enverrait le message au mauvais numéro.
          unresolved.push(row);
          continue;
        }
        if (next !== row.value) changes.push({ id: row.id, from: row.value, to: next });
      }

      totalChanges += changes.length;
      totalUnresolved += unresolved.length;

      console.log(
        `\n🔧 ${table}.${column} — ${rows.length} valeur(s), ${changes.length} à normaliser, ${unresolved.length} non convertible(s)`
      );
      for (const c of changes) console.log(`   #${c.id}  ${c.from}  →  ${c.to}`);
      for (const u of unresolved) {
        console.log(`   ⚠️  #${u.id}  ${u.value}  → à corriger à la main (indicatif pays manquant)`);
      }

      if (APPLY && changes.length > 0) {
        for (const c of changes) {
          await sql.unsafe(`UPDATE ${table} SET ${column} = $1 WHERE ${idColumn} = $2`, [c.to, c.id]);
        }
        console.log(`✅ ${changes.length} valeur(s) mise(s) à jour dans ${table}.${column}.`);
      }
    }

    console.log(`\n📊 Total : ${totalChanges} à normaliser, ${totalUnresolved} à corriger manuellement.`);
    if (!APPLY) {
      console.log("ℹ️  Aperçu uniquement. Relancer avec --apply pour écrire en base.\n");
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

normalizePhones().catch((err) => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
