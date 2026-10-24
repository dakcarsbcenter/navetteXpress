#!/bin/bash
# Après un déploiement : invalide les pages publiques pré-rendues au build (base
# factice, donc tarifs/flotte vides), puis les visite pour qu'elles soient
# régénérées avec les vraies données avant l'arrivée des visiteurs et de Googlebot.
# Appelé par scripts/deploy.sh ; relançable à la main sans risque.
#
# Même règle que run-review-requests-cron.sh : le CRON_SECRET est lu dans
# .env.docker et passé par stdin, jamais en argument visible dans `ps`.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/.env.docker"

if [ ! -f "$ENV_FILE" ]; then
  echo "Erreur : ${ENV_FILE} introuvable." >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

if [ -z "${CRON_SECRET:-}" ]; then
  echo "Erreur : CRON_SECRET non défini, la route répondrait 403." >&2
  exit 1
fi

BASE_URL="${WARM_BASE_URL:-${NEXTAUTH_URL:-https://navettexpress.com}}"
BASE_URL="${BASE_URL%/}"

printf 'x-cron-secret: %s\n' "$CRON_SECRET" \
  | curl -fsS --max-time 30 -X POST "${BASE_URL}/api/cron/revalidate-public" -H @-
echo

# Toutes les URL du sitemap. Deux passages : selon la version de Next, la
# première visite après invalidation peut encore servir l'ancienne page
# pendant qu'elle se régénère ; la seconde trouve la page fraîche en cache.
URLS="$(curl -fsS --max-time 30 "${BASE_URL}/sitemap.xml" | grep -o '<loc>[^<]*</loc>' | sed 's#</\?loc>##g')"
COUNT="$(printf '%s\n' "$URLS" | grep -c . || true)"
for pass in 1 2; do
  failures=0
  while IFS= read -r url; do
    [ -z "$url" ] && continue
    curl -fsS -o /dev/null --max-time 60 "$url" || failures=$((failures + 1))
  done <<< "$URLS"
  echo "Passage ${pass} : ${COUNT} pages visitées, ${failures} en échec."
  [ "$pass" = 1 ] && sleep 5
done
