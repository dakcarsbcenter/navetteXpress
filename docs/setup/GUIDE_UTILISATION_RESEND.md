# 📧 Guide d'Utilisation des Templates Resend

## ✅ Templates Disponibles (11)

### Authentification (3)
- `password-reset` - Réinitialisation mot de passe
- `account-locked` - Compte verrouillé
- `welcome` - Bienvenue

### Réservations (3)
- `new-booking-request` - Nouvelle demande
- `booking-assigned` - Réservation assignée
- `booking-confirmed` - Réservation confirmée

### Devis (4)
- `new-quote-request` - Nouvelle demande de devis
- `quote-confirmed` - Devis confirmé
- `quote-accepted` - Devis accepté
- `quote-rejected` - Devis rejeté

### Facturation (1)
- `invoice` - Nouvelle facture

---

## 🚀 Méthode 1 : Utiliser les Fonctions Helper

### 1. Envoyer une Facture

```typescript
import { sendInvoiceEmail } from '@/lib/resend-mailer';

// Dans votre code (ex: après création d'une facture)
await sendInvoiceEmail('client@example.com', {
  invoiceNumber: 'INV-2025-00001',
  customerName: 'Jean Dupont',
  service: 'Transfert Aéroport - Hôtel',
  amountHT: '120,000 FCFA',
  vatAmount: '24,000 FCFA',
  amountTTC: '144,000 FCFA',
  issueDate: '17/11/2025',
  dueDate: '17/12/2025',
  invoiceUrl: 'https://navettexpress.com/invoices/INV-2025-00001'
});
```

### 2. Envoyer une Notification de Réservation

```typescript
import { sendNewBookingEmail } from '@/lib/resend-mailer';

await sendNewBookingEmail('client@example.com', {
  customerName: 'Jean Dupont',
  bookingId: 'BOOK-2025-001',
  pickupLocation: 'Aéroport Léopold Sédar Senghor',
  dropoffLocation: 'Hôtel Radisson Blu',
  pickupDate: '20/11/2025',
  pickupTime: '14:30'
});
```

### 3. Envoyer un Devis

```typescript
import { sendQuoteConfirmedEmail } from '@/lib/resend-mailer';

await sendQuoteConfirmedEmail('client@example.com', {
  customerName: 'Jean Dupont',
  quoteId: 'QUOTE-2025-001',
  amount: '85,000 FCFA',
  pickupLocation: 'Dakar Centre',
  dropoffLocation: 'Saly',
  pickupDate: '25/11/2025',
  acceptUrl: 'https://navettexpress.com/quotes/QUOTE-2025-001/accept',
  rejectUrl: 'https://navettexpress.com/quotes/QUOTE-2025-001/reject'
});
```

---

## 🔧 Méthode 2 : Utiliser l'API Resend Directement

### Configuration

```typescript
// .env.local
RESEND_API_KEY=re_votre_clé_api
RESEND_FROM_EMAIL=NavetteXpress <noreply@votredomaine.com>
NEXT_PUBLIC_APP_URL=https://navettexpress.com
```

### Envoyer un Email Personnalisé

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Exemple simple
await resend.emails.send({
  from: 'NavetteXpress <noreply@votredomaine.com>',
  to: ['client@example.com'],
  subject: '🚗 Confirmation de réservation',
  html: '<p>Votre réservation est confirmée !</p>'
});
```

---

## 📋 Exemples d'Utilisation dans l'Application

### 1. Après Création d'une Facture

```typescript
// src/app/api/invoices/route.ts
import { sendInvoiceEmail } from '@/lib/resend-mailer';

export async function POST(request: Request) {
  // ... création de la facture dans la DB
  
  const invoice = await db.insert(invoicesTable).values({
    invoiceNumber: 'INV-2025-00001',
    customerEmail: 'client@example.com',
    // ... autres champs
  }).returning();
  
  // Envoyer l'email de notification
  try {
    await sendInvoiceEmail(invoice.customerEmail, {
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      service: invoice.service,
      amountHT: `${invoice.amount} FCFA`,
      vatAmount: `${invoice.taxAmount} FCFA`,
      amountTTC: `${invoice.totalAmount} FCFA`,
      issueDate: new Date(invoice.issueDate).toLocaleDateString('fr-FR'),
      dueDate: new Date(invoice.dueDate).toLocaleDateString('fr-FR'),
      invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}`
    });
    
    console.log('✅ Email facture envoyé');
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    // Ne pas bloquer la création de la facture si l'email échoue
  }
  
  return Response.json({ success: true, invoice });
}
```

### 2. Après Acceptation d'un Devis

```typescript
// src/app/api/quotes/[id]/accept/route.ts
import { sendQuoteAcceptedEmail } from '@/lib/resend-mailer';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  // ... mise à jour du devis
  
  const quote = await db.update(quotesTable)
    .set({ status: 'accepted' })
    .where(eq(quotesTable.id, params.id))
    .returning();
  
  // Notifier le client
  await sendQuoteAcceptedEmail(quote.customerEmail, {
    customerName: quote.customerName,
    quoteId: quote.quoteNumber,
    bookingId: 'BOOK-2025-XXX', // ID de la réservation créée
    amount: `${quote.amount} FCFA`,
    pickupLocation: quote.pickupLocation,
    dropoffLocation: quote.dropoffLocation,
    pickupDate: new Date(quote.pickupDate).toLocaleDateString('fr-FR'),
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/client/dashboard`
  });
  
  return Response.json({ success: true });
}
```

### 3. Après Création d'une Réservation

```typescript
// src/app/api/bookings/route.ts
import { sendNewBookingEmail } from '@/lib/resend-mailer';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Créer la réservation
  const booking = await db.insert(bookingsTable).values({
    customerId: body.customerId,
    pickupLocation: body.pickupLocation,
    // ... autres champs
  }).returning();
  
  // Notifier le client
  await sendNewBookingEmail(body.customerEmail, {
    customerName: body.customerName,
    bookingId: booking.bookingNumber,
    pickupLocation: booking.pickupLocation,
    dropoffLocation: booking.dropoffLocation,
    pickupDate: new Date(booking.pickupDate).toLocaleDateString('fr-FR'),
    pickupTime: booking.pickupTime
  });
  
  // Vous pouvez aussi notifier l'admin
  await sendNewBookingEmail('admin@navettexpress.com', {
    customerName: body.customerName,
    bookingId: booking.bookingNumber,
    // ... même données
  });
  
  return Response.json({ success: true, booking });
}
```

---

## 🧪 Tester l'Envoi d'Emails

### Script de Test

Créez un fichier `test-resend.mjs` :

```javascript
import { Resend } from 'resend';

const resend = new Resend('re_votre_clé_api');

async function testEmail() {
  const { data, error } = await resend.emails.send({
    from: 'NavetteXpress <onboarding@resend.dev>',
    to: ['votre@email.com'],
    subject: '🧪 Test NavetteXpress',
    html: '<h1>Test Email</h1><p>Votre configuration Resend fonctionne ! 🎉</p>'
  });

  if (error) {
    console.error('❌ Erreur:', error);
  } else {
    console.log('✅ Email envoyé:', data);
  }
}

testEmail();
```

Exécutez :
```bash
node test-resend.mjs
```

---

## 📊 Monitoring des Emails

### Dashboard Resend

1. Allez sur https://resend.com/emails
2. Vous verrez tous les emails envoyés avec :
   - Statut (delivered, bounced, failed)
   - Date/heure d'envoi
   - Destinataire
   - Sujet
   - ID de l'email

### Logs dans l'Application

```typescript
// Les fonctions dans resend-mailer.ts loguent déjà :
console.log('✅ Email envoyé:', data?.id);
console.error('❌ Erreur envoi email:', error);
```

---

## 🔒 Sécurité et Bonnes Pratiques

### 1. Protection de la Clé API

```env
# ✅ Bon : Dans .env.local (jamais commité)
RESEND_API_KEY=re_votre_clé

# ❌ Mauvais : Dans le code
const apiKey = "re_123456789";
```

### 2. Gestion des Erreurs

```typescript
try {
  await sendInvoiceEmail(email, invoiceData);
} catch (error) {
  // Log l'erreur mais ne bloquez pas le processus principal
  console.error('Erreur envoi email:', error);
  // Vous pouvez sauvegarder dans une queue pour réessayer plus tard
}
```

### 3. Rate Limiting

Resend a des limites :
- Plan gratuit : 100 emails/jour
- Plan Pro : 50,000 emails/mois

```typescript
// Ajoutez un délai entre les envois en masse
for (const customer of customers) {
  await sendEmail(customer);
  await new Promise(resolve => setTimeout(resolve, 100)); // 100ms de pause
}
```

---

## 🎯 Prochaines Étapes

### Configuration Recommandée

1. **Ajouter votre domaine dans Resend**
   - Allez sur https://resend.com/domains
   - Ajoutez votre domaine (ex: navettexpress.com)
   - Configurez les DNS (SPF, DKIM)
   - Utilisez `noreply@navettexpress.com` au lieu de `onboarding@resend.dev`

2. **Créer des Webhooks**
   - Pour être notifié des bounces
   - Pour tracker les ouvertures (optionnel)
   - Pour tracker les clics (optionnel)

3. **Améliorer les Templates**
   - Ajouter un logo
   - Personnaliser les couleurs
   - Ajouter des informations de contact

---

## 📝 Ressources

- **Documentation Resend** : https://resend.com/docs
- **Dashboard Resend** : https://resend.com/emails
- **Templates Resend** : https://resend.com/docs/send-with-react
- **Support** : https://resend.com/support

---

**Dernière mise à jour** : 17 novembre 2025
