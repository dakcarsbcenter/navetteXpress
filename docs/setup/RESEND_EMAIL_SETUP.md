# Configuration Resend pour l'Envoi d'Emails

## 📧 Vue d'ensemble

Resend est maintenant configuré pour envoyer automatiquement des emails pour :
- ✅ Réinitialisation de mot de passe
- ✅ Notification de compte bloqué après 3 tentatives
- ✅ Confirmation de changement de mot de passe

## 🚀 Configuration Rapide (5 minutes)

### Étape 1 : Créer un compte Resend

1. Allez sur [https://resend.com/signup](https://resend.com/signup)
2. Inscrivez-vous avec votre email
3. Vérifiez votre email

### Étape 2 : Obtenir votre clé API

1. Connectez-vous à [https://resend.com/login](https://resend.com/login)
2. Allez dans **Dashboard → API Keys**
3. Cliquez sur **Create API Key**
4. Nommez-la (ex: "NavetteXpress Production")
5. Copiez la clé (elle commence par `re_`)

### Étape 3 : Configurer les variables d'environnement

Ajoutez dans votre fichier `.env.local` :

```env
# Resend Configuration
RESEND_API_KEY=re_votre_clé_api_ici
RESEND_FROM_EMAIL=NavetteXpress <onboarding@resend.dev>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Pour les tests en local**, vous pouvez utiliser `onboarding@resend.dev` comme email d'expéditeur.

**Pour la production**, vérifiez votre propre domaine (voir étape 4).

### Étape 4 : Vérifier votre domaine (Production uniquement)

Pour envoyer des emails depuis votre propre domaine (ex: `noreply@votredomaine.com`) :

1. Allez dans **Dashboard → Domains**
2. Cliquez sur **Add Domain**
3. Entrez votre domaine (ex: `votredomaine.com`)
4. Ajoutez les enregistrements DNS fournis :
   - SPF
   - DKIM
   - DMARC
5. Attendez la vérification (quelques minutes à quelques heures)
6. Une fois vérifié, mettez à jour `.env.local` :

```env
RESEND_FROM_EMAIL=NavetteXpress <noreply@votredomaine.com>
```

## 📝 Configuration de Production

### Pour Coolify

1. Ajoutez les variables d'environnement dans Coolify :
   - `RESEND_API_KEY` → Votre clé API
   - `RESEND_FROM_EMAIL` → Votre email vérifié
   - `NEXT_PUBLIC_APP_URL` → Votre URL de production (ex: `https://navettexpress.com`)

2. Redéployez l'application

### Pour Vercel

1. Allez dans **Project Settings → Environment Variables**
2. Ajoutez :
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `NEXT_PUBLIC_APP_URL`
3. Redéployez

## 🧪 Tester l'Envoi d'Emails

### Test 1 : Réinitialisation de mot de passe

1. Allez sur `/auth/reset-password`
2. Entrez votre email
3. Vérifiez votre boîte de réception
4. Cliquez sur le lien reçu
5. Changez votre mot de passe

### Test 2 : Compte bloqué

1. Essayez de vous connecter avec un mauvais mot de passe 3 fois
2. Vérifiez votre email → Vous devriez recevoir une notification de blocage

### Test 3 : Confirmation de changement

1. Réinitialisez votre mot de passe
2. Vérifiez votre email → Vous devriez recevoir une confirmation

## 📊 Quota Gratuit Resend

- **100 emails/jour** (3000/mois)
- Idéal pour une application avec 50-100 utilisateurs actifs
- Pas de carte de crédit requise

## 🔧 Dépannage

### Problème : "Invalid API Key"

**Solution** :
- Vérifiez que `RESEND_API_KEY` est bien défini dans `.env.local`
- La clé doit commencer par `re_`
- Redémarrez le serveur Next.js après avoir ajouté la clé

```bash
# Arrêtez le serveur (Ctrl+C)
# Relancez
npm run dev
```

### Problème : Les emails ne sont pas reçus

**Vérifications** :
1. ✅ Vérifiez les **logs de la console** → Les emails sont-ils envoyés ?
2. ✅ Vérifiez votre **dossier spam**
3. ✅ Vérifiez le **Dashboard Resend** → Logs d'envoi
4. ✅ Si vous utilisez Gmail, vérifiez les onglets "Promotions" ou "Social"

### Problème : "Domain not verified"

**Pour le développement** : Utilisez `onboarding@resend.dev`

**Pour la production** : Suivez l'étape 4 ci-dessus pour vérifier votre domaine

## 📧 Templates Email Disponibles

### 1. PasswordResetEmail
Utilisé pour la réinitialisation de mot de passe
- Template React moderne
- Bouton call-to-action
- Lien de secours
- Message d'expiration

### 2. AccountLockedEmail
Utilisé quand un compte est bloqué après 3 tentatives
- Alerte visuelle
- Heure de déblocage
- Conseils de sécurité
- Lien de réinitialisation

### 3. PasswordChangedEmail
Confirmation après changement de mot de passe
- Message de succès
- Alerte de sécurité

## 🎨 Personnaliser les Templates

Les templates sont dans `src/emails/` :

```typescript
// src/emails/PasswordResetEmail.tsx
export default function PasswordResetEmail({
  userName,
  resetUrl,
  expiresIn
}: PasswordResetEmailProps) {
  // Personnalisez ici
}
```

Vous pouvez modifier :
- Les couleurs
- Le texte
- Le logo (ajoutez une image)
- La mise en page

## 📈 Monitoring

### Dashboard Resend

1. Allez sur [https://resend.com/emails](https://resend.com/emails)
2. Consultez :
   - Emails envoyés
   - Taux de délivrance
   - Erreurs éventuelles

### Logs Application

Les logs sont visibles dans la console :

```
📧 [EMAIL] Envoi email de réinitialisation à: user@example.com
✅ [EMAIL] Email envoyé avec succès: abc123
```

## 🔐 Sécurité

### Bonnes Pratiques

1. ✅ **Ne jamais commiter** `RESEND_API_KEY` dans Git
2. ✅ Utiliser des variables d'environnement
3. ✅ Régénérer la clé API si compromise
4. ✅ Activer SPF/DKIM/DMARC en production
5. ✅ Monitorer les envois inhabituels

### Protection contre le Spam

Le système inclut déjà :
- ✅ Rate limiting par IP (Next.js middleware)
- ✅ Validation d'email
- ✅ Tokens avec expiration (1 heure)
- ✅ Messages génériques (pas d'énumération d'emails)

## 📞 Support

### Resend
- Documentation : [https://resend.com/docs](https://resend.com/docs)
- Support : [https://resend.com/support](https://resend.com/support)
- Status : [https://status.resend.com](https://status.resend.com)

### Code Source

Fichiers modifiés :
- `src/lib/email.ts` → Logique d'envoi
- `src/emails/PasswordResetEmail.tsx` → Template réinitialisation
- `src/emails/AccountLockedEmail.tsx` → Template blocage
- `src/app/api/auth/reset-password/route.ts` → API réinitialisation
- `src/app/api/auth/reset-password/confirm/route.ts` → API confirmation
- `src/lib/auth.ts` → Envoi lors du blocage

## 🎯 Prochaines Étapes

### Améliorations Possibles

1. **Emails de bienvenue** pour les nouveaux utilisateurs
2. **Notifications de réservation** pour les clients
3. **Alertes chauffeur** pour les nouvelles courses
4. **Rapports hebdomadaires** pour les managers
5. **Factures par email** pour les clients

### Exemple : Email de bienvenue

```typescript
// src/lib/email.ts
export async function sendWelcomeEmail(
  email: string,
  userName: string
) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [email],
    subject: '🎉 Bienvenue chez NavetteXpress !',
    react: WelcomeEmail({ userName }),
  });
  
  return { success: !error, data, error };
}
```

---

## ✅ Checklist de Configuration

- [ ] Compte Resend créé
- [ ] Clé API obtenue
- [ ] Variables d'environnement ajoutées dans `.env.local`
- [ ] Serveur Next.js redémarré
- [ ] Test de réinitialisation effectué
- [ ] Email reçu et testé
- [ ] (Production) Domaine vérifié
- [ ] (Production) Variables d'environnement ajoutées sur Coolify/Vercel

---

**Date de configuration** : 15 novembre 2025
**Status** : ✅ Prêt à utiliser
**Version Resend** : 4.x
