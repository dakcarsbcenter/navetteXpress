# 🚀 Guide de Déploiement Coolify - PRÊT À DÉPLOYER

## ✅ Toutes les corrections ont été appliquées

### 1️⃣ Corrections Build-Time
- ✅ **DATABASE_URL** : Lazy loading dans `src/db.ts`
- ✅ **NEXTAUTH_SECRET** : Getters dans `src/lib/auth.ts`
- ✅ **Variables ENV dummy** : Ajoutées dans `Dockerfile` pour le build
- ✅ **52+ routes API** : Marquées comme `force-dynamic`

### 2️⃣ Build Local Validé
```bash
npm run build
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (50/50)
✓ Build completed successfully!
```

## 🎯 Checklist Avant Déploiement Coolify

### Variables d'Environnement à Configurer dans Coolify

Allez dans **Coolify → Application → Environment Variables** et ajoutez :

#### 🔐 NextAuth
```bash
NEXTAUTH_SECRET=7c6cbed843c54f2d524da8a56df1cd51d1eccdf7848a1a130281393fa0263b89
NEXTAUTH_URL=https://navettexpress.com
```

#### 🔑 Google OAuth
```bash
GOOGLE_CLIENT_ID=283261955961-dq0bgt2gs4hse9em906aa3ulo2o8vdk6.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

#### 🗄️ PostgreSQL Database (Coolify)
```bash
DATABASE_URL=postgres://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@e4804cckc48ckk8wk0c4k04k:5432/postgres
```

#### ☁️ Cloudinary
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dpuol11u1
NEXT_PUBLIC_CLOUDINARY_API_KEY=567139516116942
CLOUDINARY_API_SECRET=b_fOVlRn4kxJBgcOzUwM0i9-kCc
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=navette-xpress-vehicles
```

#### 📧 Brevo (Email)
```bash
BREVO_API_KEY=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
BREVO_SENDER_EMAIL=dakcarsbcenter@gmail.com
BREVO_SENDER_NAME=NavetteHub
ADMIN_EMAIL=dakcarsbcenter@gmail.com
```

## 🚀 Étapes de Déploiement

### 1. Vérifier que toutes les variables ENV sont configurées dans Coolify

Cliquez sur **"Save"** après avoir ajouté toutes les variables.

### 2. Déclencher le déploiement

- **Option A** : Push automatique (déjà fait avec `git push`)
- **Option B** : Bouton "Redeploy" dans Coolify UI

### 3. Suivre les logs de build

Le build devrait maintenant **passer sans erreur** :

```
✓ Compiled successfully in 98s
✓ Collecting page data
✓ Generating static pages (50/50)
✓ Finalizing page optimization
✓ Build completed successfully!
```

### 4. Vérifier le déploiement

Une fois déployé, testez :

#### Test 1 : Page d'accueil
```
https://navettexpress.com
```

#### Test 2 : Connexion NextAuth
```
https://navettexpress.com/auth/signin
```

#### Test 3 : Test Database
```
https://navettexpress.com/api/test-db
```

Devrait retourner :
```json
{
  "status": "success",
  "message": "Base de données PostgreSQL connectée avec succès",
  "timestamp": "2025-10-27T..."
}
```

#### Test 4 : Dashboard Admin
```
https://navettexpress.com/admin
```

Se connecter avec vos credentials admin existants.

## 🗄️ Migration Base de Données

**Après le premier déploiement réussi**, suivez les étapes de migration :

### Option A : Auto-Migration au Premier Démarrage

Le script `start.sh` exécute automatiquement :
```bash
npm run db:push  # Crée les tables automatiquement
```

### Option B : Migration Manuelle (Recommandé)

1. **Créer le schéma dans Coolify PostgreSQL**
   - Allez dans **Coolify → PostgreSQL → Terminal**
   - Exécutez le contenu de `scripts/schema.sql`

2. **Migrer les données depuis Neon**
   ```bash
   # Dans le terminal de l'application Coolify
   npm run migrate:coolify
   ```

3. **Vérifier les données**
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM vehicles;
   SELECT COUNT(*) FROM bookings;
   ```

📖 **Guide complet** : `MIGRATION_README.md`

## 🔍 Dépannage

### Si le build échoue encore

1. **Vérifier les logs Coolify** : Copier l'erreur exacte
2. **Vérifier les variables ENV** : Toutes doivent être définies
3. **Vérifier le Dockerfile** : Doit contenir les ENV dummy

### Si l'application démarre mais erreurs de connexion DB

1. **Hostname interne Docker** : `e4804cckc48ckk8wk0c4k04k` n'est accessible que depuis le réseau Docker de Coolify
2. **Vérifier DATABASE_URL** : Doit pointer vers le hostname interne
3. **Créer les tables** : Utiliser `scripts/schema.sql` ou `npm run db:push`

### Si NextAuth ne fonctionne pas

1. **NEXTAUTH_URL** : Doit être `https://navettexpress.com` (votre domaine)
2. **NEXTAUTH_SECRET** : Doit être défini (256 bits minimum)
3. **Google OAuth** : Vérifier les credentials et callback URL

## 📊 Architecture de Déploiement

```
┌─────────────────────────────────────────────────┐
│  GitHub Repository                               │
│  github.com/dakcarsbcenter/navetteXpress        │
└──────────────┬──────────────────────────────────┘
               │ git push
               ↓
┌─────────────────────────────────────────────────┐
│  Coolify Build                                   │
│  1. Clone repo                                   │
│  2. Docker build (avec ENV dummy)                │
│  3. npm run build ✅                             │
│  4. Create image                                 │
└──────────────┬──────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────┐
│  Coolify Runtime Container                       │
│  - Injecte vraies ENV variables                  │
│  - Lance start.sh                                │
│  - Exécute npm run db:push (si besoin)          │
│  - Lance server.js                               │
└──────────────┬──────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────┐
│  PostgreSQL Coolify                              │
│  - Hostname: e4804cckc48ckk8wk0c4k04k           │
│  - Port: 5432                                    │
│  - Database: postgres                            │
└─────────────────────────────────────────────────┘
```

## 🎉 Résumé

✅ **Code corrigé** : Lazy loading DB + Auth  
✅ **Dockerfile optimisé** : ENV dummy pour build  
✅ **Routes dynamiques** : 52+ routes API configurées  
✅ **Build validé** : Tests locaux passent  
✅ **Variables ENV prêtes** : Copier-coller dans Coolify  
✅ **Migration documentée** : Guide complet disponible  

---

## 🚀 PRÊT À DÉPLOYER !

1. ✅ Configurer les variables ENV dans Coolify
2. ✅ Cliquer sur "Redeploy"
3. ✅ Attendre le build (~2-3 minutes)
4. ✅ Vérifier https://navettexpress.com
5. ✅ Exécuter la migration de données

**Tout est prêt !** Le déploiement devrait passer sans erreur. 🎊
