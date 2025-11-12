# 📡 Exemples d'Utilisation de l'API Factures

## 🔐 Authentification

Toutes les requêtes nécessitent une authentification via NextAuth. Le token de session doit être inclus dans les cookies.

---

## 📋 Liste des Factures

### GET /api/invoices

Récupère toutes les factures (filtrées selon le rôle de l'utilisateur).

**Paramètres de requête (optionnels) :**
- `status` : Filtrer par statut (`pending`, `paid`, `cancelled`, `overdue`)

**Exemple - Toutes les factures :**
```bash
curl -X GET 'http://localhost:3000/api/invoices' \
  -H 'Cookie: next-auth.session-token=...'
```

**Exemple - Factures en attente :**
```bash
curl -X GET 'http://localhost:3000/api/invoices?status=pending' \
  -H 'Cookie: next-auth.session-token=...'
```

**Réponse :**
```json
{
  "success": true,
  "invoices": [
    {
      "id": 1,
      "invoiceNumber": "INV-2024-00001",
      "quoteId": 123,
      "customerName": "Jean Dupont",
      "customerEmail": "jean@example.com",
      "customerPhone": "+33612345678",
      "service": "Transport aéroport - Paris CDG vers Hotel Plaza",
      "amount": "100.00",
      "taxRate": "20.00",
      "taxAmount": "20.00",
      "totalAmount": "120.00",
      "status": "pending",
      "issueDate": "2024-11-10T10:00:00Z",
      "dueDate": "2024-12-10T10:00:00Z",
      "paidDate": null,
      "paymentMethod": null,
      "notes": null,
      "createdAt": "2024-11-10T10:00:00Z",
      "updatedAt": "2024-11-10T10:00:00Z"
    }
  ]
}
```

---

## 📄 Détails d'une Facture

### GET /api/invoices/[id]

Récupère les détails d'une facture spécifique.

**Exemple :**
```bash
curl -X GET 'http://localhost:3000/api/invoices/1' \
  -H 'Cookie: next-auth.session-token=...'
```

**Réponse :**
```json
{
  "success": true,
  "invoice": {
    "id": 1,
    "invoiceNumber": "INV-2024-00001",
    "quoteId": 123,
    "customerName": "Jean Dupont",
    "customerEmail": "jean@example.com",
    "amount": "100.00",
    "taxAmount": "20.00",
    "totalAmount": "120.00",
    "status": "pending",
    "issueDate": "2024-11-10T10:00:00Z",
    "dueDate": "2024-12-10T10:00:00Z"
  }
}
```

---

## 🔗 Facture d'un Devis

### GET /api/quotes/[id]/invoice

Récupère la facture associée à un devis spécifique.

**Exemple :**
```bash
curl -X GET 'http://localhost:3000/api/quotes/123/invoice' \
  -H 'Cookie: next-auth.session-token=...'
```

**Réponse - Facture trouvée :**
```json
{
  "success": true,
  "invoice": {
    "id": 1,
    "invoiceNumber": "INV-2024-00001",
    "quoteId": 123,
    "totalAmount": "120.00",
    "status": "pending"
  }
}
```

**Réponse - Pas de facture :**
```json
{
  "success": true,
  "invoice": null,
  "message": "Aucune facture générée pour ce devis"
}
```

---

## ✏️ Mettre à Jour une Facture

### PATCH /api/invoices/[id]

Met à jour une facture (admin/manager uniquement).

**Exemple - Marquer comme payée :**
```bash
curl -X PATCH 'http://localhost:3000/api/invoices/1' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=...' \
  -d '{
    "status": "paid",
    "paymentMethod": "card",
    "paidDate": "2024-11-10T14:30:00Z"
  }'
```

**Exemple - Modifier les notes :**
```bash
curl -X PATCH 'http://localhost:3000/api/invoices/1' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=...' \
  -d '{
    "notes": "Paiement reçu par virement bancaire"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "invoice": {
    "id": 1,
    "invoiceNumber": "INV-2024-00001",
    "status": "paid",
    "paidDate": "2024-11-10T14:30:00Z",
    "paymentMethod": "card"
  },
  "message": "Facture mise à jour avec succès"
}
```

---

## ❌ Annuler une Facture

### DELETE /api/invoices/[id]

Annule une facture (passe le statut à `cancelled`). Admin uniquement.

**Exemple :**
```bash
curl -X DELETE 'http://localhost:3000/api/invoices/1' \
  -H 'Cookie: next-auth.session-token=...'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Facture annulée avec succès"
}
```

---

## ➕ Créer une Facture Manuellement

### POST /api/invoices

Crée une facture manuellement (admin uniquement).

**Exemple :**
```bash
curl -X POST 'http://localhost:3000/api/invoices' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=...' \
  -d '{
    "invoiceNumber": "INV-2024-00002",
    "quoteId": 124,
    "customerName": "Marie Martin",
    "customerEmail": "marie@example.com",
    "customerPhone": "+33698765432",
    "service": "Transport privé - Dakar vers Thiès",
    "amount": "150.00",
    "taxRate": "20.00",
    "taxAmount": "30.00",
    "totalAmount": "180.00",
    "status": "pending",
    "dueDate": "2024-12-15T00:00:00Z",
    "notes": "Facture créée manuellement"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "invoice": {
    "id": 2,
    "invoiceNumber": "INV-2024-00002",
    "totalAmount": "180.00",
    "status": "pending"
  },
  "message": "Facture créée avec succès"
}
```

---

## 🎯 Workflow Complet - Devis → Facture

### 1. Créer un Devis
```bash
POST /api/quotes
{
  "customerName": "Jean Dupont",
  "customerEmail": "jean@example.com",
  "service": "Transport aéroport",
  "estimatedPrice": "100.00"
}
```

### 2. Envoyer le Devis au Client
```bash
POST /api/quotes/1/send
```

### 3. Le Client Accepte le Devis
```bash
POST /api/quotes/client/actions
{
  "quoteId": 1,
  "action": "accept",
  "message": "Parfait pour moi!"
}
```

**Réponse avec facture générée :**
```json
{
  "success": true,
  "message": "Action effectuée avec succès",
  "newStatus": "accepted",
  "timestamp": "2024-11-10T10:00:00Z",
  "invoice": {
    "id": 1,
    "invoiceNumber": "INV-2024-00001",
    "totalAmount": "120.00",
    "dueDate": "2024-12-10T10:00:00Z"
  }
}
```

### 4. Consulter la Facture Générée
```bash
GET /api/quotes/1/invoice
```

### 5. Marquer la Facture comme Payée (Admin)
```bash
PATCH /api/invoices/1
{
  "status": "paid",
  "paymentMethod": "bank_transfer"
}
```

---

## 🔒 Permissions

| Endpoint                      | Customer | Driver | Manager | Admin |
|-------------------------------|----------|--------|---------|-------|
| `GET /api/invoices`           | ✅ (ses factures) | ❌ | ✅ | ✅ |
| `GET /api/invoices/[id]`      | ✅ (ses factures) | ❌ | ✅ | ✅ |
| `GET /api/quotes/[id]/invoice`| ✅ (ses devis) | ❌ | ✅ | ✅ |
| `POST /api/invoices`          | ❌ | ❌ | ❌ | ✅ |
| `PATCH /api/invoices/[id]`    | ❌ | ❌ | ✅ | ✅ |
| `DELETE /api/invoices/[id]`   | ❌ | ❌ | ❌ | ✅ |

---

## 🐛 Codes d'Erreur

| Code | Message | Solution |
|------|---------|----------|
| `401` | Non authentifié | Vérifier le token de session |
| `403` | Accès non autorisé | Vérifier le rôle de l'utilisateur |
| `404` | Facture non trouvée | Vérifier l'ID de la facture |
| `400` | ID invalide | Utiliser un ID numérique valide |
| `500` | Erreur interne | Vérifier les logs du serveur |

---

## 💡 Astuces

### Vérifier si un devis a une facture
```javascript
fetch('/api/quotes/123/invoice')
  .then(res => res.json())
  .then(data => {
    if (data.invoice) {
      console.log('Facture existe:', data.invoice.invoiceNumber)
    } else {
      console.log('Pas de facture pour ce devis')
    }
  })
```

### Lister toutes les factures impayées
```javascript
fetch('/api/invoices?status=pending')
  .then(res => res.json())
  .then(data => {
    const unpaidInvoices = data.invoices
    console.log(`${unpaidInvoices.length} factures en attente`)
  })
```

### Calculer le total des factures payées
```javascript
fetch('/api/invoices?status=paid')
  .then(res => res.json())
  .then(data => {
    const total = data.invoices.reduce((sum, inv) => 
      sum + parseFloat(inv.totalAmount), 0
    )
    console.log(`Total encaissé: ${total}€`)
  })
```

---

**Documentation complète:** Voir `INVOICE_SYSTEM_IMPLEMENTATION.md`
