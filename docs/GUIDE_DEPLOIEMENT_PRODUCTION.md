# Guide de déploiement — NavetteXpress (VPS + Docker Compose)

> **Dernière mise à jour :** 2026-08-29
> **Statut de l'infra décrite :** en production (VPS direct, Docker Compose — Coolify a été abandonné le 2026-08-24)
> **Ce document doit être tenu à jour.** Voir le [chapitre 14](#14-journal-des-évolutions-nécessitant-une-configuration) : à chaque fonctionnalité qui ajoute une variable d'environnement, un service externe ou une dépendance, une ligne doit être ajoutée ici.

## Sommaire

1. [À qui s'adresse ce guide](#1-à-qui-sadresse-ce-guide)
2. [Vue d'ensemble de l'architecture](#2-vue-densemble-de-larchitecture)
3. [Glossaire express](#3-glossaire-express)
4. [Informations d'accès](#4-informations-daccès-à-compléter-par-vous)
5. [Pré-requis avant de commencer](#5-pré-requis-avant-de-commencer)
6. [Installation initiale complète (une seule fois)](#6-installation-initiale-complète-une-seule-fois)
7. [Redéploiement — mettre en ligne une nouvelle version du code](#7-redéploiement--mettre-en-ligne-une-nouvelle-version-du-code)
8. [Variables d'environnement](#8-variables-denvironnement)
9. [Migrations de base de données](#9-migrations-de-base-de-données)
10. [Sauvegarde et restauration de la base de données](#10-sauvegarde-et-restauration-de-la-base-de-données)
11. [Vérifications après un déploiement (checklist)](#11-vérifications-après-un-déploiement-checklist)
12. [Rollback — annuler un déploiement raté](#12-rollback--annuler-un-déploiement-raté)
13. [Pannes courantes et comment les résoudre](#13-pannes-courantes-et-comment-les-résoudre)
14. [Journal des évolutions nécessitant une configuration](#14-journal-des-évolutions-nécessitant-une-configuration)
15. [Sécurité de base](#15-sécurité-de-base)
16. [Pistes d'amélioration proposées](#16-pistes-damélioration-proposées)

---

## 1. À qui s'adresse ce guide

Ce guide est écrit pour être suivi **sans connaissances techniques préalables**. Chaque commande à taper est dans un bloc gris, à copier-coller tel quel (en remplaçant seulement ce qui est écrit en `MAJUSCULES_ENTRE_CROCHETS` ou signalé `<À REMPLACER>`).

Règle d'or : **en cas de doute, ne pas improviser** — relire le chapitre [14. Pannes courantes](#14-pannes-courantes-et-comment-les-résoudre) ou demander de l'aide plutôt que de taper une commande dont on ne comprend pas l'effet, en particulier tout ce qui contient `rm`, `delete`, `--force`, `-f`, ou `DROP`.

Ce guide couvre uniquement le **déploiement web via Docker Compose sur le VPS de production**. Pour le développement local et la publication de l'application mobile Android, voir [`docs/GUIDE_DEPLOIEMENT_DEV_PROD.md`](GUIDE_DEPLOIEMENT_DEV_PROD.md) (sa partie "Production/Coolify" est obsolète, seule sa partie "Dev local" et "Android" reste valable).

## 2. Vue d'ensemble de l'architecture

L'application tourne sur **un seul serveur (VPS)**, avec **3 "conteneurs" Docker** qui travaillent ensemble (définis dans le fichier [`docker-compose.yml`](../docker-compose.yml) à la racine du projet) :

```
                          Internet (HTTPS)
                                │
                                ▼
                    ┌───────────────────────┐
                    │  caddy                │  reverse-proxy + certificat
                    │  (ports 80 / 443)     │  HTTPS automatique (Let's Encrypt)
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  app                  │  l'application NavetteXpress
                    │  (Next.js, port 3000) │  (le code de ce dépôt Git)
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  postgres             │  base de données
                    └───────────────────────┘
```

- **`caddy`** — reçoit tout le trafic web sur les ports 80/443, obtient et renouvelle automatiquement le certificat HTTPS, puis transmet les requêtes à `app`. Configuré dans [`Caddyfile`](../Caddyfile) (domaines `navettexpress.com` et `www.navettexpress.com`).
- **`app`** — l'application elle-même (Next.js), construite à partir du code du dépôt via le [`Dockerfile`](../Dockerfile). C'est ce conteneur qu'on reconstruit à chaque déploiement.
- **`postgres`** — la base de données PostgreSQL 15, qui stocke toutes les données (utilisateurs, réservations, factures, etc.). Ses données vivent dans un volume Docker qui survit aux redémarrages/mises à jour.

> Un 4ᵉ conteneur (`openwa`, passerelle de notifications WhatsApp) a existé jusqu'au 2026-08-29 ; il a été retiré après le blocage du numéro associé par Meta — voir [chapitre 14](#14-journal-des-évolutions-nécessitant-une-configuration).

Tout est piloté par la commande `docker compose` (avec un espace, pas un tiret — voir chapitre 5) exécutée directement sur le VPS, sans plateforme intermédiaire (l'ancienne solution "Coolify" a été abandonnée).

## 3. Glossaire express

| Terme | Explication simple |
|---|---|
| **VPS** | Le serveur (l'ordinateur distant, loué chez un hébergeur) sur lequel tourne le site en production. |
| **SSH** | Le moyen de se connecter et taper des commandes sur le VPS à distance, depuis son propre ordinateur. |
| **Docker** | Un outil qui fait tourner l'application "empaquetée" dans des boîtes isolées appelées conteneurs, toujours de la même façon, qu'on soit en local ou sur le serveur. |
| **Conteneur** | Une de ces "boîtes" Docker qui tourne (ex : `app`, `postgres`). |
| **Docker Compose** | L'outil qui démarre/arrête plusieurs conteneurs ensemble, décrits dans un seul fichier (`docker-compose.yml`). |
| **Image Docker** | Le "plan de montage" figé d'un conteneur (construit une fois, puis démarré). Reconstruire l'image = intégrer le nouveau code. |
| **Variable d'environnement** | Un réglage (souvent un secret : mot de passe, clé d'API) donné à l'application au démarrage, sans être écrit dans le code. |
| **Migration** | Une modification de la structure de la base de données (ex : ajouter une colonne), appliquée automatiquement à chaque démarrage. |
| **Git / `git pull`** | Le système de gestion du code source. `git pull` télécharge la dernière version du code sur le serveur. |
| **Reverse proxy** | Le "standard téléphonique" qui reçoit toutes les requêtes du site et les redirige vers le bon conteneur (ici : Caddy). |
| **Health check** | Une vérification automatique que l'application répond bien ("est-elle vivante ?"). |
| **Rollback** | Revenir en arrière à la version précédente après un déploiement raté. |

## 4. Informations d'accès (à compléter par vous)

> ⚠️ Si ce dépôt Git est **public** ou partagé largement, ne remplissez **pas** les valeurs sensibles directement ici. Conservez-les dans un gestionnaire de mots de passe d'équipe et laissez juste une référence ("voir coffre-fort équipe X").

| Information | Valeur |
|---|---|
| Adresse du VPS (IP) | `<À REMPLIR>` |
| Nom d'utilisateur SSH | `<À REMPLIR>` (souvent `root` ou `deploy`) |
| Méthode de connexion | `<mot de passe / clé SSH — préciser où trouver la clé>` |
| Dossier du projet sur le VPS | `/opt/navettexpress` |
| Nom de domaine | `navettexpress.com` / `www.navettexpress.com` |
| Hébergeur / fournisseur DNS | `<À REMPLIR>` |
| Où est stocké `.env.docker` de prod (sauvegarde) | `<À REMPLIR — ex : coffre-fort partagé>` |

## 5. Pré-requis avant de commencer

1. **Un accès SSH au VPS** (adresse IP + identifiants — chapitre 4).
2. **Un terminal sur votre ordinateur** :
   - **Windows** : ouvrir "Terminal" ou "PowerShell" (déjà installés, pas besoin de PuTTY).
   - **Mac/Linux** : l'application "Terminal".
3. Se connecter une première fois pour vérifier l'accès :

```bash
ssh UTILISATEUR@ADRESSE_IP_DU_VPS
```

Remplacez `UTILISATEUR` et `ADRESSE_IP_DU_VPS` par les valeurs du chapitre 4. Si c'est la première connexion, tapez `yes` quand on vous demande de confirmer l'empreinte du serveur.

4. Une fois connecté, vérifiez que Docker est bien installé sur le serveur :

```bash
docker --version
docker compose version
```

Les deux commandes doivent afficher un numéro de version (pas d'erreur "command not found"). **Important : la commande est `docker compose` (avec un espace)**, pas `docker-compose` (avec un tiret) — cette dernière n'est pas installée sur ce VPS.

## 6. Installation initiale complète (une seule fois)

> Ce chapitre ne sert que si le VPS part de zéro (nouveau serveur) ou en cas de reconstruction complète. Pour une mise à jour normale, allez directement au [chapitre 7](#7-redéploiement--mettre-en-ligne-une-nouvelle-version-du-code).

**Étape 1 — Se connecter au VPS**

```bash
ssh UTILISATEUR@ADRESSE_IP_DU_VPS
```

**Étape 2 — Récupérer le code du projet**

```bash
sudo mkdir -p /opt/navettexpress
sudo chown $USER:$USER /opt/navettexpress
cd /opt/navettexpress
git clone <URL_DU_DÉPÔT_GIT> .
```

**Étape 3 — Créer le fichier de configuration secrète**

Ce fichier n'existe pas dans le dépôt Git (il contient des secrets, il ne doit jamais y être) : il faut le créer directement sur le VPS, à la main, avec l'éditeur `nano` :

```bash
nano .env.docker
```

`nano` est un petit éditeur de texte dans le terminal. Tapez-y (ou collez-y) une ligne `VARIABLE=valeur` par variable, en vous basant sur le tableau complet du [chapitre 8](#8-variables-denvironnement) — au minimum les 4 variables marquées "✅ Oui". Une fois terminé, appuyez sur `Ctrl+O` (sauver) puis `Entrée`, puis `Ctrl+X` (quitter).

Générez un `NEXTAUTH_SECRET` fort avec :

```bash
openssl rand -base64 32
```

Copiez le résultat dans la ligne `NEXTAUTH_SECRET=` du fichier `.env.docker`.

**Étape 4 — Démarrer toute la stack**

```bash
docker compose up -d --build
```

Cette commande télécharge/construit les images puis démarre les 3 conteneurs en arrière-plan (`-d`). La première fois, cela peut prendre plusieurs minutes (construction de l'image `app`).

**Étape 5 — Vérifier que tout tourne**

```bash
docker compose ps
```

Les 3 services (`app`, `postgres`, `caddy`) doivent apparaître avec un statut `Up` (et `healthy` pour `postgres`/`app` après ~30 secondes).

Puis suivez le [chapitre 11 — Vérifications après un déploiement](#11-vérifications-après-un-déploiement-checklist).

**Étape 6 — DNS**

Assurez-vous que le domaine (`navettexpress.com` et `www.navettexpress.com`) pointe bien, chez votre registrar/DNS, vers l'adresse IP du VPS (enregistrement de type `A`). Sans cela, Caddy ne pourra pas obtenir de certificat HTTPS valide.

## 7. Redéploiement — mettre en ligne une nouvelle version du code

C'est l'opération que vous ferez **le plus souvent**, à chaque fois qu'une nouvelle fonctionnalité ou un correctif a été validé et doit passer en production.

**Étape 1 — Se connecter au VPS et se placer dans le dossier du projet**

```bash
ssh UTILISATEUR@ADRESSE_IP_DU_VPS
cd /opt/navettexpress
```

**Étape 2 — Noter la version actuelle (filet de sécurité pour un rollback)**

```bash
git log -1 --oneline
```

Notez quelque part (bloc-notes, message à vous-même) le code affiché (ex : `0ecee39 feat: ...`). C'est le point auquel revenir si le déploiement se passe mal — voir [chapitre 13](#13-rollback--annuler-un-déploiement-raté).

**Étape 3 — (Recommandé si la mise à jour touche la base de données) faire une sauvegarde**

```bash
./scripts/backup.sh
```

Voir [chapitre 10](#10-sauvegarde-et-restauration-de-la-base-de-données). Dans le doute, faites-la systématiquement : elle ne prend que quelques secondes et ne perturbe pas le service.

**Étape 4 — Récupérer le nouveau code**

```bash
git pull origin main
```

**Étape 5 — Reconstruire et redémarrer l'application**

```bash
docker compose build app
docker compose up -d app
```

> `.env.docker` n'est **jamais** touché par `git pull` (il n'est pas suivi par Git) : vos secrets de production sont donc en sécurité lors d'une mise à jour. En revanche, si la nouvelle version du code introduit une **nouvelle variable d'environnement obligatoire**, il faut l'ajouter manuellement dans `.env.docker` **avant** cette étape (voir [chapitre 14](#14-journal-des-évolutions-nécessitant-une-configuration) qui doit lister ces cas).

**Étape 6 — Suivre le démarrage**

```bash
docker compose logs -f app
```

Vous devez voir successivement : `Base de données prête!`, puis `Migrations appliquées` (ou `Migrations ignorées` si désactivées), puis le serveur Next.js qui démarre. Appuyez sur `Ctrl+C` pour arrêter l'affichage des logs (cela n'arrête pas l'application).

**Étape 7 — Vérifier**

Passez au [chapitre 11 — Vérifications après un déploiement](#11-vérifications-après-un-déploiement-checklist). Si quelque chose ne va pas, allez au [chapitre 12 — Rollback](#12-rollback--annuler-un-déploiement-raté) ou au [chapitre 13 — Pannes courantes](#13-pannes-courantes-et-comment-les-résoudre).

**Raccourci : script tout-en-un**

Les étapes 2 à 6 ci-dessus (sauvegarde, `git pull`, build, redémarrage, vérification santé) sont automatisées dans [`scripts/deploy.sh`](../scripts/deploy.sh), qui applique aussi les migrations explicitement juste après le `git pull` — avant même de reconstruire l'image — pour échouer vite (et sans avoir gaspillé un build) si une migration casse ; le conteneur `app` les réappliquera de toute façon à son démarrage (voir chapitre 9), cette étape ne fait qu'avancer le moment où un problème est détecté. Une fois à l'aise avec le détail des étapes manuelles, vous pouvez simplement lancer :

```bash
cd /opt/navettexpress
./scripts/deploy.sh
```

Le script affiche le commit précédent (à noter pour un rollback éventuel), fait la sauvegarde, récupère le code, reconstruit et redémarre l'application, puis vérifie l'endpoint de santé. Il s'arrête et affiche un message d'erreur clair si une étape échoue — dans ce cas, reportez-vous au [chapitre 13](#13-pannes-courantes-et-comment-les-résoudre).

Pour déployer une autre branche que `main` : `./scripts/deploy.sh nom-de-la-branche`.

> Ce script ne remplace pas votre jugement : si la nouvelle version ajoute une variable d'environnement obligatoire, il faut toujours l'ajouter à la main dans `.env.docker` **avant** de lancer `deploy.sh` (voir chapitre 14).

## 8. Variables d'environnement

Toutes les variables ci-dessous se règlent dans le fichier **`.env.docker`** sur le VPS, créé à la main (voir [chapitre 6, étape 3](#6-installation-initiale-complète-une-seule-fois)) — ce fichier ne doit **jamais** être ajouté à Git, car il contient des secrets.

| Variable | Obligatoire ? | Sert à | Où l'obtenir |
|---|---|---|---|
| `NEXTAUTH_SECRET` | ✅ Oui | Sécuriser les sessions de connexion | Générée localement (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ Oui | URL publique HTTPS du site | À définir (ex : `https://www.navettexpress.com`) |
| `NEXT_PUBLIC_APP_URL` | ✅ Oui | URL publique utilisée côté navigateur | Identique à `NEXTAUTH_URL` |
| `DATABASE_URL` | ✅ Oui | Connexion à la base PostgreSQL | Construite automatiquement (service `postgres` du docker-compose) |
| `RUN_MIGRATIONS` | Non (défaut `true`) | Active/désactive les migrations auto au démarrage | — |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Recommandé | Connexion "Se connecter avec Google" | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `RESEND_API_KEY` | Recommandé | Envoi des emails (confirmations, factures...) | [resend.com/api-keys](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL` | Recommandé | Adresse d'expédition des emails | Adresse vérifiée dans Resend |
| `ADMIN_EMAIL` | Recommandé | Destinataire des notifications internes | Adresse email de l'équipe |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` / `NEXT_PUBLIC_CLOUDINARY_API_KEY` / `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` / `CLOUDINARY_API_SECRET` | Recommandé | Upload et hébergement des photos (véhicules, profils) | [console.cloudinary.com](https://console.cloudinary.com) — ⚠️ `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` et `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` sont figées dans le bundle client au **build** (voir note ci-dessous), pas seulement au runtime |
| `ANTHROPIC_API_KEY` | Optionnel | Assistant IA de l'espace admin | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| `NEXT_PUBLIC_GA_ID` | Optionnel | Statistiques Google Analytics | [Google Analytics](https://analytics.google.com) |
| `GESKAP_API_KEY` | Recommandé (WhatsApp) | Envoi des notifications WhatsApp via Geskap | Console Geskap, une fois le compte créé |
| `GESKAP_API_BASE_URL` | Non (défaut `https://api-meta.geskap.com`) | Domaine de l'API Geskap | Console Geskap |
| `GESKAP_WEBHOOK_SECRET` | Recommandé (WhatsApp) | Vérifie la signature HMAC du webhook entrant `/api/webhooks/geskap` | Console Geskap, au moment de configurer le webhook |
| `GESKAP_ADMIN_PHONE` | Recommandé (WhatsApp) | Numéro WhatsApp admin recevant les notifications internes | — |
| `WHATSAPP_REMINDER_LEAD_MINUTES` | Non (défaut `60`) | Délai avant départ pour le rappel WhatsApp | — |
| `CRON_SECRET` | ✅ Oui (crons internes) | Sécurise `/api/ads/expire` et `/api/cron/whatsapp-reminders` (en-tête `x-cron-secret`) | Générée localement |

**Après toute modification de `.env.docker`, il faut redémarrer le conteneur `app` pour que ce soit pris en compte :**

```bash
docker compose up -d app
```

> ⚠️ **Exception : les variables `NEXT_PUBLIC_*`** (ex. `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GA_ID`) sont figées dans le bundle JavaScript côté navigateur **au moment du `npm run build`**, pas au démarrage du conteneur. Un simple `docker compose up -d app` après les avoir ajoutées/modifiées dans `.env.docker` ne suffit **pas** — il faut relancer un build complet (`./scripts/deploy.sh` s'en charge automatiquement en exportant `.env.docker` avant `docker compose build app` ; en manuel : `set -a && source .env.docker && set +a && docker compose build app && docker compose up -d app`).

## 9. Migrations de base de données

À chaque démarrage du conteneur `app`, le script [`start.sh`](../start.sh) applique automatiquement les migrations de base de données en attente (sauf si `RUN_MIGRATIONS=false` dans `.env.docker`).

> ⚠️ **Point de vigilance connu sur ce projet** : l'outil de migration (`drizzle-kit`) a déjà, par le passé, affiché le message rassurant `migrations applied successfully` **sans avoir réellement appliqué le changement** à la base (table ou colonne manquante malgré le message). **Ne faites donc jamais une confiance aveugle à ce message après une mise à jour qui modifie la base de données.**

**Comment vérifier qu'une migration a réellement été appliquée**, après un déploiement qui ajoute une table ou une colonne (remplacez `nom_de_la_table` par le nom réel) :

```bash
docker compose exec postgres psql -U navettexpress_user -d navettexpress -c "\d nom_de_la_table"
```

Si la commande répond `Did not find any relation named "nom_de_la_table"` ou que la colonne attendue n'apparaît pas dans la liste, la migration n'a pas réellement été appliquée malgré un éventuel message de succès dans les logs.

**Si une migration doit être appliquée manuellement** (fichier `.sql` dans le dossier `migrations/`) :

```bash
docker compose exec -T postgres psql -U navettexpress_user -d navettexpress < migrations/NOM_DU_FICHIER.sql
```

**Pour lancer les migrations manuellement sans redémarrer toute l'application** (utile si `RUN_MIGRATIONS=false`) :

```bash
docker compose exec app node scripts/run-migrations.mjs
```

En cas de doute ou de blocage sur une migration, faites une [sauvegarde](#11-sauvegarde-et-restauration-de-la-base-de-données) avant toute intervention manuelle sur la base.

## 10. Sauvegarde et restauration de la base de données

**Sauvegarder** (à faire avant chaque redéploiement qui touche la base, et idéalement tous les jours automatiquement — voir chapitre 16) :

```bash
mkdir -p /opt/navettexpress/backups
docker compose exec -T postgres pg_dump -U navettexpress_user navettexpress | gzip > /opt/navettexpress/backups/navettexpress_$(date +%Y%m%d_%H%M%S).sql.gz
```

Cela crée un fichier compressé horodaté dans `/opt/navettexpress/backups/`. Le script [`scripts/backup.sh`](../scripts/backup.sh) fait exactement cette commande (et ne garde automatiquement que les 2 sauvegardes les plus récentes, réglable via `RETENTION_COUNT`) — vous pouvez utiliser `./scripts/backup.sh` à la place.

**Automatiser la sauvegarde quotidienne** (à faire une fois sur le VPS) :

```bash
./scripts/setup-backup-cron.sh
```

Cela programme `scripts/backup.sh` pour s'exécuter chaque nuit à 3h (heure du serveur) et journalise son résultat dans `backups/backup.log`. Vérifier que la tâche est bien enregistrée avec `crontab -l`. Pour changer l'heure : `BACKUP_HOUR=2 ./scripts/setup-backup-cron.sh`.

**Vérifier qu'une sauvegarde n'est pas vide** (réflexe à prendre) :

```bash
ls -lh /opt/navettexpress/backups/ | tail -5
```

Une sauvegarde saine fait généralement plusieurs centaines de Ko au minimum (pas 0 octet).

**Restaurer une sauvegarde** (⚠️ ceci **remplace entièrement** le contenu actuel de la base — à utiliser uniquement en cas de besoin réel, après avoir si possible sauvegardé l'état actuel malgré tout) :

```bash
gunzip -c /opt/navettexpress/backups/NOM_DU_FICHIER.sql.gz | docker compose exec -T postgres psql -U navettexpress_user -d navettexpress
```

## 11. Vérifications après un déploiement (checklist)

À faire systématiquement après une installation initiale ou un redéploiement :

1. **Conteneurs bien démarrés :**
   ```bash
   docker compose ps
   ```
   → les 3 services en `Up`, sans redémarrages en boucle (`Restarting`).

2. **L'application répond en interne :**
   ```bash
   docker compose exec app wget -qO- http://127.0.0.1:3000/api/health
   ```
   → doit répondre `{"status":"ok", ...}`.

3. **Le site répond en HTTPS depuis l'extérieur :** ouvrir `https://www.navettexpress.com` dans un navigateur (idéalement en navigation privée, pour éviter le cache).

4. **Le certificat HTTPS est valide** (cadenas vert dans le navigateur, pas d'avertissement de sécurité).

5. **Connexion utilisateur** : se connecter avec un compte de test (email/mot de passe, puis Google si configuré).

6. **Un parcours métier critique** : faire une réservation de test de bout en bout (ou consulter une réservation existante).

7. **Emails** : vérifier qu'un email transactionnel récent est bien parti (table `notification_queue` en base, ou boîte mail réelle).

8. **Logs sans erreur bloquante :**
   ```bash
   docker compose logs --tail=100 app
   ```

Si l'un de ces points échoue, consultez le [chapitre 13 — Pannes courantes](#13-pannes-courantes-et-comment-les-résoudre).

## 12. Rollback — annuler un déploiement raté

Si après un redéploiement ([chapitre 7](#7-redéploiement--mettre-en-ligne-une-nouvelle-version-du-code)) quelque chose ne va pas et ne peut pas être corrigé rapidement :

**Étape 1 — Revenir au code de la version précédente** (remplacez `CODE_NOTÉ` par le code noté à l'étape 2 du chapitre 7, ex. `0ecee39`) :

```bash
cd /opt/navettexpress
git checkout CODE_NOTÉ
```

**Étape 2 — Reconstruire et redémarrer avec cette ancienne version :**

```bash
docker compose build app
docker compose up -d app
```

**Étape 3 — Revenir sur la branche principale une fois le correctif prêt à être redéployé normalement :**

```bash
git checkout main
```

> ⚠️ Un rollback du **code** ne défait pas automatiquement une migration de base de données déjà appliquée (ex : une colonne ajoutée reste ajoutée). Si le problème vient d'une migration, la solution la plus sûre est de [restaurer la sauvegarde](#10-sauvegarde-et-restauration-de-la-base-de-données) prise juste avant le déploiement, plutôt que d'essayer d'annuler la migration à la main.

## 13. Pannes courantes et comment les résoudre

### L'application redémarre en boucle (`Restarting` dans `docker compose ps`)

```bash
docker compose logs --tail=100 app
```
Cause la plus fréquente : `DATABASE_URL` absent ou invalide dans `.env.docker`, ou une variable obligatoire manquante après l'ajout d'une fonctionnalité (voir [chapitre 14](#14-journal-des-évolutions-nécessitant-une-configuration)). Corrigez `.env.docker` puis `docker compose up -d app`.

### Le site affiche une erreur 502/503/504 (Bad Gateway)

Le conteneur `app` est probablement arrêté ou en train de démarrer. Vérifiez :
```bash
docker compose ps
docker compose logs --tail=50 app
```

### Pas de certificat HTTPS / erreur "connexion non sécurisée"

- Vérifiez que le DNS du domaine pointe bien vers l'IP du VPS (`nslookup navettexpress.com`).
- Vérifiez que les ports 80 et 443 sont bien ouverts sur le pare-feu du VPS.
- Consultez les logs de Caddy :
  ```bash
  docker compose logs --tail=100 caddy
  ```

### La base de données est inaccessible ("connection refused", "ECONNREFUSED")

```bash
docker compose ps postgres
docker compose logs --tail=50 postgres
```
Vérifiez que le service est `healthy`. Si `postgres` vient de redémarrer après une panne serveur, patientez ~30 secondes (démarrage + vérification de santé) avant de redémarrer `app`.

### Une migration semble ne pas s'être appliquée malgré un message de succès

Voir la procédure de vérification manuelle au [chapitre 9](#9-migrations-de-base-de-données).

### Les emails ne partent pas

- Vérifiez `RESEND_API_KEY` et `RESEND_FROM_EMAIL` dans `.env.docker`.
- Les envois passent par une file d'attente avec réessais automatiques (`notification_queue`, jusqu'à 6 tentatives sur ~12h). Un échec ponctuel se corrige souvent tout seul ; regardez les logs de l'application pour une erreur explicite de l'API Resend (clé invalide, expéditeur non vérifié).

### Le disque du VPS se remplit (images Docker accumulées au fil des déploiements)

```bash
df -h /
docker system df
```
Pour nettoyer les images/conteneurs Docker inutilisés (sans toucher aux volumes de données, donc sans risque pour la base) :
```bash
docker image prune -af
```

### "no such service" en tapant une commande `docker compose ...`

Vous avez probablement utilisé le nom du **conteneur** (ex : `navettexpress_app`) au lieu du nom du **service** dans `docker-compose.yml` (ex : `app`). Les commandes `docker compose build/up/logs/exec` attendent toujours le nom de service (`app`, `postgres`, `caddy`).

## 14. Journal des évolutions nécessitant une configuration

**Règle à appliquer pour toute nouvelle fonctionnalité qui ajoute une variable d'environnement, un service externe ou une dépendance de déploiement : ajouter une ligne ici, ET mettre à jour le tableau du [chapitre 8](#8-variables-denvironnement).**

| Date | Fonctionnalité | Ce qui a changé | Action requise en prod |
|---|---|---|---|
| 2026-08-24 | Abandon de Coolify | Déploiement direct VPS via `docker compose` | Utiliser ce guide, plus les anciens guides Coolify (marqués obsolètes) |
| ~2026-08 | File de notifications (email/WhatsApp) avec réessais | Table `notification_queue`, worker démarré dans `src/instrumentation.ts` | Obsolète pour le canal WhatsApp — voir la ligne du 2026-08-29 |
| 2026-08-21 | Notifications WhatsApp (OpenWA) | Nouveau conteneur `openwa` + 4 variables (`OPENWA_*`, `ADMIN_WHATSAPP_NUMBER`) | **Obsolète — service retiré le 2026-08-29, voir ligne ci-dessous.** (le rattachement prod n'avait jamais été fait) |
| 2026-08-28 | Rédaction de ce guide | — | — |
| 2026-08-29 | Retrait du service WhatsApp (OpenWA) | Numéro associé bloqué par Meta. Conteneur `openwa` et volume `openwa_data` retirés de `docker-compose.yml` ; `src/lib/whatsapp.ts` supprimé ; les 4 variables `OPENWA_*`/`ADMIN_WHATSAPP_NUMBER` ne sont plus lues ; les 2 notifications admin qui n'avaient pas d'équivalent email (refus chauffeur, annulation client) ont reçu un équivalent email (`sendBookingRejectedByDriverEmail`, `sendBookingCancelledByClientEmail` dans `src/lib/resend-mailer.ts`) | Sur le VPS : `docker compose up -d` recrée la stack sans `openwa` ; retirer les 4 variables `OPENWA_*`/`ADMIN_WHATSAPP_NUMBER` de `.env.docker` (facultatif, elles sont simplement ignorées sinon) ; supprimer manuellement le volume `openwa_data` si l'espace disque doit être récupéré (`docker volume rm navettexpress_openwa_data` — vérifier d'abord `docker volume ls`) |
| 2026-08-29 | Notifications WhatsApp (Geskap, API Cloud officielle Meta) | Nouveau webhook entrant `/api/webhooks/geskap`, cron `/api/cron/whatsapp-reminders`, 6 nouvelles variables (`GESKAP_API_KEY`, `GESKAP_API_BASE_URL`, `GESKAP_WEBHOOK_SECRET`, `GESKAP_ADMIN_PHONE`, `WHATSAPP_REMINDER_LEAD_MINUTES`, `CRON_SECRET`), migration `0021` (colonne `bookings.whatsapp_reminder_sent_at`). Voir [docs/GESKAP_WHATSAPP.md](GESKAP_WHATSAPP.md) | Ajouter les 6 variables dans `.env.docker` sur le VPS (voir chapitre 8) ; configurer le webhook Geskap sur `https://navettexpress.com/api/webhooks/geskap` ; programmer le cron de rappel (`*/15 * * * * curl -s -X POST https://navettexpress.com/api/cron/whatsapp-reminders -H "x-cron-secret: $CRON_SECRET"`) ; redémarrer `app` après ajout des variables |
| 2026-08-28 | Automatisation du déploiement/sauvegarde | Ajout de `scripts/deploy.sh`, `scripts/setup-backup-cron.sh`, purge auto dans `scripts/backup.sh`, `.github/workflows/deploy.yml`, port PostgreSQL restreint à `127.0.0.1` | Sur le VPS : lancer `./scripts/setup-backup-cron.sh` une fois après le prochain déploiement. Dans GitHub : configurer les secrets `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY` si le déploiement en un clic est souhaité (chapitre 16) |
| 2026-08-28 | Surveillance externe | Compte UptimeRobot créé, moniteur HTTP(s) sur `/api/health` (5 min, alerte email) | Aucune — fait |
| 2026-08-28 | Sauvegarde planifiée activée en prod | `./scripts/setup-backup-cron.sh` exécuté sur le VPS | Aucune — fait |
| 2026-08-28 | Restriction du port PostgreSQL appliquée en prod | `docker compose up -d postgres` relancé sur le VPS, conteneur recréé et `Running` | Aucune — fait |
| 2026-08-28 | Déploiement en un clic mis en route | Secrets GitHub configurés ; remote Git du VPS passé de SSH à HTTPS (`git@github.com:...` → `https://github.com/...`, dépôt public, pas besoin de clé de déploiement) ; `command_timeout` de l'étape SSH porté à 30m dans `.github/workflows/deploy.yml` (le build seul prend ~7 min) | Aucune — fait, workflow testé avec succès |
| 2026-08-30 | Champ upload photo ajouté au formulaire véhicule admin | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` et `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` sont désormais passées en build-args (`Dockerfile` + `docker-compose.yml`), et `scripts/deploy.sh` les exporte depuis `.env.docker` avant `docker compose build app` — ces variables `NEXT_PUBLIC_*` sont figées au build, `env_file` seul (runtime) ne suffisait pas | Vérifier que `.env.docker` sur le VPS contient bien `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` et `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (voir chapitre 8), puis redéployer via `./scripts/deploy.sh` (rebuild complet nécessaire, pas juste un restart) |

## 15. Sécurité de base

- **Ne jamais** committer `.env`, `.env.docker` ou tout fichier contenant un secret dans Git (déjà exclus par `.gitignore` — ne pas forcer leur ajout avec `git add -f`).
- Changer `NEXTAUTH_SECRET` et le mot de passe PostgreSQL par des valeurs uniques en production (ne jamais réutiliser les valeurs par défaut du fichier modèle ou celles utilisées en développement local).
- Limiter l'accès SSH au VPS aux personnes qui en ont réellement besoin ; privilégier une connexion par clé SSH plutôt que par mot de passe si possible.
- Garder le VPS à jour (`sudo apt update && sudo apt upgrade`, régulièrement).
- Le port PostgreSQL (5432) est restreint à `127.0.0.1` dans `docker-compose.yml` (non accessible depuis internet) — au prochain déploiement, `docker compose up -d postgres` recrée le conteneur avec cette restriction si ce n'est pas déjà fait.

## 16. Améliorations appliquées et actions restantes

### Déjà fait (présent dans le dépôt, rien à coder)

- **Sauvegardes automatiques** : [`scripts/backup.sh`](../scripts/backup.sh) purge désormais lui-même les sauvegardes au-delà des 2 plus récentes (capacité disque limitée du VPS), et [`scripts/setup-backup-cron.sh`](../scripts/setup-backup-cron.sh) programme son exécution quotidienne (chapitre 10).
- **Port PostgreSQL restreint** : `docker-compose.yml` n'expose plus PostgreSQL que sur `127.0.0.1` (chapitre 15).
- **Script de déploiement tout-en-un** : [`scripts/deploy.sh`](../scripts/deploy.sh) enchaîne sauvegarde, `git pull`, build, redémarrage et vérification de santé (chapitre 7).
- **Déploiement en un clic (CI/CD manuel)** : [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml), déclenchable depuis l'onglet "Actions" de GitHub — voir mise en route ci-dessous.
- **Nettoyage des documents obsolètes** : les anciens guides Coolify / scripts VPS inexistants (`DEPLOYMENT_COOLIFY.md`, `COOLIFY_DEPLOYMENT_FIX.md`, `COOLIFY_DEPLOYMENT_READY.md`, `DEPLOYMENT_MANUAL_VPS.md`, `PRODUCTION_GO_LIVE_CHECKLIST.md`, `MIGRATION_GUIDE.md`, `MIGRATION_README.md`) ont été supprimés ; `GUIDE_DEPLOIEMENT_DEV_PROD.md` a été nettoyé de sa partie Coolify obsolète (sa partie Dev local/Android reste valable).
- **Surveillance externe (uptime monitoring)** : compte UptimeRobot créé le 2026-08-28, moniteur HTTP(s) actif sur `https://www.navettexpress.com/api/health` (intervalle 5 minutes, alerte email configurée).
- **Sauvegarde planifiée activée en prod** : `./scripts/setup-backup-cron.sh` exécuté sur le VPS le 2026-08-28 (vérifié avec `crontab -l`).
- **Restriction du port PostgreSQL appliquée en prod** : `docker compose up -d postgres` relancé sur le VPS le 2026-08-28, conteneur `navettexpress_db` recréé et `Running` avec la configuration restreinte à `127.0.0.1`.
- **Déploiement en un clic opérationnel** : secrets `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY` configurés le 2026-08-28 avec une clé dédiée, workflow testé avec succès de bout en bout depuis l'onglet Actions de GitHub.

### Actions restantes — à faire une seule fois, sur le serveur ou les comptes externes

Je n'ai pas d'accès direct au VPS ni à votre compte GitHub : ces étapes ne peuvent pas être appliquées depuis le dépôt de code, il faut les exécuter vous-même (ou lors du prochain redéploiement).

1. ~~Activer la sauvegarde planifiée~~ — **fait le 2026-08-28** (voir "Déjà fait" ci-dessus).
2. ~~Appliquer la restriction du port PostgreSQL~~ — **fait le 2026-08-28** (voir "Déjà fait" ci-dessus).
3. ~~Activer le déploiement en un clic depuis GitHub~~ — **fait le 2026-08-28** (voir "Déjà fait" ci-dessus, et procédure de mise en route conservée ci-dessous pour référence/reproduction future — ex. si la clé doit être régénérée).

   a. **Générer une paire de clés SSH dédiée** (sur votre ordinateur, **pas** sur le VPS, et **pas** votre clé personnelle) :

      ```bash
      ssh-keygen -t ed25519 -f ./navettexpress_deploy -N "" -C "github-actions-deploy-navettexpress"
      ```

      `-N ""` crée la clé **sans mot de passe** (obligatoire ici : GitHub Actions doit pouvoir s'en servir seule, sans qu'on tape une phrase de passe). C'est justement pour ça que cette clé doit être **dédiée** à cet usage et n'avoir aucun autre droit que celui de lancer `scripts/deploy.sh`. Cette commande crée deux fichiers : `navettexpress_deploy` (la clé **privée**, secrète) et `navettexpress_deploy.pub` (la clé **publique**, sans risque à partager).

   b. **Ajouter la clé publique au VPS** — copiez le contenu de `navettexpress_deploy.pub`, connectez-vous au VPS, et ajoutez-la aux clés autorisées :

      ```bash
      mkdir -p ~/.ssh && chmod 700 ~/.ssh
      echo "CONTENU_DE_navettexpress_deploy.pub" >> ~/.ssh/authorized_keys
      chmod 600 ~/.ssh/authorized_keys
      ```

      > Si `docker compose up -d` échoue avec `unable to authenticate ... no supported methods remain`, vérifiez d'abord avec `cat ~/.ssh/authorized_keys` que la clé est bien là, sur une seule ligne, et dans le `authorized_keys` du **même utilisateur** que celui mis dans `VPS_USER` (pas un autre compte du VPS).

   c. **Ajouter les secrets dans GitHub** : dans GitHub → *Settings* → *Secrets and variables* → *Actions* → *Repository secrets* (pas la section "Environment secrets", inutile ici puisque le workflow ne référence aucun `environment:`), ajouter `VPS_HOST` (IP du serveur), `VPS_USER` (utilisateur SSH) et `VPS_SSH_KEY` (le contenu **complet** du fichier `navettexpress_deploy`, la clé **privée** — jamais la `.pub`).

   d. **Supprimer la clé privée de votre ordinateur** une fois copiée dans GitHub (elle n'a plus besoin d'y rester : `rm ./navettexpress_deploy ./navettexpress_deploy.pub`).

   e. **Le remote Git sur le VPS doit être en HTTPS, pas en SSH** — le dépôt étant public, `git pull` fonctionne sans authentification via HTTPS, alors qu'un remote `git@github.com:...` échoue avec `Permission denied (publickey)` (le VPS n'a pas de clé enregistrée côté GitHub, et n'en a pas besoin). Si `git remote -v` sur le VPS affiche une URL `git@github.com:...`, corrigez avec :

      ```bash
      cd /opt/navettexpress
      git remote set-url origin https://github.com/dakcarsbcenter/navetteXpress.git
      ```

   Ensuite, dans l'onglet *Actions* du dépôt GitHub, le workflow "Déploiement production (VPS)" peut être lancé manuellement (bouton *Run workflow*) — il exécute exactement `scripts/deploy.sh` sur le serveur. Le build de l'image (`npm run build`) prenant plusieurs minutes, le `command_timeout` de l'étape SSH dans `.github/workflows/deploy.yml` est réglé à 30 minutes — à augmenter si le build venait à durer plus longtemps.
4. ~~Mettre en place une surveillance externe (uptime monitoring)~~ — **fait le 2026-08-28** (voir "Déjà fait" ci-dessus).
5. ~~Décider d'un environnement de pré-production (staging)~~ — **décision prise le 2026-08-28 : pas nécessaire pour l'instant.** À reconsidérer plus tard si le besoin se présente (ex. tests risqués avant une mise en prod, équipe plus grande).

> Toutes les actions de ce chapitre sont désormais réalisées. Chaque fois qu'une **nouvelle** évolution nécessite une action en prod, notez-la dans le [chapitre 14](#14-journal-des-évolutions-nécessitant-une-configuration) pour que ce guide reste le reflet fidèle de l'état réel.
