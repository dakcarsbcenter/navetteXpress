#!/bin/bash
# Enchaîne les étapes du redéploiement standard sur le VPS de production :
# sauvegarde -> git pull -> build -> redémarrage -> vérification santé.
# Voir docs/GUIDE_DEPLOIEMENT_PRODUCTION.md, chapitre 7.
#
# Usage : ./scripts/deploy.sh [branche]   (branche par défaut : main)
set -euo pipefail

cd "$(dirname "$0")/.."

BRANCH="${1:-main}"

echo "==> Version actuelle avant déploiement :"
PREVIOUS_COMMIT="$(git log -1 --oneline)"
echo "$PREVIOUS_COMMIT"
echo "   (notez ce commit pour un rollback éventuel : docs/GUIDE_DEPLOIEMENT_PRODUCTION.md, chapitre 13)"

echo "==> Sauvegarde de la base de données..."
./scripts/backup.sh

echo "==> Récupération du code (git pull origin ${BRANCH})..."
git pull origin "$BRANCH"

echo "==> Construction de l'image de l'application..."
docker compose build app

echo "==> Redémarrage de l'application..."
docker compose up -d app

echo "==> Attente du démarrage (15s)..."
sleep 15

echo "==> Vérification de santé..."
if docker compose exec -T app wget -qO- http://127.0.0.1:3000/api/health; then
  echo
  echo "==> Déploiement terminé avec succès."
else
  echo
  echo "==> ATTENTION : l'endpoint de santé ne répond pas comme attendu."
  echo "    Consultez : docker compose logs --tail=100 app"
  echo "    Et si besoin, le rollback : docs/GUIDE_DEPLOIEMENT_PRODUCTION.md, chapitre 13 (revenir à : ${PREVIOUS_COMMIT})"
  exit 1
fi
