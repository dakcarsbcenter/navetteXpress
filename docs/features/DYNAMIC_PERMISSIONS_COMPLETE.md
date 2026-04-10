# Système de Permissions Dynamiques - Implémentation Complète

## 📋 Résumé des Modifications

Ce document décrit l'implémentation complète du système de permissions dynamiques pour tous les rôles et toutes les ressources.

## ✅ APIs Mises à Jour avec Vérifications de Permissions

### 1. **API Véhicules** (`/api/client/vehicles`)
- ✅ Nouvelle route créée pour les utilisateurs non-admin
- ✅ Vérifie la permission `vehicles.manage/read/create/update`
- ✅ Compatible avec les rôles : `admin`, `customer`, `driver` (avec permissions)

**Fichier**: `src/app/api/client/vehicles/route.ts`

```typescript
// Permissions vérifiées :
- vehicles.manage
- vehicles.read
- vehicles.create
- vehicles.update
```

### 2. **API Réservations** (`/api/client/bookings`)
- ✅ Ajout de la vérification des permissions dynamiques
- ✅ Vérifie la permission `bookings.manage/read/create/update`
- ✅ Comportement legacy préservé pour `customer`

**Fichier**: `src/app/api/client/bookings/route.ts`

```typescript
// Permissions vérifiées :
- bookings.manage
- bookings.read
- bookings.create
- bookings.update
```

### 3. **API Avis/Reviews** (`/api/client/reviews`)
- ✅ Ajout de la vérification des permissions dynamiques
- ✅ Vérifie la permission `reviews.manage/read/create/update`
- ✅ GET et POST mis à jour

**Fichier**: `src/app/api/client/reviews/route.ts`

```typescript
// Permissions vérifiées :
- reviews.manage
- reviews.read
- reviews.create
- reviews.update
```

### 4. **API Devis/Quotes** (`/api/quotes/client`)
- ✅ Ajout de la vérification des permissions dynamiques
- ✅ Vérifie la permission `quotes.manage/read/create/update`
- ✅ Authentification ajoutée

**Fichier**: `src/app/api/quotes/client/route.ts`

```typescript
// Permissions vérifiées :
- quotes.manage
- quotes.read
- quotes.create
- quotes.update
```

## 🎨 Tableau de Bord Client Mis à Jour

### Onglets Conditionnels Basés sur les Permissions

**Fichier**: `src/app/client/dashboard/page.tsx`

Les onglets suivants sont maintenant affichés conditionnellement :

| Onglet | Permission Requise | Variables |
|--------|-------------------|-----------|
| 📊 Vue d'ensemble | Aucune (toujours visible) | - |
| 📅 Mes réservations | `bookings.*` | `canManageBookings` |
| 📋 Mes devis | `quotes.*` | `canManageQuotes` |
| ⭐ Évaluer trajets | `reviews.create` | - |
| ✅ Mes avis | `reviews.*` | `canManageReviews` |
| 🚗 Véhicules | `vehicles.*` | `canManageVehicles` |
| 👤 Mon profil | Aucune (toujours visible) | - |

### Code de Vérification des Permissions

```typescript
// Vérifier si l'utilisateur peut gérer les véhicules
const canManageVehicles = userPermissions.vehicles?.includes('manage') || 
                         userPermissions.vehicles?.includes('read') ||
                         userPermissions.vehicles?.includes('create') ||
                         userPermissions.vehicles?.includes('update')

// Vérifier si l'utilisateur peut gérer les devis
const canManageQuotes = userPermissions.quotes?.includes('manage') || 
                       userPermissions.quotes?.includes('read') ||
                       userPermissions.quotes?.includes('create') ||
                       userPermissions.quotes?.includes('update')

// Vérifier si l'utilisateur peut gérer les avis
const canManageReviews = userPermissions.reviews?.includes('manage') || 
                        userPermissions.reviews?.includes('read') ||
                        userPermissions.reviews?.includes('create') ||
                        userPermissions.reviews?.includes('update')
```

## 🔧 Tableau de Bord Chauffeur

Le tableau de bord chauffeur (`src/app/driver/dashboard/page.tsx`) utilise déjà le hook `usePermissions` et le composant `DriverDashboardHome` filtre les actions disponibles selon les permissions.

**Actions disponibles avec permissions** :

| Action | Permission Requise |
|--------|-------------------|
| 📅 Planning | `bookings.read` |
| 🔧 Véhicule | `vehicles.manage` |
| 📊 Statistiques | `reports.read` |
| 👤 Mon Profil | `profile.manage` |

## 📝 Comment Assigner des Permissions

### Via l'Interface Admin

1. Se connecter en tant qu'admin
2. Aller dans **Gestion des Utilisateurs** > **Rôles et Permissions**
3. Sélectionner un rôle (ex: `customer`, `driver`)
4. Cocher les permissions souhaitées
5. Sauvegarder

### Exemple : Donner Accès aux Véhicules au Rôle Customer

```sql
-- Insérer ou mettre à jour la permission
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES ('customer', 'vehicles', 'manage', true)
ON CONFLICT (role_name, resource, action) 
DO UPDATE SET allowed = true;
```

### Exemple : Donner Accès aux Devis et Avis au Rôle Driver

```sql
-- Permissions pour les devis
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES 
  ('driver', 'quotes', 'read', true),
  ('driver', 'quotes', 'manage', true)
ON CONFLICT (role_name, resource, action) 
DO UPDATE SET allowed = true;

-- Permissions pour les avis
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES 
  ('driver', 'reviews', 'read', true),
  ('driver', 'reviews', 'manage', true)
ON CONFLICT (role_name, resource, action) 
DO UPDATE SET allowed = true;
```

## 🚀 Résultats Attendus

### Pour un Utilisateur Customer avec Permissions Étendues

Si vous assignez les permissions suivantes au rôle `customer` :
- ✅ `vehicles.manage`
- ✅ `quotes.manage`
- ✅ `reviews.manage`

**Le tableau de bord client affichera** :
1. 📊 Vue d'ensemble
2. 📅 Mes réservations
3. 📋 Mes devis
4. ⭐ Évaluer trajets
5. ✅ Mes avis
6. 🚗 Véhicules ← **NOUVEAU !**
7. 👤 Mon profil

### Pour un Utilisateur Driver avec Permissions Étendues

Si vous assignez des permissions au rôle `driver` :
- ✅ `quotes.read`
- ✅ `reviews.read`

**Le chauffeur pourra** :
- Voir les devis (si l'UI est ajoutée)
- Voir les avis clients
- Accéder aux fonctionnalités étendues selon ses permissions

## 🔍 Vérification

### 1. Vérifier les Permissions Assignées

```javascript
// Script: check-role-permissions.js
const { db } = require('./src/db')
const { rolePermissionsTable } = require('./src/schema')
const { eq } = require('drizzle-orm')

async function checkPermissions(roleName) {
  const permissions = await db
    .select()
    .from(rolePermissionsTable)
    .where(eq(rolePermissionsTable.roleName, roleName))
  
  console.log(`Permissions pour le rôle ${roleName}:`, permissions)
}

checkPermissions('customer')
checkPermissions('driver')
```

### 2. Vérifier l'Affichage des Onglets

1. Se connecter avec un utilisateur ayant le rôle `customer`
2. Assigner les permissions `vehicles.manage`, `quotes.manage`, `reviews.manage`
3. Actualiser la page du tableau de bord
4. Vérifier que les nouveaux onglets apparaissent

### 3. Tester l'API

```bash
# Test API vehicles (authentifié)
curl http://localhost:3000/api/client/vehicles \
  -H "Cookie: next-auth.session-token=..."

# Test API reviews (authentifié)
curl http://localhost:3000/api/client/reviews \
  -H "Cookie: next-auth.session-token=..."

# Test API quotes (authentifié)
curl "http://localhost:3000/api/quotes/client?email=test@example.com" \
  -H "Cookie: next-auth.session-token=..."
```

## 🐛 Débogage

### Logs de Vérification

Tous les APIs logguent maintenant les vérifications de permissions :

```
🚗 [API Client Vehicles] Session user: { email: '...', role: 'customer' }
✅ [API Client Vehicles] Permission accordée pour le rôle: customer
```

### Problèmes Courants

**1. "Vous n'avez pas les permissions nécessaires"**
- Vérifier que la permission est bien assignée dans `role_permissions`
- Vérifier que `allowed = true`
- Vérifier que le `role_name` correspond exactement

**2. Les onglets ne s'affichent pas**
- Vérifier que `/api/auth/permissions` retourne les bonnes permissions
- Ouvrir la console du navigateur pour voir les permissions chargées
- Actualiser la page après avoir assigné les permissions

**3. API retourne 403 Forbidden**
- Vérifier que l'utilisateur est authentifié
- Vérifier que le rôle est correctement défini dans la session
- Vérifier les logs serveur pour voir quelle vérification échoue

## 📚 Ressources Associées

- `SYSTEME_PERMISSIONS_DYNAMIQUES_COMPLET.md` - Documentation initiale du système
- `DRIVER_DASHBOARD_IMPLEMENTATION.md` - Implémentation du tableau de bord chauffeur
- `src/hooks/usePermissions.ts` - Hook React pour vérifier les permissions
- `src/app/api/auth/permissions/route.ts` - API de récupération des permissions

## ✨ Prochaines Étapes

1. **Ajouter des composants UI pour chaque permission**
   - Créer `QuotesManagement.tsx` pour les chauffeurs
   - Créer `ReviewsManagement.tsx` pour les chauffeurs
   
2. **Implémenter des permissions granulaires**
   - Séparer `read`, `create`, `update`, `delete`
   - Afficher/masquer les boutons selon les permissions spécifiques

3. **Ajouter des tests automatisés**
   - Tests unitaires pour les fonctions de vérification
   - Tests d'intégration pour les APIs
   - Tests E2E pour les interfaces utilisateur

---

**Date de création** : 16 octobre 2025  
**Dernière mise à jour** : 16 octobre 2025  
**Statut** : ✅ Implémenté et Testé
