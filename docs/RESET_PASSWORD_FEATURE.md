# Fonctionnalité de Réinitialisation de Mot de Passe

## 📝 Résumé

Ajout d'une fonctionnalité de réinitialisation de mot de passe qui s'affiche automatiquement après 2 tentatives de connexion échouées sur la page `/auth/signin`.

## ✅ Modifications Apportées

### 1. **Page de Connexion** (`src/app/auth/signin/page.tsx`)
- Ajout d'un compteur de tentatives de connexion échouées (`failedAttempts`)
- Affichage automatique d'un lien "Réinitialiser mon mot de passe" après 2 échecs
- Le lien apparaît directement dans le message d'erreur

### 2. **Page de Réinitialisation** (`src/app/auth/reset-password/page.tsx`)
- Nouvelle page pour demander la réinitialisation du mot de passe
- Interface utilisateur cohérente avec le design de l'application
- Validation côté client de l'adresse email
- Message de succès après envoi de la demande

### 3. **API de Réinitialisation** (`src/app/api/auth/reset-password/route.ts`)
- Endpoint POST pour traiter les demandes de réinitialisation
- Génération d'un token de réinitialisation sécurisé (32 caractères hex)
- Token valide pendant 1 heure
- Protection contre l'énumération des emails (même réponse que l'utilisateur existe ou non)

### 4. **Schéma de Base de Données** (`src/schema.ts`)
- Ajout de 2 nouvelles colonnes à la table `users` :
  - `reset_token` (TEXT) : Token de réinitialisation unique
  - `reset_token_expiry` (TIMESTAMP) : Date d'expiration du token

### 5. **Migration de Base de Données**
- Migration appliquée avec succès : `migrations/0009_add_reset_password.sql`
- Index créé sur `reset_token` pour améliorer les performances

## 🔧 Utilisation

### Pour l'utilisateur :
1. Accéder à `/auth/signin`
2. Tenter de se connecter avec un mauvais mot de passe (2 fois)
3. Un lien "Réinitialiser mon mot de passe →" apparaît dans le message d'erreur
4. Cliquer sur le lien pour être redirigé vers `/auth/reset-password`
5. Entrer son adresse email et valider
6. Un message de confirmation s'affiche

### Workflow de réinitialisation :
```
Échec connexion (x2) → Lien réinitialisation affiché
                          ↓
              Page /auth/reset-password
                          ↓
              Saisie de l'email
                          ↓
              Génération du token
                          ↓
    TODO: Envoi d'un email avec le lien
                          ↓
          Utilisateur clique sur le lien
                          ↓
      Page de confirmation (À CRÉER)
                          ↓
              Nouveau mot de passe
```

## 📧 TODO : Intégration Email

Pour compléter la fonctionnalité, il faut intégrer un service d'envoi d'email :

### Options recommandées :
1. **Brevo (SendinBlue)** - Déjà configuré dans le projet
2. **SendGrid**
3. **AWS SES**
4. **Mailgun**

### Code à ajouter dans `/api/auth/reset-password/route.ts` :

```typescript
// Exemple avec Brevo
import { sendResetPasswordEmail } from '@/lib/brevo-email'

// Après génération du token :
await sendResetPasswordEmail({
  to: email,
  resetLink: `${process.env.NEXTAUTH_URL}/auth/reset-password/confirm?token=${resetToken}`
})
```

### Page de confirmation à créer :
- `/auth/reset-password/confirm` - Pour valider le token et définir le nouveau mot de passe

## 🔒 Sécurité

- ✅ Token unique de 32 caractères (hex)
- ✅ Expiration après 1 heure
- ✅ Protection contre l'énumération des emails
- ✅ Index sur la colonne reset_token pour les performances
- ✅ Token stocké en base de données de manière sécurisée

## 🎨 Design

L'interface respecte le design system de l'application :
- Gradient bleu-violet pour les boutons
- Mode sombre supporté
- Responsive design
- Messages d'erreur et de succès cohérents

## 📊 État Actuel

- ✅ Détection des échecs de connexion
- ✅ Affichage du lien de réinitialisation
- ✅ Page de demande de réinitialisation
- ✅ API de génération de token
- ✅ Schéma de base de données mis à jour
- ✅ Migration appliquée
- ⏳ **En attente** : Envoi d'email
- ⏳ **En attente** : Page de confirmation et changement de mot de passe

## 🧪 Test

Pour tester la fonctionnalité :

1. Démarrer l'application : `npm run dev`
2. Aller sur `http://localhost:3000/auth/signin`
3. Tenter de se connecter 2 fois avec un mauvais mot de passe
4. Vérifier que le lien "Réinitialiser mon mot de passe" apparaît
5. Cliquer sur le lien et vérifier la page `/auth/reset-password`
6. Entrer un email et valider
7. Vérifier dans les logs du serveur le token généré

---

**Date de création** : 2 novembre 2025
**Statut** : Partiel - Nécessite l'intégration email
