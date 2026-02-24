# Guide de Migration Base de Données vers Coolify PostgreSQL

## Problème
Les hostnames PostgreSQL de Coolify (`db-navettexpress` ou `e4804cckc48ckk8wk0c4k04k`) ne sont accessibles que depuis le réseau interne Docker de Coolify, pas depuis votre machine locale.

## Solution : Migration via les scripts de déploiement Coolify

### Option 1 : Migration automatique via Drizzle au premier déploiement ✅ (RECOMMANDÉ)

1. **Dans Coolify, configurez les variables d'environnement de votre application :**
   ```bash
   DATABASE_URL=postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@e4804cckc48ckk8wk0c4k04k:5432/postgres
   ```

2. **Vérifiez que votre Dockerfile inclut la migration :**
   Le Dockerfile devrait déjà être configuré pour créer le schéma au build ou au démarrage.

3. **Commitez et pushez vos changements :**
   ```bash
   git add .
   git commit -m "Configure Coolify PostgreSQL database"
   git push origin main
   ```

4. **Le schéma sera créé automatiquement** lors du premier déploiement car le code utilise `drizzle-orm` qui crée les tables si elles n'existent pas.

---

### Option 2 : Créer le schéma manuellement via Coolify Terminal

1. **Allez dans Coolify → Votre application → Terminal**

2. **Exécutez la commande de migration Drizzle :**
   ```bash
   npm run db:push
   ```
   Ou si vous avez des migrations :
   ```bash
   npm run db:migrate
   ```

---

### Option 3 : Exporter/Importer les données depuis Neon

#### Étape 1 : Exporter les données depuis Neon (sur votre machine locale)

```bash
# Remplacez par votre URL Neon
$env:NEON_DATABASE_URL = "votre_url_neon_ici"

# Exporter le schéma et les données
pg_dump $env:NEON_DATABASE_URL -f backup_neon.sql
```

#### Étape 2 : Importer dans Coolify PostgreSQL

**Via le terminal Coolify de la base de données :**

1. Allez dans Coolify → PostgreSQL Database → Terminal
2. Copiez le contenu de `backup_neon.sql`
3. Exécutez :
   ```bash
   psql -U postgres -d postgres < backup_neon.sql
   ```

Ou **via un conteneur temporaire :**

```bash
# Copiez backup_neon.sql dans le serveur Coolify
scp backup_neon.sql user@votre-serveur-coolify:/tmp/

# Connectez-vous au serveur
ssh user@votre-serveur-coolify

# Trouvez l'ID du conteneur PostgreSQL
docker ps | grep postgres

# Copiez le fichier dans le conteneur
docker cp /tmp/backup_neon.sql <container-id>:/tmp/

# Importez les données
docker exec -i <container-id> psql -U postgres -d postgres < /tmp/backup_neon.sql
```

---

### Option 4 : Migration via script Node.js (depuis l'application déployée)

Créez un endpoint API temporaire qui copie les données :

**Fichier : `src/app/api/admin/migrate-from-neon/route.ts`**

```typescript
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getDb } from '@/db';

export async function POST() {
  try {
    // Connexion Neon (source)
    const neonUrl = process.env.NEON_DATABASE_URL;
    if (!neonUrl) throw new Error('NEON_DATABASE_URL non défini');
    
    const neonSql = neon(neonUrl);
    const coolifyDb = getDb();

    // Exemple : copier les utilisateurs
    const users = await neonSql`SELECT * FROM users`;
    
    for (const user of users) {
      await coolifyDb.insert(usersTable).values(user).onConflictDoNothing();
    }

    return NextResponse.json({ 
      success: true, 
      message: `${users.length} utilisateurs migrés` 
    });
  } catch (error) {
    console.error('Erreur migration:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}
```

Puis appelez l'endpoint depuis Coolify ou votre navigateur après déploiement.

---

## Configuration dans Coolify

### Variables d'environnement à définir :

```bash
# Base de données PostgreSQL Coolify (hostname interne)
DATABASE_URL=postgresql://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@e4804cckc48ckk8wk0c4k04k:5432/postgres

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

---

## Vérification après migration

1. **Testez la connexion :**
   - Allez sur `https://navettexpress.com/api/test-db`
   - Devrait retourner `{ success: true }`

2. **Créez le premier admin :**
   - Allez sur `https://navettexpress.com/init-admin`
   - Suivez les instructions

3. **Vérifiez les tables :**
   Dans le terminal PostgreSQL Coolify :
   ```sql
   \dt -- Lister les tables
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM vehicles;
   SELECT COUNT(*) FROM bookings;
   ```

---

## Recommandation

✅ **Option 1 (Migration automatique)** est la plus simple :
1. Configurez DATABASE_URL dans Coolify
2. Déployez l'application
3. Le schéma sera créé automatiquement
4. Créez le premier admin via `/init-admin`
5. Importez manuellement les données importantes si nécessaire

Si vous avez beaucoup de données existantes dans Neon, utilisez **Option 3 (Export/Import)** pour les transférer.
