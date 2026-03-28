# 🔧 Résolution de l'erreur de connexion à la base de données

**Date:** 10 novembre 2025  
**Erreur:** HTTP Error 500 - `ENOTFOUND 100.198.101.267`  
**Statut:** ✅ Résolu

## 🐛 Problème rencontré

### Symptômes
- Erreur 500 sur `/api/admin/roles`
- Message : `getaddrinfo ENOTFOUND 100.198.101.267`
- Toutes les API échouaient avec la même erreur

### Cause
Le serveur de développement Next.js avait **mis en cache l'ancienne connexion** à la base de données avec l'ancienne IP `100.198.101.267`.

La nouvelle configuration dans `.env.local` utilise :
```
DATABASE_URL='postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress'
```

Mais le serveur continuait d'utiliser l'ancienne IP mise en cache.

## ✅ Solution appliquée

### Étape 1 : Nettoyage du cache Next.js
```powershell
Remove-Item -Recurse -Force .next
```

### Étape 2 : Redémarrage du serveur
```powershell
npm run dev
```

### Étape 3 : Rafraîchissement du navigateur
Le navigateur doit recharger la page pour établir de nouvelles connexions API.

## 🔍 Vérification

Le serveur devrait maintenant démarrer sans erreurs :

```
✓ Starting...
✓ Compiled middleware in 2.5s
✓ Ready in 7s
```

Aucun message `ENOTFOUND` ne devrait apparaître.

## 📝 Pour éviter ce problème à l'avenir

### Quand vous changez DATABASE_URL :

1. **Arrêtez le serveur** (Ctrl+C)
2. **Nettoyez le cache** : `Remove-Item -Recurse -Force .next`
3. **Redémarrez** : `npm run dev`
4. **Rafraîchissez le navigateur** (F5 ou Ctrl+F5)

### Alternative rapide
Utilisez cette commande en une ligne :
```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue; npm run dev
```

## 🎯 Prochaines étapes

Maintenant que le serveur fonctionne correctement :

1. ✅ Rafraîchir le navigateur
2. ✅ Se connecter en tant qu'admin
3. ✅ Aller sur `/init-permissions.html`
4. ✅ Initialiser les permissions de profil
5. ✅ Tester la modification du profil client

## 🔐 Initialisation des permissions

N'oubliez pas d'initialiser les permissions de profil :

**URL :** http://localhost:3000/init-permissions.html

Cela ajoutera les permissions `profile.read` et `profile.update` pour les rôles customer, manager et driver.

---

**Note:** Cette erreur est normale après un changement de DATABASE_URL. Next.js met en cache les connexions pour des raisons de performance.
