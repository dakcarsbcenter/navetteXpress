# Logique de la Matrice des Permissions

## 🎯 Principe fondamental

**Chaque permission cochée dans la matrice donne UNIQUEMENT l'action spécifique cochée.**

Si un rôle n'a **aucune permission cochée** pour une ressource → **Pas d'accès du tout** (pas d'onglet, pas de données).

## 📊 Permissions disponibles

### Actions individuelles

| Permission | Ce qu'elle autorise | Interface utilisateur |
|-----------|---------------------|----------------------|
| **`read`** | Voir uniquement ses propres données | ✅ Onglet visible<br>✅ Liste des données<br>❌ Pas de bouton créer<br>❌ Pas de boutons modifier/supprimer |
| **`create`** | Créer de nouvelles entrées | ✅ Onglet visible<br>✅ Bouton "Créer/Nouveau"<br>✅ Voir ses données (pour créer)<br>❌ Pas de boutons modifier/supprimer |
| **`update`** | Modifier des entrées existantes | ✅ Onglet visible<br>✅ Bouton "Modifier" (✏️)<br>✅ Voir ses données (pour modifier)<br>❌ Pas de bouton créer<br>❌ Pas de bouton supprimer |
| **`delete`** | Supprimer des entrées | ✅ Onglet visible<br>✅ Bouton "Supprimer" (🗑️)<br>✅ Voir ses données (pour supprimer)<br>❌ Pas de bouton créer<br>❌ Pas de bouton modifier |
| **`manage`** | Toutes les actions | ✅ Onglet visible<br>✅ Voir TOUTES les données<br>✅ Bouton créer<br>✅ Boutons modifier<br>✅ Boutons supprimer |

### Permission `manage` (super-permission)

La permission **`manage`** est équivalente à avoir **toutes les autres permissions** (`read` + `create` + `update` + `delete`) **PLUS** la capacité de voir les données de **tous les utilisateurs**.

```
manage = read + create + update + delete + voir_toutes_les_données
```

## 🔄 Logique d'affichage

### 1. Affichage de l'onglet

Un onglet s'affiche si l'utilisateur a **AU MOINS UNE** permission pour cette ressource :

```typescript
const canViewBookings = 
  hasBookingsReadPermission || 
  hasBookingsCreatePermission || 
  hasBookingsUpdatePermission || 
  hasBookingsDeletePermission

// Onglet visible si canViewBookings === true
```

### 2. Affichage des boutons d'action

Chaque bouton s'affiche **UNIQUEMENT** si la permission spécifique est cochée :

```tsx
{/* Bouton Créer - visible seulement avec 'create' ou 'manage' */}
{hasBookingsCreatePermission && (
  <button>Nouvelle réservation</button>
)}

{/* Bouton Modifier - visible seulement avec 'update' ou 'manage' */}
{hasBookingsUpdatePermission && (
  <button>✏️ Modifier</button>
)}

{/* Bouton Supprimer - visible seulement avec 'delete' ou 'manage' */}
{hasBookingsDeletePermission && (
  <button>🗑️ Supprimer</button>
)}
```

### 3. Filtrage des données

| Permission | Données visibles |
|-----------|------------------|
| `read` | Ses propres données uniquement |
| `create` | Ses propres données uniquement |
| `update` | Ses propres données uniquement |
| `delete` | Ses propres données uniquement |
| `manage` | **Toutes les données** de tous les utilisateurs |

## 📋 Exemples pratiques

### Exemple 1 : Utilisateur avec UNIQUEMENT `read`

**Configuration dans la base de données :**
```sql
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES ('customer', 'bookings', 'read', true);
```

**Résultat dans l'interface :**
- ✅ Onglet "Mes réservations" visible
- ✅ Liste de ses propres réservations
- ❌ Pas de bouton "Nouvelle réservation"
- ❌ Pas de bouton "Modifier" (✏️)
- ❌ Pas de bouton "Supprimer" (🗑️)

**Variables calculées :**
```typescript
hasBookingsReadPermission = true
hasBookingsCreatePermission = false
hasBookingsUpdatePermission = false
hasBookingsDeletePermission = false
canViewBookings = true
```

### Exemple 2 : Utilisateur avec `read` + `create`

**Configuration dans la base de données :**
```sql
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES 
  ('customer', 'bookings', 'read', true),
  ('customer', 'bookings', 'create', true);
```

**Résultat dans l'interface :**
- ✅ Onglet "Mes réservations" visible
- ✅ Liste de ses propres réservations
- ✅ Bouton "Nouvelle réservation"
- ❌ Pas de bouton "Modifier" (✏️)
- ❌ Pas de bouton "Supprimer" (🗑️)

**Variables calculées :**
```typescript
hasBookingsReadPermission = true
hasBookingsCreatePermission = true
hasBookingsUpdatePermission = false
hasBookingsDeletePermission = false
canViewBookings = true
```

### Exemple 3 : Utilisateur avec `update` UNIQUEMENT (sans read)

**Configuration dans la base de données :**
```sql
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES ('customer', 'bookings', 'update', true);
```

**Résultat dans l'interface :**
- ✅ Onglet "Mes réservations" visible
- ✅ Liste de ses propres réservations (nécessaire pour modifier)
- ❌ Pas de bouton "Nouvelle réservation"
- ✅ Bouton "Modifier" (✏️)
- ❌ Pas de bouton "Supprimer" (🗑️)

**Note :** `update` implique automatiquement la capacité de **voir** ses données (sinon impossible de modifier).

**Variables calculées :**
```typescript
hasBookingsReadPermission = false  // Pas explicitement read
hasBookingsCreatePermission = false
hasBookingsUpdatePermission = true
hasBookingsDeletePermission = false
canViewBookings = true  // true car update implique visualisation
```

### Exemple 4 : Utilisateur avec `manage`

**Configuration dans la base de données :**
```sql
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES ('manager', 'bookings', 'manage', true);
```

**Résultat dans l'interface :**
- ✅ Onglet "Mes réservations" visible
- ✅ Liste de **TOUTES** les réservations (tous utilisateurs)
- ✅ Bouton "Nouvelle réservation"
- ✅ Bouton "Modifier" (✏️) sur chaque réservation
- ✅ Bouton "Supprimer" (🗑️) sur chaque réservation

**Variables calculées :**
```typescript
hasBookingsManagePermission = true
hasBookingsReadPermission = true  // manage implique read
hasBookingsCreatePermission = true  // manage implique create
hasBookingsUpdatePermission = true  // manage implique update
hasBookingsDeletePermission = true  // manage implique delete
canViewBookings = true
```

### Exemple 5 : Utilisateur SANS permissions

**Configuration dans la base de données :**
```sql
-- Aucune permission pour bookings
```

**Résultat dans l'interface :**
- ❌ Onglet "Mes réservations" **NON visible**
- ❌ Aucun accès aux données
- ❌ Aucun bouton

**Variables calculées :**
```typescript
hasBookingsReadPermission = false
hasBookingsCreatePermission = false
hasBookingsUpdatePermission = false
hasBookingsDeletePermission = false
canViewBookings = false  // Onglet non affiché
```

### Exemple 6 : Permissions mixtes sur plusieurs ressources

**Configuration dans la base de données :**
```sql
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES 
  ('customer', 'bookings', 'read', true),
  ('customer', 'quotes', 'manage', true),
  ('customer', 'reviews', 'create', true),
  ('customer', 'reviews', 'read', true);
```

**Résultat dans l'interface :**

**Bookings (réservations) :**
- ✅ Onglet visible
- ✅ Voir ses réservations
- ❌ Pas créer/modifier/supprimer

**Quotes (devis) :**
- ✅ Onglet visible
- ✅ Voir **TOUS** les devis
- ✅ Créer des devis
- ✅ Modifier des devis
- ✅ Supprimer des devis

**Reviews (avis) :**
- ✅ Onglet visible
- ✅ Voir ses avis
- ✅ Créer des avis
- ❌ Pas modifier/supprimer

## 🔒 Sécurité API

Les API vérifient les permissions **côté serveur** :

```typescript
// Exemple : API GET bookings
export async function GET(request: NextRequest) {
  const hasReadPermission = await hasBookingsPermission(userRole, 'read');
  
  if (!hasReadPermission) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const hasManagePermission = await hasBookingsPermission(userRole, 'update') || 
                              await hasBookingsPermission(userRole, 'delete');

  if (hasManagePermission) {
    // Retourner TOUTES les données
    return db.select().from(bookingsTable);
  } else {
    // Retourner UNIQUEMENT les données de l'utilisateur
    return db.select().from(bookingsTable)
      .where(eq(bookingsTable.userId, session.user.id));
  }
}
```

## 📝 Règles importantes

### Règle 1 : Permissions indépendantes
Chaque permission est **indépendante**. Avoir `create` ne donne pas `update`.

### Règle 2 : Visualisation implicite
Les permissions `create`, `update`, `delete` impliquent la capacité de **voir les données** (sinon impossible d'agir dessus).

### Règle 3 : Manage = Super permission
`manage` donne **toutes les permissions** + accès à **toutes les données**.

### Règle 4 : Aucune permission = Aucun accès
Si aucune permission n'est cochée pour une ressource, l'onglet n'apparaît pas.

### Règle 5 : Admin bypass
Les utilisateurs avec `role = 'admin'` ont **toujours** toutes les permissions, sans vérification dans la table `role_permissions`.

## 🎨 Code de vérification des permissions

```typescript
// Bookings
const hasBookingsManagePermission = userPermissions.bookings?.includes('manage')
const hasBookingsReadPermission = userPermissions.bookings?.includes('read') || hasBookingsManagePermission
const hasBookingsCreatePermission = userPermissions.bookings?.includes('create') || hasBookingsManagePermission
const hasBookingsUpdatePermission = userPermissions.bookings?.includes('update') || hasBookingsManagePermission
const hasBookingsDeletePermission = userPermissions.bookings?.includes('delete') || hasBookingsManagePermission

// L'onglet s'affiche si AU MOINS une permission existe
const canViewBookings = 
  hasBookingsReadPermission || 
  hasBookingsCreatePermission || 
  hasBookingsUpdatePermission || 
  hasBookingsDeletePermission
```

## 🧪 Matrice de test

| Permissions cochées | Onglet visible | Voir données | Créer | Modifier | Supprimer | Portée des données |
|-------------------|----------------|--------------|-------|----------|-----------|-------------------|
| Aucune | ❌ | ❌ | ❌ | ❌ | ❌ | N/A |
| `read` | ✅ | ✅ | ❌ | ❌ | ❌ | Ses données |
| `create` | ✅ | ✅ | ✅ | ❌ | ❌ | Ses données |
| `update` | ✅ | ✅ | ❌ | ✅ | ❌ | Ses données |
| `delete` | ✅ | ✅ | ❌ | ❌ | ✅ | Ses données |
| `read` + `create` | ✅ | ✅ | ✅ | ❌ | ❌ | Ses données |
| `read` + `update` | ✅ | ✅ | ❌ | ✅ | ❌ | Ses données |
| `create` + `update` + `delete` | ✅ | ✅ | ✅ | ✅ | ✅ | Ses données |
| `manage` | ✅ | ✅ | ✅ | ✅ | ✅ | **Toutes les données** |

## 🎯 Résumé

✅ **Une permission = Une action spécifique**  
✅ **Manage = Toutes les actions + toutes les données**  
✅ **Aucune permission = Aucun accès**  
✅ **Au moins une permission = Onglet visible**  
✅ **Sécurité côté serveur**

Le système est maintenant **granulaire, précis et sécurisé** ! 🚀
