# Système de Permissions "Profil" - Documentation Complète

**Date**: 10 novembre 2025  
**Auteur**: Système NavetteXpress  
**Version**: 1.0

## 📋 Vue d'ensemble

Un système complet de permissions a été ajouté pour contrôler l'accès à la modification du profil utilisateur. Les administrateurs peuvent désormais gérer qui peut voir et modifier les informations de profil via la matrice de permissions.

---

## 🎯 Fonctionnalités Implémentées

### 1. **Nouvelle Ressource "Profile" dans la Matrice de Permissions**

#### Actions disponibles :
- **`read`** : Consulter son profil
- **`update`** : Modifier son profil (nom, email, téléphone, photo)

#### Ressources dans le système :
```typescript
'users'     | 'bookings' | 'vehicles' | 
'quotes'    | 'reviews'  | 'profile'
```

---

## 🔧 Modifications Techniques

### 1. **Types et Schémas**

#### `src/utils/permissions.ts`
```typescript
export type Resource = 
  | 'bookings' 
  | 'vehicles' 
  | 'users' 
  | 'planning' 
  | 'profile'; // ✨ Nouveau
```

#### `src/utils/admin-permissions.ts`
```typescript
// Nouveaux helpers
export const requireProfileRead = () => 
  requireResourcePermission('profile', 'read');

export const requireProfileUpdate = () => 
  requireResourcePermission('profile', 'update');
```

---

### 2. **API Backend**

#### `src/app/api/admin/permissions/route.ts`
Ajout des permissions profile dans la liste complète :
```typescript
{ resource: 'profile', action: 'read', category: 'profile' },
{ resource: 'profile', action: 'update', category: 'profile' }
```

#### `src/app/api/admin/roles/route.ts`
Mapping des permissions étendu :
```typescript
{ id: 11, resource: 'profile', action: 'read' },
{ id: 12, resource: 'profile', action: 'update' }
```

#### `src/app/api/client/profile/route.ts`
**Vérification des permissions avant toute action** :

```typescript
// PUT - Mettre à jour le profil
export async function PUT(request: NextRequest) {
  const userRole = session.user.role || 'customer'
  
  // Les admins ont toujours accès
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
        error: "Vous n'avez pas la permission de modifier votre profil." 
      }, { status: 403 })
    }
  }
  
  // Mise à jour incluant la photo
  const updatedUser = await db
    .update(users)
    .set({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      image: image?.trim() || null // ✨ Upload photo
    })
    // ...
}
```

---

### 3. **Interface Utilisateur**

#### `src/components/client/EditProfileModal.tsx`

**Nouvelles fonctionnalités** :

1. **Vérification des permissions au chargement** :
```typescript
useEffect(() => {
  const checkPermissions = async () => {
    const response = await fetch('/api/client/profile')
    if (response.status === 403) {
      setHasUpdatePermission(false)
      setError("Vous n'avez pas la permission de modifier votre profil.")
    }
  }
  if (isOpen) checkPermissions()
}, [isOpen])
```

2. **Upload de photo de profil** :
```tsx
{hasUpdatePermission && (
  <div>
    <label>Photo de profil</label>
    <ImageUploader
      currentImage={formData.image || null}
      onUploadComplete={(url: string) => 
        setFormData(prev => ({ ...prev, image: url }))
      }
      label="Photo de profil"
    />
  </div>
)}
```

3. **Désactivation des champs sans permission** :
```tsx
<input
  disabled={!hasUpdatePermission}
  className="... disabled:bg-slate-100 disabled:cursor-not-allowed"
/>
```

4. **Messages conditionnels** :
```tsx
{hasUpdatePermission ? (
  <div className="bg-blue-50">
    ℹ️ Les modifications seront enregistrées immédiatement
  </div>
) : (
  <div className="bg-yellow-50">
    ⚠️ Contactez un administrateur pour activer cette fonctionnalité.
  </div>
)}
```

#### `src/components/admin/ModernPermissionsManagement.tsx`

Ajout de l'icône pour la catégorie "Profil" :
```typescript
const getCategoryIcon = (category: string) => {
  const icons = {
    // ...
    'Profil': '👤',
    'profile': '👤'
  }
  return icons[category] || '🔧'
}
```

---

## 📊 Matrice de Permissions par Défaut

### Migration SQL : `migrations/add-profile-permissions.sql`

```sql
-- Permissions pour tous les rôles
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES 
  -- CUSTOMER : Peut lire et modifier son profil
  ('customer', 'profile', 'read', true),
  ('customer', 'profile', 'update', true),
  
  -- DRIVER : Peut lire et modifier son profil
  ('driver', 'profile', 'read', true),
  ('driver', 'profile', 'update', true),
  
  -- MANAGER : Peut lire et modifier son profil
  ('manager', 'profile', 'read', true),
  ('manager', 'profile', 'update', true),
  
  -- ADMIN : Accès total (bypass les permissions)
  ('admin', 'profile', 'read', true),
  ('admin', 'profile', 'update', true)
ON CONFLICT (role_name, resource, action) DO UPDATE
SET allowed = true;
```

---

## 🎨 Expérience Utilisateur

### Cas d'usage 1 : Client avec permission ✅
1. Clique sur **"Modifier"** dans son profil
2. Modal s'ouvre avec tous les champs éditables
3. Peut modifier : nom, email, téléphone, photo
4. Upload de photo via Cloudinary
5. Enregistrement → Session rafraîchie → Page rechargée
6. **Message** : "✅ Profil mis à jour avec succès"

### Cas d'usage 2 : Client sans permission ⚠️
1. Clique sur **"Modifier"** dans son profil
2. Modal s'ouvre avec champs **désactivés**
3. Champs grisés et non modifiables
4. Bouton "Enregistrer" désactivé
5. **Message** : "⚠️ Vous n'avez pas la permission de modifier votre profil. Contactez un administrateur."

### Cas d'usage 3 : Admin configure les permissions 🔐
1. Va dans **Dashboard Admin → Permissions**
2. Section **"Profil"** visible avec icône 👤
3. Matrice affiche :
   - Lignes : Rôles (admin, manager, driver, customer)
   - Colonnes : Actions (read, update)
4. Toggle pour activer/désactiver par rôle
5. Changements appliqués immédiatement

---

## 🔐 Sécurité

### Niveaux de protection :

1. **Backend** :
   - Vérification systématique dans `/api/client/profile`
   - Query SQL avec `rolePermissionsTable`
   - Admins contournent les vérifications (trusted)

2. **Frontend** :
   - Vérification au chargement du modal
   - Désactivation des champs sans permission
   - Messages d'erreur clairs

3. **Base de données** :
   - Table `role_permissions` contrôle l'accès
   - Contraintes `ON CONFLICT` pour éviter les doublons
   - Colonne `allowed` pour activer/désactiver

---

## 📁 Structure des Fichiers Modifiés

```
src/
├── utils/
│   ├── permissions.ts                    ✏️ Ajout type 'profile'
│   └── admin-permissions.ts             ✏️ Helpers requireProfile*
├── app/
│   └── api/
│       ├── admin/
│       │   ├── permissions/route.ts     ✏️ Mapping profile
│       │   └── roles/route.ts           ✏️ IDs 11-12 profile
│       └── client/
│           └── profile/route.ts         ✏️ Vérif permissions + image
└── components/
    ├── admin/
    │   └── ModernPermissionsManagement.tsx  ✏️ Icône 👤
    └── client/
        └── EditProfileModal.tsx         ✏️ Upload photo + perms

migrations/
└── add-profile-permissions.sql          ✨ NOUVEAU
```

---

## 🚀 Déploiement

### 1. Exécuter la migration SQL
```bash
# Connexion à la base de données
psql $DATABASE_URL

# Exécuter le script
\i migrations/add-profile-permissions.sql

# Vérifier
SELECT role_name, resource, action, allowed 
FROM role_permissions 
WHERE resource = 'profile';
```

### 2. Redémarrer l'application
```bash
npm run build
npm run start
```

### 3. Vérifications post-déploiement
- [ ] Login en tant que client
- [ ] Cliquer sur "Modifier" dans le profil
- [ ] Vérifier que les champs sont éditables
- [ ] Uploader une photo
- [ ] Enregistrer et vérifier le rafraîchissement
- [ ] Login admin → Permissions → Vérifier section "Profil"
- [ ] Désactiver permission "update" pour "customer"
- [ ] Re-login client → Vérifier champs désactivés

---

## 📊 Tableau Récapitulatif

| Rôle       | profile:read | profile:update | Notes                    |
|------------|--------------|----------------|--------------------------|
| **admin**  | ✅ Toujours  | ✅ Toujours    | Bypass toutes les perms  |
| **manager**| ✅ Par défaut| ✅ Par défaut  | Configurable via matrice |
| **driver** | ✅ Par défaut| ✅ Par défaut  | Configurable via matrice |
| **customer**| ✅ Par défaut| ✅ Par défaut  | Configurable via matrice |

---

## 🎯 Prochaines Étapes (Optionnel)

### Améliorations possibles :
1. **Audit Log** : Tracer les modifications de profil
2. **Validation Email** : Envoyer un code de confirmation
3. **Historique** : Garder un historique des changements
4. **Champs supplémentaires** : Adresse, date de naissance, etc.
5. **Photo de couverture** : Banner en plus de la photo de profil
6. **Préférences** : Langue, notifications, thème

---

## 📝 Notes Techniques

### Utilisation du champ `image` existant
Au lieu de créer un nouveau champ `photo`, nous utilisons le champ `image` déjà présent dans le schéma NextAuth :

```typescript
// Schema users
export const users = pgTable('users', {
  // ...
  image: text('image'), // ← Utilisé pour la photo de profil
  // ...
})
```

### Cloudinary
Upload automatique via `ImageUploader` component :
- **Preset** : `navette_profiles` (à configurer dans Cloudinary)
- **Folder** : `profiles/`
- **Max size** : 10 MB
- **Formats** : JPEG, PNG, WebP

---

## ✅ Checklist de Validation

- [x] Type `Resource` étendu avec 'profile'
- [x] Helpers `requireProfileRead` et `requireProfileUpdate`
- [x] API permissions avec profile (IDs 11-12)
- [x] API profile avec vérification des permissions
- [x] Upload de photo dans EditProfileModal
- [x] Désactivation des champs sans permission
- [x] Messages utilisateur contextuels
- [x] Icône 👤 dans la matrice admin
- [x] Migration SQL créée
- [x] Documentation complète
- [ ] Tests en environnement de production
- [ ] Migration SQL exécutée

---

## 🐛 Dépannage

### Problème : "Vous n'avez pas la permission..."
**Solution** : Exécuter la migration SQL pour ajouter les permissions par défaut.

### Problème : Photo ne s'upload pas
**Solution** : Vérifier la configuration Cloudinary et les presets.

### Problème : Session non rafraîchie
**Solution** : L'appel à `/api/auth/session?update` + `window.location.reload()` est déjà implémenté.

---

## 📧 Support

Pour toute question ou problème :
1. Vérifier cette documentation
2. Consulter les logs serveur
3. Vérifier la table `role_permissions` en base
4. Contacter l'équipe de développement

---

**Fin de la documentation** 🎉
