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

echo "==> Application des migrations de base de données..."
echo "    (avant le build, pour échouer vite si une migration casse — voir"
echo "     migrations/meta/_journal.json pour la liste des migrations trackées."
echo "     Un fichier .sql non enregistré dans le journal n'est PAS appliqué ici,"
echo "     voir docs/GUIDE_DEPLOIEMENT_PRODUCTION.md chapitre 9.)"
# Réutilise le node_modules déjà installé dans l'image "app" actuellement en
# service (postgres + drizzle-orm y sont présents, voir Dockerfile) en montant
# par-dessus le dossier migrations/ et le script fraîchement récupérés par le
# git pull ci-dessus. Pas besoin de Node/npm sur l'hôte ni d'attendre le build.
# (pas de --no-deps : laisse compose s'assurer que postgres est "healthy"
# avant de lancer la migration, comme pour le service "app" normal)
docker compose run --rm \
  -v "$(pwd)/migrations:/app/migrations:ro" \
  -v "$(pwd)/scripts/run-migrations.mjs:/app/scripts/run-migrations.mjs:ro" \
  --entrypoint node \
  app scripts/run-migrations.mjs

echo "==> Construction de l'image de l'application..."
# Les variables NEXT_PUBLIC_* (ex: Cloudinary) sont figées dans le bundle
# client PENDANT ce build : docker-compose.yml les passe en build-args, donc
# elles doivent exister dans l'environnement shell ici, pas seulement dans
# .env.docker (qui n'est lu qu'au runtime via env_file).
set -a
source .env.docker
set +a
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
