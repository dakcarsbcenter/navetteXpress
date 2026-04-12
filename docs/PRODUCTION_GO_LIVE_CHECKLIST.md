# Checklist Go Live VPS

## 1. Infrastructure

- VPS a jour avec Docker Engine et plugin docker compose.
- Pare-feu actif avec ports 22, 80, 443 ouverts.
- DNS du domaine pointe vers l'adresse IP du VPS.
- Reverse proxy TLS configure (Nginx, Traefik, Caddy).

## 2. Secrets et variables

- NEXTAUTH_SECRET fort et unique en production.
- NEXTAUTH_URL defini sur le domaine HTTPS final.
- DATABASE_URL verifiee avec credentials production.
- RUN_MIGRATIONS selon la strategie retenue.

## 3. Base de donnees

- Sauvegarde initiale verifiee avec scripts/vps-backup.sh.
- Politique de retention des backups definie.
- Test de restauration valide sur environnement de test.

## 4. Deploiement

- docker compose config valide.
- Build applicatif valide via npm run build.
- Deploiement VPS lance avec scripts/vps-deploy.sh.
- Endpoint de sante repond sur /api/health.

## 5. Verification applicative

- Authentification web fonctionnelle.
- Endpoint DB fonctionnel (exemple: /api/test-db).
- Pages critiques chargees sans erreur.
- Logs applicatifs sans erreur bloquante.

## 6. Exploitation

- Monitoring actif sur CPU, RAM, disque et restart containers.
- Alerting configure sur indisponibilite endpoint sante.
- Procedure de rollback testee avec scripts/vps-rollback.sh.

## 7. Post go live

- Activer sauvegardes planifiees.
- Conserver le commit de release et note de changement.
- Planifier une verification J+1 et J+7.
