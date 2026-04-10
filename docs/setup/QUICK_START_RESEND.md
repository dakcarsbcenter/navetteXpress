# 🚀 Configuration Rapide - Templates Resend

## 📋 Résumé en 5 Minutes

Vous avez maintenant **2 façons** d'utiliser les templates email :

### ✅ Méthode 1 : React Email (Actuelle)
- Templates générés dynamiquement en TypeScript/React
- Fichiers : `src/emails/*.tsx`
- Module : `src/lib/email.ts`
- **Avantages** : Contrôle total, pas de configuration externe
- **Inconvénients** : Modifications = redéploiement

### 🎯 Méthode 2 : Templates Resend (Recommandé pour Production)
- Templates stockés dans le dashboard Resend
- Module : `src/lib/email-resend-templates.ts`
- **Avantages** : Modifications sans redéploiement, versioning, preview facile
- **Inconvénients** : Nécessite configuration Resend

---

## ⚡ Quick Start - Méthode Resend

### Étape 1 : Générer les Templates HTML (1 min)

```bash
npm run email:resend
```

📁 Résultat : 3 fichiers dans `resend-templates/`
- `password-reset.html`
- `account-locked.html`
- `welcome.html`

### Étape 2 : Créer un Compte Resend (2 min)

1. Allez sur https://resend.com/signup
2. Créez un compte gratuit
3. Obtenez votre clé API : https://resend.com/api-keys

### Étape 3 : Créer les Templates (10 min)

1. Allez sur https://resend.com/emails/templates
2. Pour chaque fichier HTML :
   - Cliquez **"Create Template"**
   - Nom : `password-reset`, `account-locked`, `welcome`
   - Copiez-collez le contenu HTML
   - **Important** : Notez l'ID du template !

### Étape 4 : Configurer .env.local (2 min)

```env
# Ajoutez ces lignes dans .env.local
RESEND_API_KEY=re_votre_clé_ici
RESEND_FROM_EMAIL=NavetteXpress <onboarding@resend.dev>

# IDs des templates (ceux notés à l'étape 3)
RESEND_TEMPLATE_PASSWORD_RESET=password-reset
RESEND_TEMPLATE_ACCOUNT_LOCKED=account-locked
RESEND_TEMPLATE_WELCOME=welcome

# URL de votre app
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Étape 5 : Tester (1 min)

```bash
# Test de configuration
npm run email:test votre@email.com

# Test d'un template spécifique
npm run email:test votre@email.com password-reset
npm run email:test votre@email.com account-locked
npm run email:test votre@email.com welcome
```

### Étape 6 : Activer dans l'Application (2 min)

Remplacez le module actuel :

```bash
# Sauvegarde de l'ancien
mv src/lib/email.ts src/lib/email-old.ts

# Activation du nouveau
mv src/lib/email-resend-templates.ts src/lib/email.ts

# Redémarrage
npm run dev
```

**C'est tout ! ✅**

---

## 📊 Fichiers Créés

```
navetteXpress/
├── resend-templates/              📁 Templates HTML pour Resend
│   ├── password-reset.html
│   ├── account-locked.html
│   └── welcome.html
├── src/lib/
│   ├── email.ts                   📄 Module actuel (React Email)
│   └── email-resend-templates.ts  📄 Nouveau module (Templates Resend)
├── generate-resend-templates.ts   🔧 Générateur de templates HTML
├── test-resend-templates.ts       🧪 Script de test
└── RESEND_TEMPLATES_USAGE.md      📖 Guide complet (40+ pages)
```

## 🎯 Scripts Disponibles

```bash
# Générer les templates HTML pour Resend
npm run email:resend

# Tester l'envoi avec templates Resend
npm run email:test votre@email.com

# Test d'un template spécifique
npm run email:test votre@email.com [password-reset|account-locked|welcome]

# Prévisualiser les templates (ancienne méthode)
npm run email:preview
```

## 🔄 Comparaison des Méthodes

| Critère | React Email | Templates Resend |
|---------|-------------|------------------|
| Configuration | ✅ Aucune | ⚠️ Compte Resend requis |
| Modification | ❌ Redéploiement | ✅ Dashboard temps réel |
| Versioning | ⚠️ Git | ✅ Intégré Resend |
| Preview | ⚠️ HTML local | ✅ Dashboard Resend |
| Performance | ✅ Rapide | ✅ Rapide |
| Coût | ✅ Gratuit | ✅ 100 emails/jour gratuit |
| Production | ⚠️ OK | ✅ Recommandé |

## ✅ Checklist

### Configuration Initiale
- [ ] Compte Resend créé
- [ ] Clé API obtenue
- [ ] Templates HTML générés (`npm run email:resend`)
- [ ] 3 templates créés dans Resend Dashboard
- [ ] IDs des templates notés
- [ ] `.env.local` configuré avec les variables
- [ ] Serveur redémarré

### Test
- [ ] Test de configuration réussi
- [ ] Email de test envoyé et reçu
- [ ] Variables remplacées correctement dans l'email
- [ ] Templates affichés correctement

### Activation
- [ ] Module `email-resend-templates.ts` activé
- [ ] Ancienne version sauvegardée (`email-old.ts`)
- [ ] Application testée en conditions réelles
- [ ] Logs vérifiés (pas d'erreurs)

## 🐛 Problèmes Fréquents

### ❌ "RESEND_API_KEY is not defined"

```bash
# Vérifiez .env.local
cat .env.local | grep RESEND_API_KEY

# Si vide, ajoutez-le
echo 'RESEND_API_KEY=re_votre_clé' >> .env.local

# Redémarrez
npm run dev
```

### ❌ "Template not found"

- Vérifiez que l'ID du template dans `.env.local` correspond à celui dans Resend
- Allez sur https://resend.com/emails/templates et vérifiez les noms

### ❌ Variables non remplacées ({{userName}} visible)

- Assurez-vous d'utiliser la syntaxe `{{variableName}}` dans le template HTML
- Vérifiez que vous passez bien les variables dans le code :
  ```typescript
  variables: {
    userName: 'Jean',
    resetUrl: 'https://...'
  }
  ```

## 📚 Documentation Complète

Pour le guide détaillé avec tous les cas d'usage, voir :
📖 **[RESEND_TEMPLATES_USAGE.md](./RESEND_TEMPLATES_USAGE.md)**

## 🎉 Prochaines Étapes

1. **Maintenant** : Configurez Resend (15 minutes)
2. **Ensuite** : Testez l'envoi d'emails
3. **Optionnel** : Configurez votre domaine personnalisé
4. **Production** : Activez le module dans l'application

## 💡 Besoin d'Aide ?

- **Resend Docs** : https://resend.com/docs
- **React Email** : https://react.email/docs
- **Dashboard Resend** : https://resend.com
- **Guide complet** : `RESEND_TEMPLATES_USAGE.md`

---

**Status** : ✅ Tout est prêt !  
**Temps de configuration** : ~15 minutes  
**Méthode recommandée** : Templates Resend  
**Date** : 15 novembre 2025
