#!/bin/bash
# Declenche les demandes d'avis Google post-course (POST /api/cron/review-requests).
# Appele par la tache planifiee horaire posee par scripts/setup-review-requests-cron.sh.
#
# Le secret est lu ici, a l'execution, et jamais ecrit dans la crontab : une ligne
# de crontab se lit avec `crontab -l` et s'exporte dans les sauvegardes. Il n'est
# pas non plus passe en argument de curl, ou il apparaitrait dans `ps`.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/.env.docker"

if [ ! -f "$ENV_FILE" ]; then
  echo "$(date -Is) Erreur : ${ENV_FILE} introuvable." >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

if [ -z "${CRON_SECRET:-}" ]; then
  echo "$(date -Is) Erreur : CRON_SECRET non defini, la route repondrait 403." >&2
  exit 1
fi

# L'URL publique plutot que localhost:3000 : le conteneur app n'expose son port
# qu'au reseau Docker interne (docker-compose.yml utilise `expose`, pas `ports`),
# il n'est donc pas joignable depuis l'hote. Caddy, lui, sert le domaine public.
BASE_URL="${REVIEW_CRON_BASE_URL:-${NEXTAUTH_URL:-https://navettexpress.com}}"
BASE_URL="${BASE_URL%/}"

# -H @- : l'en-tete est lu sur l'entree standard, donc absent de la ligne de
# commande visible dans `ps`.
RESPONSE="$(
  printf 'x-cron-secret: %s\n' "$CRON_SECRET" \
    | curl -fsS --max-time 120 -X POST "${BASE_URL}/api/cron/review-requests" -H @-
)"

echo "$(date -Is) ${RESPONSE}"
