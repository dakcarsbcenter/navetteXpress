# 🎯 Utilisation des Templates Resend - Guide Complet

## 📋 Table des Matières

1. [Configuration des Templates dans Resend](#configuration)
2. [Variables d'Environnement](#environnement)
3. [Utilisation dans l'Application](#utilisation)
4. [Test de la Configuration](#test)
5. [Migration du Code Existant](#migration)

---

## 🔧 Configuration des Templates dans Resend {#configuration}

### Étape 1 : Créer un Compte Resend

1. Allez sur https://resend.com/signup
2. Créez un compte gratuit (100 emails/jour)
3. Vérifiez votre email

### Étape 2 : Obtenir la Clé API

1. Allez sur https://resend.com/api-keys
2. Cliquez sur **"Create API Key"**
3. Nom : `NavetteXpress Production`
4. Permissions : **Full Access** (ou Send Emails seulement)
5. Copiez la clé (elle ne sera montrée qu'une fois !)

### Étape 3 : Créer les Templates

#### 📧 Template 1 : Password Reset

1. Allez sur https://resend.com/emails/templates
2. Cliquez sur **"Create Template"**
3. Remplissez :
   - **Name** : `password-reset`
   - **Subject** : `Réinitialisation de votre mot de passe - NavetteXpress`
4. Dans l'éditeur HTML, collez le contenu de :
   ```bash
   d:\navetteXpress\resend-templates\password-reset.html
   ```
5. **Variables utilisées** :
   - `{{userName}}` - Nom de l'utilisateur
   - `{{resetUrl}}` - Lien de réinitialisation complet
6. Cliquez sur **"Save"**
7. **Notez l'ID du template** (visible dans l'URL)

#### 🔒 Template 2 : Account Locked

1. Créez un nouveau template
2. Remplissez :
   - **Name** : `account-locked`
   - **Subject** : `🔒 Alerte sécurité - Compte temporairement bloqué`
3. Collez le contenu de :
   ```bash
   d:\navetteXpress\resend-templates\account-locked.html
   ```
4. **Variables utilisées** :
   - `{{userName}}` - Nom de l'utilisateur
   - `{{unlockTime}}` - Date/heure de déblocage formatée
   - `{{resetUrl}}` - Lien de réinitialisation
5. Sauvegardez et notez l'ID

#### 🎉 Template 3 : Welcome

1. Créez un nouveau template
2. Remplissez :
   - **Name** : `welcome`
   - **Subject** : `🎉 Bienvenue chez NavetteXpress !`
3. Collez le contenu de :
   ```bash
   d:\navetteXpress\resend-templates\welcome.html
   ```
4. **Variables utilisées** :
   - `{{userName}}` - Nom de l'utilisateur (optionnel)
   - `{{dashboardUrl}}` - Lien vers le dashboard
5. Sauvegardez et notez l'ID

#### ✅ Template 4 : Password Changed (Optionnel)

Créez un template similaire pour confirmer le changement de mot de passe.

---

## 🔐 Variables d'Environnement {#environnement}

### Fichier `.env.local`

Ajoutez ces variables :

```env
# ===== RESEND EMAIL CONFIGURATION =====

# Clé API Resend (obtenue depuis https://resend.com/api-keys)
RESEND_API_KEY=re_votre_clé_api_ici

# Email d'envoi (utilisez onboarding@resend.dev pour les tests)
# Pour la production, configurez votre domaine dans Resend
RESEND_FROM_EMAIL=NavetteXpress <onboarding@resend.dev>

# IDs des templates (obtenus depuis https://resend.com/emails/templates)
RESEND_TEMPLATE_PASSWORD_RESET=password-reset
RESEND_TEMPLATE_ACCOUNT_LOCKED=account-locked
RESEND_TEMPLATE_PASSWORD_CHANGED=password-changed
RESEND_TEMPLATE_WELCOME=welcome

# URL de l'application (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Pour la Production

```env
# Production
RESEND_FROM_EMAIL=NavetteXpress <noreply@votredomaine.com>
NEXT_PUBLIC_APP_URL=https://votredomaine.com
```

**⚠️ N'oubliez pas de redémarrer le serveur après modification !**

```bash
# Ctrl+C puis
npm run dev
```

---

## 💻 Utilisation dans l'Application {#utilisation}

### Option 1 : Remplacer le Module Actuel (Recommandé)

Remplacez `src/lib/email.ts` par la version avec templates :

```bash
# Sauvegardez l'ancien
mv src/lib/email.ts src/lib/email-old.ts

# Utilisez la nouvelle version
mv src/lib/email-resend-templates.ts src/lib/email.ts
```

### Option 2 : Utiliser les Deux Modules

Gardez les deux et importez selon vos besoins :

```typescript
// Avec React Email (génération dynamique)
import { sendPasswordResetEmail } from '@/lib/email';

// Avec templates Resend (production)
import { sendPasswordResetEmail } from '@/lib/email-resend-templates';
```

### Exemples d'Utilisation

#### 📧 Email de Réinitialisation

```typescript
// Dans src/app/api/auth/reset-password/route.ts
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: Request) {
  // ... votre logique ...
  
  await sendPasswordResetEmail(
    user.email,
    resetToken,
    user.name || 'Utilisateur'
  );
  
  return NextResponse.json({ message: 'Email envoyé' });
}
```

#### 🔒 Email de Blocage de Compte

```typescript
// Dans src/lib/auth.ts
import { sendAccountLockedEmail } from './email';

// Après 3 tentatives échouées
const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

await sendAccountLockedEmail(
  user.email,
  user.name || 'Utilisateur',
  lockedUntil
);
```

#### ✅ Email de Confirmation

```typescript
// Dans src/app/api/auth/reset-password/confirm/route.ts
import { sendPasswordChangedEmail } from '@/lib/email';

// Après changement réussi
await sendPasswordChangedEmail(
  user.email,
  user.name || 'Utilisateur'
);
```

#### 🎉 Email de Bienvenue

```typescript
// Dans src/app/api/auth/signup/route.ts
import { sendWelcomeEmail } from '@/lib/email';

// Après création du compte
await sendWelcomeEmail(
  newUser.email,
  newUser.name
);
```

---

## 🧪 Test de la Configuration {#test}

### Script de Test

Créez `test-resend-templates.ts` :

```typescript
import { testResendConfiguration } from './src/lib/email-resend-templates';

async function main() {
  console.log('🧪 Test de la configuration Resend...\n');
  
  const isConfigured = await testResendConfiguration();
  
  if (isConfigured) {
    console.log('\n✅ Configuration OK ! Vous pouvez utiliser les templates.');
  } else {
    console.log('\n❌ Configuration incorrecte. Vérifiez vos variables d\'environnement.');
  }
}

main();
```

Exécutez :

```bash
npx tsx test-resend-templates.ts
```

### Test avec Votre Email

Créez `test-send-email.ts` :

```typescript
import { sendPasswordResetEmail } from './src/lib/email-resend-templates';

async function main() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.error('❌ Usage: npm run test:email votre@email.com');
    process.exit(1);
  }
  
  console.log(`📧 Envoi d'un email de test à ${testEmail}...`);
  
  try {
    await sendPasswordResetEmail(
      testEmail,
      'test-token-123',
      'Test User'
    );
    console.log('✅ Email envoyé ! Vérifiez votre boîte de réception.');
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  }
}

main();
```

Ajoutez dans `package.json` :

```json
{
  "scripts": {
    "test:email": "npx tsx test-send-email.ts"
  }
}
```

Testez :

```bash
npm run test:email votre@email.com
```

---

## 🔄 Migration du Code Existant {#migration}

### Fichiers à Modifier

#### 1. `src/lib/auth.ts`

```typescript
// Changez l'import
import { sendAccountLockedEmail } from './email';
// en
import { sendAccountLockedEmail } from './email-resend-templates';

// Le reste du code reste identique !
```

#### 2. `src/app/api/auth/reset-password/route.ts`

```typescript
// Changez l'import
import { sendPasswordResetEmail } from '@/lib/email';
// en
import { sendPasswordResetEmail } from '@/lib/email-resend-templates';
```

#### 3. `src/app/api/auth/reset-password/confirm/route.ts`

```typescript
// Changez l'import
import { sendPasswordChangedEmail } from '@/lib/email';
// en
import { sendPasswordChangedEmail } from '@/lib/email-resend-templates';
```

### Checklist de Migration

- [ ] Templates créés dans Resend Dashboard
- [ ] IDs des templates notés
- [ ] Variables d'environnement configurées dans `.env.local`
- [ ] Module `email-resend-templates.ts` créé
- [ ] Test de configuration réussi
- [ ] Imports mis à jour dans les fichiers API
- [ ] Serveur redémarré
- [ ] Email de test envoyé et reçu
- [ ] Templates testés en production

---

## 🎨 Personnalisation des Templates

### Dans le Dashboard Resend

1. Allez sur votre template
2. Cliquez sur **"Edit"**
3. Modifiez le HTML/CSS
4. Cliquez sur **"Save"**
5. ✅ Changements appliqués instantanément !

**Avantages** :
- Pas besoin de redéployer l'application
- Changements en temps réel
- Prévisualisation dans Resend
- Historique des versions

### Tester les Modifications

```bash
npm run test:email votre@email.com
```

---

## 📊 Monitoring des Emails

### Dashboard Resend

1. Allez sur https://resend.com/emails
2. Voyez tous les emails envoyés
3. Filtrez par statut :
   - ✅ Delivered
   - ⏳ Pending
   - ❌ Failed
4. Cliquez sur un email pour voir les détails

### Logs dans l'Application

Les fonctions d'envoi loggent automatiquement :

```typescript
// ✅ Success
console.log('✅ Email de réinitialisation envoyé:', data?.id);

// ❌ Error
console.error('❌ Erreur lors de l\'envoi:', error);
```

---

## 🚨 Dépannage

### Erreur : `RESEND_API_KEY is not defined`

```bash
# Vérifiez .env.local
cat .env.local | grep RESEND

# Si vide, ajoutez :
echo "RESEND_API_KEY=re_votre_clé" >> .env.local

# Redémarrez
npm run dev
```

### Erreur : Template not found

```typescript
// Vérifiez l'ID dans Resend Dashboard
// Mettez à jour .env.local avec le bon ID
RESEND_TEMPLATE_PASSWORD_RESET=le-bon-id-ici
```

### Emails non reçus

1. Vérifiez les spams
2. Vérifiez le dashboard Resend (status)
3. Utilisez `delivered@resend.dev` pour tester
4. Vérifiez votre quota (100/jour en gratuit)

### Variables non remplacées

Les variables apparaissent comme `{{userName}}` dans l'email ?

**Cause** : Le template n'utilise pas la syntaxe Resend

**Solution** : Vérifiez que vous utilisez bien `{{variableName}}` dans le HTML du template

---

## ✅ Checklist Finale

### Configuration
- [ ] Compte Resend créé
- [ ] Clé API obtenue
- [ ] 3+ templates créés dans le dashboard
- [ ] IDs des templates notés

### Variables d'Environnement
- [ ] `RESEND_API_KEY` configurée
- [ ] `RESEND_FROM_EMAIL` configurée
- [ ] `RESEND_TEMPLATE_*` configurées
- [ ] `NEXT_PUBLIC_APP_URL` configurée

### Code
- [ ] Module `email-resend-templates.ts` créé
- [ ] Imports mis à jour dans l'application
- [ ] Serveur redémarré

### Tests
- [ ] Test de configuration réussi
- [ ] Email de test envoyé et reçu
- [ ] Templates affichés correctement
- [ ] Variables remplacées correctement

### Production
- [ ] Domaine vérifié dans Resend (optionnel)
- [ ] Email FROM personnalisé (optionnel)
- [ ] Monitoring configuré
- [ ] Logs vérifiés

---

## 🎯 Prochaines Étapes

### Maintenant

1. **Configurer Resend** (15 min)
   ```bash
   # 1. Créer les templates
   # 2. Configurer .env.local
   # 3. Tester
   npm run test:email votre@email.com
   ```

2. **Migrer le code** (5 min)
   ```bash
   # Remplacer les imports
   # Redémarrer le serveur
   npm run dev
   ```

3. **Tester en conditions réelles**
   - Essayer de se connecter avec un mauvais mot de passe 3 fois
   - Demander une réinitialisation de mot de passe
   - Vérifier la réception des emails

### Plus tard

- Ajouter plus de templates (booking confirmation, etc.)
- Configurer un domaine personnalisé
- Ajouter des analytics
- A/B testing des templates

---

## 📚 Ressources

- **Resend Dashboard** : https://resend.com
- **Resend Docs** : https://resend.com/docs
- **React Email** : https://react.email
- **Templates générés** : `d:\navetteXpress\resend-templates\`

---

**Date de création** : 15 novembre 2025  
**Status** : ✅ Prêt à l'emploi  
**Templates** : 3 créés  
**Méthode** : Templates Resend Dashboard
