# Sécurité et Permissions - Rôle Manager

## 📋 Résumé des Modifications

Ce document décrit les modifications apportées pour sécuriser l'accès au rôle Manager et respecter la matrice de permissions.

---

## 🔒 Règles de Sécurité Implémentées

### 1. **Protection des Utilisateurs Admin**
- ❌ Les managers ne peuvent **PAS** voir les utilisateurs avec le rôle "admin"
- ❌ Les managers ne peuvent **PAS** modifier les utilisateurs admin
- ❌ Les managers ne peuvent **PAS** supprimer les utilisateurs admin
- ❌ Les managers ne peuvent **PAS** créer de nouveaux administrateurs
- ✅ Seuls les admins peuvent gérer d'autres admins

### 2. **Permissions Basées sur la Matrice**
- ✅ Les managers suivent les permissions définies dans la matrice
- ✅ Les permissions sont vérifiées dynamiquement via `hasUsersPermission()`
- ✅ Les onglets du dashboard sont filtrés selon les permissions
- ❌ Les managers n'ont **PAS** tous les droits automatiquement

### 3. **Accès Restreint aux Fonctionnalités Admin**
- ❌ **Matrice de permissions** : Admin uniquement
- ❌ **Statistiques globales** : Admin uniquement
- ❌ **Gestion des rôles** : Admin uniquement
- ✅ **Gestion des utilisateurs** : Selon permissions (managers inclus)
- ❌ **Onglet "Analytics"** : Caché pour les managers
- ❌ **Onglet "Permissions"** : Caché pour les managers

---

## 📝 Modifications par Fichier

### **API - Utilisateurs** (`src/app/api/admin/users/route.ts`)

#### GET - Liste des utilisateurs
```typescript
// Filtrer les admins : seuls les admins peuvent les voir
if (userRole !== 'admin') {
  rows = rows.filter(user => user.role !== 'admin')
}
```

#### POST - Créer un utilisateur
```typescript
// Seuls les admins peuvent créer d'autres admins
if (normalizedRole === 'admin' && userRole !== 'admin') {
  return NextResponse.json(
    { error: "Seuls les administrateurs peuvent créer d'autres administrateurs" },
    { status: 403 }
  )
}
```

---

### **API - Utilisateur spécifique** (`src/app/api/admin/users/[id]/route.ts`)

#### GET - Récupérer un utilisateur
```typescript
// Seuls les admins peuvent voir d'autres admins
if (user[0].role === 'admin' && userRole !== 'admin') {
  return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
}
```

#### PUT - Modifier un utilisateur
```typescript
// Seuls les admins peuvent modifier d'autres admins
if (existingUser[0].role === 'admin' && userRole !== 'admin') {
  return NextResponse.json(
    { error: "Vous ne pouvez pas modifier un administrateur" },
    { status: 403 }
  )
}

// Seuls les admins peuvent attribuer le rôle admin
if (role === 'admin' && userRole !== 'admin') {
  return NextResponse.json(
    { error: "Seuls les administrateurs peuvent créer d'autres administrateurs" },
    { status: 403 }
  )
}
```

#### DELETE - Supprimer un utilisateur
```typescript
// Seuls les admins peuvent supprimer d'autres admins
if (existingUser[0].role === 'admin' && userRole !== 'admin') {
  return NextResponse.json(
    { error: "Vous ne pouvez pas supprimer un administrateur" },
    { status: 403 }
  )
}
```

---

### **API - Statistiques** (`src/app/api/admin/stats/route.ts`)
```typescript
// Seuls les admins ont accès (pas les managers)
if (userRole !== 'admin') {
  return NextResponse.json({ 
    success: false, 
    message: 'Accès non autorisé. Seuls les administrateurs peuvent accéder aux statistiques globales.' 
  }, { status: 403 })
}
```

---

### **API - Rôles** (`src/app/api/admin/roles/route.ts`)
```typescript
// Seuls les admins peuvent gérer les rôles (matrice de permissions)
if (!session?.user || userRole !== 'admin') {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
}
```

---

### **API - Permissions Composées** (`src/app/api/admin/permissions/composed/route.ts`)
```typescript
// GET, POST, PUT : Seuls les admins
if (!session?.user || userRole !== 'admin') {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
}
```

---

### **Dashboard Admin** (`src/app/admin/dashboard/page.tsx`)
```typescript
const allTabs = [
  { id: 'modern' as TabType, label: 'Dashboard', icon: '🏠', resource: '', always: true },
  { id: 'stats' as TabType, label: 'Statistiques Globales', icon: '📈', resource: '', adminOnly: true },
  { id: 'users' as TabType, label: 'Utilisateurs', icon: '👥', resource: 'users' },
  // ... autres onglets
  { id: 'permissions' as TabType, label: 'Permissions', icon: '🔐', resource: 'users', requireManage: true, adminOnly: true },
]

// Filtrer les onglets selon les permissions
const tabs = allTabs.filter(tab => {
  if (tab.always) return true
  if (permissionsLoading) return true
  
  const userRole = (session?.user as any)?.role
  
  // Les onglets adminOnly sont uniquement pour les admins
  if (tab.adminOnly && userRole !== 'admin') return false
  
  // Pour les administrateurs, montrer tous les onglets
  if (userRole === 'admin') return true
  
  // Pour les managers et autres, vérifier les permissions dynamiques
  if (tab.resource) {
    if (tab.requireManage) {
      return canManage(tab.resource)
    } else {
      return canRead(tab.resource) || canManage(tab.resource)
    }
  }
  
  return false
})
```

---

### **Composant - ModernAdminDashboard** (`src/components/admin/ModernAdminDashboard.tsx`)

#### Actions rapides filtrées
```typescript
const userRole = (session?.user as { role?: string })?.role
const isAdmin = userRole === 'admin'

const allQuickActions: QuickAction[] = [
  // ... actions normales
  {
    id: 'stats',
    title: 'Analytics',
    description: 'Statistiques et performances',
    icon: '📊',
    adminOnly: true,
    onClick: () => onNavigate('stats')
  },
  {
    id: 'permissions',
    title: 'Permissions',
    description: 'Contrôle d\'accès et sécurité',
    icon: '🔐',
    adminOnly: true,
    onClick: () => onNavigate('permissions')
  },
]

// Filtrer les actions selon le rôle
const quickActions = allQuickActions.filter(action => !action.adminOnly || isAdmin)
```

#### Chargement des statistiques
```typescript
// Seuls les admins peuvent charger les statistiques
if (session?.user && userRole === 'admin') {
  fetchStats()
} else {
  setIsLoading(false)
}
```

---

### **Composant - ModernUsersManagement** (`src/components/admin/ModernUsersManagement.tsx`)

#### Fonctions helper
```typescript
// Vérifier si admin ou manager
const isCurrentUserAdmin = () => {
  return !userPermissions || currentUserRole === 'admin' || currentUserRole === 'manager'
}

// Vérifier si strictement admin (pas manager)
const isStrictAdmin = () => {
  return currentUserRole === 'admin'
}
```

#### Select de rôle
```typescript
<option value="customer">👤 Client</option>
<option value="driver">🚗 Chauffeur</option>
{isCurrentUserAdmin() && <option value="manager">👨‍💼 Manager</option>}
{isStrictAdmin() && <option value="admin">👑 Admin</option>}
```

#### Filtre par rôle
```typescript
<option value="">Tous les rôles</option>
{isStrictAdmin() && <option value="admin">👑 Administrateurs</option>}
{isCurrentUserAdmin() && <option value="manager">👨‍💼 Managers</option>}
<option value="driver">🚗 Chauffeurs</option>
<option value="customer">👤 Clients</option>
```

#### Statistiques
```typescript
{isStrictAdmin() && (
  <div>
    <p>{stats.admins}</p>
    <p>Admins</p>
  </div>
)}

{isCurrentUserAdmin() && (
  <div>
    <p>{stats.managers}</p>
    <p>Managers</p>
  </div>
)}
```

---

## 🎯 Comportement Final

### **Manager**
✅ Peut accéder au dashboard admin
✅ Voit les onglets selon ses permissions dans la matrice
✅ Peut gérer les utilisateurs (sauf admins) selon ses permissions
✅ Peut créer des managers, drivers, customers
❌ Ne voit PAS les utilisateurs admin
❌ Ne peut PAS modifier les utilisateurs admin
❌ Ne peut PAS supprimer les utilisateurs admin
❌ Ne peut PAS créer d'admins
❌ N'a PAS accès à la matrice de permissions
❌ N'a PAS accès aux statistiques globales
❌ Ne voit PAS l'onglet "Statistiques Globales"
❌ Ne voit PAS l'onglet "Permissions"
❌ Ne voit PAS la carte "Analytics" sur le dashboard
❌ Ne voit PAS la carte "Permissions" sur le dashboard

### **Admin**
✅ Accès complet à toutes les fonctionnalités
✅ Peut voir et gérer tous les utilisateurs (y compris admins)
✅ Peut modifier la matrice de permissions
✅ Peut voir les statistiques globales
✅ Peut créer d'autres admins

---

## 🧪 Tests Recommandés

1. **Connexion en tant que Manager**
   - Vérifier que le dashboard s'affiche
   - Vérifier que les admins ne sont PAS visibles dans la liste
   - Essayer de créer un admin → Devrait échouer
   - Vérifier que l'onglet "Permissions" n'est pas visible

2. **Connexion en tant qu'Admin**
   - Vérifier accès complet
   - Vérifier visibilité de tous les utilisateurs
   - Vérifier accès à la matrice de permissions

3. **Permissions Dynamiques**
   - Modifier les permissions du manager dans la matrice
   - Vérifier que les onglets s'affichent/disparaissent selon les permissions

---

## 📌 Notes Importantes

- Les permissions sont vérifiées **côté serveur** dans les APIs
- Les vérifications côté client servent uniquement à l'UX (cacher les boutons)
- Un manager malveillant ne peut PAS contourner les restrictions via l'API
- Toutes les actions sensibles nécessitent une vérification du rôle `userRole === 'admin'`
