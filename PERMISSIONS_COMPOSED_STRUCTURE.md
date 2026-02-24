# Structure des Permissions Composées

## 🎯 Concept

La **matrice des permissions** affiche des **permissions composées** qui sont en réalité des groupes de permissions atomiques.

## 📊 Les 4 types de permissions composées

### 1. **`manage [resource]`**
**Actions incluses :** `create`, `read`, `update`, `delete`

**Description :** Gestion complète de la ressource avec accès à toutes les données

**Exemple :** "manage users"
- ✅ Créer des utilisateurs
- ✅ Voir tous les utilisateurs
- ✅ Modifier tous les utilisateurs
- ✅ Supprimer tous les utilisateurs
- ✅ Accès aux données de tous les utilisateurs

### 2. **`read [resource]`**
**Actions incluses :** `read`

**Description :** Lecture seule de ses propres données

**Exemple :** "read users"
- ✅ Voir uniquement ses propres données
- ❌ Ne peut pas créer
- ❌ Ne peut pas modifier
- ❌ Ne peut pas supprimer

### 3. **`update [resource]`**
**Actions incluses :** `update`

**Description :** Modification uniquement de ses propres données

**Exemple :** "update users"
- ✅ Modifier ses propres données
- ✅ Voir ses données (nécessaire pour modifier)
- ❌ Ne peut pas créer
- ❌ Ne peut pas supprimer

### 4. **`delete [resource]`**
**Actions incluses :** `delete`

**Description :** Suppression uniquement de ses propres données

**Exemple :** "delete users"
- ✅ Supprimer ses propres données
- ✅ Voir ses données (nécessaire pour supprimer)
- ❌ Ne peut pas créer
- ❌ Ne peut pas modifier

## 🗂️ Ressources disponibles

Les permissions s'appliquent aux ressources suivantes :

1. **`users`** - Utilisateurs
2. **`vehicles`** - Véhicules
3. **`bookings`** - Réservations
4. **`quotes`** - Devis
5. **`reviews`** - Avis

## 📋 Matrice complète des permissions

### Structure dans la matrice (exemple)

```
┌─────────────────────────────────────────────────────────────┐
│                    Matrice des permissions                   │
├─────────────────────────────────────────────────────────────┤
│ Permissions        │ admin │ manager │ customer │ driver    │
├────────────────────┼───────┼─────────┼──────────┼───────────┤
│ 👥 users           │       │         │          │           │
│   manage users     │   ✅  │   ✅    │    ❌    │    ❌     │
│   read users       │   ✅  │   ✅    │    ✅    │    ❌     │
│   update user      │   ✅  │   ✅    │    ❌    │    ❌     │
│   delete user      │   ✅  │   ✅    │    ❌    │    ❌     │
├────────────────────┼───────┼─────────┼──────────┼───────────┤
│ 🚗 vehicles        │       │         │          │           │
│   manage vehicles  │   ✅  │   ✅    │    ❌    │    ❌     │
│   read vehicles    │   ✅  │   ✅    │    ✅    │    ✅     │
│   update vehicle   │   ✅  │   ✅    │    ❌    │    ❌     │
│   delete vehicle   │   ✅  │   ✅    │    ❌    │    ❌     │
├────────────────────┼───────┼─────────┼──────────┼───────────┤
│ 📅 bookings        │       │         │          │           │
│   manage bookings  │   ✅  │   ✅    │    ❌    │    ❌     │
│   read bookings    │   ✅  │   ✅    │    ✅    │    ✅     │
│   update booking   │   ✅  │   ✅    │    ❌    │    ✅     │
│   delete booking   │   ✅  │   ✅    │    ❌    │    ❌     │
├────────────────────┼───────┼─────────┼──────────┼───────────┤
│ 📋 quotes          │       │         │          │           │
│   manage quotes    │   ✅  │   ✅    │    ❌    │    ❌     │
│   read quotes      │   ✅  │   ✅    │    ✅    │    ❌     │
│   update quote     │   ✅  │   ✅    │    ❌    │    ❌     │
│   delete quote     │   ✅  │   ✅    │    ❌    │    ❌     │
├────────────────────┼───────┼─────────┼──────────┼───────────┤
│ ⭐ reviews         │       │         │          │           │
│   manage reviews   │   ✅  │   ✅    │    ❌    │    ❌     │
│   read reviews     │   ✅  │   ✅    │    ✅    │    ✅     │
│   update review    │   ✅  │   ✅    │    ❌    │    ❌     │
│   delete review    │   ✅  │   ✅    │    ❌    │    ❌     │
└────────────────────┴───────┴─────────┴──────────┴───────────┘
```

## 🔄 Conversion : Permissions composées → Permissions atomiques

### Exemple 1 : Cocher "manage users"

**Dans la matrice :**
```
✅ manage users
```

**Dans la base de données :**
```sql
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('customer', 'users', 'create', true),
('customer', 'users', 'read', true),
('customer', 'users', 'update', true),
('customer', 'users', 'delete', true);
```

**Retour API permissions :**
```json
{
  "users": ["create", "read", "update", "delete"]
}
```

### Exemple 2 : Cocher "read bookings"

**Dans la matrice :**
```
✅ read bookings
```

**Dans la base de données :**
```sql
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('customer', 'bookings', 'read', true);
```

**Retour API permissions :**
```json
{
  "bookings": ["read"]
}
```

### Exemple 3 : Cocher "update bookings" + "delete bookings"

**Dans la matrice :**
```
✅ update bookings
✅ delete bookings
```

**Dans la base de données :**
```sql
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('customer', 'bookings', 'update', true),
('customer', 'bookings', 'delete', true);
```

**Retour API permissions :**
```json
{
  "bookings": ["update", "delete"]
}
```

## 🎨 Affichage dans la matrice

### Logique de détection

```typescript
// Récupérer les permissions atomiques de la DB
const permissions = ['create', 'read', 'update', 'delete']

// Détecter si c'est "manage"
if (permissions.includes('create') && 
    permissions.includes('read') && 
    permissions.includes('update') && 
    permissions.includes('delete')) {
  // Afficher uniquement "manage" coché
  return ['manage']
}

// Sinon, afficher les permissions individuelles
const composed = []
if (permissions.includes('read')) composed.push('read')
if (permissions.includes('update')) composed.push('update')
if (permissions.includes('delete')) composed.push('delete')

return composed
```

### Exemple d'affichage

**Cas 1 :** Permissions atomiques = `['create', 'read', 'update', 'delete']`
```
✅ manage users
⬜ read users
⬜ update user
⬜ delete user
```

**Cas 2 :** Permissions atomiques = `['read']`
```
⬜ manage users
✅ read users
⬜ update user
⬜ delete user
```

**Cas 3 :** Permissions atomiques = `['update', 'delete']`
```
⬜ manage users
⬜ read users
✅ update user
✅ delete user
```

**Cas 4 :** Permissions atomiques = `[]` (aucune)
```
⬜ manage users
⬜ read users
⬜ update user
⬜ delete user
```

## 🔧 API Endpoints

### GET `/api/admin/permissions/composed?role=customer`

**Réponse :**
```json
{
  "success": true,
  "role": "customer",
  "permissions": {
    "users": ["read"],
    "vehicles": ["read"],
    "bookings": ["read", "update"],
    "quotes": ["manage"],
    "reviews": ["read"]
  }
}
```

### POST `/api/admin/permissions/composed`

**Requête :**
```json
{
  "roleName": "customer",
  "resource": "bookings",
  "composedPermission": "manage",
  "enabled": true
}
```

**Effet :**
```sql
-- Supprime toutes les permissions bookings existantes
DELETE FROM role_permissions 
WHERE role_name = 'customer' AND resource = 'bookings';

-- Ajoute les 4 permissions atomiques
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('customer', 'bookings', 'create', true),
('customer', 'bookings', 'read', true),
('customer', 'bookings', 'update', true),
('customer', 'bookings', 'delete', true);
```

### PUT `/api/admin/permissions/composed`

**Requête :**
```json
{
  "roleName": "customer",
  "permissions": {
    "users": ["read"],
    "vehicles": ["read"],
    "bookings": ["manage"],
    "quotes": ["read", "update"],
    "reviews": ["read"]
  }
}
```

**Effet :** Remplace toutes les permissions du rôle par les nouvelles.

## 📝 Règles importantes

### Règle 1 : Exclusivité de "manage"
Si "manage" est coché, les autres permissions de la même ressource sont ignorées.

❌ **Mauvais :**
```
✅ manage users
✅ read users    // Ignoré car manage inclut déjà read
```

✅ **Bon :**
```
✅ manage users
⬜ read users
⬜ update user
⬜ delete user
```

### Règle 2 : Permissions multiples autorisées
On peut cocher plusieurs permissions individuelles :

✅ **Valide :**
```
⬜ manage users
✅ read users
✅ update user
✅ delete user
```

### Règle 3 : Visualisation implicite
`update` et `delete` impliquent automatiquement la capacité de voir les données.

### Règle 4 : Portée des données
- **manage** → Voit TOUTES les données
- **read/update/delete** → Voit UNIQUEMENT ses propres données

## 🧪 Tests de la matrice

### Test 1 : Cocher "manage bookings"

1. Cocher la case "manage bookings"
2. Sauvegarder
3. Vérifier dans la DB :
```sql
SELECT * FROM role_permissions 
WHERE role_name = 'customer' AND resource = 'bookings';

-- Attendu: 4 lignes (create, read, update, delete)
```

### Test 2 : Décocher "manage bookings"

1. Décocher la case "manage bookings"
2. Sauvegarder
3. Vérifier dans la DB :
```sql
SELECT * FROM role_permissions 
WHERE role_name = 'customer' AND resource = 'bookings';

-- Attendu: 0 lignes
```

### Test 3 : Cocher "read bookings" + "update bookings"

1. Cocher "read bookings"
2. Cocher "update bookings"
3. Sauvegarder
4. Vérifier dans la DB :
```sql
SELECT * FROM role_permissions 
WHERE role_name = 'customer' AND resource = 'bookings';

-- Attendu: 2 lignes (read, update)
```

## 🎉 Résumé

✅ **4 permissions composées** : manage, read, update, delete  
✅ **5 ressources** : users, vehicles, bookings, quotes, reviews  
✅ **20 lignes dans la matrice** : 4 permissions × 5 ressources  
✅ **Conversion automatique** : Composées → Atomiques  
✅ **Détection automatique** : Atomiques → Composées  
✅ **API dédiée** : `/api/admin/permissions/composed`

La matrice est maintenant **simple, claire et puissante** ! 🚀
