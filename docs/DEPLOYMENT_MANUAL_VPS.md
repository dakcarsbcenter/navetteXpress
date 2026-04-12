# Deploiement VPS manuel sans Coolify

## Prerequis

- Docker Engine + plugin `docker compose` installes sur le VPS.
- Ports 80/443 (reverse proxy) et 3000 (app interne) geres.
- DNS du domaine configure vers le VPS.

## 1) Configurer les variables

Le projet contient un fichier `.env.docker` pour le mode manuel. Mettre a jour au minimum:

```bash
NEXTAUTH_SECRET=change-me-64-char-min
NEXTAUTH_URL=https://example.com
DATABASE_URL=postgresql://navettexpress_user:password@postgres:5432/navettexpress
RUN_MIGRATIONS=true
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## 2) Demarrer la stack

```bash
chmod +x scripts/vps-deploy.sh scripts/vps-backup.sh scripts/vps-rollback.sh
./scripts/vps-deploy.sh
```

## 3) Verifications

```bash
docker compose ps
docker compose logs -f app
curl -fsS http://127.0.0.1:3000/api/health
```

Attendus:
- Le service `postgres` passe en `healthy`.
- Le service `app` affiche l'attente DB puis le message de migrations reussies.
- L'endpoint health renvoie `status: ok`.

## 4) Migration manuelle optionnelle

Si vous ne voulez pas migrer au demarrage:

1. Mettre `RUN_MIGRATIONS=false` dans `.env.docker`.
2. Redemarrer l'app: `docker compose up -d app`.
3. Lancer la migration one-shot:

```bash
docker compose exec app node scripts/run-migrations.mjs
```

## 5) Mise a jour applicative

```bash
git pull
./scripts/vps-deploy.sh
```

## 6) Sauvegarde base de donnees

```bash
./scripts/vps-backup.sh
```

## 7) Rollback simple

- Revenir au commit precedent et relancer le service applicatif:

```bash
./scripts/vps-rollback.sh HEAD~1
```

- Toujours executer une sauvegarde via `./scripts/vps-backup.sh` avant un rollback.
