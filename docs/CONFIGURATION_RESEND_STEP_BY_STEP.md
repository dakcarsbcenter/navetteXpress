# ✅ Configuration Templates Resend - Guide Pas à Pas

## 🎯 Ce qui a été préparé pour vous

### 📁 Fichiers Créés

1. **Templates HTML pour Resend** → `resend-templates/`
   - ✅ `password-reset.html` - Email de réinitialisation
   - ✅ `account-locked.html` - Notification de blocage
   - ✅ `welcome.html` - Email de bienvenue

2. **Module d'envoi avec templates Resend** → `src/lib/email-resend-templates.ts`
   - Utilise les templates du dashboard Resend
   - Gère toutes les variables dynamiques
   - Logs et gestion d'erreurs intégrés

3. **Scripts utiles**
   - `generate-resend-templates.ts` - Génère les HTML pour Resend
   - `test-resend-templates.ts` - Teste l'envoi d'emails

4. **Documentation**
   - `RESEND_TEMPLATES_USAGE.md` - Guide complet (40+ pages)
   - `QUICK_START_RESEND.md` - Démarrage rapide
   - `.env.resend.example` - Exemple de configuration

---

## 🚀 Configuration en 6 Étapes (15 minutes)

### Étape 1 : Créer un Compte Resend (3 min)

```
1. Allez sur : https://resend.com/signup
2. Créez un compte avec votre email
3. Vérifiez votre email
4. Connectez-vous
```

**✅ Résultat** : Compte créé, vous êtes sur le dashboard

---

### Étape 2 : Obtenir la Clé API (1 min)

```
1. Allez sur : https://resend.com/api-keys
2. Cliquez sur "Create API Key"
3. Nom : NavetteXpress Production
4. Permission : Full Access (ou "Send emails" minimum)
5. Cliquez sur "Create"
6. COPIEZ LA CLÉ (elle ne sera plus visible !)
```

**✅ Résultat** : Clé API copiée (format : `re_...`)

---

### Étape 3 : Créer les Templates dans Resend (10 min)

#### Template 1 : Password Reset

```
1. Allez sur : https://resend.com/emails/templates
2. Cliquez sur "Create Template"
3. Remplissez :
   Name: password-reset
   Subject: Réinitialisation de votre mot de passe - NavetteXpress

4. Dans l'éditeur HTML :
   - Ouvrez le fichier : resend-templates/password-reset.html
   - Copiez TOUT le contenu (avec les commentaires)
   - Collez dans l'éditeur Resend
   - Supprimez les commentaires <!-- ... --> du début

5. Cliquez sur "Save"
6. NOTEZ L'ID (visible dans l'URL ou le nom)
```

**Variables utilisées** :
- `{{userName}}` - Nom de l'utilisateur
- `{{resetUrl}}` - Lien de réinitialisation complet

#### Template 2 : Account Locked

```
1. Créez un nouveau template
2. Remplissez :
   Name: account-locked
   Subject: 🔒 Alerte sécurité - Compte temporairement bloqué

3. Copiez le contenu de : resend-templates/account-locked.html
4. Collez et nettoyez les commentaires
5. Save et notez l'ID
```

**Variables utilisées** :
- `{{userName}}` - Nom de l'utilisateur
- `{{unlockTime}}` - Date/heure de déblocage
- `{{resetUrl}}` - Lien de réinitialisation

#### Template 3 : Welcome

```
1. Créez un nouveau template
2. Remplissez :
   Name: welcome
   Subject: 🎉 Bienvenue chez NavetteXpress !

3. Copiez le contenu de : resend-templates/welcome.html
4. Collez et nettoyez
5. Save et notez l'ID
```

**✅ Résultat** : 3 templates créés dans Resend, IDs notés

---

### Étape 4 : Configurer .env.local (2 min)

Ouvrez `.env.local` et ajoutez ces lignes :

```env
# ===== RESEND EMAIL CONFIGURATION =====

# Clé API (remplacez par votre vraie clé)
RESEND_API_KEY=re_votre_clé_api_ici

# Email d'envoi (gardez onboarding@resend.dev pour les tests)
RESEND_FROM_EMAIL=NavetteXpress <onboarding@resend.dev>

# IDs des templates (remplacez par vos vrais IDs si différents)
RESEND_TEMPLATE_PASSWORD_RESET=password-reset
RESEND_TEMPLATE_ACCOUNT_LOCKED=account-locked
RESEND_TEMPLATE_PASSWORD_CHANGED=password-changed
RESEND_TEMPLATE_WELCOME=welcome

# URL de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Important** : Remplacez `re_votre_clé_api_ici` par votre vraie clé !

**✅ Résultat** : `.env.local` configuré

---

### Étape 5 : Tester la Configuration (2 min)

```bash
# Test de configuration
npm run email:test votre@email.com
```

**Vous devriez voir** :
```
🧪 Test de la configuration Resend...
✅ Configuration Resend OK. Email de test envoyé: xxx
📧 Envoi du template "Password Reset"...
✅ Email de réinitialisation envoyé: xxx
✅ Email envoyé avec succès !
```

**Vérifiez votre email** (regardez aussi les spams)

**✅ Résultat** : Email reçu avec le template stylé

---

### Étape 6 : Activer dans l'Application (1 min)

```bash
# Sauvegarde de l'ancien module
mv src/lib/email.ts src/lib/email-old.ts

# Activation du nouveau module avec templates Resend
mv src/lib/email-resend-templates.ts src/lib/email.ts

# Redémarrage du serveur
npm run dev
```

**✅ Résultat** : Application utilise les templates Resend

---

## 🧪 Tests Supplémentaires

### Tester Chaque Template

```bash
# Password Reset
npm run email:test votre@email.com password-reset

# Account Locked
npm run email:test votre@email.com account-locked

# Welcome
npm run email:test votre@email.com welcome
```

### Test en Conditions Réelles

1. **Test de blocage de compte** :
   ```
   1. Allez sur /auth/signin
   2. Entrez un mauvais mot de passe 3 fois
   3. Compte bloqué → email reçu
   ```

2. **Test de réinitialisation** :
   ```
   1. Allez sur /auth/reset-password
   2. Entrez votre email
   3. Email de réinitialisation reçu
   4. Cliquez sur le lien
   5. Changez le mot de passe
   6. Email de confirmation reçu (si configuré)
   ```

---

## 📊 Monitoring

### Dashboard Resend

```
1. Allez sur : https://resend.com/emails
2. Voyez tous les emails envoyés
3. Filtrez par statut (Delivered, Failed, etc.)
4. Cliquez sur un email pour voir les détails
```

### Logs dans l'Application

Les emails sont loggés automatiquement :

```typescript
// Success
✅ Email de réinitialisation envoyé: xxx

// Error
❌ Erreur lors de l'envoi: [message]
```

---

## 🎨 Personnaliser les Templates

### Dans Resend (Recommandé)

```
1. Allez sur https://resend.com/emails/templates
2. Cliquez sur un template
3. Cliquez sur "Edit"
4. Modifiez le HTML/CSS
5. Save

✅ Changements appliqués instantanément (pas de redéploiement !)
```

### Variables Disponibles

Chaque template supporte des variables dynamiques :

**password-reset** :
- `{{userName}}` - Nom de l'utilisateur
- `{{resetUrl}}` - Lien complet de réinitialisation

**account-locked** :
- `{{userName}}` - Nom de l'utilisateur
- `{{unlockTime}}` - Date de déblocage formatée
- `{{resetUrl}}` - Lien de réinitialisation

**welcome** :
- `{{userName}}` - Nom de l'utilisateur
- `{{dashboardUrl}}` - Lien vers le dashboard

---

## ⚙️ Configuration Production

### Domaine Personnalisé

Pour utiliser votre propre domaine (`noreply@votredomaine.com`) :

```
1. Allez sur : https://resend.com/domains
2. Cliquez sur "Add Domain"
3. Entrez votre domaine : votredomaine.com
4. Ajoutez les enregistrements DNS fournis
5. Vérifiez le domaine

Puis dans .env.local :
RESEND_FROM_EMAIL=NavetteXpress <noreply@votredomaine.com>
```

### Variables de Production

```env
# .env.production ou .env.local (production)
RESEND_API_KEY=re_prod_votre_clé
RESEND_FROM_EMAIL=NavetteXpress <noreply@votredomaine.com>
NEXT_PUBLIC_APP_URL=https://votredomaine.com
```

---

## ✅ Checklist Finale

### Configuration
- [ ] Compte Resend créé
- [ ] Clé API obtenue et copiée
- [ ] Template "password-reset" créé dans Resend
- [ ] Template "account-locked" créé dans Resend
- [ ] Template "welcome" créé dans Resend
- [ ] IDs des templates notés

### Variables d'Environnement
- [ ] `RESEND_API_KEY` configurée
- [ ] `RESEND_FROM_EMAIL` configurée
- [ ] `RESEND_TEMPLATE_*` configurées
- [ ] `NEXT_PUBLIC_APP_URL` configurée
- [ ] Serveur redémarré après modification

### Tests
- [ ] Test de configuration réussi
- [ ] Email "password-reset" envoyé et reçu
- [ ] Email "account-locked" envoyé et reçu
- [ ] Email "welcome" envoyé et reçu
- [ ] Variables remplacées correctement
- [ ] Templates affichés proprement (pas de code visible)

### Activation
- [ ] Module `email-resend-templates.ts` renommé en `email.ts`
- [ ] Ancien module sauvegardé (`email-old.ts`)
- [ ] Application testée (3 mauvais mots de passe)
- [ ] Email de blocage reçu
- [ ] Réinitialisation testée
- [ ] Email de réinitialisation reçu

### Production (Optionnel)
- [ ] Domaine vérifié dans Resend
- [ ] Email FROM personnalisé configuré
- [ ] Variables de production configurées
- [ ] Tests de bout en bout effectués

---

## 🐛 Dépannage

### ❌ "RESEND_API_KEY is not defined"

**Cause** : Variable manquante dans `.env.local`

**Solution** :
```bash
# Vérifiez
cat .env.local | grep RESEND_API_KEY

# Si vide
echo 'RESEND_API_KEY=re_votre_clé' >> .env.local

# Redémarrez
npm run dev
```

### ❌ "Template not found"

**Cause** : ID du template incorrect ou template non créé

**Solution** :
1. Vérifiez que le template existe : https://resend.com/emails/templates
2. Vérifiez l'ID dans `.env.local`
3. Assurez-vous qu'ils correspondent exactement

### ❌ Variables non remplacées ({{userName}} visible)

**Cause** : Mauvaise syntaxe dans le template ou variables non passées

**Solution** :
1. Vérifiez que le template utilise `{{variableName}}`
2. Vérifiez que le code passe les variables :
   ```typescript
   variables: {
     userName: 'Jean',
     resetUrl: 'https://...'
   }
   ```

### ❌ Email non reçu

**Causes possibles** :
1. Dans les spams
2. Email incorrect
3. Quota dépassé (100/jour en gratuit)
4. Erreur dans les logs

**Solution** :
1. Vérifiez les spams
2. Utilisez `delivered@resend.dev` pour tester
3. Vérifiez le dashboard Resend : https://resend.com/emails
4. Vérifiez les logs de l'application

### ❌ Erreur "Failed to send"

**Causes possibles** :
1. Clé API invalide
2. Quota dépassé
3. Email FROM non vérifié (si domaine personnalisé)

**Solution** :
1. Régénérez la clé API
2. Vérifiez votre quota sur Resend
3. Utilisez `onboarding@resend.dev` pour tester

---

## 📚 Ressources

### Documentation
- **Guide complet** : `RESEND_TEMPLATES_USAGE.md`
- **Démarrage rapide** : `QUICK_START_RESEND.md`
- **Resend Docs** : https://resend.com/docs
- **React Email** : https://react.email

### Dashboard
- **Resend Dashboard** : https://resend.com
- **Templates** : https://resend.com/emails/templates
- **Emails envoyés** : https://resend.com/emails
- **API Keys** : https://resend.com/api-keys
- **Domaines** : https://resend.com/domains

### Scripts
```bash
# Générer les templates HTML
npm run email:resend

# Tester l'envoi
npm run email:test votre@email.com

# Test d'un template spécifique
npm run email:test votre@email.com password-reset

# Prévisualiser localement (ancienne méthode)
npm run email:preview
```

---

## 🎉 Félicitations !

Vous avez maintenant un système d'emails professionnel avec :

- ✅ Templates stylés et responsive
- ✅ Personnalisation facile via dashboard
- ✅ Pas de redéploiement pour modifier les templates
- ✅ Monitoring complet des envois
- ✅ Gestion d'erreurs robuste
- ✅ Variables dynamiques
- ✅ Production-ready

### Prochaines Étapes

1. **Maintenant** : Suivez les 6 étapes ci-dessus
2. **Testez** : Envoyez des emails de test
3. **Personnalisez** : Modifiez les templates dans Resend
4. **Production** : Configurez votre domaine (optionnel)
5. **Enrichissez** : Ajoutez de nouveaux templates (booking, etc.)

---

**Date** : 15 novembre 2025  
**Status** : ✅ Prêt à configurer  
**Temps estimé** : 15 minutes  
**Difficulté** : ⭐⭐ (Facile)
