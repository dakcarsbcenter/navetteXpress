# Correction : Erreur NextAuth "CredentialsSignin"

## Problème
L'erreur NextAuth retournait un message générique "CredentialsSignin" au lieu des messages d'erreur spécifiques (email introuvable, mot de passe incorrect, etc.). Cela rendait difficile le débogage pour l'utilisateur.

## Cause de l'erreur
Dans la fonction `authorize` du `CredentialsProvider`, plusieurs chemins retournaient `null` au lieu de lancer une `Error` avec un message spécifique :
- Credentials manquantes → `return null`
- Utilisateur non trouvé → `return null`
- Pas de mot de passe défini → `return null`

Quand la fonction retourne `null`, NextAuth retourne simplement "CredentialsSignin" au client sans le code d'erreur spécifique.

## Solutions appliquées

### 1. **Corriger la fonction `authorize` dans `/src/lib/auth.ts`**

Remplacer les `return null` par `throw new Error()` avec des codes d'erreur spécifiques :

```typescript
// AVANT
if (!credentials?.email || !credentials?.password) {
  console.log("❌ [NextAuth] Credentials manquantes")
  return null
}

// APRÈS
if (!credentials?.email || !credentials?.password) {
  console.log("❌ [NextAuth] Credentials manquantes")
  throw new Error("CredentialsMissing")  // Code d'erreur spécifique
}
```

**Changements effectués :**
- `return null` → `throw new Error("CredentialsMissing")` (ligne 54)
- `return null` → `throw new Error("UserNotFound")` (ligne 71)
- `return null` → `throw new Error("NoPassword")` (ligne 103)

### 2. **Améliorer le logging côté client dans `/src/app/auth/signin/page.tsx`**

Le logging a été amélioré pour afficher le type d'erreur exact reçu :

```typescript
if (result?.error) {
  console.error("❌ Erreur NextAuth détectée:", result.error)
  console.error("   Type d'erreur:", result.error)
  const mappedError = getErrorMessage(result.error)
  console.error("   Message mappé:", mappedError)
  setError(mappedError)
}
```

### 3. **Améliorer le message d'erreur par défaut**

Pour les erreurs inconnues, afficher le type d'erreur en développement :

```typescript
default:
  // Pour le debugging, afficher le type d'erreur exact en développement
  console.warn("⚠️ [SignIn] Type d'erreur non géré:", errorType)
  return `Erreur de connexion${process.env.NODE_ENV === 'development' ? ` (${errorType})` : ''}`
```

## Codes d'erreur gérés

| Code | Message | Situation |
|------|---------|-----------|
| `CredentialsMissing` | "Veuillez remplir tous les champs" | Email ou mot de passe manquant |
| `UserNotFound` | "Votre email ou mot de passe est incorrect" | Email non trouvé en DB |
| `NoPassword` | "Votre email ou mot de passe est incorrect" | Compte sans mot de passe |
| `InvalidPassword:N` | "Mot de passe incorrect. Il vous reste N tentative(s)..." | Mauvais mot de passe |
| `AccountLocked:M` | "Compte temporairement bloqué... Réessayez dans M minute(s)" | Compte bloqué après 3 tentatives |
| `AccountLockedAfter3Attempts` | "Compte bloqué après 3 tentatives échouées" | Blocage après limites |

## Console debugging

Après ces changements, vous verrez maintenant dans la console du navigateur :

```
❌ Erreur NextAuth détectée: UserNotFound
   Type d'erreur: UserNotFound
   Message mappé: Votre email ou mot de passe est incorrect
```

Au lieu de simplement :

```
Erreur NextAuth: CredentialsSignin
```

## Fichiers modifiés

### 1. `/src/lib/auth.ts`
- Ligne 54: `return null` → `throw new Error("CredentialsMissing")`
- Ligne 71: `return null` → `throw new Error("UserNotFound")`  
- Ligne 103: `return null` → `throw new Error("NoPassword")`

### 2. `/src/app/auth/signin/page.tsx`
- Lignes 93-97: Amélioration du logging lors des erreurs NextAuth
- Lignes 62-67: Amélioration du message d'erreur par défaut avec débogage

## Communications d'erreur utilisateur améliorées

L'utilisateur reçoit maintenant des messages d'erreur clairs et contextuels :

1. **Credentials manquantes** → "Veuillez remplir tous les champs"
2. **Utilisateur non trouvé** → "Votre email ou mot de passe est incorrect"
3. **Mot de passe inventé** → "Mot de passe incorrect. Il vous reste 2 tentative(s)..."
4. **Compte bloqué** → "Compte temporairement bloqué... Réessayez dans 14 minute(s)"

## Testing recommandé

1. Tester avec un email qui n'existe pas
2. Tester avec un mauvais mot de passe
3. Tester avec des champs vides
4. Vérifier les logs de console pour les codes d'erreur spécifiques
5. Tester le compte bloqué après 3 tentatives

## Notes techniques

- Les changements respectent la structure NextAuth v5
- Les codes d'erreur lancés dans `authorize` sont transmis au client via `result.error`
- La cartographie des erreurs dans `getErrorMessage()` gère le cas par défaut
- Le logging en développement aide à identifier les erreurs inattendues
