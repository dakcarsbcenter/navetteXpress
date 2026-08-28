#!/bin/bash
# Installe (ou met à jour) une tâche planifiée quotidienne qui exécute scripts/backup.sh.
# À exécuter une seule fois sur le VPS, avec l'utilisateur qui possède /opt/navettexpress.
# Voir docs/GUIDE_DEPLOIEMENT_PRODUCTION.md, chapitre 11.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOUR="${BACKUP_HOUR:-3}"
MARKER="# navettexpress-backup-cron"
CRON_LINE="0 ${HOUR} * * * cd ${PROJECT_DIR} && ./scripts/backup.sh >> ${PROJECT_DIR}/backups/backup.log 2>&1 ${MARKER}"

mkdir -p "${PROJECT_DIR}/backups"

EXISTING_CRON="$(crontab -l 2>/dev/null || true)"

if echo "$EXISTING_CRON" | grep -qF "$MARKER"; then
  UPDATED_CRON="$(echo "$EXISTING_CRON" | grep -vF "$MARKER")"
  UPDATED_CRON="$(printf '%s\n%s\n' "$UPDATED_CRON" "$CRON_LINE")"
  echo "Tâche planifiée déjà présente : mise à jour."
else
  UPDATED_CRON="$(printf '%s\n%s\n' "$EXISTING_CRON" "$CRON_LINE")"
  echo "Ajout de la tâche planifiée de sauvegarde quotidienne."
fi

printf '%s\n' "$UPDATED_CRON" | crontab -

echo "Fait. La sauvegarde tournera chaque jour à ${HOUR}h. Vérifier avec : crontab -l"
