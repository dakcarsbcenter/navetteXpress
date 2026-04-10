# 📧 Intégration Complète des Emails - NavetteXpress

## ✅ Vue d'ensemble

Tous les emails automatiques ont été intégrés dans l'application NavetteXpress. Le système envoie des notifications par email à chaque étape importante du workflow de réservation, devis et facturation.

---

## 📋 Templates Configurés dans Resend

| Template | Usage | Destinataire |
|----------|-------|--------------|
| `password-reset` | Réinitialisation mot de passe | Utilisateur |
| `account-locked` | Compte verrouillé | Utilisateur |
| `welcome` | Bienvenue nouvel utilisateur | Utilisateur |
| `new-booking-request` | Nouvelle demande de réservation | Client |
| `booking-assigned` | Réservation assignée à un chauffeur | Chauffeur |
| `booking-confirmed` | Réservation confirmée par le chauffeur | Client |
| `new-quote-request` | Nouvelle demande de devis | Client + Admin |
| `quote-confirmed` | Devis confirmé avec prix | Client |
| `quote-accepted` | Devis accepté par le client | Admin |
| `quote-rejected` | Devis rejeté par le client | Admin |
| `invoice` | Facture générée/payée | Client |

---

## 🚗 Workflow Réservations (Bookings)

### 1. Création de Réservation
**Route:** `POST /api/bookings`

**Emails envoyés:**
- ✅ **Client:** Confirmation de réception de la demande
  - Template: `new-booking-request`
  - Fonction: `sendNewBookingRequestEmail()`
  - Contenu: Détails de la réservation (départ, arrivée, date, heure, passagers)

- ✅ **Admin:** Notification nouvelle demande
  - Fonction: `sendBookingNotificationToAdmin()`
  - Contenu: Toutes les informations de la réservation

**Code:**
```typescript
// Email au client
await sendNewBookingRequestEmail(createdBooking.customerEmail, {
  bookingId: `BOOK-${createdBooking.id}`,
  customerName: createdBooking.customerName,
  pickupLocation: createdBooking.pickupAddress,
  dropoffLocation: createdBooking.dropoffAddress,
  pickupDate: new Date(createdBooking.scheduledDateTime).toLocaleDateString('fr-FR'),
  pickupTime: new Date(createdBooking.scheduledDateTime).toLocaleTimeString('fr-FR'),
  passengers: passengers || 1
});
```

---

### 2. Assignation à un Chauffeur
**Route:** `PATCH /api/admin/bookings/[id]/assign`

**Email envoyé:**
- ✅ **Chauffeur:** Nouvelle course assignée
  - Template: `booking-assigned`
  - Fonction: `sendBookingAssignedToDriver()` (depuis @/lib/resend-email)
  - Contenu: Détails de la course, informations client

**Code existant:**
```typescript
await sendBookingAssignedToDriver({
  driverId: driverId,
  driverEmail: driverEmail,
  bookingId: booking.id,
  customerName: booking.customerName,
  pickupAddress: booking.pickupAddress,
  dropoffAddress: booking.dropoffAddress,
  scheduledDateTime: booking.scheduledDateTime.toISOString(),
  passengers: booking.passengers || 1
});
```

---

### 3. Confirmation par le Chauffeur
**Route:** `PATCH /api/driver/bookings/[id]`

**Email envoyé:**
- ✅ **Client:** Confirmation que le chauffeur a accepté
  - Template: `booking-confirmed`
  - Fonction: `sendBookingConfirmedByDriverEmail()`
  - Contenu: Informations chauffeur (nom, téléphone), détails course

**Code:**
```typescript
if (status === 'confirmed') {
  const driverInfo = await db.select({
    name: usersTable.name,
    phone: usersTable.phone
  })
    .from(usersTable)
    .where(eq(usersTable.id, session.user.id))
    .limit(1);

  await sendBookingConfirmedByDriverEmail(booking.customerEmail, {
    bookingId: `BOOK-${bookingId}`,
    customerName: booking.customerName,
    driverName: driverInfo[0]?.name || 'Votre chauffeur',
    driverPhone: driverInfo[0]?.phone || undefined,
    pickupLocation: booking.pickupAddress,
    dropoffLocation: booking.dropoffAddress,
    pickupDate: new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR'),
    pickupTime: new Date(booking.scheduledDateTime).toLocaleTimeString('fr-FR')
  });
}
```

---

## 💼 Workflow Devis (Quotes)

### 1. Création de Demande de Devis
**Route:** `POST /api/quotes`

**Emails envoyés:**
- ✅ **Client:** Confirmation de réception
  - Template: `new-quote-request`
  - Fonction: `sendNewQuoteRequestEmail(customerEmail, {...}, false)`
  - Contenu: Récapitulatif de la demande

- ✅ **Admin:** Notification nouvelle demande
  - Template: `new-quote-request`
  - Fonction: `sendNewQuoteRequestEmail(adminEmail, {...}, true)`
  - Contenu: Détails complets de la demande

**Code:**
```typescript
// Email au client
await sendNewQuoteRequestEmail(customerEmail, {
  quoteId: `QUOTE-${newQuote[0].id}`,
  customerName,
  service,
  preferredDate: preferredDate ? new Date(preferredDate).toLocaleDateString('fr-FR') : undefined,
  message
}, false);

// Email à l'admin
const adminEmail = process.env.ADMIN_EMAIL || 'admin@navettexpress.com';
await sendNewQuoteRequestEmail(adminEmail, {
  quoteId: `QUOTE-${newQuote[0].id}`,
  customerName,
  service,
  preferredDate: preferredDate ? new Date(preferredDate).toLocaleDateString('fr-FR') : undefined,
  message
}, true);
```

---

### 2. Confirmation du Devis par l'Admin (avec prix)
**Route:** `PUT /api/quotes/[id]`

**Email envoyé:**
- ✅ **Client:** Devis avec prix définitif
  - Template: `quote-confirmed`
  - Fonction: `sendQuoteConfirmedEmail()`
  - Contenu: Prix, service, date limite de validité, notes admin

**Condition:** Statut passe à `'sent'` ET un prix est défini

**Code:**
```typescript
if (status === 'sent' && estimatedPrice !== undefined) {
  await sendQuoteConfirmedEmail(updatedQuote[0].customerEmail, {
    quoteId: `QUOTE-${updatedQuote[0].id}`,
    customerName: updatedQuote[0].customerName,
    service: updatedQuote[0].service,
    price: estimatedPrice,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
    adminNotes: adminNotes
  });
}
```

---

### 3. Acceptation du Devis par le Client
**Route:** `POST /api/quotes/client/actions` (action='accept')

**Emails envoyés:**
- ✅ **Client:** Facture automatique (voir section Factures)
  - Template: `invoice`
  - Fonction: `sendInvoiceEmail()`

- ✅ **Admin:** Notification devis accepté
  - Template: `quote-accepted`
  - Fonction: `sendQuoteAcceptedEmail()`
  - Contenu: Informations client, montant, info facture auto-générée

**Code:**
```typescript
if (action === 'accept') {
  // ... génération facture et réservation ...
  
  await sendQuoteAcceptedEmail({
    quoteId: `QUOTE-${currentQuote.id}`,
    customerName: currentQuote.customerName,
    customerEmail: currentQuote.customerEmail,
    service: currentQuote.service,
    price: parseFloat(currentQuote.estimatedPrice || '0')
  });
}
```

---

### 4. Rejet du Devis par le Client
**Route:** `POST /api/quotes/client/actions` (action='reject')

**Email envoyé:**
- ✅ **Admin:** Notification devis rejeté
  - Template: `quote-rejected`
  - Fonction: `sendQuoteRejectedEmail()`
  - Contenu: Informations client, raison du rejet

**Code:**
```typescript
if (action === 'reject') {
  await sendQuoteRejectedEmail({
    quoteId: `QUOTE-${currentQuote.id}`,
    customerName: currentQuote.customerName,
    customerEmail: currentQuote.customerEmail,
    service: currentQuote.service,
    rejectionReason: message
  });
}
```

---

## 💰 Workflow Factures (Invoices)

### 1. Création Manuelle de Facture
**Route:** `POST /api/invoices`

**Email envoyé:**
- ✅ **Client:** Facture complète
  - Template: `invoice`
  - Fonction: `sendInvoiceEmail()`
  - Contenu: Numéro facture, montants (HT/TVA/TTC), méthodes de paiement, date d'échéance

**Code:**
```typescript
await sendInvoiceEmail(customerEmail, {
  invoiceNumber: createdInvoice.invoiceNumber,
  customerName: createdInvoice.customerName,
  service: createdInvoice.service,
  amount: createdInvoice.amount,
  taxAmount: createdInvoice.taxAmount,
  totalAmount: createdInvoice.totalAmount,
  issueDate: createdInvoice.issueDate.toLocaleDateString('fr-FR'),
  dueDate: createdInvoice.dueDate.toLocaleDateString('fr-FR')
});
```

---

### 2. Confirmation de Paiement
**Route:** `PATCH /api/invoices/[id]`

**Email envoyé:**
- ✅ **Client:** Confirmation paiement reçu
  - Email HTML personnalisé (inline)
  - Contenu: Remerciement, récapitulatif montant, numéro facture

**Condition:** Statut passe à `'paid'`

**Code:**
```typescript
if (updatedData.status === 'paid' && existingInvoice.status !== 'paid') {
  const { data, error } = await resend.emails.send({
    from: 'Navette Express <reservations@navettexpress.com>',
    to: [existingInvoice.customerEmail],
    subject: `✅ Paiement confirmé - Facture ${existingInvoice.invoiceNumber}`,
    html: `<!-- Email HTML complet avec branding bordeaux -->`
  });
}
```

---

### 3. Facture Auto-générée (Acceptation Devis)
**Route:** `POST /api/quotes/client/actions` (action='accept')

**Email envoyé:**
- ✅ **Client:** Facture suite à acceptation devis
  - Template: `invoice`
  - Fonction: `sendInvoiceEmail()`
  - Contenu: Identique à la création manuelle

**Code:**
```typescript
if (action === 'accept') {
  // ... création facture automatique ...
  
  await sendInvoiceEmail(currentQuote.customerEmail, {
    invoiceNumber: newInvoice.invoiceNumber,
    customerName: newInvoice.customerName,
    service: newInvoice.service,
    amount: newInvoice.amount,
    taxAmount: newInvoice.taxAmount,
    totalAmount: newInvoice.totalAmount,
    issueDate: newInvoice.issueDate.toLocaleDateString('fr-FR'),
    dueDate: newInvoice.dueDate.toLocaleDateString('fr-FR')
  });
}
```

---

## 🔧 Configuration Requise

### Variables d'Environnement
```bash
# Resend API
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=reservations@navettexpress.com

# Admin notifications
ADMIN_EMAIL=admin@navettexpress.com

# URL de l'application
NEXT_PUBLIC_APP_URL=https://navettexpress.com
```

---

## 📁 Structure des Fichiers

### Fonctions Email (`src/lib/resend-mailer.ts`)
```typescript
// Authentification
sendPasswordResetEmail()

// Factures
sendInvoiceEmail()

// Réservations
sendNewBookingEmail() // Deprecated - use sendNewBookingRequestEmail
sendNewBookingRequestEmail() // ✅ Utilisé
sendBookingAssignedEmailToDriver() // ✅ Fonction créée (mais assignment utilise resend-email)
sendBookingConfirmedByDriverEmail() // ✅ Utilisé

// Devis
sendQuoteConfirmedEmail() // ✅ Utilisé
sendNewQuoteRequestEmail() // ✅ Utilisé
sendQuoteRejectedEmail() // ✅ Utilisé
sendQuoteAcceptedEmail() // ✅ Utilisé
```

### Routes Modifiées
```
✅ src/app/api/bookings/route.ts (POST)
✅ src/app/api/driver/bookings/[id]/route.ts (PATCH)
✅ src/app/api/quotes/route.ts (POST)
✅ src/app/api/quotes/[id]/route.ts (PUT)
✅ src/app/api/quotes/client/actions/route.ts (POST)
✅ src/app/api/invoices/route.ts (POST)
✅ src/app/api/invoices/[id]/route.ts (PATCH)
```

---

## 🎨 Branding des Emails

Tous les emails utilisent le branding NavetteXpress:
- **Couleur principale:** #93374d (bordeaux)
- **Couleurs secondaires:** 
  - Success: #10b981 (vert)
  - Error: #ef4444 (rouge)
  - Info: #3b82f6 (bleu)
  - Warning: #f59e0b (orange)
- **Typographie:** Arial, sans-serif
- **Header:** Fond bordeaux avec "Navette Express" en blanc
- **Boutons CTA:** Bordeaux avec texte blanc, coins arrondis

---

## 🧪 Testing

### Générer les Templates HTML
```bash
npm run email:all
```
Génère tous les templates dans `resend-templates/`

### Tester un Email Spécifique
```bash
# Facture
node test-invoice-email.mjs

# Autres tests à créer selon besoin
```

### Vérifier dans Resend Dashboard
1. Se connecter à [resend.com](https://resend.com/emails)
2. Aller dans "Emails" pour voir l'historique
3. Vérifier les templates dans "Templates"

---

## ⚠️ Gestion des Erreurs

Tous les emails sont dans des blocs `try/catch` pour ne pas bloquer les opérations principales:

```typescript
try {
  await sendEmail(...);
  console.log('✅ Email envoyé');
} catch (emailError) {
  console.error('❌ Erreur email:', emailError);
  // L'opération principale continue
}
```

Les erreurs d'email sont **loggées** mais **ne bloquent jamais** la création de réservation, devis ou facture.

---

## 📊 Récapitulatif des Intégrations

| Événement | Client | Admin | Chauffeur | Status |
|-----------|--------|-------|-----------|--------|
| Création réservation | ✅ | ✅ | - | ✅ Intégré |
| Assignation chauffeur | - | - | ✅ | ✅ Intégré |
| Confirmation chauffeur | ✅ | - | - | ✅ Intégré |
| Création devis | ✅ | ✅ | - | ✅ Intégré |
| Devis avec prix | ✅ | - | - | ✅ Intégré |
| Acceptation devis | ✅ (facture) | ✅ | - | ✅ Intégré |
| Rejet devis | - | ✅ | - | ✅ Intégré |
| Création facture | ✅ | - | - | ✅ Intégré |
| Paiement facture | ✅ | - | - | ✅ Intégré |

**Total: 9 workflows email automatisés**

---

## 🚀 Prochaines Étapes

1. ✅ **Déployer en production**
2. ✅ **Ajouter ADMIN_EMAIL dans .env de production**
3. ✅ **Tester chaque workflow en environnement de production**
4. ⏳ **Monitorer les logs Resend** pour détecter les erreurs
5. ⏳ **Ajouter des tests automatisés** pour les emails (optionnel)

---

## 📞 Support

En cas de problème:
1. Vérifier les logs serveur: `console.log` préfixés par 📧, ✅ ou ❌
2. Vérifier le dashboard Resend
3. Valider les variables d'environnement
4. Tester la génération de templates: `npm run email:all`

---

**Date de dernière mise à jour:** ${new Date().toLocaleDateString('fr-FR')}
**Version:** 1.0.0
