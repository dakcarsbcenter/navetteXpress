# 🚀 Configuration Cloudinary pour Navette Xpress

## Étape 1 : Créer un compte Cloudinary (GRATUIT)

### 1.1 Inscription
1. Allez sur **https://cloudinary.com**
2. Cliquez sur **"Sign Up for Free"**
3. Remplissez le formulaire :
   - Nom
   - Email
   - Mot de passe
4. **OU** inscrivez-vous avec GitHub/Google

### 1.2 Récupérer vos credentials

Une fois connecté, vous arrivez sur le **Dashboard**. Vous y trouverez :

```
Cloud Name: xxxxxx
API Key: 123456789012345
API Secret: xxxxxxxxxxxxxxxxxxxx
```

**⚠️ IMPORTANT : Notez ces 3 valeurs, vous en aurez besoin !**

---

## Étape 2 : Créer un Upload Preset

### 2.1 Navigation
1. Dans le Dashboard Cloudinary
2. Cliquez sur l'icône **⚙️ Settings** (en haut à droite)
3. Allez dans l'onglet **"Upload"**
4. Faites défiler jusqu'à **"Upload presets"**
5. Cliquez sur **"Add upload preset"**

### 2.2 Configuration du preset
- **Preset name** : `navette-xpress-vehicles`
- **Signing Mode** : **Unsigned** (IMPORTANT !)
- **Folder** : `navette-xpress/vehicles`
- **Access mode** : Public
- **Unique filename** : ✅ Activé
- Laissez le reste par défaut
- Cliquez sur **"Save"**

**📋 Notez le nom du preset : `navette-xpress-vehicles`**

---

## Étape 3 : Configuration dans votre projet

### 3.1 Variables d'environnement

Créez ou modifiez votre fichier `.env.local` à la racine du projet :

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="votre-cloud-name-ici"
NEXT_PUBLIC_CLOUDINARY_API_KEY="votre-api-key-ici"
CLOUDINARY_API_SECRET="votre-api-secret-ici"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="navette-xpress-vehicles"
```

**Remplacez les valeurs avec celles de l'Étape 1 !**

---

## Étape 4 : Test rapide

Une fois tout configuré, vous pourrez uploader des images qui seront automatiquement :
- ✅ Optimisées (WebP, AVIF)
- ✅ Redimensionnées selon les besoins
- ✅ Servies via CDN mondial
- ✅ Accessibles via une URL permanente

---

## 🎉 C'est tout !

Votre configuration Cloudinary est terminée. Vous pouvez maintenant utiliser le composant `ImageUploader` dans votre application !

---

## 📊 Limites du plan gratuit

- **Stockage** : 25 GB
- **Bande passante** : 25 GB/mois
- **Transformations** : 25,000 par mois

**Largement suffisant pour démarrer !** 🚀

---

## ❓ Problèmes courants

### "Upload failed" ou "Invalid signature"
→ Vérifiez que le preset est bien en mode **"Unsigned"**

### "Access denied"
→ Vérifiez que vos variables d'environnement sont correctes

### Images ne s'affichent pas
→ Redémarrez votre serveur Next.js après avoir ajouté les variables d'environnement

---

## 🔗 Liens utiles

- Dashboard : https://console.cloudinary.com
- Documentation : https://cloudinary.com/documentation
- Support : https://support.cloudinary.com


