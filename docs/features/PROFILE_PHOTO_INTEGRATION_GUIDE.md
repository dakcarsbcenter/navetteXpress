# 🔐 Configuration des Permissions - Upload Photo de Profil

## 📋 **Vue d'ensemble**

Le système d'upload de photos de profil utilise le composant `UniversalProfilePhotoUpload` qui s'adapte automatiquement selon les permissions de l'utilisateur connecté. 

## 🏗️ **Architecture des Permissions**

### **🛡️ API Route Unifiée: `/api/admin/users/profile-photo`**

L'API route gère automatiquement les permissions selon ces règles :

```typescript
// Règles de permissions automatiques
1. Utilisateur Normal → Peut modifier SA PROPRE photo uniquement
2. Administrateur → Peut modifier la photo de N'IMPORTE QUEL utilisateur
3. Sécurité → Vérification de l'identité avant toute modification
```

## 🎯 **Utilisation par Rôle**

### **👤 Clients (Customer)**
- **Localisation** : `src/app/client/dashboard/page.tsx` → onglet "Mon profil"
- **Permissions** : Peut uniquement modifier sa propre photo
- **Usage** :
```tsx
<UniversalProfilePhotoUpload
  currentPhoto={session?.user?.image || undefined}
  onSuccess={(message) => console.log('✅', message)}
  onError={(error) => console.error('❌', error)}
/>
```

### **🚗 Chauffeurs (Driver)**
- **Localisation** : `src/app/driver/dashboard/page.tsx` → Vue "Mon Profil"
- **Permissions** : Peut uniquement modifier sa propre photo
- **Usage** : Identique aux clients

### **👑 Administrateurs (Admin)**
- **Localisation** : `src/components/admin/UsersManagement.tsx` → Modal d'édition utilisateur
- **Permissions** : Peut modifier la photo de n'importe quel utilisateur
- **Usage** :
```tsx
<UniversalProfilePhotoUpload
  userId={editingUser.id}  // ⚠️ IMPORTANT: Spécifier l'ID de l'utilisateur cible
  currentPhoto={formData.image}
  onSuccess={(message) => {
    showSuccess(message)
    fetchUsers() // Rafraîchir la liste
  }}
  onError={showError}
/>
```

## ⚙️ **Configuration Technique**

### **🔒 Logique de Sécurité dans l'API**

```typescript
// Dans /api/admin/users/profile-photo/route.ts

const targetUserId = userId || session.user.id

// Vérification des permissions
if (targetUserId !== session.user.id && session.user.role !== 'admin') {
  return NextResponse.json(
    { success: false, error: 'Permission refusée' },
    { status: 403 }
  )
}
```

### **☁️ Organisation Cloudinary**

```typescript
// Structure des dossiers
navette-xpress/
└── profiles/
    ├── profile-{userId}-{timestamp}.{ext}
    └── profile-{userId}-{timestamp}.{ext}
```

### **🗄️ Base de Données**

```sql
-- Table users - Colonne image
UPDATE users 
SET image = 'https://res.cloudinary.com/dpuo111u1/image/upload/...'
WHERE id = ?
```

## 🛠️ **Personnalisation des Permissions**

### **🎨 Modifier les Restrictions**

Pour personnaliser les permissions selon vos besoins métier, modifiez le fichier :
`src/app/api/admin/users/profile-photo/route.ts`

**Exemples de personnalisations :**

#### **1. Permettre aux chauffeurs de modifier les photos des clients :**
```typescript
// Exemple: Chauffeur peut modifier photo du client qu'il transporte
if (targetUserId !== session.user.id && 
    session.user.role !== 'admin' && 
    !(session.user.role === 'driver' && await isClientOfDriver(targetUserId, session.user.id))) {
  return NextResponse.json({ success: false, error: 'Permission refusée' }, { status: 403 })
}
```

#### **2. Système de validation d'images :**
```typescript
// Ajouter une validation avant upload
const isImageValid = await validateImageContent(file)
if (!isImageValid) {
  return NextResponse.json({ success: false, error: 'Image non conforme' }, { status: 400 })
}
```

#### **3. Logs d'audit :**
```typescript
// Ajouter un système de logs
await logUserAction({
  userId: session.user.id,
  action: 'PROFILE_PHOTO_UPDATE',
  targetUserId: targetUserId,
  timestamp: new Date()
})
```

### **📱 Customiser l'Interface**

#### **Masquer l'upload selon les rôles :**
```tsx
// Dans vos composants
{session?.user?.role !== 'customer' && (
  <UniversalProfilePhotoUpload {...props} />
)}
```

#### **Ajouter des restrictions de taille :**
```tsx
<UniversalProfilePhotoUpload
  maxSize={5 * 1024 * 1024} // 5MB max
  allowedTypes={['image/jpeg', 'image/png']}
  {...otherProps}
/>
```

## 🚨 **Sécurité et Bonnes Pratiques**

### **✅ Recommandations**

1. **Validation côté serveur** : Toujours valider les permissions côté API
2. **Taille des fichiers** : Limiter la taille max (actuellement 10MB)
3. **Types de fichiers** : Accepter uniquement images (JPEG, PNG, WebP)
4. **Rate limiting** : Implémenter des limites d'upload par utilisateur
5. **Modération** : Ajouter un système de validation des images si nécessaire

### **🛡️ Variables d'Environnement Requises**

```env
# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# NextAuth
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000

# Base de données
DATABASE_URL=your_database_url
```

### **⚠️ Points d'Attention**

1. **Ne jamais exposer** les clés API Cloudinary côté client
2. **Toujours vérifier** l'identité de l'utilisateur avant modification
3. **Nettoyer** les anciennes images de Cloudinary périodiquement
4. **Surveiller** l'usage de bande passante Cloudinary

## 🔄 **Migration depuis les Anciens Composants**

Si vous aviez utilisé les anciens composants (`ProfilePhotoUpload`, `UserProfilePhotoUpload`, `ClerkProfilePhotoUpload`), ils ont été supprimés et remplacés par `UniversalProfilePhotoUpload`.

### **Mapping de Migration :**

```typescript
// Ancien
<ProfilePhotoUpload
  userId={user.id}
  currentImage={user.image}
  onImageUpdate={handleUpdate}
  onSuccess={showSuccess}
  onError={showError}
/>

// Nouveau
<UniversalProfilePhotoUpload
  userId={user.id}           // Pour les admins uniquement
  currentPhoto={user.image}  // Renommé: currentImage → currentPhoto
  onSuccess={showSuccess}
  onError={showError}
  // onImageUpdate supprimé - géré automatiquement
/>
```

## 📞 **Support et Débogage**

### **🔍 Debugging**

Activer les logs détaillés en ajoutant dans votre fichier `.env.local` :
```env
DEBUG_UPLOAD=true
```

### **📊 Monitoring**

Le composant log automatiquement les actions :
- `📤 Upload vers API admin/users/profile-photo`
- `✅ Photo de profil mise à jour avec succès`
- `❌ Erreur lors de l'upload`

Surveillez ces logs dans la console du navigateur et les logs serveur.

---

## 🎉 **Installation Terminée !**

Votre système d'upload de photos de profil est maintenant :
- ✅ Intégré dans tous les dashboards
- ✅ Sécurisé avec les bonnes permissions
- ✅ Nettoyé des anciens composants
- ✅ Documenté pour la maintenance

**Testez votre application dès maintenant !** 🚀