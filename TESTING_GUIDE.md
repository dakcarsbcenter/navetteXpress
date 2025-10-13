# 🎯 URLs de Test - Système Upload Photos de Profil

## 🏠 **Dashboards avec Upload de Photos**

### 👤 **Dashboard Client**
```
http://localhost:3000/client/dashboard
```
- Connectez-vous en tant que client
- Allez dans l'onglet "Mon profil"
- Upload de sa propre photo uniquement

### 🚗 **Dashboard Chauffeur**
```
http://localhost:3000/driver/dashboard
```
- Connectez-vous en tant que chauffeur  
- Cliquez sur "Mon Profil" dans le menu
- Upload de sa propre photo uniquement

### 👑 **Dashboard Admin**
```
http://localhost:3000/admin/dashboard
```
- Connectez-vous en tant qu'admin
- Allez dans l'onglet "Utilisateurs"
- Cliquez "Modifier" sur un utilisateur
- Upload de la photo de n'importe quel utilisateur

## 🔧 **API Endpoints**

### 📤 **Upload/Suppression Photos**
```
POST /api/admin/users/profile-photo
DELETE /api/admin/users/profile-photo
```
- API unifiée pour tous les rôles
- Permissions automatiques selon l'utilisateur

### 🏥 **Health Check Système**
```
GET /api/profile-system-health
```
- Vérifier le bon fonctionnement du système
- Affiche l'état et les features disponibles

## 🧪 **Guide de Test Rapide**

### **1. Test Client/Chauffeur**
1. Connectez-vous avec un compte client ou chauffeur
2. Allez dans votre dashboard respectif
3. Accédez à la section profil
4. Testez l'upload d'une image (JPG/PNG/WebP, max 10MB)
5. Vérifiez que l'image s'affiche correctement
6. Testez la suppression de l'image

### **2. Test Admin**
1. Connectez-vous avec un compte admin
2. Allez dans `/admin/dashboard`
3. Onglet "Utilisateurs" → Modifier un utilisateur
4. Testez l'upload d'une photo pour cet utilisateur
5. Vérifiez que l'admin peut modifier les photos d'autres utilisateurs

### **3. Test Sécurité**
1. Essayez d'accéder aux APIs directement sans authentification
2. Vérifiez qu'un client ne peut pas modifier la photo d'un autre utilisateur
3. Testez avec des fichiers non-images (devrait être rejeté)
4. Testez avec des fichiers trop volumineux (devrait être rejeté)

## 📊 **Monitoring**

Surveillez les logs dans la console navigateur et serveur :
- `📤 [UPLOAD] Début de l'upload...`
- `✅ [UPLOAD] Photo de profil uploadée...`
- `❌ [UPLOAD] Erreur...`

## 🛠️ **Dépannage**

### **Si les images ne s'affichent pas :**
1. Vérifiez les variables d'environnement Cloudinary
2. Contrôlez les permissions CORS si nécessaire
3. Vérifiez les logs d'erreur Cloudinary

### **Si les uploads échouent :**
1. Vérifiez la taille du fichier (max 10MB)
2. Vérifiez le type de fichier (JPG/PNG/WebP uniquement)
3. Contrôlez l'authentification NextAuth

---

**🎉 Votre système d'upload de photos de profil est maintenant prêt !**