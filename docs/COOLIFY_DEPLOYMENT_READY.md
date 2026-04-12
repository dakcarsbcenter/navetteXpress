# Guide de deploiement VPS

Ce projet supporte maintenant deux modes de deploiement Docker sur VPS, au choix:

- Mode orchestre avec Coolify: voir `docs/DEPLOYMENT_COOLIFY.md`
- Mode manuel sans Coolify: voir `docs/DEPLOYMENT_MANUAL_VPS.md`

## Points techniques importants

- Le demarrage applicatif lit `DATABASE_URL` et n'est plus couple a un nom de service fixe.
- Le conteneur attend PostgreSQL avant de lancer l'application.
- Les migrations sont executees par `scripts/run-migrations.mjs` quand `RUN_MIGRATIONS=true`.
- Le healthcheck de conteneur utilise `GET /api/health`.

## Validation rapide

```bash
docker compose config
npm run build
```

Puis verifier l'endpoint de sante sur l'environnement cible.
