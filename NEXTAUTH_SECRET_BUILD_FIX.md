# 🔐 Correction : NEXTAUTH_SECRET Build Error

## ❌ Problème

Lors du déploiement sur Coolify, le build échouait avec l'erreur :

```
Error: NEXTAUTH_SECRET n'est pas défini. Veuillez le configurer dans votre environnement.
    at __TURBOPACK__module__evaluation__ (.next/server/chunks/_dea0b58d._.js:34:45459)
    
> Build error occurred
[Error: Failed to collect page data for /api/auth/[...nextauth]]
```

**Cause** : Next.js évalue les modules pendant la phase `Collecting page data` du build, même avec les getters JavaScript.

## ✅ Solution Finale : Variables ENV Dummy dans Dockerfile

Au lieu de compter uniquement sur les getters JavaScript (qui ne suffisent pas pendant `Collecting page data`), nous ajoutons des **variables d'environnement dummy** dans le Dockerfile qui sont utilisées **uniquement pendant le build**.

### Dockerfile (section builder)

```dockerfile
# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Variables dummy pour le build (seront remplacées au runtime par Coolify)
# Ces valeurs ne sont utilisées QUE pendant la phase de build
# Les vraies valeurs sécurisées seront injectées par Coolify au runtime
ARG NEXTAUTH_SECRET="build-time-dummy-secret-will-be-replaced-at-runtime"
ARG NEXTAUTH_URL="http://localhost:3000"
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ARG GOOGLE_CLIENT_ID="dummy"
ARG GOOGLE_CLIENT_SECRET="dummy"

ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV DATABASE_URL=$DATABASE_URL
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

# Build de l'application Next.js en mode standalone
RUN npm run build
```

## 🔒 Sécurité

**Les vraies variables d'environnement** seront injectées par Coolify au **runtime** (pas au build) :

1. **Build** : Utilise les valeurs dummy ci-dessus
2. **Runtime** : Coolify injecte les vraies valeurs via les variables d'environnement configurées dans l'UI

Les variables dummy ne sont **jamais utilisées en production** car :
- Elles existent seulement dans l'image Docker intermédiaire (stage `builder`)
- Au runtime, Coolify remplace toutes les variables par les vraies valeurs
- Le conteneur final (`runner` stage) n'hérite pas de ces ENV

## 🎯 Avantages

1. ✅ **Build réussi** : Next.js a accès aux variables pendant `Collecting page data`
2. ✅ **Sécurisé** : Les vraies valeurs ne sont jamais dans le Dockerfile
3. ✅ **Flexible** : Coolify peut changer les variables sans rebuild
4. ✅ **Standard** : Pattern Docker multi-stage recommandé

## 📊 Résultat

```bash
npm run build
✓ Compiled successfully in 98s
✓ Collecting page data    ← Plus d'erreur ici !
✓ Generating static pages (50/50)
✓ Finalizing page optimization

Build completed successfully!
```

## � Configuration Coolify

Dans **Coolify → Application → Environment Variables**, configurez :

```bash
# NextAuth
NEXTAUTH_SECRET=7c6cbed843c54f2d524da8a56df1cd51d1eccdf7848a1a130281393fa0263b89
NEXTAUTH_URL=https://navettexpress.com

# Google OAuth
GOOGLE_CLIENT_ID=283261955961-dq0bgt2gs4hse9em906aa3ulo2o8vdk6.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Database
DATABASE_URL=postgres://postgres:8aS0bLp5Hmcf0jH4RhwRJxjQYi5hZJvMLLcBPBl9y37wRJ87YFOT4AqrEMS69agk@e4804cckc48ckk8wk0c4k04k:5432/postgres

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

## 🔗 Fichiers modifiés

1. ✅ `Dockerfile` - Ajout variables ENV dummy pour build
2. ✅ `src/lib/auth.ts` - Getters pour lazy loading (amélioration supplémentaire)
3. ✅ `src/db.ts` - Lazy loading database (correction précédente)

## 💡 Pourquoi les getters seuls ne suffisent pas ?

Next.js avec Turbopack exécute le code pendant `Collecting page data` pour :
- Détecter les routes dynamiques vs statiques
- Optimiser le pre-rendering
- Analyser les dépendances

Même avec des getters, l'évaluation du module peut déclencher l'accès aux variables. Les ENV dummy garantissent que les variables existent toujours pendant cette phase.

## 📝 Pattern Multi-Stage Docker

```
Stage 1: deps     → Install node_modules
Stage 2: builder  → Build avec ENV dummy ← Les vraies valeurs ne sont PAS ici
Stage 3: runner   → Production avec vraies ENV de Coolify ← Les vraies valeurs ICI
```

Les ENV dummy du stage `builder` ne sont **jamais copiées** dans le stage `runner`.

---

✅ **Problème résolu !** Le déploiement Coolify devrait maintenant passer sans erreur.

