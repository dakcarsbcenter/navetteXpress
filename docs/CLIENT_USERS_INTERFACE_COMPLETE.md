# 👥 Interface Client - Gestion des Utilisateurs

## 📋 Vue d'ensemble

Implémentation d'une interface complète de gestion des utilisateurs dans le dashboard client, réutilisant le composant `ModernUsersManagement` de l'admin avec une couche de vérification des permissions.

## ✨ Composant créé : ClientUsersManagement

### 📁 Fichier
`src/components/client/ClientUsersManagement.tsx`

### 🎯 Fonctionnalités

1. **Chargement des permissions** :
   - Appel à `/api/auth/permissions` au montage
   - Vérification si l'utilisateur a au moins une permission sur `users`

2. **Affichage conditionnel** :
   - **Loading state** : Spinner pendant le chargement
   - **Accès refusé** : Message d'erreur si aucune permission
   - **Interface complète** : Composant admin si permissions OK

3. **Header informatif** :
   - Bandeau bleu avec icône d'information
   - Liste des permissions actuelles de l'utilisateur
   - Badges colorés par type de permission

### 🔐 Vérification des permissions

```typescript
const hasUsersPermission = 
  userPermissions.users?.includes('manage') ||
  userPermissions.users?.includes('read') ||
  userPermissions.users?.includes('create') ||
  userPermissions.users?.includes('update') ||
  userPermissions.users?.includes('delete')
```

### 🎨 Badges de permissions

| Permission | Badge | Couleur |
|-----------|-------|---------|
| `manage` | ⚡ Gestion complète | Bleu |
| `read` | 👁️ Lecture | Bleu |
| `create` | ➕ Création | Bleu |
| `update` | ✏️ Modification | Bleu |
| `delete` | 🗑️ Suppression | Bleu |

## 🔄 Intégration au Dashboard Client

### Modifications dans `src/app/client/dashboard/page.tsx`

1. **Import du composant** :
```typescript
import { ClientUsersManagement } from "@/components/client/ClientUsersManagement"
```

2. **Cas 'users' simplifié** :
```typescript
case 'users':
  return <ClientUsersManagement />
```

## 🎯 Fonctionnalités héritées de ModernUsersManagement

### 👀 Vue d'ensemble
- **Deux modes d'affichage** : Cards ou Tableau
- **Statistiques** : Total users, par rôle, actifs/inactifs
- **Recherche** : Par nom, email, rôle
- **Filtres** : Role, Status, Search
- **Tri** : Par nom, email, date, avec ordre asc/desc

### ➕ Création d'utilisateurs
- Modal complet avec formulaire
- Champs : Nom, Email, Rôle, Téléphone, Numéro de permis
- Upload de photo de profil
- Génération de mot de passe
- Activation/Désactivation

### ✏️ Modification d'utilisateurs
- Modal d'édition pré-rempli
- Tous les champs modifiables
- Changement de photo
- Toggle actif/inactif

### 🗑️ Suppression d'utilisateurs
- Confirmation avant suppression
- Message d'avertissement

### 🔑 Gestion des mots de passe
- Modal de réinitialisation
- Nouveau mot de passe

### 📸 Upload de photos
- Composant `UniversalProfilePhotoUpload`
- Upload vers Cloudinary
- Preview en temps réel

## 🔐 Contrôle d'accès multi-niveaux

### 1. **Niveau Dashboard** (page.tsx)
```typescript
const canManageUsers = userPermissions.users?.includes('manage') || 
                      userPermissions.users?.includes('read') ||
                      userPermissions.users?.includes('create') ||
                      userPermissions.users?.includes('update')
```
→ Affiche/cache l'onglet 👥 Utilisateurs

### 2. **Niveau Composant** (ClientUsersManagement.tsx)
```typescript
if (!hasUsersPermission) {
  return <AccessDeniedMessage />
}
```
→ Vérifie les permissions avant d'afficher l'interface

### 3. **Niveau API** (/api/admin/users)
→ Vérifie le rôle et les permissions pour chaque opération
- GET : Lecture
- POST : Création
- PUT/PATCH : Modification
- DELETE : Suppression

## 🎨 Design et UX

### Header informatif
```
┌─────────────────────────────────────────────────┐
│ ℹ️  Vos permissions actuelles                   │
│                                                  │
│ • ⚡ Gestion complète  • 👁️ Lecture            │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Message d'accès refusé
```
┌─────────────────────────────────────────────────┐
│ ⚠️  Accès refusé                                │
│                                                  │
│     Vous n'avez pas les permissions             │
│     nécessaires pour gérer les utilisateurs.    │
└─────────────────────────────────────────────────┘
```

### Interface complète
- Même design que l'admin
- Cards modernes avec photos
- Filtres et recherche intuitifs
- Actions contextuelles selon permissions

## 📱 Responsive

- **Mobile** : Cards en 1 colonne, menu hamburger
- **Tablet** : Cards en 2 colonnes, filtres inline
- **Desktop** : Cards en 3 colonnes, tous les filtres visibles

## 🔄 Flux utilisateur complet

1. **Admin assigne les permissions** :
   ```
   Rôle: customer
   Resource: users
   Actions: manage, read, create, update
   ```

2. **Customer se connecte** :
   - Voit l'onglet 👥 **Utilisateurs** dans le dashboard
   - Clique dessus

3. **Chargement de l'interface** :
   - Spinner de chargement
   - Appel à `/api/auth/permissions`
   - Vérification des permissions

4. **Affichage du header** :
   - Bandeau bleu informatif
   - Liste des permissions actuelles
   - Badges colorés

5. **Interface de gestion** :
   - Liste complète des utilisateurs
   - Filtres et recherche
   - Actions disponibles selon permissions

6. **Actions possibles** :
   - **Avec `read`** : Voir la liste uniquement
   - **Avec `create`** : Bouton "➕ Ajouter un utilisateur"
   - **Avec `update`** : Bouton "✏️ Modifier" sur chaque card
   - **Avec `delete`** : Bouton "🗑️ Supprimer" sur chaque card
   - **Avec `manage`** : Toutes les actions disponibles

## ⚡ Permissions granulaires

| Action | API Endpoint | Permission requise |
|--------|-------------|-------------------|
| Voir la liste | GET /api/admin/users | `read` ou `manage` |
| Créer un utilisateur | POST /api/admin/users | `create` ou `manage` |
| Modifier un utilisateur | PUT /api/admin/users/:id | `update` ou `manage` |
| Supprimer un utilisateur | DELETE /api/admin/users/:id | `delete` ou `manage` |
| Changer le mot de passe | POST /api/admin/users/:id/password | `update` ou `manage` |

## 🎯 Avantages de cette approche

1. **Réutilisation du code** :
   - Même composant pour admin et client
   - Évite la duplication
   - Maintenance simplifiée

2. **Sécurité renforcée** :
   - Triple vérification (dashboard + composant + API)
   - Permissions granulaires
   - Messages d'erreur clairs

3. **UX cohérente** :
   - Même interface que l'admin
   - Apprentissage facilité
   - Expérience professionnelle

4. **Flexibilité** :
   - Permissions ajustables par l'admin
   - Pas de code en dur
   - Scalable facilement

5. **Transparence** :
   - L'utilisateur voit ses permissions
   - Messages d'information clairs
   - Pas de fonctionnalités cachées

## 🚀 Performance

- **Lazy loading** : Le composant charge uniquement si nécessaire
- **Optimistic updates** : Actions instantanées avec rollback
- **Caching** : Permissions en cache après premier chargement
- **Debouncing** : Recherche optimisée avec délai

## 📊 Cas d'usage

### Exemple 1 : Customer avec manage
```typescript
permissions: {
  users: ['manage']
}
```
→ Peut tout faire (CRUD complet)

### Exemple 2 : Customer avec read + create
```typescript
permissions: {
  users: ['read', 'create']
}
```
→ Peut voir la liste et créer, mais pas modifier/supprimer

### Exemple 3 : Customer avec read seulement
```typescript
permissions: {
  users: ['read']
}
```
→ Peut voir la liste en lecture seule, aucun bouton d'action

### Exemple 4 : Customer sans permission
```typescript
permissions: {
  vehicles: ['manage'],
  bookings: ['read']
}
```
→ Onglet Utilisateurs pas visible, accès refusé si URL directe

---

**Fichiers créés/modifiés** :
- ✅ `src/components/client/ClientUsersManagement.tsx` (nouveau)
- ✅ `src/app/client/dashboard/page.tsx` (modifié)

**API utilisées** :
- ✅ `GET /api/auth/permissions`
- ✅ `GET /api/admin/users`
- ✅ `POST /api/admin/users`
- ✅ `PUT /api/admin/users/:id`
- ✅ `DELETE /api/admin/users/:id`

**Date** : 16 Octobre 2025
**Contexte** : Dashboard client avec système de permissions dynamiques - Interface complète de gestion des utilisateurs
