# 🔐 Correction : NEXTAUTH_SECRET Build Error

## ❌ Problème

Lors du déploiement sur Coolify, le build échouait avec l'erreur :

```
Error: NEXTAUTH_SECRET n'est pas défini. Veuillez le configurer dans votre environnement.
    at __TURBOPACK__module__evaluation__ (.next/server/chunks/_dea0b58d._.js:34:45459)
    
> Build error occurred
[Error: Failed to collect page data for /api/auth/[...nextauth]]
```

## 🔍 Cause

Le fichier `src/lib/auth.ts` accédait à `process.env.NEXTAUTH_SECRET` au **niveau du module** (top-level) :

```typescript
// ❌ AVANT - Code exécuté au chargement du module
const { NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env
if (!NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET n'est pas défini...")
}

export const authOptions = {
  secret: NEXTAUTH_SECRET,
  providers: [...]
}
```

Pendant le build Next.js (phase `npm run build`), les variables d'environnement de **runtime** ne sont pas encore disponibles, causant l'échec du build.

## ✅ Solution

**Lazy Loading** des variables d'environnement avec des **getters** :

```typescript
// ✅ APRÈS - Code exécuté à la demande (runtime)
function getEnvConfig() {
  const { NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env
  
  if (!NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET n'est pas défini...")
  }
  
  return { NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET }
}

export const authOptions = {
  get secret() {
    return getEnvConfig().NEXTAUTH_SECRET
  },
  get providers() {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = getEnvConfig()
    return [
      ...(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET ? [
        GoogleProvider({ clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET })
      ] : []),
      CredentialsProvider({...})
    ]
  },
  // ... autres options
}
```

## 🎯 Avantages

1. **Build réussi** : Plus d'erreur pendant `npm run build`
2. **Runtime sécurisé** : Les variables sont vérifiées au moment de l'utilisation
3. **Compatibilité** : Fonctionne avec NextAuth sans modification des imports
4. **Pattern uniforme** : Même approche que pour `DATABASE_URL` dans `src/db.ts`

## 📊 Résultat

```bash
npm run build
✓ Compiled successfully in 22.3s
✓ Collecting page data
✓ Generating static pages (50/50)
✓ Finalizing page optimization

Build completed successfully!
```

## 🔗 Fichiers modifiés

- ✅ `src/lib/auth.ts` - Lazy loading de NEXTAUTH_SECRET et credentials Google OAuth

## 🚀 Déploiement

Les variables d'environnement doivent être configurées dans **Coolify** :

```bash
NEXTAUTH_SECRET=7c6cbed843c54f2d524da8a56df1cd51d1eccdf7848a1a130281393fa0263b89
NEXTAUTH_URL=https://navettexpress.com
GOOGLE_CLIENT_ID=283261955961-dq0bgt2gs4hse9em906aa3ulo2o8vdk6.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## 📝 Notes

- Cette correction suit le même pattern que la correction précédente pour `DATABASE_URL`
- Les getters JavaScript permettent d'évaluer les valeurs de manière paresseuse (lazy)
- NextAuth appelle ces getters au runtime, pas au build time
- Aucun changement n'est requis dans les fichiers qui importent `authOptions`

---

✅ **Problème résolu !** Le build passe maintenant sans erreur et l'application peut être déployée sur Coolify.
