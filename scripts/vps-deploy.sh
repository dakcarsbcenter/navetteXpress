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
# Le port 3000 n'est PAS publie sur l'hote (docker-compose.yml utilise `expose`,
# pas `ports`) : seul Caddy l'atteint via le reseau Docker. Un curl depuis l'hote
# echouait donc systematiquement alors que le deploiement etait bon. On
# interroge l'app depuis l'interieur du conteneur, en laissant au HEALTHCHECK
# du Dockerfile (start-period 30s) le temps de passer au vert.
for attempt in $(seq 1 15); do
  if health_body=$(docker compose -f "$COMPOSE_FILE" exec -T "$APP_SERVICE" \
      wget -qO- http://127.0.0.1:3000/api/health 2>/dev/null); then
    echo "[health] $health_body"
    break
  fi
  if [ "$attempt" -eq 15 ]; then
    echo "[ERROR] Health check failed after 15 attempts"
    docker compose -f "$COMPOSE_FILE" logs --tail=50 "$APP_SERVICE"
    exit 1
  fi
  echo "[health] not ready yet (attempt $attempt/15), retrying in 4s"
  sleep 4
done

echo "Deployment finished successfully"
