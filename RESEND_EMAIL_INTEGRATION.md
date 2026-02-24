# Intégration Resend - Notifications Email Réservations

## 📧 Vue d'ensemble

Système de notifications email automatiques pour les réservations utilisant **Resend** :

1. **Nouvelle réservation** → Email à l'admin
2. **Chauffeur assigné** → Email au chauffeur
3. **Réservation confirmée** → Email au client

## ✅ Installation et Configuration

### 1. Installer Resend SDK

```bash
npm install resend
```

### 2. Variables d'environnement

Ajoutez ces lignes dans votre fichier `.env.local` :

```bash
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=admin@navettexpress.com
```

**Important :** 
- Obtenez votre clé API sur [resend.com](https://resend.com/)
- `RESEND_FROM_EMAIL` doit être vérifié dans votre compte Resend
- `ADMIN_EMAIL` est l'email qui recevra les notifications de nouvelles réservations

### 3. Vérifier votre domaine (Production)

Pour l'environnement de production, vous devez vérifier votre domaine dans Resend :

1. Connectez-vous à [resend.com](https://resend.com/)
2. Allez dans **Domains** → **Add Domain**
3. Ajoutez votre domaine (ex: `navettexpress.com`)
4. Suivez les instructions pour ajouter les enregistrements DNS
5. Une fois vérifié, utilisez un email de ce domaine comme `RESEND_FROM_EMAIL`

Exemple : `RESEND_FROM_EMAIL=notifications@navettexpress.com`

## 📋 Fonctionnalités

### 1. Notification Admin - Nouvelle Réservation

**Déclencheur :** Création d'une réservation via `POST /api/bookings`

**Destinataire :** Admin (variable `ADMIN_EMAIL`)

**Contenu :**
- Numéro de réservation
- Informations client (nom, email, téléphone)
- Détails du trajet (départ, arrivée, date)
- Prix estimé
- Notes spéciales
- Lien vers le dashboard admin

**Code :** `src/lib/resend-email.ts` → `sendBookingNotificationToAdmin()`

### 2. Notification Chauffeur - Assignation

**Déclencheur :** 
- Assignation via `PUT /api/admin/bookings/[id]/assign`
- Mise à jour avec `driverId` via `PATCH /api/admin/bookings/[id]`

**Destinataire :** Chauffeur assigné

**Contenu :**
- Numéro de course
- Date et heure
- Itinéraire complet
- Informations client
- Notes importantes
- Lien vers le dashboard chauffeur

**Code :** `src/lib/resend-email.ts` → `sendBookingAssignedToDriver()`

### 3. Notification Client - Confirmation

**Déclencheur :** Changement de statut à `confirmed` via `PATCH /api/admin/bookings/[id]`

**Destinataire :** Client (email de la réservation)

**Contenu :**
- Confirmation de la réservation
- Récapitulatif complet
- Informations du chauffeur (si assigné)
- Conseils pratiques
- Lien vers le dashboard client

**Code :** `src/lib/resend-email.ts` → `sendBookingConfirmedToClient()`

## 🎨 Templates Email

Les emails sont au format HTML avec :
- Design moderne et responsive
- Dégradés de couleurs cohérents avec l'identité visuelle
- Icônes et émojis pour meilleure lisibilité
- Boutons d'action vers les dashboards respectifs
- Footer avec informations de contact

**Couleurs :**
- Admin : Gradient bleu-violet (#667eea → #764ba2)
- Chauffeur : Gradient vert (#10b981 → #059669)
- Client : Gradient vert de confirmation (#10b981 → #059669)

## 🔧 APIs Modifiées

### 1. `src/app/api/bookings/route.ts`

```typescript
import { sendBookingNotificationToAdmin } from '@/lib/resend-email';

// Dans POST handler, après création de la réservation :
await sendBookingNotificationToAdmin({
  id, customerName, customerEmail, customerPhone,
  pickupAddress, dropoffAddress, scheduledDateTime,
  passengers, price, notes
});
```

### 2. `src/app/api/admin/bookings/[id]/route.ts`

```typescript
import { sendBookingConfirmedToClient, sendBookingAssignedToDriver } from '@/lib/resend-email';

// Dans PATCH handler :
// - Si status devient 'confirmed' → sendBookingConfirmedToClient()
// - Si driverId est défini → sendBookingAssignedToDriver()
```

### 3. `src/app/api/admin/bookings/[id]/assign/route.ts`

```typescript
import { sendBookingAssignedToDriver } from '@/lib/resend-email';

// Dans PUT handler, après assignation :
await sendBookingAssignedToDriver(bookingData, driverData);
```

## 🧪 Tests

### Test Environnement Local

1. Démarrez le serveur :
```bash
npm run dev
```

2. Créez une réservation test via l'interface ou l'API

3. Vérifiez les logs dans le terminal :
```
📧 Envoi notification admin pour nouvelle réservation #123...
✅ Notification admin envoyée via Resend
```

4. Vérifiez votre boîte email (admin)

### Test Assignation Chauffeur

1. Dans le dashboard admin, assignez un chauffeur à une réservation

2. Vérifiez les logs :
```
📧 Envoi notification chauffeur pour assignation #123...
✅ Notification chauffeur envoyée via Resend
```

3. Vérifiez l'email du chauffeur

### Test Confirmation Client

1. Changez le statut d'une réservation à `confirmed`

2. Vérifiez les logs :
```
📧 Envoi notification confirmation au client pour réservation #123...
✅ Notification client envoyée via Resend
```

3. Vérifiez l'email du client

## 🚨 Gestion des Erreurs

Les envois d'email sont **non-bloquants** :
- Si l'envoi échoue, l'opération continue (réservation créée, assignation effectuée, etc.)
- Les erreurs sont loggées dans la console
- Le message de succès indique que la notification a été envoyée (si réussi)

**Exemple de log d'erreur :**
```
❌ Erreur notification admin: Error: Invalid API key
```

## 📊 Monitoring

Pour surveiller vos envois d'emails :

1. Connectez-vous à [resend.com](https://resend.com/)
2. Accédez à **Emails** dans le menu
3. Consultez :
   - Emails envoyés
   - Taux de délivrabilité
   - Erreurs éventuelles
   - Statistiques d'ouverture

## 🔒 Sécurité

✅ **Bonnes pratiques appliquées :**
- Clé API stockée dans `.env.local` (non versionnée)
- Validation des données avant envoi
- Protection contre les injections dans les templates
- Logs détaillés pour le debugging
- Gestion gracieuse des erreurs

## 🎯 Prochaines Améliorations

- [ ] Ajouter un système de templates personnalisables
- [ ] Intégrer des webhooks Resend pour tracking
- [ ] Ajouter des notifications SMS via Twilio
- [ ] Créer des rappels automatiques avant le trajet
- [ ] Ajouter des emails de feedback post-trajet

## 📚 Ressources

- [Documentation Resend](https://resend.com/docs)
- [API Reference Resend](https://resend.com/docs/api-reference)
- [Resend Node.js SDK](https://github.com/resendlabs/resend-node)
- [Templates HTML](https://resend.com/docs/send-with-nodejs#html-templates)

---

**Date de création :** 3 novembre 2025  
**Statut :** ✅ Opérationnel  
**Version :** 1.0.0
