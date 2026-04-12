#!/bin/bash
set -euo pipefail

echo "🚀 Démarrage de Navette Xpress..."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL n'est pas défini."
  exit 1
fi

if [ ! -f "./server.js" ]; then
  echo "❌ server.js est introuvable. Vérifiez la copie du build standalone."
  exit 1
fi

eval "$(node <<'NODE'
const { URL } = require("url");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  process.exit(1);
}

const parsed = new URL(databaseUrl);
const values = {
  DB_HOST: parsed.hostname,
  DB_PORT: parsed.port || "5432",
  DB_USER: decodeURIComponent(parsed.username),
  DB_PASSWORD: decodeURIComponent(parsed.password),
  DB_NAME: parsed.pathname.replace(/^\/+/, "") || "postgres",
};

for (const [key, value] of Object.entries(values)) {
  console.log(`${key}=${JSON.stringify(value)}`);
}
NODE
)"

if [ -z "${DB_HOST:-}" ] || [ -z "${DB_USER:-}" ]; then
  echo "❌ DATABASE_URL est invalide: hôte ou utilisateur manquant."
  exit 1
fi

export PGPASSWORD="${DB_PASSWORD:-}"

echo "⏳ Attente de la base de données sur ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
  echo "Base de données non disponible, attente..."
  sleep 2
done

echo "✅ Base de données prête!"

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "🔄 Application des migrations..."
  node ./scripts/run-migrations.mjs
  echo "✅ Migrations appliquées"
else
  echo "⏭️ Migrations ignorées (RUN_MIGRATIONS=false)"
fi

echo "🚀 Démarrage de l'application Next.js..."
exec node server.js