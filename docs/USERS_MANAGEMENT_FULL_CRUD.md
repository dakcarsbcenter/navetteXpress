# Implémentation complète du CRUD utilisateurs avec permissions

## 📋 Contexte

Le composant `ModernUsersManagement` affichait l'interface mais n'avait pas les fonctionnalités pour créer, modifier, réinitialiser les mots de passe et supprimer les utilisateurs. De plus, avec la permission "manage users", le rôle customer doit pouvoir effectuer toutes ces opérations.

## 🎯 Objectifs

1. ✅ Ajouter les handlers pour créer un utilisateur
2. ✅ Ajouter les handlers pour modifier un utilisateur
3. ✅ Ajouter les handlers pour réinitialiser le mot de passe
4. ✅ Ajouter les handlers pour supprimer un utilisateur
5. ✅ Ajouter les modals de création/modification
6. ✅ Ajouter le modal de réinitialisation de mot de passe
7. ✅ Activer les boutons selon les permissions
8. ✅ Vérifier que "manage users" donne tous les droits

## ✅ Modifications effectuées

### 1. Ajout des handlers CRUD

#### a) Handler de création d'utilisateur
```typescript
const handleCreateUser = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    
    if (response.ok) {
      await fetchUsers()
      setIsModalOpen(false)
      resetForm()
      showSuccess('Utilisateur créé avec succès', 'Création réussie')
    } else {
      const error = await response.json()
      showError(`Erreur: ${error.error}`, 'Échec de la création')
    }
  } catch (error) {
    console.error('Erreur lors de la création:', error)
    showError('Une erreur est survenue lors de la création', 'Erreur technique')
  }
}
```

#### b) Handler de modification d'utilisateur
```typescript
const handleUpdateUser = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!editingUser) return
  
  try {
    // Exclure le champ image du formData car il est géré séparément
    const { image, ...updateData } = formData
    
    const response = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    
    if (response.ok) {
      await fetchUsers()
      setIsModalOpen(false)
      setEditingUser(null)
      resetForm()
      showSuccess('Utilisateur mis à jour avec succès', 'Modification réussie')
    } else {
      const error = await response.json()
      showError(`Erreur: ${error.error}`, 'Échec de la modification')
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    showError('Une erreur est survenue lors de la modification', 'Erreur technique')
  }
}
```

#### c) Handler de réinitialisation du mot de passe
```typescript
const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!selectedUser || !newPassword) return
  
  try {
    const response = await fetch(`/api/admin/users/${selectedUser.id}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword })
    })
    
    if (response.ok) {
      setIsPasswordModalOpen(false)
      setNewPassword('')
      setSelectedUser(null)
      showSuccess('Le mot de passe a été mis à jour avec succès', 'Mot de passe modifié')
    } else {
      const error = await response.json()
      showError(`Erreur: ${error.error}`, 'Échec de la modification')
    }
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error)
    showError('Une erreur est survenue lors de la modification du mot de passe', 'Erreur technique')
  }
}
```

#### d) Handler de suppression d'utilisateur
```typescript
const handleDeleteUser = async (userId: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return
  
  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    })
    
    if (response.ok) {
      await fetchUsers()
      showSuccess('Utilisateur supprimé avec succès', 'Suppression réussie')
    } else {
      const error = await response.json()
      showError(`Erreur: ${error.error}`, 'Échec de la suppression')
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    showError('Une erreur est survenue lors de la suppression', 'Erreur technique')
  }
}
```

#### e) Helpers
```typescript
const resetForm = () => {
  setFormData({
    name: '',
    email: '',
    role: 'customer',
    phone: '',
    licenseNumber: '',
    isActive: true,
    password: '',
    image: ''
  })
}

const handleProfilePhotoUpdate = (url: string | null) => {
  setFormData(prev => ({ ...prev, image: url || '' }))
}
```

### 2. Activation des boutons d'action

#### a) Bouton "Supprimer" dans la vue en cartes
```typescript
{canDelete() && (
  <button
    onClick={() => handleDeleteUser(user.id)}
    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600..."
  >
    <svg>...</svg>
    Supprimer
  </button>
)}
```

#### b) Bouton "Supprimer" dans la vue en tableau
```typescript
{canDelete() && (
  <button
    onClick={() => handleDeleteUser(user.id)}
    className="p-2 text-red-600..."
    title="Supprimer"
  >
    <svg>...</svg>
  </button>
)}
```

### 3. Modal de création/modification d'utilisateur

```typescript
{isModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-scaleIn">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
      </h3>
      
      <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
        {/* Champ Nom */}
        <input type="text" value={formData.name} ... />
        
        {/* Photo de profil (uniquement en édition) */}
        {editingUser && (
          <UniversalProfilePhotoUpload
            userId={editingUser.id}
            currentImage={formData.image}
            onImageUpdate={handleProfilePhotoUpdate}
            ...
          />
        )}
        
        {/* Champ Email */}
        <input type="email" value={formData.email} ... />
        
        {/* Sélecteur de Rôle */}
        <select value={formData.role} ...>
          <option value="customer">👤 Client</option>
          <option value="driver">🚗 Chauffeur</option>
          <option value="admin">👑 Admin</option>
        </select>
        
        {/* Champ Téléphone */}
        <input type="tel" value={formData.phone} ... />
        
        {/* Champ Numéro de permis */}
        <input type="text" value={formData.licenseNumber} ... />
        
        {/* Mot de passe (uniquement en création) */}
        {!editingUser && (
          <input type="password" value={formData.password} ... />
        )}
        
        {/* Checkbox Utilisateur actif */}
        <input type="checkbox" checked={formData.isActive} ... />
        
        {/* Boutons d'action */}
        <button type="button" onClick={...}>Annuler</button>
        <button type="submit">{editingUser ? 'Mettre à jour' : 'Créer'}</button>
      </form>
    </div>
  </div>
)}
```

**Caractéristiques du modal:**
- ✅ Design moderne avec animations (fadeIn, scaleIn)
- ✅ Champs pré-remplis en mode édition
- ✅ Upload de photo uniquement en mode édition
- ✅ Mot de passe uniquement en mode création
- ✅ Validation des champs required
- ✅ Réinitialisation du formulaire après soumission
- ✅ Notifications de succès/erreur

### 4. Modal de réinitialisation de mot de passe

```typescript
{isPasswordModalOpen && selectedUser && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-scaleIn">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-shrink-0 w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-amber-600 dark:text-amber-400">
            {/* Icône cadenas */}
          </svg>
        </div>
        <div>
          <h3>Réinitialiser le mot de passe</h3>
          <p>{selectedUser.name}</p>
        </div>
      </div>
      
      <form onSubmit={handleResetPassword}>
        {/* Info utilisateur */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200...">
          <p><strong>Email:</strong> {selectedUser.email}</p>
        </div>
        
        {/* Champ nouveau mot de passe */}
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Minimum 6 caractères"
          required
          minLength={6}
        />
        
        {/* Boutons */}
        <button type="button" onClick={...}>Annuler</button>
        <button type="submit">Mettre à jour</button>
      </form>
    </div>
  </div>
)}
```

**Caractéristiques du modal:**
- ✅ Design moderne avec icône de cadenas
- ✅ Affichage de l'utilisateur concerné
- ✅ Validation minimum 6 caractères
- ✅ Message d'aide pour l'utilisateur
- ✅ Notifications de succès/erreur
- ✅ Réinitialisation après soumission

## 🔐 Vérification des permissions

### Matrice des permissions

| Permission | canCreate() | canUpdate() | canDelete() |
|-----------|------------|------------|------------|
| `read` | ❌ | ❌ | ❌ |
| `create` | ✅ | ❌ | ❌ |
| `update` | ❌ | ✅ | ❌ |
| `delete` | ❌ | ❌ | ✅ |
| `manage` | ✅ | ✅ | ✅ |
| Admin (undefined) | ✅ | ✅ | ✅ |

### Boutons affichés selon les permissions

| Permission | Nouvel utilisateur | Modifier | Mot de passe | Supprimer |
|-----------|-------------------|----------|--------------|-----------|
| `read` | ❌ | ❌ | ❌ | ❌ |
| `create` | ✅ | ❌ | ❌ | ❌ |
| `update` | ❌ | ✅ | ✅ | ❌ |
| `delete` | ❌ | ❌ | ❌ | ✅ |
| `manage` | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ |

## 🎬 Flux utilisateur

### 1. Création d'un utilisateur (avec permission `create` ou `manage`)

1. Utilisateur clique sur "Nouvel utilisateur"
2. Modal s'ouvre avec formulaire vide
3. Utilisateur remplit les champs:
   - Nom (requis)
   - Email (requis)
   - Rôle (requis)
   - Téléphone (optionnel)
   - Numéro de permis (optionnel)
   - Mot de passe (optionnel - par défaut si vide)
   - Utilisateur actif (checkbox)
4. Utilisateur clique sur "Créer"
5. Appel API POST `/api/admin/users`
6. Si succès: notification verte + liste rafraîchie + modal fermé
7. Si erreur: notification rouge avec message d'erreur

### 2. Modification d'un utilisateur (avec permission `update` ou `manage`)

1. Utilisateur clique sur bouton "Modifier" d'un utilisateur
2. Modal s'ouvre avec formulaire pré-rempli
3. Section de upload de photo de profil visible
4. Utilisateur modifie les champs souhaités
5. Utilisateur clique sur "Mettre à jour"
6. Appel API PUT `/api/admin/users/{id}`
7. Si succès: notification verte + liste rafraîchie + modal fermé
8. Si erreur: notification rouge avec message d'erreur

### 3. Réinitialisation du mot de passe (avec permission `update` ou `manage`)

1. Utilisateur clique sur bouton "Mot de passe" d'un utilisateur
2. Modal s'ouvre avec infos de l'utilisateur
3. Utilisateur saisit le nouveau mot de passe (min 6 caractères)
4. Utilisateur clique sur "Mettre à jour"
5. Appel API PUT `/api/admin/users/{id}/password`
6. Si succès: notification verte + modal fermé
7. Si erreur: notification rouge avec message d'erreur

### 4. Suppression d'un utilisateur (avec permission `delete` ou `manage`)

1. Utilisateur clique sur bouton "Supprimer" d'un utilisateur
2. Boîte de confirmation native du navigateur
3. Si confirmation: Appel API DELETE `/api/admin/users/{id}`
4. Si succès: notification verte + liste rafraîchie
5. Si erreur: notification rouge avec message d'erreur

## 🧪 Tests à effectuer

### Test 1: Customer avec permission "read" uniquement
```json
{ "users": ["read"] }
```
**Résultat attendu:**
- ✅ Liste des utilisateurs visible
- ❌ Bouton "Nouvel utilisateur" invisible
- ❌ Boutons "Modifier", "Mot de passe", "Supprimer" invisibles

### Test 2: Customer avec permission "manage"
```json
{ "users": ["manage"] }
```
**Résultat attendu:**
- ✅ Liste des utilisateurs visible
- ✅ Bouton "Nouvel utilisateur" visible et fonctionnel
- ✅ Boutons "Modifier", "Mot de passe", "Supprimer" visibles et fonctionnels
- ✅ Peut créer un utilisateur
- ✅ Peut modifier un utilisateur
- ✅ Peut réinitialiser un mot de passe
- ✅ Peut supprimer un utilisateur

### Test 3: Customer avec permissions mixtes
```json
{ "users": ["read", "update"] }
```
**Résultat attendu:**
- ✅ Liste visible
- ❌ Bouton "Nouvel utilisateur" invisible
- ✅ Boutons "Modifier" et "Mot de passe" visibles et fonctionnels
- ❌ Bouton "Supprimer" invisible

### Test 4: Admin (comportement par défaut)
```json
undefined (pas de userPermissions passé)
```
**Résultat attendu:**
- ✅ Tous les boutons visibles et fonctionnels (comportement identique à "manage")

## 📊 Résumé des changements

### Fichiers modifiés
1. ✅ `src/components/admin/ModernUsersManagement.tsx`
   - Ajout de 4 handlers CRUD
   - Ajout de 2 helpers
   - Ajout de 2 modals complets
   - Activation des boutons d'action
   - Gestion des erreurs avec notifications

### APIs utilisées
1. ✅ `POST /api/admin/users` - Création d'utilisateur
2. ✅ `PUT /api/admin/users/{id}` - Modification d'utilisateur
3. ✅ `PUT /api/admin/users/{id}/password` - Réinitialisation du mot de passe
4. ✅ `DELETE /api/admin/users/{id}` - Suppression d'utilisateur

### Composants utilisés
1. ✅ `NotificationCenter` - Affichage des notifications
2. ✅ `UniversalProfilePhotoUpload` - Upload de photo de profil
3. ✅ Animations CSS (fadeIn, scaleIn) - Transitions fluides

## 🎉 Conclusion

Le composant `ModernUsersManagement` est maintenant **pleinement fonctionnel** avec:
- ✅ CRUD complet (Create, Read, Update, Delete)
- ✅ Gestion des permissions granulaires
- ✅ Interface moderne et responsive
- ✅ Notifications utilisateur
- ✅ Gestion des erreurs
- ✅ Upload de photos de profil
- ✅ Réinitialisation des mots de passe
- ✅ Support du rôle "customer" avec permission "manage users"

**Avec la permission "manage users", le rôle customer peut maintenant:**
- ✅ Créer des utilisateurs
- ✅ Modifier des utilisateurs
- ✅ Réinitialiser les mots de passe
- ✅ Supprimer des utilisateurs

Exactement comme un administrateur ! 🚀
