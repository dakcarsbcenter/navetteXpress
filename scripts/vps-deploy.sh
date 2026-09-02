#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   DOMAIN=example.com ./scripts/vps-deploy.sh
# Optional:
#   COMPOSE_FILE=docker-compose.yml
#   APP_SERVICE=app
#   DB_SERVICE=postgres

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
APP_SERVICE="${APP_SERVICE:-app}"
DB_SERVICE="${DB_SERVICE:-postgres}"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "[ERROR] Compose file not found: $COMPOSE_FILE"
  exit 1
fi

if [ ! -f ".env.docker" ]; then
  echo "[ERROR] Missing .env.docker in current directory"
  exit 1
fi

echo "[1/6] Validate compose"
docker compose -f "$COMPOSE_FILE" config >/dev/null

echo "[2/6] Build images"
# Les variables NEXT_PUBLIC_* (ex: Cloudinary) sont figées dans le bundle
# client PENDANT ce build : docker-compose.yml les passe en build-args, donc
# elles doivent exister dans l'environnement shell ici, pas seulement dans
# .env.docker (qui n'est lu qu'au runtime via env_file). Voir scripts/deploy.sh.
set -a
source .env.docker
set +a
docker compose -f "$COMPOSE_FILE" build --pull

echo "[3/6] Start database"
docker compose -f "$COMPOSE_FILE" up -d "$DB_SERVICE"

echo "[4/6] Start application"
docker compose -f "$COMPOSE_FILE" up -d "$APP_SERVICE"

echo "[5/6] Service status"
docker compose -f "$COMPOSE_FILE" ps

echo "[6/6] Health check"
curl -fsS http://127.0.0.1:3000/api/health | sed 's/.*/[health] &/'

echo "Deployment finished successfully"
