# 🧪 Guide de Test des Permissions Dynamiques

## 📋 État Actuel du Serveur

✅ Serveur Next.js démarré sur http://localhost:3000  
✅ Toutes les APIs mises à jour avec vérifications de permissions  
✅ Tableau de bord client mis à jour avec onglets conditionnels

---

## 🔍 Tests à Effectuer

### Test 1️⃣ : Vérifier les Permissions Assignées

**Via l'interface admin :**

1. Connectez-vous en tant qu'admin : `admin@navettehub.com` / `admin123`
2. Allez dans **Gestion des Utilisateurs** > **Rôles et Permissions**
3. Sélectionnez le rôle **customer**
4. Vérifiez que ces permissions sont cochées :
   - ✅ `vehicles.manage`
   - ✅ `quotes.manage`
   - ✅ `reviews.manage`

**Via SQL (optionnel) :**

```sql
-- Exécuter dans votre base de données
SELECT role_name, resource, action, allowed 
FROM role_permissions 
WHERE role_name = 'customer' AND allowed = true
ORDER BY resource, action;
```

---

### Test 2️⃣ : Vérifier le Tableau de Bord Client

**Étapes :**

1. Déconnectez-vous si vous êtes connecté en tant qu'admin
2. Connectez-vous avec un compte customer : `clientnavette@gmail.com`
3. Accédez au tableau de bord : http://localhost:3000/client/dashboard

**Résultats attendus :**

Le tableau de bord devrait afficher ces onglets (selon les permissions) :

| Onglet | Visible ? | Condition |
|--------|-----------|-----------|
| 📊 Vue d'ensemble | ✅ Toujours | Aucune |
| 📅 Mes réservations | ✅ Toujours | Customer par défaut |
| 📋 Mes devis | ✅/❌ | Si permission `quotes.*` |
| ⭐ Évaluer trajets | ✅ Toujours | Customer par défaut |
| ✅ Mes avis | ✅/❌ | Si permission `reviews.*` |
| 🚗 Véhicules | ✅/❌ | Si permission `vehicles.*` |
| 👤 Mon profil | ✅ Toujours | Aucune |

---

### Test 3️⃣ : Tester l'API Véhicules

**Dans la console du navigateur (F12) :**

```javascript
// Test de l'API véhicules
fetch('/api/client/vehicles')
  .then(res => res.json())
  .then(data => console.log('Véhicules:', data))
  .catch(err => console.error('Erreur:', err))
```

**Résultats attendus :**

- ✅ Si permission accordée : `{ success: true, vehicles: [...] }`
- ❌ Si permission refusée : `{ error: 'Vous n\'avez pas les permissions...' }` (403)

---

### Test 4️⃣ : Tester l'API Reviews

**Dans la console du navigateur :**

```javascript
// Test de l'API reviews
fetch('/api/client/reviews')
  .then(res => res.json())
  .then(data => console.log('Avis:', data))
  .catch(err => console.error('Erreur:', err))
```

**Résultats attendus :**

- ✅ Si permission accordée : `{ success: true, reviews: [...] }`
- ❌ Si permission refusée : `{ error: 'Vous n\'avez pas les permissions...' }` (403)

---

### Test 5️⃣ : Tester l'API Quotes

**Dans la console du navigateur :**

```javascript
// Test de l'API quotes (remplacer l'email par celui de l'utilisateur connecté)
fetch('/api/quotes/client?email=clientnavette@gmail.com')
  .then(res => res.json())
  .then(data => console.log('Devis:', data))
  .catch(err => console.error('Erreur:', err))
```

**Résultats attendus :**

- ✅ Si permission accordée : `{ success: true, data: [...] }`
- ❌ Si permission refusée : `{ error: 'Vous n\'avez pas les permissions...' }` (403)

---

### Test 6️⃣ : Vérifier les Logs du Serveur

**Ouvrez le terminal où tourne le serveur et cherchez :**

```
🚗 [API Client Vehicles] Session user: { email: '...', role: 'customer' }
```

**Logs attendus pour chaque API :**

- **Véhicules** : `🚗 [API Client Vehicles] Session user: ...`
- **Reviews** : Logs de vérification des permissions
- **Quotes** : Logs de vérification des permissions

---

## 🐛 Problèmes Connus et Solutions

### Problème 1 : Les onglets ne s'affichent pas

**Solution :**
1. Ouvrir la console du navigateur (F12)
2. Vérifier que `/api/auth/permissions` retourne les bonnes permissions
3. Actualiser la page avec `Ctrl+F5` (hard refresh)
4. Vérifier dans le code source que `userPermissions` est bien chargé

```javascript
// Dans la console du navigateur
fetch('/api/auth/permissions')
  .then(res => res.json())
  .then(data => console.log('Permissions utilisateur:', data))
```

### Problème 2 : API retourne 403 Forbidden

**Causes possibles :**
- ✅ Permission non assignée dans la base de données
- ✅ Permission avec `allowed = false`
- ✅ Mauvaise orthographe du `role_name` ou `resource`

**Solution :**
```sql
-- Vérifier la permission
SELECT * FROM role_permissions 
WHERE role_name = 'customer' 
  AND resource = 'vehicles' 
  AND action = 'manage';

-- Si elle n'existe pas ou est désactivée, la créer/activer
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES ('customer', 'vehicles', 'manage', true)
ON CONFLICT (role_name, resource, action) 
DO UPDATE SET allowed = true;
```

### Problème 3 : Erreur "Cannot convert undefined to object"

**Cause :** Le champ `userRole` est `undefined` dans la session

**Solution :**
1. Vérifier que l'utilisateur est bien authentifié
2. Déconnecter et reconnecter l'utilisateur
3. Vérifier que le callback JWT dans `auth.ts` inclut le rôle

---

## 📊 Checklist de Validation Complète

Cochez les items au fur et à mesure :

- [ ] Serveur démarré sans erreur
- [ ] Connexion admin fonctionne
- [ ] Interface de gestion des permissions accessible
- [ ] Permissions assignées au rôle `customer` :
  - [ ] `vehicles.manage` = true
  - [ ] `quotes.manage` = true
  - [ ] `reviews.manage` = true
- [ ] Connexion client fonctionne
- [ ] Tableau de bord client charge correctement
- [ ] Onglet "Véhicules" visible
- [ ] Onglet "Mes devis" visible
- [ ] Onglet "Mes avis" visible
- [ ] API `/api/client/vehicles` retourne 200
- [ ] API `/api/client/reviews` retourne 200
- [ ] API `/api/quotes/client` retourne 200
- [ ] Composant VehiclesManagement affiche la liste
- [ ] Pas d'erreur dans la console navigateur
- [ ] Pas d'erreur dans les logs serveur

---

## 🎯 Prochaines Actions

Si tous les tests passent :
✅ Le système de permissions dynamiques est fonctionnel !

Si certains tests échouent :
1. Noter les erreurs exactes
2. Vérifier les logs serveur
3. Vérifier la console navigateur
4. Consulter `DYNAMIC_PERMISSIONS_COMPLETE.md` pour le débogage

---

## 📞 Aide Rapide

**Commandes utiles :**

```powershell
# Redémarrer le serveur
npm run dev

# Vérifier les permissions en base
psql -U votre_user -d votre_db -f check-permissions.sql

# Voir les logs en temps réel
# (Dans le terminal où tourne npm run dev)
```

**URLs importantes :**
- Admin Dashboard : http://localhost:3000/admin/dashboard
- Client Dashboard : http://localhost:3000/client/dashboard
- Driver Dashboard : http://localhost:3000/driver/dashboard

---

**Date de création** : 16 octobre 2025  
**Dernière mise à jour** : 16 octobre 2025  
**Statut** : 🚀 Prêt pour les tests
