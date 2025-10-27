# Guide de Migration - Base de Données Neon vers Coolify PostgreSQL

## Situation
- **Base actuelle** : Neon PostgreSQL (avec données existantes)
- **Base cible** : Coolify PostgreSQL (nouvelle, vide)
- **Problème** : Le hostname Coolify n'est accessible que depuis le réseau Docker interne

## Solution : Migration en 2 étapes

### 🔧 Étape 1 : Créer le schéma dans Coolify PostgreSQL

**Option A - Via le Terminal Coolify (RECOMMANDÉ)** ✅

1. Allez dans **Coolify** → **PostgreSQL Database** → **Terminal**
2. Copiez le contenu du fichier `scripts/schema.sql`
3. Collez et exécutez dans le terminal PostgreSQL

**Option B - Via un fichier SQL**

1. Copiez `scripts/schema.sql` sur votre serveur Coolify
2. Exécutez :
   ```bash
   # Depuis le serveur Coolify
   docker exec -i <postgres-container-id> psql -U postgres -d postgres < schema.sql
   ```

---

### 📦 Étape 2 : Migrer les données

**Option A - Via l'application déployée (RECOMMANDÉ)** ✅

1. Ajoutez cette variable d'environnement temporaire dans Coolify :
   ```
   NEON_DATABASE_URL=postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

2. Déployez l'application avec le script de migration

3. Depuis le terminal de l'application dans Coolify :
   ```bash
   npx tsx scripts/migrate-to-coolify.ts
   ```

4. Vérifiez les logs pour confirmer la migration

5. Supprimez la variable `NEON_DATABASE_URL` après la migration

**Option B - Export/Import manuel**

1. **Sur votre machine locale**, exportez depuis Neon :
   ```bash
   pg_dump "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require" > neon_data.sql
   ```

2. **Copiez sur le serveur Coolify** :
   ```bash
   scp neon_data.sql user@votre-serveur:/tmp/
   ```

3. **Importez dans PostgreSQL Coolify** :
   ```bash
   # Depuis le serveur Coolify
   docker cp /tmp/neon_data.sql <postgres-container-id>:/tmp/
   docker exec -i <postgres-container-id> psql -U postgres -d postgres < /tmp/neon_data.sql
   ```

---

## ✅ Vérification après migration

1. **Connectez-vous au terminal PostgreSQL Coolify**
   ```sql
   \dt  -- Lister les tables
   
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM vehicles;
   SELECT COUNT(*) FROM bookings;
   SELECT COUNT(*) FROM reviews;
   SELECT COUNT(*) FROM quotes;
   ```

2. **Testez l'application**
   - Allez sur `https://navettexpress.com/api/test-db`
   - Connectez-vous avec un compte existant
   - Vérifiez les données dans le dashboard

---

## 🔐 Sécurité

Une fois la migration terminée :

1. ✅ Supprimez `NEON_DATABASE_URL` des variables d'environnement Coolify
2. ✅ Gardez uniquement `DATABASE_URL` pointant vers Coolify
3. ✅ Sauvegardez une copie de la base Neon avant de la supprimer
4. ✅ Testez l'application en production pendant quelques jours
5. ✅ Supprimez la base Neon si tout fonctionne correctement

---

## 📊 Tables migrées

- ✅ users (utilisateurs)
- ✅ accounts (comptes OAuth)
- ✅ sessions (sessions NextAuth)
- ✅ verification_tokens (tokens de vérification)
- ✅ custom_roles (rôles personnalisés)
- ✅ vehicles (véhicules)
- ✅ bookings (réservations)
- ✅ reviews (avis)
- ✅ permissions (permissions)
- ✅ role_permissions (permissions des rôles)
- ✅ quotes (demandes de devis)

---

## 🚨 En cas de problème

**Si la migration échoue :**

1. Vérifiez les logs dans Coolify
2. Vérifiez que `DATABASE_URL` est bien configuré
3. Vérifiez que le schéma est créé avec `\dt` dans PostgreSQL
4. Relancez le script de migration
5. Contactez le support si nécessaire

**Rollback :**

1. Changez `DATABASE_URL` pour pointer vers Neon dans Coolify
2. Redéployez l'application
3. L'application retournera sur Neon
