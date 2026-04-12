# Deploiement VPS avec Coolify

## Prerequis

- Un projet Coolify relie au depot Git.
- Une base PostgreSQL accessible depuis le reseau Docker de Coolify.
- Un domaine pointe vers l'application.

## Variables d'environnement obligatoires

Configurer ces variables dans Coolify avant le deploiement:

```bash
NEXTAUTH_SECRET=change-me-64-char-min
NEXTAUTH_URL=https://example.com
DATABASE_URL=postgresql://user:password@postgres-host:5432/database
RUN_MIGRATIONS=true
GOOGLE_CLIENT_ID=optional
GOOGLE_CLIENT_SECRET=optional
```

Notes:
- Laisser `RUN_MIGRATIONS=true` applique les migrations au demarrage.
- Si vous preferez migrer manuellement, definir `RUN_MIGRATIONS=false` puis lancer `node scripts/run-migrations.mjs` en job one-shot.

## Build et runtime

- Build Docker: `Dockerfile` multi-stage avec Next.js standalone.
- Runtime: `start.sh` attend PostgreSQL via `DATABASE_URL`, execute les migrations si activees, puis lance `node server.js`.
- Healthcheck: endpoint `GET /api/health`.

## Verification apres deploiement

1. Ouvrir `https://example.com/api/health` et verifier `status: ok`.
2. Ouvrir `https://example.com/auth/signin`.
3. Tester un endpoint base de donnees, par exemple `/api/test-db`.
4. Verifier les logs d'application pour confirmer l'etape "Migrations appliquees avec succes.".

## Depannage rapide

- Erreur DB au demarrage: verifier `DATABASE_URL` et le reseau de la base.
- Boucle de redemarrage: verifier `NEXTAUTH_SECRET` et `NEXTAUTH_URL`.
- Migrations desactivees: confirmer la valeur de `RUN_MIGRATIONS`.
