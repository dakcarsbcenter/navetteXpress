# 👥 Onglet Utilisateurs - Dashboard Client

## 📋 Vue d'ensemble

Ajout d'un onglet **"Utilisateurs"** dans le tableau de bord client pour les utilisateurs avec le rôle `customer` qui ont reçu les permissions appropriées (`manage users`, `read users`, etc.).

## ✨ Fonctionnalités

### 🔐 Vérification des permissions

L'onglet s'affiche uniquement si l'utilisateur customer possède au moins l'une des permissions suivantes :
- ✅ `users.manage` - Gestion complète
- 👁️ `users.read` - Lecture seule
- ➕ `users.create` - Création d'utilisateurs
- ✏️ `users.update` - Modification d'utilisateurs
- 🗑️ `users.delete` - Suppression d'utilisateurs

### 📊 Contenu de l'onglet

1. **Header avec titre et description**
   - Icône 👥
   - Titre "Gestion des utilisateurs"
   - Description explicative

2. **Card de redirection vers l'interface admin**
   - Icône SVG moderne
   - Titre et description
   - Bouton "Accéder à la gestion des utilisateurs"
   - Lien vers `/admin/users`

3. **Grille d'informations (2 colonnes)**

   **Colonne 1 : Vos permissions actuelles**
   - Liste des permissions de l'utilisateur
   - Indicateur visuel vert
   - Format : "action users" (ex: "read users", "manage users")

   **Colonne 2 : Fonctionnalités disponibles**
   - Liste des actions possibles selon les permissions
   - Icônes colorées par action :
     - 👁️ Consulter (bleu)
     - ➕ Créer (vert)
     - ✏️ Modifier (orange)
     - 🗑️ Supprimer (rouge)
     - ⚡ Gestion complète (violet)

## 🛠️ Implémentation technique

### Modification du type TabType

```typescript
type TabType = 'overview' | 'bookings' | 'quotes' | 'reviews' | 'create-reviews' | 'profile' | 'vehicles' | 'users'
```

### Vérification des permissions

```typescript
const canManageUsers = userPermissions.users?.includes('manage') || 
                      userPermissions.users?.includes('read') ||
                      userPermissions.users?.includes('create') ||
                      userPermissions.users?.includes('update')
```

### Ajout de l'onglet conditionnel

```typescript
const tabs = [
  // ... autres onglets
  ...(canManageUsers ? [{ id: 'users' as TabType, label: 'Utilisateurs', icon: '👥' }] : []),
  { id: 'profile' as TabType, label: 'Mon profil', icon: '👤' },
]
```

### Contenu de la page

```typescript
case 'users':
  return (
    // Card avec redirection vers /admin/users
    // Affichage des permissions actuelles
    // Liste des fonctionnalités disponibles
  )
```

## 🎨 Design

### Style et layout
- Card blanche/sombre avec bordure et ombre
- Header avec gradient et icône
- Grille responsive (1 colonne mobile, 2 colonnes desktop)
- Bouton bleu avec icône externe
- Backgrounds colorés pour les sections

### Dark mode
- Support complet du mode sombre
- `dark:bg-slate-800`, `dark:text-white`
- `dark:bg-blue-900/20` pour les accents

## 🔄 Flux utilisateur

1. **Admin assigne les permissions** :
   - Via `/admin/roles`
   - Sélectionne le rôle `customer`
   - Ajoute `users.manage` et/ou `users.read`

2. **Customer se connecte** :
   - API `/api/auth/permissions` charge les permissions
   - Dashboard affiche l'onglet 👥 **Utilisateurs**

3. **Customer clique sur l'onglet** :
   - Voit ses permissions actuelles
   - Voit les fonctionnalités disponibles
   - Peut cliquer sur "Accéder à la gestion des utilisateurs"

4. **Redirection vers `/admin/users`** :
   - Interface complète de gestion
   - Fonctionnalités limitées selon permissions
   - Contrôle d'accès côté API

## 🔐 Sécurité

### Vérifications en place

1. **Frontend (Dashboard client)** :
   - Vérification des permissions pour afficher l'onglet
   - Vérification des permissions pour afficher les fonctionnalités

2. **Backend (API)** :
   - L'API `/admin/users` vérifie les permissions
   - Chaque action (GET, POST, PUT, DELETE) vérifie le rôle et les permissions
   - Même si le customer accède à `/admin/users`, les actions sont contrôlées

### Permissions dynamiques

Le système vérifie :
```typescript
userPermissions.users?.includes('action')
```

Où `action` peut être :
- `read` - Lecture seule
- `create` - Créer de nouveaux utilisateurs
- `update` - Modifier des utilisateurs existants
- `delete` - Supprimer des utilisateurs
- `manage` - Tous les droits ci-dessus

## 📱 Responsive

- Mobile : 1 colonne pour les cards d'information
- Tablet/Desktop : 2 colonnes (md:grid-cols-2)
- Padding adaptatif (p-4 sm:p-6)
- Bouton full-width sur mobile

## ✅ Avantages

1. **Flexibilité** : L'admin peut donner des permissions granulaires aux customers
2. **Sécurité** : Double vérification (frontend + backend)
3. **UX cohérente** : Même interface que l'admin
4. **Clarté** : L'utilisateur voit exactement ce qu'il peut faire
5. **Évolutivité** : Facile d'ajouter d'autres ressources (bookings, reviews, etc.)

## 🎯 Cas d'usage

### Exemple 1 : Customer Manager
Un customer avec `users.manage` peut :
- ✅ Voir tous les utilisateurs de son organisation
- ✅ Créer de nouveaux utilisateurs (drivers, autres customers)
- ✅ Modifier les profils utilisateurs
- ✅ Désactiver des comptes

### Exemple 2 : Customer avec read-only
Un customer avec `users.read` peut :
- ✅ Voir la liste des utilisateurs
- ❌ Ne peut pas créer/modifier/supprimer
- ℹ️ L'interface affiche les informations en mode lecture seule

## 📊 Statistiques visibles

L'onglet affiche :
- Liste complète des permissions actuelles
- Icônes colorées pour chaque action
- Description claire de chaque fonctionnalité

---

**Fichiers modifiés** :
- ✅ `src/app/client/dashboard/page.tsx`

**API utilisée** :
- ✅ `GET /api/auth/permissions`
- ✅ `GET /admin/users` (via redirection)

**Date** : 16 Octobre 2025
**Contexte** : Dashboard client avec système de permissions dynamiques
