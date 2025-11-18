# 🧪 Guide de Test - Système d'Approbation des Prix

## ✅ Installation Terminée

### Ce qui a été fait :

1. ✅ **Migration base de données** - 4 colonnes ajoutées à `bookings`
2. ✅ **Composant PriceApprovalModal** - Interface client créée
3. ✅ **Intégration dashboard client** - Modal intégré avec badges de statut
4. ✅ **API client respond-price** - Endpoint pour accepter/rejeter
5. ✅ **Emails de notification** - Admin notifié lors des réponses
6. ✅ **API admin modifiée** - Enregistrement automatique des propositions

---

## 🎯 Workflow Complet de Test

### Étape 1 : Créer une demande de réservation (Client)

1. **Aller sur** : `http://localhost:3000/reservation`
2. **Remplir le formulaire** :
   - Nom du client
   - Email
   - Adresse de départ
   - Adresse d'arrivée
   - Date et heure
   - Nombre de passagers
   - Nombre de bagages
3. **Soumettre** la demande

**Résultat attendu :**
- ✅ Réservation créée avec `price = '0'`
- ✅ Statut = `'pending'`
- ✅ Email envoyé à l'admin (contact@navettexpress.com)

---

### Étape 2 : Admin définit le prix

1. **Se connecter en admin** : `http://localhost:3000/auth/signin`
   - Email admin : `contact@navettexpress.com`
   
2. **Aller sur le dashboard** : `http://localhost:3000/dashboard?tab=bookings`

3. **Trouver la réservation** et cliquer sur "Modifier"

4. **Définir un prix** (ex: 15000 FCFA)

5. **Enregistrer**

**Résultat attendu :**
- ✅ `price` mis à jour (15000)
- ✅ `priceProposedAt` = date actuelle
- ✅ `clientResponse` = `'pending'`
- ✅ (TODO) Email envoyé au client avec proposition

---

### Étape 3 : Client reçoit la notification

**Scénario A : Client accepte le prix**

1. **Se connecter en client** : `http://localhost:3000/auth/signin`
   - Utiliser l'email du client de la réservation

2. **Aller sur** : `http://localhost:3000/client/dashboard?tab=bookings`

3. **Observer le badge** : "💰 En attente de votre réponse"

4. **Cliquer sur le bouton** : "💰 Répondre"

5. **Le modal s'ouvre** avec :
   - Détails de la réservation
   - Prix proposé (grand, vert, centré)
   - Bouton "Accepter le prix"
   - Bouton "Refuser"

6. **Cliquer sur "Accepter le prix"**

**Résultat attendu :**
- ✅ `clientResponse` = `'accepted'`
- ✅ `clientResponseAt` = date actuelle
- ✅ `status` = `'confirmed'`
- ✅ Email envoyé à l'admin : "✅ Prix accepté"
- ✅ Badge changé : "✅ Prix accepté"
- ✅ Bouton "Répondre" disparaît

---

**Scénario B : Client refuse le prix**

1. **Cliquer sur le bouton** : "Refuser"

2. **Le formulaire de refus apparaît** :
   - Champ texte pour le message (requis)
   - Bouton "Confirmer le refus"

3. **Écrire une raison** : "Le prix est trop élevé"

4. **Cliquer sur "Confirmer le refus"**

**Résultat attendu :**
- ✅ `clientResponse` = `'rejected'`
- ✅ `clientResponseAt` = date actuelle
- ✅ `clientResponseMessage` = "Le prix est trop élevé"
- ✅ `status` = retourne à `'pending'`
- ✅ Email envoyé à l'admin : "❌ Prix refusé" avec raison
- ✅ Badge changé : "❌ Prix refusé"
- ✅ Bouton "Répondre" disparaît

---

### Étape 4 : Admin modifie le prix après refus

1. **Admin retourne sur** : `http://localhost:3000/dashboard?tab=bookings`

2. **Modifier la réservation** refusée

3. **Changer le prix** (ex: 12000 FCFA au lieu de 15000)

4. **Enregistrer**

**Résultat attendu :**
- ✅ `price` = 12000
- ✅ `priceProposedAt` = nouvelle date
- ✅ `clientResponse` = `'pending'` (réinitialisé)
- ✅ `clientResponseAt` = NULL (réinitialisé)
- ✅ `clientResponseMessage` = NULL (réinitialisé)
- ✅ Client peut de nouveau répondre

---

## 📧 Emails à Vérifier

### 1. **Nouvelle demande de réservation** (déjà implémenté)
- À : Admin (contact@navettexpress.com)
- Sujet : "Nouvelle demande de réservation"
- Contenu : Détails complets + bagages

### 2. **Prix accepté** ✅ NOUVEAU
- À : Admin
- Sujet : "✅ Prix accepté - Réservation #123"
- Contenu : Détails réservation + prix accepté
- CTA : "Gérer les réservations"

### 3. **Prix refusé** ✅ NOUVEAU
- À : Admin
- Sujet : "❌ Prix refusé - Réservation #123"
- Contenu : Détails réservation + prix refusé + raison
- CTA : "Modifier le prix"

### 4. **Prix proposé au client** ⏳ TODO
- À : Client
- Sujet : "💰 Proposition de prix pour votre réservation"
- Contenu : Détails réservation + prix proposé
- CTA : "Accepter" / "Refuser"

---

## 🐛 Points de Test Critiques

### ✅ Sécurité
- [ ] Client ne peut répondre que pour SES réservations
- [ ] Client ne peut répondre qu'UNE SEULE FOIS par proposition
- [ ] Client ne peut répondre que si un prix a été proposé
- [ ] Admin doit modifier le prix pour réinitialiser la réponse

### ✅ UX/UI
- [ ] Badge visible selon `clientResponse`
- [ ] Bouton "Répondre" visible seulement si `clientResponse === 'pending'`
- [ ] Prix affiché en grand et centré dans le modal
- [ ] Message requis lors du refus
- [ ] Loading states pendant l'envoi
- [ ] Modal se ferme après succès
- [ ] Liste se recharge automatiquement

### ✅ Backend
- [ ] Migration SQL appliquée (4 colonnes créées)
- [ ] API `/api/client/bookings/[id]/respond-price` fonctionne
- [ ] API admin `/api/admin/bookings/[id]` enregistre `priceProposedAt`
- [ ] Emails envoyés sans erreur
- [ ] Dates enregistrées correctement

---

## 🔍 Vérifications Base de Données

**Après chaque action, vérifier dans la BDD :**

```sql
-- Voir la réservation avec tous les champs
SELECT 
  id,
  customer_name,
  price,
  status,
  price_proposed_at,
  client_response,
  client_response_at,
  client_response_message
FROM bookings
WHERE id = 123;
```

**Colonnes à vérifier :**
- `price` : Prix défini par l'admin
- `price_proposed_at` : Date de proposition (NOT NULL après modification admin)
- `client_response` : 'pending' | 'accepted' | 'rejected'
- `client_response_at` : Date de réponse du client
- `client_response_message` : Raison du refus (optionnel)

---

## 🎨 Interface Client - Captures Attendues

### Vue Liste (dashboard client)

```
┌─────────────────────────────────────────────────┐
│ Réservation #123                      [En attente] │
│ Dakar → Saly                                    │
│ 💰 En attente de votre réponse        [💰 Répondre]│
└─────────────────────────────────────────────────┘
```

### Modal Acceptation

```
┌───────────────────────────────────────────┐
│       Proposition de Prix                 │
├───────────────────────────────────────────┤
│ 📋 Réservation #123                       │
│ Dakar → Saly                              │
│ 15 décembre 2024, 14:00                   │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │         💰 Prix proposé             │ │
│  │                                     │ │
│  │          15 000 FCFA                │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  [  Accepter le prix  ]  [  Refuser  ]   │
└───────────────────────────────────────────┘
```

---

## 🚀 Prochaines Améliorations (Optionnel)

1. **Email au client lors de la proposition de prix**
   - Template : `booking-price-proposed`
   - Trigger : Quand admin définit/modifie le prix

2. **Historique des négociations**
   - Tableau avec toutes les propositions
   - Afficher les prix précédents
   - Dates de chaque proposition

3. **Limite de temps de réponse**
   - Ex : 48h pour répondre
   - Auto-annulation après délai

4. **Compteur de négociations**
   - Maximum 3 propositions
   - Bloquer après 3 refus

---

## 📝 Checklist de Validation Finale

- [ ] Migration appliquée sans erreur
- [ ] Serveur Next.js démarre correctement
- [ ] Client peut créer une réservation (prix = 0)
- [ ] Admin peut définir un prix
- [ ] Client voit le badge "En attente de votre réponse"
- [ ] Modal s'ouvre au clic sur "Répondre"
- [ ] Client peut accepter le prix
- [ ] Statut passe à "confirmed" après acceptation
- [ ] Email reçu par admin après acceptation
- [ ] Client peut refuser le prix avec message
- [ ] Statut retourne à "pending" après refus
- [ ] Email reçu par admin après refus avec raison
- [ ] Admin peut modifier le prix après refus
- [ ] Client peut répondre à la nouvelle proposition
- [ ] Badges de statut s'affichent correctement

---

**Date de création :** 18 novembre 2025  
**Version :** 1.0.0  
**Statut :** ✅ Prêt pour les tests
