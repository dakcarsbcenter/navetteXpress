# Implémentation des boutons conditionnels basés sur les permissions

## 📋 Contexte

L'utilisateur avec le rôle "customer" avait la permission `read users` uniquement, mais l'interface affichait toujours les boutons "Modifier", "Mot de passe" et "Supprimer" dans la gestion des utilisateurs.

## 🎯 Objectif

Adapter l'interface pour afficher uniquement les boutons d'action correspondant aux permissions réelles de l'utilisateur:
- **read** : Affichage des utilisateurs uniquement (aucun bouton d'action)
- **create** : Bouton "Nouvel utilisateur"
- **update** : Boutons "Modifier" et "Mot de passe"
- **delete** : Bouton "Supprimer"
- **manage** : Tous les boutons (équivaut à create + update + delete)

## ✅ Modifications effectuées

### 1. ModernUsersManagement.tsx

#### a) Ajout de l'interface pour les props
```typescript
interface ModernUsersManagementProps {
  userPermissions?: {
    [resource: string]: string[]
  }
}

export function ModernUsersManagement({ userPermissions }: ModernUsersManagementProps = {}) {
```

#### b) Fonctions de vérification des permissions
```typescript
// Fonctions de vérification des permissions
const canCreate = () => {
  if (!userPermissions) return true // Admin par défaut
  const usersPerms = userPermissions.users || []
  return usersPerms.includes('manage') || usersPerms.includes('create')
}

const canUpdate = () => {
  if (!userPermissions) return true // Admin par défaut
  const usersPerms = userPermissions.users || []
  return usersPerms.includes('manage') || usersPerms.includes('update')
}

const canDelete = () => {
  if (!userPermissions) return true // Admin par défaut
  const usersPerms = userPermissions.users || []
  return usersPerms.includes('manage') || usersPerms.includes('delete')
}
```

**Logique:**
- Si `userPermissions` n'est pas défini → L'utilisateur est admin → Retourne `true`
- Sinon, vérifie si l'utilisateur a la permission `manage` OU la permission spécifique (`create`, `update`, `delete`)

#### c) Bouton "Nouvel utilisateur" conditionnel
```typescript
{/* Bouton Nouvel utilisateur */}
{canCreate() && (
  <button
    onClick={() => setIsModalOpen(true)}
    className="bg-gradient-to-r from-blue-600 to-indigo-600..."
  >
    <svg>...</svg>
    Nouvel utilisateur
  </button>
)}
```

#### d) Boutons d'action dans la vue en cartes
```typescript
{/* Actions */}
<div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4">
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2">
      {canUpdate() && (
        <button onClick={() => {...}} className="...">
          Modifier
        </button>
      )}
      
      {canUpdate() && (
        <button onClick={() => {...}} className="...">
          Mot de passe
        </button>
      )}
    </div>
    
    {canDelete() && (
      <button onClick={() => {...}} className="...">
        Supprimer
      </button>
    )}
  </div>
</div>
```

#### e) Boutons d'action dans la vue en tableau
```typescript
<td className="px-6 py-4 text-right">
  <div className="flex items-center justify-end gap-2">
    {canUpdate() && (
      <button title="Modifier">...</button>
    )}
    
    {canUpdate() && (
      <button title="Modifier le mot de passe">...</button>
    )}
    
    {canDelete() && (
      <button title="Supprimer">...</button>
    )}
  </div>
</td>
```

### 2. ClientUsersManagement.tsx

Ajout du passage des permissions au composant:
```typescript
{/* Composant de gestion des utilisateurs */}
<ModernUsersManagement userPermissions={userPermissions} />
```

## 🔄 Comportement selon les permissions

### Cas 1: Permission "read" uniquement
```json
{
  "users": ["read"]
}
```
**Interface affichée:**
- ✅ Liste des utilisateurs (vue cartes ou tableau)
- ✅ Filtres et recherche
- ✅ Statistiques
- ❌ Aucun bouton d'action (ni "Nouvel utilisateur", ni "Modifier", ni "Mot de passe", ni "Supprimer")

### Cas 2: Permissions "read" + "update"
```json
{
  "users": ["read", "update"]
}
```
**Interface affichée:**
- ✅ Liste des utilisateurs
- ✅ Boutons "Modifier" et "Mot de passe"
- ❌ Bouton "Nouvel utilisateur"
- ❌ Bouton "Supprimer"

### Cas 3: Permission "manage"
```json
{
  "users": ["manage"]
}
```
**Interface affichée:**
- ✅ Tous les boutons d'action
- ✅ Bouton "Nouvel utilisateur"
- ✅ Boutons "Modifier" et "Mot de passe"
- ✅ Bouton "Supprimer"

### Cas 4: Utilisateur admin (sans userPermissions passé)
```typescript
<ModernUsersManagement /> // userPermissions = undefined
```
**Interface affichée:**
- ✅ Tous les boutons (comportement par défaut)

## 🎨 Impact visuel

### Avant (avec permission "read" uniquement)
```
┌─────────────────────────────────────┐
│ User Card                           │
│ - Nom: John Doe                     │
│ - Email: john@example.com           │
│                                     │
│ [Modifier] [Mot de passe] [Supprimer] ← Tous visibles ❌
└─────────────────────────────────────┘
```

### Après (avec permission "read" uniquement)
```
┌─────────────────────────────────────┐
│ User Card                           │
│ - Nom: John Doe                     │
│ - Email: john@example.com           │
│                                     │
│ (Aucun bouton) ← Interface en lecture seule ✅
└─────────────────────────────────────┘
```

## 🧪 Tests recommandés

1. **Test avec permission "read" uniquement:**
   - Vérifier qu'aucun bouton d'action n'est visible
   - Vérifier que la liste s'affiche correctement

2. **Test avec permission "read" + "update":**
   - Vérifier que seuls les boutons "Modifier" et "Mot de passe" sont visibles
   - Vérifier que "Nouvel utilisateur" et "Supprimer" sont cachés

3. **Test avec permission "manage":**
   - Vérifier que tous les boutons sont visibles
   - Vérifier le comportement identique à l'admin

4. **Test en tant qu'admin:**
   - Vérifier que tous les boutons restent visibles (comportement par défaut)

## 📊 Résultat

L'interface s'adapte maintenant dynamiquement aux permissions réelles de l'utilisateur:
- ✅ Sécurité renforcée: pas de boutons pour des actions non autorisées
- ✅ UX améliorée: interface claire et cohérente avec les droits
- ✅ Rétrocompatibilité: l'admin garde tous les accès
- ✅ Flexibilité: combinaisons de permissions granulaires supportées

## 🔐 Sécurité

**Important:** Cette implémentation concerne uniquement l'**affichage** des boutons. La vérification des permissions côté serveur reste essentielle et est déjà en place dans:
- `/api/admin/users/route.ts` (GET, POST)
- `/api/admin/users/[id]/route.ts` (GET, PUT, DELETE)

Même si un utilisateur malveillant manipulait le JavaScript côté client pour afficher les boutons, les appels API seraient bloqués par les vérifications de permissions côté serveur.
