#!/bin/bash
# Installe (ou met a jour) la tache planifiee horaire qui declenche les demandes
# d'avis Google post-course.
#
# A executer une seule fois sur le VPS, avec l'utilisateur qui possede
# /opt/navettexpress. Meme modele que scripts/setup-backup-cron.sh : le marqueur
# en fin de ligne rend le script idempotent, on peut le rejouer sans empiler les
# entrees.
#
# Ce script n'installe QUE la demande d'avis. Le rappel avant depart
# (/api/cron/whatsapp-reminders) est deja en service et sa ligne a ete posee a la
# main : on n'y touche pas, une seconde entree ferait tourner le meme cron deux
# fois. Verifier sa presence avec `crontab -l`.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MARKER="# navettexpress-review-requests-cron"
RUNNER="${PROJECT_DIR}/scripts/run-review-requests-cron.sh"
LOG_FILE="${PROJECT_DIR}/logs/review-requests.log"
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
  echo "Erreur : CRON_SECRET n'est pas defini dans ${ENV_FILE}." >&2
  echo "         Sans lui la route repond 403 et aucune demande d'avis ne part." >&2
  exit 1
fi

if [ -z "${GOOGLE_REVIEW_URL:-}" ]; then
  echo "Attention : GOOGLE_REVIEW_URL est vide dans ${ENV_FILE}."
  echo "            La tache est installee quand meme, mais la route repondra"
  echo "            \"GOOGLE_REVIEW_URL non renseignee\" et n'enverra rien."
  echo "            Rien n'est perdu : les courses terminees entre-temps partiront"
  echo "            au premier passage suivant le renseignement du lien."
  echo
fi

chmod +x "$RUNNER"
mkdir -p "${PROJECT_DIR}/logs"

# Minute 7 de chaque heure : decale de l'heure pile, ou se bousculent les taches
# planifiees par defaut. L'horaire exact n'a aucune importance ici — la condition
# est "terminee depuis au moins X heures", pas une fenetre a rater : une course
# manquee a un passage part au suivant.
CRON_LINE="7 * * * * ${RUNNER} >> ${LOG_FILE} 2>&1 ${MARKER}"

EXISTING_CRON="$(crontab -l 2>/dev/null || true)"

if echo "$EXISTING_CRON" | grep -qF "$MARKER"; then
  UPDATED_CRON="$(echo "$EXISTING_CRON" | grep -vF "$MARKER")"
  UPDATED_CRON="$(printf '%s\n%s\n' "$UPDATED_CRON" "$CRON_LINE")"
  echo "Tache planifiee deja presente : mise a jour."
else
  UPDATED_CRON="$(printf '%s\n%s\n' "$EXISTING_CRON" "$CRON_LINE")"
  echo "Ajout de la tache planifiee horaire des demandes d'avis."
fi

printf '%s\n' "$UPDATED_CRON" | crontab -

echo "Fait. La demande d'avis tournera a la minute 7 de chaque heure."
echo "  Verifier la tache  : crontab -l"
echo "  Tester tout de suite : ${RUNNER}"
echo "  Suivre les envois  : tail -f ${LOG_FILE}"
echo
echo "Rappel : le gabarit WhatsApp 'senddemandeavis' doit etre saisi dans la"
echo "console Geskap et approuve par Meta avant qu'un message puisse partir"
echo "(corps exact dans docs/GESKAP_WHATSAPP.md, chapitre 6)."
