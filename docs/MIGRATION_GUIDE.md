# Migration de Neon vers PostgreSQL Coolify

## Guide de Migration de Base de Données

Ce guide vous aide à migrer vos données de Neon vers votre nouvelle instance PostgreSQL sur Coolify.

## Prérequis

- ✅ PostgreSQL Coolify déployé et accessible
- ✅ DATABASE_URL Coolify configuré dans `.env.production`
- ✅ Accès à l'ancienne base Neon
- ✅ `pg_dump` et `psql` installés localement (ou Docker avec postgres)

## Méthode 1 : Export/Import SQL complet (Recommandé)

### Étape 1 : Exporter les données depuis Neon

```bash
# Définir les variables
$env:NEON_URL = "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
$env:COOLIFY_URL = "postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@db-navettexpress:5432/postgres"

# Exporter depuis Neon (données uniquement, sans schéma)
pg_dump $env:NEON_URL --data-only --no-owner --no-privileges --format=plain -f neon_data_backup.sql

# Ou exporter TOUT (schéma + données) si vous voulez une copie complète
pg_dump $env:NEON_URL --format=plain --no-owner --no-privileges -f neon_full_backup.sql
```

### Étape 2 : Créer le schéma dans Coolify avec Drizzle

```bash
# Utiliser la nouvelle base Coolify
$env:DATABASE_URL = "postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@db-navettexpress:5432/postgres"

# Générer et appliquer les migrations Drizzle
npm run db:push
```

### Étape 3 : Importer les données dans Coolify

```bash
# Importer les données
psql $env:COOLIFY_URL -f neon_data_backup.sql

# Ou si vous avez exporté le schéma complet, assurez-vous que le schéma existe d'abord
# psql $env:COOLIFY_URL -f neon_full_backup.sql
```

### Étape 4 : Vérifier l'import

```bash
# Connexion à Coolify PostgreSQL
psql $env:COOLIFY_URL

# Lister les tables
\dt

# Compter les enregistrements dans les tables principales
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes;

# Quitter
\q
```

---

## Méthode 2 : Script Node.js de Migration

Si vous n'avez pas `pg_dump` localement, utilisez le script Node.js fourni (`migrate-db.js`).

```bash
# Installer les dépendances si nécessaire
npm install pg dotenv

# Lancer la migration
node scripts/migrate-db.js
```

---

## Méthode 3 : Drizzle Studio (Interface Visuelle)

```bash
# 1. Connecter à Neon
$env:DATABASE_URL = "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
npm run db:studio
# Naviguer vers https://local.drizzle.studio et exporter les données manuellement

# 2. Connecter à Coolify
$env:DATABASE_URL = "postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@db-navettexpress:5432/postgres"
npm run db:push  # Créer le schéma
npm run db:studio  # Importer les données manuellement
```

---

## Post-Migration

### 1. Mettre à jour `.env.production` dans Coolify

Dans Coolify → Settings → Environment Variables :
```bash
DATABASE_URL=postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@db-navettexpress:5432/postgres
```

### 2. Redéployer l'application

Depuis Coolify, déclenchez un nouveau déploiement pour que l'app utilise la nouvelle DB.

### 3. Tester l'application

- Connexion utilisateur
- Création de réservation
- Dashboard admin
- Statistiques

---

## Résolution de problèmes

### Erreur : "relation does not exist"
```bash
# Le schéma n'a pas été créé. Relancer :
$env:DATABASE_URL = "postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@db-navettexpress:5432/postgres"
npm run db:push
```

### Erreur : "duplicate key value violates unique constraint"
```bash
# Des données existent déjà. Nettoyer d'abord :
psql $env:COOLIFY_URL
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q

# Puis recommencer la migration
```

### Erreur de connexion à Coolify
```bash
# Vérifier que db-navettexpress est accessible
# Si vous êtes en local, vous devez utiliser l'IP publique ou tunnel SSH

# Alternative : utiliser l'IP publique de Coolify
$env:COOLIFY_URL = "postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@votre-ip-coolify:5432/postgres"
```

---

## Rollback (si nécessaire)

Si la migration échoue, revenez à Neon en mettant à jour `DATABASE_URL` dans Coolify :

```bash
DATABASE_URL=postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

---

## Checklist finale

- [ ] Export Neon réussi
- [ ] Schéma créé dans Coolify (`npm run db:push`)
- [ ] Données importées dans Coolify
- [ ] Nombre d'enregistrements vérifié
- [ ] `DATABASE_URL` mis à jour dans Coolify
- [ ] Application redéployée
- [ ] Tests de connexion réussis
- [ ] Backup Neon conservé pendant 7 jours minimum

---

## Commandes rapides (Copier-Coller)

### Export depuis Neon
```powershell
$env:NEON_URL = "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
pg_dump $env:NEON_URL --data-only --no-owner --no-privileges -f neon_data.sql
```

### Préparer Coolify
```powershell
$env:DATABASE_URL = "postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@db-navettexpress:5432/postgres"
npm run db:push
```

### Import dans Coolify
```powershell
$env:COOLIFY_URL = "postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@db-navettexpress:5432/postgres"
psql $env:COOLIFY_URL -f neon_data.sql
```

### Vérification
```powershell
psql $env:COOLIFY_URL -c "SELECT 'users' as table, COUNT(*) FROM users UNION ALL SELECT 'bookings', COUNT(*) FROM bookings;"
```
