# 🔐 Implémentation du système de permissions pour le profil utilisateur

**Date:** 10 novembre 2025  
**Statut:** ✅ Complété

## 📋 Vue d'ensemble

Mise en place d'un système de permissions basé sur la matrice de permissions existante pour contrôler qui peut modifier son profil (nom, email, téléphone, photo).

## 🎯 Objectif

Permettre aux clients de modifier leurs informations de profil uniquement s'ils ont la permission `profile.update` dans la matrice de permissions.

## 🔧 Modifications apportées

### 1. **Types de permissions** (`src/utils/permissions.ts`)
```typescript
export type Resource = 'bookings' | 'vehicles' | 'users' | 'planning' | 'profile';
```
- ✅ Ajout de `'profile'` comme ressource dans le système de permissions

### 2. **Helpers de vérification** (`src/utils/admin-permissions.ts`)
```typescript
export const requireProfileRead = () => requireResourcePermission('profile', 'read');
export const requireProfileUpdate = () => requireResourcePermission('profile', 'update');
```
- ✅ Nouveaux helpers pour vérifier les permissions de profil

### 3. **Mapping des permissions** (`src/app/api/admin/roles/route.ts`)
Ajout dans les deux systèmes (custom et legacy) :
```typescript
{ id: 11, resource: 'profile', action: 'read' },
{ id: 12, resource: 'profile', action: 'update' }
```
- ✅ Permissions ajoutées au mapping pour l'API des rôles

### 4. **API des permissions** (`src/app/api/admin/permissions/route.ts`)
```typescript
{ resource: 'profile', action: 'read', category: 'profile' },
{ resource: 'profile', action: 'update', category: 'profile' }
```
- ✅ Définition des permissions de profil dans la liste globale

### 5. **Icônes de catégorie** (`src/components/admin/ModernPermissionsManagement.tsx`)
```typescript
'Profil': '👤',
'profile': '👤'
```
- ✅ Ajout de l'icône pour la catégorie Profil

### 6. **API Client Profile** (`src/app/api/client/profile/route.ts`)

#### Vérification des permissions
```typescript
// Vérifier la permission de modification du profil
if (userRole !== 'admin') {
  const profilePermission = await db
    .select()
    .from(rolePermissionsTable)
    .where(and(
      eq(rolePermissionsTable.roleName, userRole),
      eq(rolePermissionsTable.resource, 'profile'),
      eq(rolePermissionsTable.action, 'update'),
      eq(rolePermissionsTable.allowed, true)
    ))
    .limit(1)

  if (profilePermission.length === 0) {
    return NextResponse.json({ 
      error: "Vous n'avez pas la permission de modifier votre profil. Contactez un administrateur." 
    }, { status: 403 })
  }
}
```

#### Support de la photo
```typescript
const { name, email, phone, photo } = await request.json()

await db.update(users).set({
  name: name.trim(),
  email: email.trim(),
  phone: phone?.trim() || null,
  photo: photo?.trim() || null  // ✅ Nouveau
})
```

### 7. **Modal d'édition du profil** (`src/components/client/EditProfileModal.tsx`)

#### Gestion d'erreur de permission
```typescript
const data = await response.json()

if (response.status === 403) {
  setError(data.error || "Vous n'avez pas la permission de modifier votre profil.")
  setShowPermissionError(true)
  return
}
```

#### Champ photo avec ImageUploader
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Photo de profil
  </label>
  <ImageUploader
    currentImageUrl={formData.photo || ''}
    onUploadComplete={(url) => {
      setFormData(prev => ({ ...prev, photo: url }))
    }}
    context="profile"
  />
</div>
```

#### Messages d'erreur stylisés
```tsx
{showPermissionError && (
  <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
    <div className="flex items-start">
      <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm text-red-700 dark:text-red-400 font-medium">
          {error}
        </p>
      </div>
    </div>
  </div>
)}

{showPermissionError && (
  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4">
    <div className="flex items-start">
      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-yellow-700 dark:text-yellow-400">
        Vous n'avez pas la permission de modifier votre profil. Contactez un administrateur pour activer cette fonctionnalité.
      </p>
    </div>
  </div>
)}
```

### 8. **API d'initialisation** (`src/app/api/admin/init-profile-permissions/route.ts`)

Endpoint POST pour initialiser automatiquement les permissions :
- ✅ Ajoute `profile.read` et `profile.update` pour customer, manager, driver
- ✅ Accessible uniquement aux admins
- ✅ Retourne le statut de chaque permission (created/updated)

### 9. **Page d'initialisation** (`public/init-permissions.html`)

Interface HTML simple pour déclencher l'initialisation :
- ✅ Bouton pour appeler `/api/admin/init-profile-permissions`
- ✅ Affichage des résultats
- ✅ Gestion des erreurs

### 10. **Scripts de migration**

#### SQL (`add-profile-permissions.sql`)
```sql
INSERT INTO role_permissions (role_name, resource, action, allowed, description)
VALUES ('customer', 'profile', 'update', true, 'Permission de modifier son propre profil')
ON CONFLICT (role_name, resource, action) DO UPDATE
SET allowed = true;
```

#### TypeScript (`add-profile-permissions.ts`)
Script Node.js/TypeScript pour ajouter les permissions via Drizzle ORM.

## 📊 Permissions ajoutées

| Rôle | Ressource | Action | Autorisé |
|------|-----------|--------|----------|
| customer | profile | read | ✅ Oui |
| customer | profile | update | ✅ Oui |
| manager | profile | read | ✅ Oui |
| manager | profile | update | ✅ Oui |
| driver | profile | read | ✅ Oui |
| driver | profile | update | ✅ Oui |
| admin | profile | * | ✅ Oui (implicite) |

## 🚀 Comment activer les permissions

### Méthode 1 : Via l'interface web (Recommandé)

1. Se connecter en tant qu'admin
2. Aller sur `http://localhost:3000/init-permissions.html`
3. Cliquer sur "Initialiser les permissions"
4. Vérifier que toutes les permissions sont créées

### Méthode 2 : Via API directe

```bash
curl -X POST http://localhost:3000/api/admin/init-profile-permissions \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=VOTRE_TOKEN"
```

### Méthode 3 : Via SQL (en production)

```bash
psql $DATABASE_URL -f add-profile-permissions.sql
```

## 🎨 Interface utilisateur

### Avec permission ✅
- Tous les champs sont modifiables
- Bouton "Enregistrer" actif
- Upload de photo disponible
- Message : "Les modifications seront enregistrées dans la base de données et prendront effet immédiatement"

### Sans permission ❌
- Message d'erreur rouge : "Vous n'avez pas la permission de modifier votre profil"
- Message d'information jaune : "Contactez un administrateur pour activer cette fonctionnalité"
- Champs visibles mais non modifiables (via message d'erreur au submit)
- Bouton "Enregistrer" affiche l'erreur

## 🔍 Vérification des permissions

### Dans l'interface admin

1. Aller dans Admin Dashboard → Permissions
2. Chercher la catégorie "Profil" (👤)
3. Voir les deux actions : `read` et `update`
4. Activer/désactiver pour chaque rôle via la matrice

### Via base de données

```sql
SELECT role_name, resource, action, allowed 
FROM role_permissions 
WHERE resource = 'profile'
ORDER BY role_name, action;
```

## 📝 Champs modifiables du profil

Avec la permission `profile.update` :
1. ✅ **Nom complet** - Texte libre
2. ✅ **Adresse email** - Avec validation d'unicité
3. ✅ **Téléphone** - Format international
4. ✅ **Photo de profil** - Upload via Cloudinary

## 🔐 Sécurité

- ✅ Vérification côté serveur dans l'API
- ✅ Admins ont toujours accès (bypass des permissions)
- ✅ Validation des données (email, format, etc.)
- ✅ Protection CSRF via NextAuth
- ✅ Sessions refreshées après modification
- ✅ Messages d'erreur clairs et informatifs

## 📦 Fichiers modifiés

```
src/
├── utils/
│   ├── permissions.ts                          ✏️ Modifié
│   └── admin-permissions.ts                    ✏️ Modifié
├── app/
│   └── api/
│       ├── admin/
│       │   ├── roles/route.ts                  ✏️ Modifié
│       │   ├── permissions/route.ts            ✏️ Modifié
│       │   └── init-profile-permissions/
│       │       └── route.ts                    ✨ Nouveau
│       └── client/
│           └── profile/route.ts                ✏️ Modifié
├── components/
│   ├── admin/
│   │   └── ModernPermissionsManagement.tsx     ✏️ Modifié
│   └── client/
│       └── EditProfileModal.tsx                ✏️ Modifié

public/
└── init-permissions.html                       ✨ Nouveau

Migrations/
├── add-profile-permissions.sql                 ✨ Nouveau
├── add-profile-permissions.ts                  ✨ Nouveau
└── add-profile-permissions.mjs                 ✨ Nouveau
```

## ✅ Tests à effectuer

1. **En tant qu'admin**
   - [x] Initialiser les permissions via `/init-permissions.html`
   - [ ] Vérifier dans la matrice de permissions
   - [ ] Modifier son propre profil
   - [ ] Upload une photo de profil

2. **En tant que customer**
   - [ ] Se connecter
   - [ ] Cliquer sur "Modifier mon profil"
   - [ ] Modifier nom, email, téléphone
   - [ ] Upload une photo
   - [ ] Vérifier que les changements persistent
   - [ ] Vérifier que la session est refreshée

3. **Test de refus de permission**
   - [ ] En tant qu'admin, désactiver `profile.update` pour customer
   - [ ] Se connecter en tant que customer
   - [ ] Tenter de modifier le profil
   - [ ] Vérifier le message d'erreur approprié

4. **Validation**
   - [ ] Tenter d'utiliser un email déjà existant
   - [ ] Vérifier la validation du format email
   - [ ] Vérifier que les champs obligatoires sont validés

## 🎯 Prochaines étapes

1. ✅ Initialiser les permissions en production
2. ⏳ Tester l'upload de photo avec Cloudinary
3. ⏳ Ajouter la gestion des permissions dans l'interface admin
4. ⏳ Documenter pour les autres développeurs
5. ⏳ Ajouter des tests unitaires

## 📖 Documentation pour les développeurs

### Vérifier une permission dans le code

```typescript
import { hasResourcePermission } from '@/utils/admin-permissions'

// Dans un composant serveur
const canUpdateProfile = await hasResourcePermission(
  userId,
  'profile',
  'update'
)

// Dans une API route
import { requireProfileUpdate } from '@/utils/admin-permissions'

export async function PUT(request: Request) {
  await requireProfileUpdate() // Throw si pas de permission
  // ... votre code
}
```

### Ajouter une nouvelle ressource

1. Ajouter le type dans `permissions.ts`
2. Créer les helpers dans `admin-permissions.ts`
3. Ajouter au mapping dans `roles/route.ts`
4. Ajouter dans `permissions/route.ts`
5. Ajouter l'icône dans `ModernPermissionsManagement.tsx`
6. Initialiser en base de données

## 🐛 Problèmes connus

- ⚠️ Les permissions doivent être initialisées manuellement lors du premier déploiement
- ⚠️ La photo n'est pas supprimée de Cloudinary lors du changement (à implémenter)

## 💡 Améliorations futures

1. Migration automatique des permissions au démarrage
2. Interface admin pour gérer les permissions par utilisateur
3. Historique des modifications de profil
4. Compression d'image avant upload
5. Validation avancée du téléphone (par pays)
6. Avatar par défaut avec initiales

---

**Auteur:** GitHub Copilot  
**Projet:** NavetteXpress  
**Version:** 1.0.0
