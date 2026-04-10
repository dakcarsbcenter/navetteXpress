# 🚀 Migration Base de Données Neon → Coolify PostgreSQL

## ✅ Fichiers créés

1. **`scripts/schema.sql`** - Schéma SQL complet pour créer toutes les tables
2. **`scripts/migrate-to-coolify.ts`** - Script TypeScript pour migrer les données
3. **`MIGRATION_STEPS.md`** - Guide détaillé étape par étape
4. **`.env.production`** - Mis à jour avec l'URL Coolify

## 🎯 Procédure Recommandée

### Étape 1 : Créer le schéma dans Coolify

**Dans le terminal PostgreSQL de Coolify :**

1. Allez dans **Coolify** → **PostgreSQL Database** → **Terminal**
2. Copiez-collez le contenu de `scripts/schema.sql`
3. Exécutez-le dans le terminal

**OU via ligne de commande (si vous avez accès SSH au serveur) :**

```bash
# Trouvez l'ID du conteneur PostgreSQL
docker ps | grep postgres

# Exécutez le script
docker exec -i <container-id> psql -U postgres -d postgres < scripts/schema.sql
```

### Étape 2 : Configurer les variables d'environnement dans Coolify

Allez dans **Coolify** → **Application** → **Environment Variables** et ajoutez :

```bash
# Base de données PostgreSQL Coolify
DATABASE_URL=postgres://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@e4804cckc48ckk8wk0c4k04k:5432/postgres

# Temporaire pour la migration (à supprimer après)
NEON_DATABASE_URL=postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# NextAuth
NEXTAUTH_URL=https://navettexpress.com
NEXTAUTH_SECRET=7c6cbed843c54f2d524da8a56df1cd51d1eccdf7848a1a130281393fa0263b89

# Google OAuth
GOOGLE_CLIENT_ID=283261955961-dq0bgt2gs4hse9em906aa3ulo2o8vdk6.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dpuol11u1
NEXT_PUBLIC_CLOUDINARY_API_KEY=567139516116942
CLOUDINARY_API_SECRET=b_fOVlRn4kxJBgcOzUwM0i9-kCc
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=navette-xpress-vehicles

# Brevo
BREVO_API_KEY=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
BREVO_SENDER_EMAIL=dakcarsbcenter@gmail.com
BREVO_SENDER_NAME=NavetteHub
ADMIN_EMAIL=dakcarsbcenter@gmail.com
```

### Étape 3 : Déployer l'application

```bash
git add .
git commit -m "Setup Coolify PostgreSQL migration"
git push origin main
```

### Étape 4 : Exécuter la migration des données

**Dans le terminal de l'application Coolify :**

```bash
npm run migrate:coolify
```

Le script va :
- ✅ Se connecter à Neon (source)
- ✅ Se connecter à Coolify PostgreSQL (destination)
- ✅ Copier toutes les tables une par une
- ✅ Afficher la progression en temps réel
- ✅ Gérer les conflits automatiquement

### Étape 5 : Vérification

**Dans le terminal PostgreSQL Coolify :**

```sql
\dt  -- Lister les tables

SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM vehicles;
SELECT COUNT(*) FROM bookings;
SELECT COUNT(*) FROM reviews;
SELECT COUNT(*) FROM quotes;
```

**Testez l'application :**
- https://navettexpress.com/api/test-db
- Connectez-vous avec un compte existant
- Vérifiez les données dans les dashboards

### Étape 6 : Nettoyage

1. **Supprimez `NEON_DATABASE_URL`** des variables d'environnement dans Coolify
2. Redéployez pour appliquer les changements
3. Testez pendant quelques jours
4. Si tout fonctionne, supprimez la base Neon

## 🎨 Commandes disponibles

```bash
# Créer/Mettre à jour le schéma
npm run db:push

# Générer les migrations
npm run db:generate

# Migrer les données vers Coolify
npm run migrate:coolify

# Ouvrir Drizzle Studio
npm run db:studio
```

## 📊 Tables migrées

- ✅ **users** - Utilisateurs (admins, managers, drivers, customers)
- ✅ **accounts** - Comptes OAuth (Google)
- ✅ **sessions** - Sessions NextAuth
- ✅ **verification_tokens** - Tokens de vérification email
- ✅ **custom_roles** - Rôles personnalisés
- ✅ **role_permissions** - Permissions des rôles
- ✅ **vehicles** - Flotte de véhicules
- ✅ **bookings** - Réservations
- ✅ **reviews** - Avis clients
- ✅ **permissions** - Permissions système
- ✅ **quotes** - Demandes de devis

## 🔐 Sécurité

- ✅ Connexion DB paresseuse (pas de lecture ENV au build)
- ✅ Toutes les routes API en mode dynamic
- ✅ Schéma avec contraintes et validations
- ✅ Index pour optimiser les performances
- ✅ Gestion des conflits lors de l'import

## 🚨 Dépannage

**Si le hostname n'est pas accessible :**
- Vérifiez que vous exécutez depuis le terminal Coolify (pas en local)
- Le hostname `e4804cckc48ckk8wk0c4k04k` n'est accessible que depuis le réseau Docker de Coolify

**Si la migration échoue :**
- Vérifiez les logs : `docker logs <container-id>`
- Vérifiez que `NEON_DATABASE_URL` est bien configuré
- Vérifiez que le schéma est créé avec `\dt`
- Relancez `npm run migrate:coolify`

**Pour un rollback rapide :**
- Changez `DATABASE_URL` pour pointer vers Neon
- Redéployez
- L'application retournera sur Neon

## 📞 Support

Si vous rencontrez des problèmes, vérifiez :
1. Les logs de déploiement dans Coolify
2. Les logs PostgreSQL
3. Les logs de l'application
4. Le guide `MIGRATION_STEPS.md` pour plus de détails

---

✅ **Prêt à migrer !** Suivez les étapes ci-dessus dans l'ordre.
