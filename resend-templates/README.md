# 📧 Templates HTML pour Resend Dashboard

Ce dossier contient les templates email prêts à être copiés dans le dashboard Resend.

## 📁 Fichiers

### 1. `password-reset.html`
**Utilisation** : Email de réinitialisation de mot de passe

**Variables** :
- `{{userName}}` - Nom de l'utilisateur
- `{{resetUrl}}` - Lien de réinitialisation complet

**Configuration dans Resend** :
- **Name** : `password-reset`
- **Subject** : `Réinitialisation de votre mot de passe - NavetteXpress`

---

### 2. `account-locked.html`
**Utilisation** : Notification de compte bloqué (après 3 tentatives)

**Variables** :
- `{{userName}}` - Nom de l'utilisateur
- `{{unlockTime}}` - Date/heure de déblocage formatée
- `{{resetUrl}}` - Lien de réinitialisation

**Configuration dans Resend** :
- **Name** : `account-locked`
- **Subject** : `🔒 Alerte sécurité - Compte temporairement bloqué`

---

### 3. `welcome.html`
**Utilisation** : Email de bienvenue pour nouveaux utilisateurs

**Variables** :
- `{{userName}}` - Nom de l'utilisateur (optionnel)
- `{{dashboardUrl}}` - Lien vers le dashboard

**Configuration dans Resend** :
- **Name** : `welcome`
- **Subject** : `🎉 Bienvenue chez NavetteXpress !`

---

## 🚀 Comment Utiliser

### Étape 1 : Créer un Template dans Resend

1. Allez sur https://resend.com/emails/templates
2. Cliquez sur **"Create Template"**
3. Donnez un nom au template (voir ci-dessus)

### Étape 2 : Copier le HTML

1. Ouvrez le fichier HTML dans un éditeur de texte
2. Copiez **TOUT** le contenu
3. Collez dans l'éditeur Resend
4. Supprimez les commentaires HTML du début (`<!-- ... -->`)

### Étape 3 : Configurer le Subject

Ajoutez le sujet recommandé (voir ci-dessus)

### Étape 4 : Sauvegarder

Cliquez sur **"Save"** et notez l'ID du template

---

## 🔧 Régénération des Templates

Si vous modifiez les composants React Email (`src/emails/*.tsx`), régénérez les HTML :

```bash
npm run email:resend
```

Les fichiers dans ce dossier seront mis à jour.

---

## 📝 Notes

- Les templates sont générés à partir de `src/emails/*.tsx`
- Les commentaires en haut de chaque fichier contiennent les infos de configuration
- Les variables utilisent la syntaxe Resend : `{{variableName}}`
- Les templates sont responsive et testés sur tous les clients email

---

## ✨ Personnalisation

### Dans Resend Dashboard (Recommandé)

1. Modifiez directement dans https://resend.com/emails/templates
2. Les changements sont appliqués instantanément
3. Pas besoin de redéployer l'application

### Dans le Code Source

1. Modifiez `src/emails/*.tsx`
2. Régénérez avec `npm run email:resend`
3. Copiez le nouveau HTML dans Resend

---

**Date de génération** : 15 novembre 2025  
**Générateur** : `generate-resend-templates.ts`  
**Framework** : React Email + Resend
