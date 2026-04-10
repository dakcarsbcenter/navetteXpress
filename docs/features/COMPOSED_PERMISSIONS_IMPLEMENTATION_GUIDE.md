# 🎯 Système de Permissions Composées - Implémentation Complète

## 📋 Vue d'ensemble

Ce document décrit l'implémentation complète du système de permissions composées qui remplace les permissions atomiques par un système plus intuitif et visuel.

## 🔄 Changements Architecturaux

### Ancien Système (Atomique)
- Permissions dispersées : `create_users`, `read_bookings`, `update_vehicles`, etc.
- Difficulté à comprendre les droits d'un rôle
- Matrice complexe avec des dizaines de lignes

### Nouveau Système (Composé)
- **4 permissions par ressource :**
  1. **Gérer (manage)** ⚡ : Créer, lire, modifier, supprimer (toutes les données)
  2. **Lire (read)** 👁️ : Lecture seule (ses propres données)
  3. **Modifier (update)** ✏️ : Modification uniquement (ses propres données)
  4. **Supprimer (delete)** 🗑️ : Suppression uniquement (ses propres données)

- **5 ressources :**
  - 👥 Utilisateurs (users)
  - 🚗 Véhicules (vehicles)
  - 📅 Réservations (bookings)
  - 📋 Devis (quotes)
  - ⭐ Avis (reviews)

- **Matrice simplifiée :** 4 × 5 = 20 permissions par rôle

## 📁 Fichiers Créés/Modifiés

### 1. **migrations/restructure-permissions.sql**
```sql
-- Efface et recrée toutes les permissions avec la nouvelle structure
TRUNCATE TABLE role_permissions CASCADE;

-- Crée 4 actions par ressource pour chaque rôle
-- Exemple pour users:
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES 
  ('admin', 'users', 'create', true),
  ('admin', 'users', 'read', true),
  ('admin', 'users', 'update', true),
  ('admin', 'users', 'delete', true),
  -- ... répété pour chaque ressource et rôle
```

**Exécution :**
```bash
node scripts/run-restructure-permissions.js
```

### 2. **src/app/api/admin/permissions/composed/route.ts**

#### GET - Récupérer les permissions composées
```typescript
GET /api/admin/permissions/composed?role=customer

Response:
{
  "permissions": {
    "users": ["read"],
    "vehicles": [],
    "bookings": ["manage"],  // Si toutes les actions présentes
    "quotes": ["read", "update"],
    "reviews": ["read"]
  }
}
```

**Logique de conversion :**
- Si `[create, read, update, delete]` présents → `manage`
- Sinon, renvoie les actions individuelles présentes

#### POST - Activer/Désactiver une permission composée
```typescript
POST /api/admin/permissions/composed
{
  "roleName": "customer",
  "resource": "bookings",
  "composedPermission": "manage",
  "enabled": true
}

// Ajoute ou retire les actions atomiques correspondantes
// manage → ajoute [create, read, update, delete]
// read → ajoute [read] uniquement
// update → ajoute [update] uniquement
// delete → ajoute [delete] uniquement
```

#### PUT - Mettre à jour toutes les permissions d'un rôle
```typescript
PUT /api/admin/permissions/composed
{
  "roleName": "customer",
  "permissions": {
    "users": ["read"],
    "vehicles": [],
    "bookings": ["manage"],
    "quotes": ["read", "update"],
    "reviews": ["delete"]
  }
}
```

### 3. **src/components/admin/ComposedPermissionsMatrix.tsx**

Nouveau composant React pour la matrice des permissions :

**Caractéristiques :**
- ✅ Interface moderne et intuitive
- ✅ Statistiques en temps réel (rôles, permissions, utilisateurs)
- ✅ Matrice groupée par ressource
- ✅ Cases à cocher interactives
- ✅ Protection du rôle admin (toujours toutes les permissions)
- ✅ Animations et feedback visuel
- ✅ Légende explicative
- ✅ Mode sombre supporté

**Structure du tableau :**
```
┌─────────────────────┬─────────┬──────────┬──────────┬─────────┐
│ Permissions         │ Admin   │ Manager  │ Customer │ Driver  │
├─────────────────────┼─────────┼──────────┼──────────┼─────────┤
│ 👥 UTILISATEURS                                                │
│ ⚡ Gérer            │   ✓     │          │          │         │
│ 👁️ Lire            │   ✓     │    ✓     │    ✓     │         │
│ ✏️ Modifier         │   ✓     │          │          │         │
│ 🗑️ Supprimer        │   ✓     │          │          │         │
├─────────────────────┼─────────┼──────────┼──────────┼─────────┤
│ 🚗 VÉHICULES                                                   │
│ ⚡ Gérer            │   ✓     │    ✓     │          │         │
│ 👁️ Lire            │   ✓     │    ✓     │          │    ✓    │
│ ...                                                            │
```

### 4. **src/app/admin/dashboard/page.tsx**
```typescript
// Modification pour utiliser le nouveau composant
import { ComposedPermissionsMatrix } from "@/components/admin/ComposedPermissionsMatrix"

case 'permissions':
  return <ComposedPermissionsMatrix />
```

### 5. **scripts/run-restructure-permissions.js**
Script Node.js pour exécuter la migration facilement :
```bash
node scripts/run-restructure-permissions.js
```

## 🚀 Utilisation

### Exécuter la Migration

**Option 1 : Via Node.js (Recommandé)**
```bash
cd c:\Users\labs\Documents\navetteXpress
node scripts/run-restructure-permissions.js
```

**Option 2 : Via psql (si disponible)**
```bash
psql -U postgres -d navettexpress -f migrations/restructure-permissions.sql
```

### Accéder à la Matrice
1. Connectez-vous en tant qu'admin
2. Allez dans **Admin Dashboard**
3. Cliquez sur l'onglet **🔐 Permissions**
4. Vous verrez la nouvelle matrice avec 4 permissions par ressource

### Modifier les Permissions
1. Cliquez sur une case vide pour **activer** une permission
2. Cliquez sur une case cochée (✓) pour **désactiver** une permission
3. Les modifications sont appliquées **immédiatement**
4. Le rôle **admin** ne peut pas être modifié (protection)

## 📊 Permissions par Défaut

### Admin (Tous les droits)
```
users:     [manage] ⚡
vehicles:  [manage] ⚡
bookings:  [manage] ⚡
quotes:    [manage] ⚡
reviews:   [manage] ⚡
```

### Manager (Gestion opérationnelle)
```
users:     [read] 👁️
vehicles:  [manage] ⚡
bookings:  [manage] ⚡
quotes:    [manage] ⚡
reviews:   [manage] ⚡
```

### Customer (Utilisateur final)
```
users:     []
vehicles:  []
bookings:  [read] 👁️
quotes:    [read] 👁️
reviews:   [read] 👁️
```

### Driver (Chauffeur)
```
users:     []
vehicles:  [read] 👁️
bookings:  [read] 👁️
quotes:    []
reviews:   []
```

## 🔍 Logique de Conversion

### Atomique → Composé (Affichage)
```typescript
// Si toutes les actions sont présentes
if (actions.includes('create') && 
    actions.includes('read') && 
    actions.includes('update') && 
    actions.includes('delete')) {
  return ['manage']
}

// Sinon, retourner les actions individuelles
return actions // ex: ['read', 'update']
```

### Composé → Atomique (Sauvegarde)
```typescript
const MAPPING = {
  'manage': ['create', 'read', 'update', 'delete'],
  'read': ['read'],
  'update': ['update'],
  'delete': ['delete']
}

// Exemple: ['manage', 'read']
// → ['create', 'read', 'update', 'delete', 'read']
// → déduplication → ['create', 'read', 'update', 'delete']
```

## 🎨 Interface Utilisateur

### Statistiques
- **Rôles totaux** : Nombre de rôles dans le système
- **Permissions** : 20 (4 par ressource × 5 ressources)
- **Utilisateurs** : Total des utilisateurs tous rôles confondus
- **Ressources** : 5 ressources gérées

### Couleurs et Icônes
```
⚡ Gérer    → Violet  → Tous les droits
👁️ Lire     → Bleu    → Lecture seule
✏️ Modifier  → Orange  → Modification
🗑️ Supprimer → Rouge   → Suppression

✓ Vert  → Permission active
○ Gris  → Permission inactive
```

### Animations
- ✅ Hover sur les cases : Scale 1.05 + ombre
- ✅ Case cochée : Ombre verte, icône check
- ✅ Transition fluide : 200ms
- ✅ Feedback visuel : Notifications

## 🧪 Tests

### Test 1 : Vérifier la Migration
```sql
-- Doit retourner 80 lignes (4 actions × 5 ressources × 4 rôles)
SELECT COUNT(*) FROM role_permissions;

-- Vérifier les permissions d'un rôle
SELECT resource, action, allowed 
FROM role_permissions 
WHERE role_name = 'customer'
ORDER BY resource, action;
```

### Test 2 : Tester l'API
```bash
# GET - Récupérer les permissions
curl http://localhost:3000/api/admin/permissions/composed?role=customer

# POST - Activer "manage bookings" pour customer
curl -X POST http://localhost:3000/api/admin/permissions/composed \
  -H "Content-Type: application/json" \
  -d '{
    "roleName": "customer",
    "resource": "bookings",
    "composedPermission": "manage",
    "enabled": true
  }'
```

### Test 3 : Interface
1. Connectez-vous en tant qu'admin
2. Allez dans Permissions
3. Cochez "Gérer réservations" pour customer
4. Déconnectez-vous
5. Connectez-vous en tant que customer
6. Vérifiez que vous voyez le bouton "Nouvelle réservation"

## 🐛 Dépannage

### Erreur : "Cannot read property 'map' of undefined"
```typescript
// Solution : Vérifier que l'API retourne bien les données
const [permissions, setPermissions] = useState<Record<string, RolePermissions>>({})

// Initialiser avec un objet vide par défaut
permissionsData[role.name] = data.permissions || {}
```

### Erreur : "Role admin cannot be modified"
C'est normal ! Le rôle admin est protégé et a toujours toutes les permissions.

### Permissions ne s'affichent pas
1. Vérifier que la migration a été exécutée
2. Vérifier les logs du serveur
3. Tester l'API directement avec curl
4. Vérifier la console du navigateur

## 📝 Points Importants

1. **Protection Admin** : Le rôle admin ne peut jamais être modifié
2. **Atomicité** : En base de données, les permissions restent atomiques
3. **Conversion** : La conversion atomique ↔ composé se fait au niveau API
4. **Temps Réel** : Les modifications sont appliquées immédiatement
5. **Notifications** : Feedback visuel pour chaque action

## 🔮 Évolutions Futures

- [ ] Export/Import de configurations de permissions
- [ ] Historique des modifications de permissions
- [ ] Permissions temporaires avec expiration
- [ ] Permissions conditionnelles (ex: "manage bookings si statut = pending")
- [ ] Rôles personnalisés avec permissions héritées

## ✅ Résumé

**Avant :**
- ❌ Matrice complexe avec des dizaines de lignes
- ❌ Permissions atomiques difficiles à comprendre
- ❌ Interface peu intuitive

**Après :**
- ✅ Matrice claire avec 4 permissions par ressource
- ✅ Interface moderne et visuelle
- ✅ Permissions composées faciles à gérer
- ✅ Statistiques en temps réel
- ✅ Système flexible et extensible

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs du serveur
2. Vérifiez la documentation API
3. Testez avec curl pour isoler le problème
4. Vérifiez les permissions en base de données

---

**Date de création** : Aujourd'hui
**Version** : 1.0.0
**Statut** : ✅ Prêt pour la production
