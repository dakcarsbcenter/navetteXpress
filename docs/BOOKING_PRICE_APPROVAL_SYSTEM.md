# 💰 Système d'Approbation des Prix par le Client

## 🎯 Objectif

Permettre au client d'accepter ou rejeter une proposition de prix faite par l'admin pour une réservation.

---

## 📋 Workflow Complet

### 1. **Client crée une demande de réservation**
   - Statut : `pending`
   - Prix : `0 FCFA`
   - `clientResponse` : `null`

### 2. **Admin définit le prix**
   - Modifier le champ `price`
   - Automatiquement enregistré :
     - `priceProposedAt` : Date actuelle
     - `clientResponse` : `'pending'`
     - `clientResponseAt` : `null`

### 3. **Client reçoit notification** (TODO)
   - Email avec le prix proposé
   - Lien vers la page de réponse

### 4. **Client répond**
   
   **Option A : Accepter**
   - `clientResponse` : `'accepted'`
   - `clientResponseAt` : Date actuelle
   - `status` : `'confirmed'`
   - → Réservation confirmée ✅

   **Option B : Rejeter**
   - `clientResponse` : `'rejected'`
   - `clientResponseAt` : Date actuelle
   - `clientResponseMessage` : Raison du refus
   - `status` : retourne à `'pending'`
   - → Admin notifié pour négociation ❌

---

## 🗄️ Modifications Base de Données

### Nouvelles colonnes dans `bookings` :

```sql
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS price_proposed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS client_response TEXT,
ADD COLUMN IF NOT EXISTS client_response_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS client_response_message TEXT;
```

**À exécuter :** 
```bash
psql $DATABASE_URL -f add-booking-price-approval.sql
```

---

## 📡 API Créées

### 1. **POST /api/client/bookings/[id]/respond-price**

**Permet au client d'accepter ou rejeter le prix**

**Request Body:**
```json
{
  "response": "accepted" | "rejected",
  "message": "Message optionnel"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Proposition acceptée avec succès",
  "data": { /* booking mis à jour */ }
}
```

**Validations:**
- Client authentifié
- Réservation appartient au client
- Un prix a été proposé
- Client n'a pas déjà répondu

---

### 2. **PATCH /api/admin/bookings/[id]** (Modifié)

**Enregistre automatiquement la proposition de prix**

Quand l'admin modifie le champ `price`, l'API définit automatiquement :
- `priceProposedAt = new Date()`
- `clientResponse = 'pending'`
- Réinitialise `clientResponseAt` et `clientResponseMessage`

---

## 🎨 Composant React

### `PriceApprovalModal.tsx`

**Props:**
```typescript
{
  bookingId: number
  price: string
  customerName: string
  pickupAddress: string
  dropoffAddress: string
  scheduledDateTime: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}
```

**Usage:**
```tsx
import { PriceApprovalModal } from '@/components/client/PriceApprovalModal'

const [showPriceModal, setShowPriceModal] = useState(false)
const [selectedBooking, setSelectedBooking] = useState(null)

// Dans la liste des réservations
{booking.clientResponse === 'pending' && booking.price && (
  <button onClick={() => {
    setSelectedBooking(booking)
    setShowPriceModal(true)
  }}>
    💰 Répondre à la proposition
  </button>
)}

<PriceApprovalModal
  bookingId={selectedBooking?.id}
  price={selectedBooking?.price}
  customerName={selectedBooking?.customerName}
  pickupAddress={selectedBooking?.pickupAddress}
  dropoffAddress={selectedBooking?.dropoffAddress}
  scheduledDateTime={selectedBooking?.scheduledDateTime}
  isOpen={showPriceModal}
  onClose={() => setShowPriceModal(false)}
  onSuccess={() => {
    // Recharger les réservations
    fetchBookings()
  }}
/>
```

---

## 📧 Emails à Implémenter (TODO)

### 1. **Email au client : Prix proposé**
**Trigger:** Quand admin définit un prix  
**Template:** `booking-price-proposed`  
**Contenu:**
- Numéro réservation
- Détails du trajet
- Prix proposé (grand et visible)
- CTA : "Accepter" / "Refuser"

### 2. **Email à l'admin : Client a accepté**
**Trigger:** Client accepte le prix  
**Template:** `booking-price-accepted`  
**Contenu:**
- Client a accepté
- Réservation confirmée
- Détails complets

### 3. **Email à l'admin : Client a rejeté**
**Trigger:** Client rejette le prix  
**Template:** `booking-price-rejected`  
**Contenu:**
- Client a rejeté
- Raison du refus
- CTA : "Modifier le prix"

---

## 🔒 Sécurité

✅ **Validations en place:**
- Authentification obligatoire
- Vérification propriété (booking.customerEmail === session.user.email)
- Pas de double réponse (clientResponse déjà défini)
- Prix doit exister avant réponse

⚠️ **À considérer:**
- Limite de temps pour répondre ? (ex: 48h)
- Nombre de négociations max ? (ex: 3 fois)
- Historique des prix proposés ?

---

## 📊 États de la Réservation

| État | Status | ClientResponse | Description |
|------|--------|----------------|-------------|
| Nouvelle demande | `pending` | `null` | Client a soumis, pas encore de prix |
| Prix proposé | `pending` | `pending` | Admin a défini un prix, attente réponse |
| Prix accepté | `confirmed` | `accepted` | Client a accepté, réservation confirmée |
| Prix rejeté | `pending` | `rejected` | Client a refusé, admin doit renégocier |

---

## 🎨 Interface Client - Affichage

### Badge de statut selon `clientResponse` :

```tsx
{booking.clientResponse === 'pending' && booking.price && (
  <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
    ⏳ En attente de votre réponse
  </div>
)}

{booking.clientResponse === 'accepted' && (
  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
    ✅ Prix accepté
  </div>
)}

{booking.clientResponse === 'rejected' && (
  <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
    ❌ Prix refusé
  </div>
)}
```

---

## 🚀 Prochaines Étapes

1. ✅ **Appliquer la migration SQL**
   ```bash
   psql $DATABASE_URL -f add-booking-price-approval.sql
   ```

2. ⏳ **Intégrer le composant dans le dashboard client**
   - Modifier `src/app/client/dashboard/page.tsx`
   - Ajouter le bouton "Répondre" si `clientResponse === 'pending'`

3. ⏳ **Créer les templates email**
   - `booking-price-proposed.html`
   - `booking-price-accepted.html`
   - `booking-price-rejected.html`

4. ⏳ **Intégrer l'envoi d'emails**
   - Dans `/api/admin/bookings/[id]/route.ts` (prix proposé)
   - Dans `/api/client/bookings/[id]/respond-price/route.ts` (accepté/rejeté)

5. ⏳ **Afficher l'historique des négociations**
   - Dans le dashboard admin
   - Date de proposition
   - Date de réponse
   - Message du client

6. ⏳ **Tester le workflow complet**
   - Créer réservation
   - Admin définit prix
   - Client accepte/rejette
   - Vérifier emails

---

## 📝 Notes Importantes

- Le client **ne peut répondre qu'une seule fois** par proposition
- Si rejeté, l'admin doit **modifier le prix** pour déclencher une nouvelle proposition
- La modification du prix **réinitialise** automatiquement `clientResponse` à `'pending'`
- Le statut `confirmed` est **automatiquement appliqué** lors de l'acceptation

---

**Date de création:** 18 novembre 2025  
**Version:** 1.0.0
