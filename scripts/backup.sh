#!/bin/bash
# Sauvegarde la base de données PostgreSQL du docker-compose de production,
# puis ne garde que les RETENTION_COUNT sauvegardes les plus récentes (le VPS
# a une capacité disque limitée, donc une rétention par nombre plutôt que par âge).
# Voir docs/GUIDE_DEPLOIEMENT_PRODUCTION.md, chapitre 11.
set -euo pipefail

RETENTION_COUNT="${RETENTION_COUNT:-2}"

cd "$(dirname "$0")/.."

mkdir -p backups

FILE="backups/navettexpress_$(date +%Y%m%d_%H%M%S).sql.gz"

docker compose exec -T postgres pg_dump -U navettexpress_user navettexpress | gzip > "$FILE"

echo "Sauvegarde créée : $FILE"
ls -lh "$FILE"

ls -1t backups/navettexpress_*.sql.gz 2>/dev/null | tail -n +"$((RETENTION_COUNT + 1))" | xargs -r rm -v --
