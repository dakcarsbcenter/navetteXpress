# Configuration NextAuth.js

## Variables d'environnement requises

Créez un fichier `.env.local` dans le répertoire racine avec les variables suivantes :

```env
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth (Optionnel)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL=your-database-url
```

## Configuration Google OAuth (Optionnel)

Pour activer la connexion Google :

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google+ 
4. Créez des identifiants OAuth 2.0
5. Ajoutez `http://localhost:3000/api/auth/callback/google` comme URI de redirection
6. Copiez le Client ID et Client Secret dans votre `.env.local`

## Génération de NEXTAUTH_SECRET

Pour générer une clé secrète sécurisée :

```bash
openssl rand -base64 32
```

Ou utilisez un générateur en ligne : https://generate-secret.vercel.app/32

## Fonctionnalités disponibles

✅ **Connexion par email/mot de passe**
- Page de connexion : `/auth/signin`
- Page d'inscription : `/auth/signup`

✅ **Connexion Google OAuth** (si configuré)
- Bouton "Continuer avec Google" sur les pages d'auth

✅ **Protection des routes**
- Dashboard : `/dashboard` (requiert authentification)
- Admin : `/admin` (requiert rôle admin)

✅ **Gestion des sessions**
- Sessions JWT sécurisées
- Déconnexion automatique
- Interface utilisateur personnalisée

## Test de l'application

1. Démarrez le serveur : `npm run dev`
2. Accédez à `http://localhost:3000`
3. Testez la connexion sur `/auth/signin`
4. Testez l'inscription sur `/auth/signup`
5. Vérifiez l'accès au dashboard après connexion

## Migration terminée

✅ Clerk supprimé
✅ NextAuth.js installé et configuré
✅ Schéma de base de données mis à jour
✅ Composants d'authentification remplacés
✅ Pages protégées mises à jour
✅ Middleware de sécurité configuré

Votre application utilise maintenant NextAuth.js pour l'authentification !
