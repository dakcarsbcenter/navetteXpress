#!/bin/bash
# Sauvegarde la base de données PostgreSQL du docker-compose de production,
# puis supprime les sauvegardes de plus de RETENTION_DAYS jours.
# Voir docs/GUIDE_DEPLOIEMENT_PRODUCTION.md, chapitre 11.
set -euo pipefail

RETENTION_DAYS="${RETENTION_DAYS:-30}"

cd "$(dirname "$0")/.."

mkdir -p backups

FILE="backups/navettexpress_$(date +%Y%m%d_%H%M%S).sql.gz"

docker compose exec -T postgres pg_dump -U navettexpress_user navettexpress | gzip > "$FILE"

echo "Sauvegarde créée : $FILE"
ls -lh "$FILE"

find backups -name 'navettexpress_*.sql.gz' -mtime +"$RETENTION_DAYS" -print -delete
