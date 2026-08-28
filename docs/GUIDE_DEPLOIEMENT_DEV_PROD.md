# Guide de deploiement Dev et Production

Ce guide couvre:
- Le deploiement en environnement Dev (web + base + Android Capacitor)
- Le deploiement Android en production
- La liste precise de ce qu il faut changer avant la mise en production

Pour le déploiement **web** en production, voir [`GUIDE_DEPLOIEMENT_PRODUCTION.md`](GUIDE_DEPLOIEMENT_PRODUCTION.md) (VPS + Docker Compose — l'ancienne procédure via Coolify décrite plus bas dans ce fichier a été retirée, Coolify ayant été abandonné le 2026-08-24).

## 1. Prerequis

- Node.js LTS + npm
- Docker Desktop (pour la base locale)
- Android Studio + SDK Android (si app mobile)
- Un domaine production actif (exemple: navettexpress.com)
- Un VPS avec Docker + docker compose (voir GUIDE_DEPLOIEMENT_PRODUCTION.md)
- PostgreSQL de production
- Comptes tiers configures: Google OAuth, Cloudinary, Resend

## 2. Deploiement en Dev (local)

## 2.1 Installer les dependances

```powershell
npm install
```

## 2.2 Configurer les variables locales

Le projet lit:
- .env
- .env.local (prioritaire en local)

Variables minimales pour demarrer:
- NEXT_PUBLIC_APP_URL=http://localhost:3000
- NEXTAUTH_URL=http://localhost:3000
- NEXTAUTH_SECRET=<secret-long>
- DATABASE_URL=<postgres-local-ou-neon-dev>

Si vous utilisez Docker pour PostgreSQL local, verifier la coherence avec docker-compose.yml.

## 2.3 Demarrer la base locale (option Docker)

```powershell
docker compose up -d postgres
```

## 2.4 Appliquer les migrations

```powershell
npm run db:migrate
```

## 2.5 Lancer l application web

```powershell
npm run dev
```

Verification:
- Ouvrir http://localhost:3000
- Verifier la connexion
- Verifier les API critiques

## 2.6 Lancer Android en mode Dev (Capacitor)

Le projet mappe automatiquement localhost vers 10.0.2.2 pour l emulateur Android.

```powershell
npm run mobile:sync
npm run mobile:open:android
```

Puis dans Android Studio:
- Selectionner un emulateur
- Cliquer Run

Verification Android:
- Le fichier android/app/src/main/assets/capacitor.config.json doit contenir une URL locale en 10.0.2.2:3000 en mode dev
- Le login doit fonctionner
- Les appels API doivent repondre

## 3. Deploiement Android en production

Pour les variables d'environnement, le rattachement OAuth Google et la procédure de déploiement web (VPS + Docker Compose), voir [`GUIDE_DEPLOIEMENT_PRODUCTION.md`](GUIDE_DEPLOIEMENT_PRODUCTION.md).

Spécifique à l'app mobile (Capacitor) :

- Variable `CAPACITOR_SERVER_URL=https://votre-domaine` (pointe vers le site web en production)
- Vérifier dans Google Cloud Console le package Android `com.navettexpress.app` (si mobile distribué)

Avant publication mobile:
- CAPACITOR_SERVER_URL doit pointer vers https://votre-domaine
- Executer npm run mobile:sync
- Verifier app links et deep links
- Generer AAB signe dans Android Studio
- Publier en Internal Testing avant release publique

## 4. Ce qu il faut changer avant de passer en Production

Checklist obligatoire:

1. Secrets et credentials
- Remplacer tous les secrets de dev
- Regenerer NEXTAUTH_SECRET
- Rotation des cles exposees precedemment dans des fichiers/documentation
- Stockage des secrets uniquement dans le gestionnaire de secrets de la plateforme

2. Variables d URL
- NEXTAUTH_URL doit etre en https sur le domaine final
- NEXT_PUBLIC_APP_URL doit etre en https sur le domaine final
- CAPACITOR_SERVER_URL doit etre en https sur le domaine final

3. Base de donnees
- DATABASE_URL doit pointer vers la base de production
- Activer SSL (sslmode=require si necessaire)
- Verifier droits minimum du compte SQL

4. OAuth et auth
- Google OAuth en mode production (origins + callbacks exacts)
- Verifier les domaines de cookies/session
- Tester login credentials + Google en navigation web et mobile

5. Email et domaine
- RESEND_FROM_EMAIL doit etre un expediteur valide sur votre domaine
- Verifier SPF/DKIM/DMARC

6. Cloudinary
- Utiliser les cles du compte prod
- Verifier les presets et restrictions upload

7. Surfaces de test a verrouiller
- Desactiver ou proteger les pages/routes de test avant prod
- Exemple dans ce projet: routes/pages de test upload Cloudinary

8. Qualite build et securite
- Executer npm run lint
- Executer npm run build
- Repasser le parametrage TypeScript ignoreBuildErrors a false des que possible pour fiabiliser la qualite

9. Observabilite et operations
- Activer logs applicatifs centralises
- Mettre en place alertes uptime + erreurs 5xx
- Planifier sauvegardes automatiques base de donnees

10. Runbook incident
- Procedure rollback applicative
- Procedure restauration base de donnees
- Contact d astreinte et escalade

## 5. Procedure de validation finale (Go Live)

1. Validation technique
- Build OK
- Migration OK
- Sante API OK
- Auth web/mobile OK
- Emails transactionnels OK

2. Validation metier
- Reservation complete de bout en bout
- Parcours client, chauffeur et admin verifies

3. Validation securite
- Secrets confirms
- Endpoints de test verrouilles
- Pas de credential en clair dans les docs publiees

Si les 3 blocs sont verts, lancer la mise en production.

## 6. Commandes utiles (resume)

Dev:

```powershell
npm install
npm run db:migrate
npm run dev
npm run mobile:sync
npm run mobile:open:android
```

Production (verification locale avant push):

```powershell
npm run lint
npm run build
```

## 7. References internes

- ANDROID_DEPLOYMENT.md
- ANDROID_OAUTH_E2E_CHECKLIST.md
- GUIDE_DEPLOIEMENT_PRODUCTION.md
- README.md
