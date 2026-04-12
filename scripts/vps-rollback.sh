#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/vps-rollback.sh <git-ref>
# Example:
#   ./scripts/vps-rollback.sh HEAD~1
# Optional:
#   COMPOSE_FILE=docker-compose.yml
#   APP_SERVICE=app

if [ $# -lt 1 ]; then
  echo "Usage: $0 <git-ref>"
  exit 1
fi

TARGET_REF="$1"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
APP_SERVICE="${APP_SERVICE:-app}"

if ! git rev-parse --verify "$TARGET_REF" >/dev/null 2>&1; then
  echo "[ERROR] Unknown git ref: $TARGET_REF"
  exit 1
fi

echo "Checkout target ref: $TARGET_REF"
git checkout "$TARGET_REF"

echo "Rebuild and restart application service"
docker compose -f "$COMPOSE_FILE" build "$APP_SERVICE"
docker compose -f "$COMPOSE_FILE" up -d "$APP_SERVICE"

echo "Rollback complete"
