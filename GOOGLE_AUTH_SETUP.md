# Guide d'Intégration Google OAuth - NavetteXpress

## 🎯 Vue d'ensemble

Ce guide vous accompagne dans l'intégration de l'authentification Google pour votre application NavetteXpress.

## 📋 Prérequis

- Compte Google (pour Google Cloud Console)
- Application Next.js configurée avec NextAuth
- Base de données configurée

## 🔧 Configuration Google Cloud Console

### 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un existant
3. Notez l'ID du projet

### 2. Activer les APIs nécessaires

1. Dans "APIs & Services" > "Library"
2. Activez :
   - **Google+ API**
   - **Google OAuth2 API**

### 3. Configurer l'écran de consentement OAuth

1. Allez dans "APIs & Services" > "OAuth consent screen"
2. Choisissez "External"
3. Remplissez :
   - **App name**: NavetteXpress
   - **User support email**: votre email
   - **Developer contact**: votre email
4. Ajoutez les scopes :
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`

### 4. Créer les identifiants OAuth2

1. "APIs & Services" > "Credentials"
2. "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configurez :
   - **Type**: Web application
   - **Name**: NavetteXpress Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (développement)
     - `https://votre-domaine.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (développement)
     - `https://votre-domaine.com/api/auth/callback/google` (production)

## 🔐 Configuration des variables d'environnement

Créez un fichier `.env.local` dans la racine du projet :

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre-secret-nextauth-ici

# Google OAuth Configuration
GOOGLE_CLIENT_ID=votre-google-client-id-ici
GOOGLE_CLIENT_SECRET=votre-google-client-secret-ici

# Database (si nécessaire)
DATABASE_URL=votre-database-url-ici
```

### Générer NEXTAUTH_SECRET

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🚀 Test de la configuration

### 1. Vérifier la configuration

```bash
node scripts/test-google-auth.js
```

### 2. Démarrer l'application

```bash
npm run dev
```

### 3. Tester l'authentification

1. Allez sur `http://localhost:3000/auth/signin`
2. Cliquez sur "Continuer avec Google"
3. Autorisez l'application
4. Vérifiez la redirection vers `/dashboard`

## 🔍 Dépannage

### Erreurs courantes

#### 1. "redirect_uri_mismatch"
- Vérifiez que l'URL de redirection dans Google Console correspond exactement à `http://localhost:3000/api/auth/callback/google`

#### 2. "invalid_client"
- Vérifiez que `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont corrects
- Assurez-vous qu'ils ne contiennent pas d'espaces

#### 3. "access_denied"
- L'utilisateur a refusé l'autorisation
- Vérifiez les scopes dans Google Console

#### 4. "Error: Configuration"
- Vérifiez que `NEXTAUTH_SECRET` est défini
- Redémarrez le serveur après avoir ajouté les variables d'environnement

### Logs de débogage

Activez les logs NextAuth en ajoutant dans `.env.local` :

```env
NEXTAUTH_DEBUG=true
```

## 📱 Fonctionnalités implémentées

### ✅ Connexion Google
- Bouton "Continuer avec Google" sur la page de connexion
- Gestion automatique des utilisateurs existants
- Mise à jour des informations de profil

### ✅ Inscription Google
- Bouton "Continuer avec Google" sur la page d'inscription
- Création automatique de compte client
- Vérification d'email automatique

### ✅ Gestion des utilisateurs
- Création automatique d'utilisateurs Google
- Attribution du rôle "client" par défaut
- Synchronisation des informations de profil

### ✅ Interface utilisateur
- Icône Google officielle
- États de chargement
- Gestion d'erreurs
- Design responsive

## 🔒 Sécurité

### Bonnes pratiques implémentées

1. **Validation des tokens** : NextAuth valide automatiquement les tokens Google
2. **Gestion des erreurs** : Messages d'erreur sécurisés sans exposition d'informations sensibles
3. **Rôles par défaut** : Les utilisateurs Google sont créés avec le rôle "client"
4. **Vérification d'email** : Les comptes Google sont automatiquement vérifiés

### Recommandations supplémentaires

1. **HTTPS en production** : Utilisez toujours HTTPS en production
2. **Domaines autorisés** : Limitez les domaines autorisés dans Google Console
3. **Monitoring** : Surveillez les tentatives de connexion suspectes
4. **Backup** : Sauvegardez régulièrement votre base de données

## 📊 Monitoring et Analytics

### Métriques à surveiller

1. **Taux de conversion** : Connexions Google vs connexions classiques
2. **Erreurs d'authentification** : Fréquence et types d'erreurs
3. **Temps de réponse** : Performance des appels Google OAuth
4. **Utilisateurs actifs** : Nombre d'utilisateurs connectés via Google

## 🚀 Déploiement en production

### 1. Mise à jour des URLs

Dans Google Cloud Console, ajoutez :
- **Authorized JavaScript origins** : `https://votre-domaine.com`
- **Authorized redirect URIs** : `https://votre-domaine.com/api/auth/callback/google`

### 2. Variables d'environnement

```env
NEXTAUTH_URL=https://votre-domaine.com
GOOGLE_CLIENT_ID=votre-client-id-production
GOOGLE_CLIENT_SECRET=votre-client-secret-production
```

### 3. Test en production

1. Testez la connexion Google
2. Vérifiez les redirections
3. Testez la création de comptes
4. Vérifiez les rôles utilisateurs

## 📞 Support

En cas de problème :

1. Vérifiez les logs de l'application
2. Consultez la [documentation NextAuth](https://next-auth.js.org/)
3. Consultez la [documentation Google OAuth](https://developers.google.com/identity/protocols/oauth2)

---

**Note** : Ce guide est spécifique à NavetteXpress. Adaptez les URLs et configurations selon votre domaine de production.
