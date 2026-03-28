# 🚀 Configuration Rapide - Resend Email

## Étape 1 : Créer un compte Resend

1. Allez sur [resend.com](https://resend.com/)
2. Créez un compte gratuit
3. Confirmez votre email

## Étape 2 : Obtenir votre clé API

1. Dans le dashboard Resend, cliquez sur **API Keys**
2. Cliquez sur **Create API Key**
3. Donnez un nom (ex: "NavetteXpress - Production")
4. Sélectionnez **Full Access**
5. Cliquez sur **Create**
6. **Copiez immédiatement** la clé (elle ne sera plus visible après)

## Étape 3 : Configurer .env.local

Ajoutez ces lignes dans votre fichier `.env.local` :

```bash
# Resend Email Service
RESEND_API_KEY=re_VotreCleAPIIci
RESEND_FROM_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=dakcarsbcenter@gmail.com
```

**Remplacez :**
- `re_VotreCleAPIIci` par votre vraie clé API Resend
- `onboarding@resend.dev` par votre email vérifié (voir Étape 4 pour production)
- `dakcarsbcenter@gmail.com` par l'email admin qui recevra les notifications

## Étape 4 : Vérifier votre domaine (Production uniquement)

### Pour le développement local

Utilisez `onboarding@resend.dev` (fourni par Resend, prêt à l'emploi)

### Pour la production

1. Dans Resend, allez sur **Domains**
2. Cliquez sur **Add Domain**
3. Entrez votre domaine (ex: `navettexpress.com`)
4. Suivez les instructions pour ajouter les enregistrements DNS :
   - Enregistrement TXT
   - Enregistrements MX
   - Enregistrements DKIM
5. Attendez la vérification (quelques minutes à 24h)
6. Une fois vérifié, mettez à jour `.env.local` :

```bash
RESEND_FROM_EMAIL=notifications@navettexpress.com
```

## Étape 5 : Tester l'intégration

1. Redémarrez votre serveur :
```bash
npm run dev
```

2. Créez une réservation de test via l'interface

3. Vérifiez les logs dans le terminal :
```
📧 Envoi notification admin pour nouvelle réservation #1...
✅ Notification admin envoyée via Resend
```

4. Vérifiez votre boîte email (ADMIN_EMAIL)

## Étape 6 : Surveiller vos emails

1. Connectez-vous à [resend.com](https://resend.com/)
2. Cliquez sur **Emails** dans le menu
3. Vous verrez :
   - Liste des emails envoyés
   - Statut de délivrance
   - Erreurs éventuelles
   - Statistiques d'ouverture

## ✅ Configuration terminée !

Votre système de notifications email est maintenant opérationnel.

### 📧 Emails qui seront envoyés :

1. **Nouvelle réservation** → Admin reçoit un email
2. **Chauffeur assigné** → Chauffeur reçoit un email
3. **Réservation confirmée** → Client reçoit un email

### 🔧 En cas de problème

**L'email n'arrive pas ?**
- Vérifiez que `RESEND_API_KEY` est correct
- Vérifiez les logs du terminal pour voir les erreurs
- Consultez le dashboard Resend pour voir le statut

**Erreur "Invalid API key" ?**
- Vérifiez que vous avez bien copié la clé complète
- Redémarrez le serveur après modification de `.env.local`

**Email dans les spams ?**
- En développement, c'est normal avec `onboarding@resend.dev`
- En production, vérifiez votre domaine dans Resend
- Ajoutez les enregistrements SPF, DKIM, DMARC

### 📚 Aide supplémentaire

- [Documentation Resend](https://resend.com/docs)
- [Guide de vérification de domaine](https://resend.com/docs/dashboard/domains/introduction)
- [FAQ Resend](https://resend.com/docs/faq)

---

**Besoin d'aide ?** Consultez `RESEND_EMAIL_INTEGRATION.md` pour plus de détails.
