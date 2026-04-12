#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/vps-backup.sh
# Optional:
#   COMPOSE_FILE=docker-compose.yml
#   DB_SERVICE=postgres
#   BACKUP_DIR=./backups
#   DB_NAME=navettexpress

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
DB_SERVICE="${DB_SERVICE:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_NAME="${DB_NAME:-navettexpress}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="$BACKUP_DIR/db-$DB_NAME-$STAMP.sql.gz"

echo "Creating PostgreSQL backup: $OUT_FILE"
docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" \
  pg_dump -U navettexpress_user -d "$DB_NAME" | gzip > "$OUT_FILE"

echo "Backup completed: $OUT_FILE"
