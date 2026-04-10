# 🔐 Guide Complet : Authentification Google OAuth pour NavetteXpress

## 🎯 Objectif
Permettre aux utilisateurs de se connecter et créer un compte avec leur compte Google sur `localhost:3000`.

## 📋 Étapes Détaillées

### 1️⃣ Accéder à Google Cloud Console
```
🔗 URL: https://console.cloud.google.com/
🔐 Connexion: Utilisez votre compte Google
```

### 2️⃣ Créer ou Sélectionner un Projet
```
📁 Nom du projet: NavetteXpress-Auth
🆔 ID du projet: navettexpress-auth-[random]
📍 Organisation: Laisser par défaut
```

### 3️⃣ Activer les APIs Nécessaires
Allez dans **APIs & Services > Library** et activez :
- ✅ **Google+ API** (obligatoire)
- ✅ **Google People API** (recommandé)

### 4️⃣ Configurer l'Écran de Consentement OAuth
**APIs & Services > OAuth consent screen**

```
🔘 Type d'utilisateur: External
📝 Nom de l'application: NavetteXpress
📧 Email de support: votre-email@gmail.com
🏠 Domaine d'accueil: localhost (optionnel)
🔒 Domaines autorisés: localhost
📧 Email de contact développeur: votre-email@gmail.com
```

**Scopes (Portées):**
- ✅ email
- ✅ profile
- ✅ openid

### 5️⃣ Créer les Identifiants OAuth 2.0
**APIs & Services > Credentials**

1. Cliquez sur **"Create Credentials"**
2. Sélectionnez **"OAuth client ID"**
3. Type d'application: **Web application**
4. Nom: **NavetteXpress Web Client**

### 6️⃣ Configurer les URIs (IMPORTANT)
```
🌐 Origines JavaScript autorisées:
   http://localhost:3000

🔄 URIs de redirection autorisées:
   http://localhost:3000/api/auth/callback/google
```

⚠️ **ATTENTION**: L'URI de callback doit être exactement : `/api/auth/callback/google`

### 7️⃣ Récupérer les Identifiants
Après création, vous obtiendrez :

```
🔑 Client ID:
   Format: 1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com

🔐 Client Secret:
   Format: GOCSPX-abcdefghijklmnopqrstuvwxyz
```

### 8️⃣ Configuration dans .env.local
Ajoutez ces lignes dans votre fichier `.env.local`:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID="VOTRE-CLIENT-ID-ICI"
GOOGLE_CLIENT_SECRET="VOTRE-CLIENT-SECRET-ICI"
```

### 9️⃣ Tester la Configuration
```bash
# 1. Vérifier la configuration
node scripts/test-google-oauth.js

# 2. Redémarrer le serveur
npm run dev

# 3. Tester la connexion
# Allez sur: http://localhost:3000/auth/signin
# Cliquez sur "Continuer avec Google"
```

## � Résolution des Problèmes Courants

### Erreur: "redirect_uri_mismatch"
```
❌ Problème: L'URI de redirection ne correspond pas
✅ Solution: Vérifiez que l'URI est exactement:
   http://localhost:3000/api/auth/callback/google
```

### Erreur: "access_denied"
```
❌ Problème: L'utilisateur a refusé l'accès
✅ Solution: Normal, réessayez avec "Autoriser"
```

### Erreur: "Configuration"
```
❌ Problème: Credentials manquants ou incorrects
✅ Solution: Vérifiez vos variables d'environnement
```

## 🚀 Déploiement en Production

Quand vous déployerez sur un domaine réel :

```bash
# 1. Ajoutez votre domaine dans Google Console:
https://votre-domaine.com
https://votre-domaine.com/api/auth/callback/google

# 2. Mettez à jour .env:
NEXTAUTH_URL=https://votre-domaine.com
```

## � Test Complet

### Scénario 1: Nouvel Utilisateur
1. Va sur `/auth/signin`
2. Clique "Continuer avec Google"
3. Autorise l'application
4. → Compte créé automatiquement
5. → Redirection vers `/dashboard`

### Scénario 2: Utilisateur Existant
1. Va sur `/auth/signin`
2. Clique "Continuer avec Google"
3. → Connexion immédiate
4. → Redirection vers `/dashboard`

## 🎨 Personnalisation UI

Le bouton Google utilise déjà :
- ✅ Logo officiel Google
- ✅ Couleurs de marque
- ✅ Animations hover
- ✅ États de chargement
- ✅ Support mode sombre

## 📊 Fonctionnalités Automatiques

✅ **Création automatique de compte** pour nouveaux utilisateurs
✅ **Rôle par défaut**: "customer"
✅ **Synchronisation de l'avatar** depuis Google
✅ **Pas de mot de passe requis**
✅ **Intégration complète** avec le système existant

## ⚡ Commandes Rapides

```bash
# Vérifier la configuration
node scripts/test-google-oauth.js

# Redémarrer le serveur
npm run dev

# Ouvrir Google Console
start https://console.cloud.google.com/

# Tester l'authentification
start http://localhost:3000/auth/signin
```

---

🎉 **Félicitations !** Votre authentification Google est maintenant configurée !