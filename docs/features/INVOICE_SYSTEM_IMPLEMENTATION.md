# 🧾 Implémentation du Système de Facturation Automatique

## 📋 Vue d'ensemble

Ce document décrit l'implémentation complète du système de génération automatique de factures lorsqu'un client valide un devis dans NavetteXpress.

## 🎯 Fonctionnalités Implémentées

### 1. Table Factures (Invoices)

Une nouvelle table `invoices` a été créée dans la base de données avec les champs suivants :

- **id** : Identifiant unique de la facture
- **invoiceNumber** : Numéro de facture unique au format `INV-YYYY-XXXXX`
- **quoteId** : Référence au devis accepté
- **customerName** : Nom du client
- **customerEmail** : Email du client
- **customerPhone** : Téléphone du client
- **service** : Description du service
- **amount** : Montant HT
- **taxRate** : Taux de TVA (20% par défaut)
- **taxAmount** : Montant de la TVA
- **totalAmount** : Montant TTC
- **status** : Statut de la facture (`pending`, `paid`, `cancelled`, `overdue`)
- **issueDate** : Date d'émission
- **dueDate** : Date d'échéance (30 jours par défaut)
- **paidDate** : Date de paiement (si payée)
- **paymentMethod** : Méthode de paiement
- **notes** : Notes additionnelles

### 2. Génération Automatique

Lorsqu'un client accepte un devis via l'API `/api/quotes/client/actions` :

1. ✅ Le devis passe au statut `accepted`
2. 📄 Une facture est **automatiquement générée**
3. 🔢 Un numéro unique est attribué (format : `INV-2024-00001`)
4. 💰 Les montants sont calculés (HT, TVA 20%, TTC)
5. 📅 La date d'échéance est fixée à 30 jours
6. ✉️ La facture est enregistrée dans la base de données

### 3. API Routes Créées

#### `/api/invoices` (GET, POST)
- **GET** : Récupère toutes les factures (filtrées selon le rôle)
  - Admin/Manager : Toutes les factures
  - Client : Uniquement ses propres factures
- **POST** : Création manuelle d'une facture (admin uniquement)

#### `/api/invoices/[id]` (GET, PATCH, DELETE)
- **GET** : Récupère une facture spécifique
- **PATCH** : Met à jour une facture (statut, paiement, etc.)
- **DELETE** : Annule une facture (passe le statut à `cancelled`)

#### `/api/quotes/[id]/invoice` (GET)
- Récupère la facture associée à un devis spécifique

### 4. Utilitaires

Un fichier `src/lib/invoice-utils.ts` contient des fonctions utilitaires :

- **generateInvoiceNumber()** : Génère un numéro de facture unique
- **calculateInvoiceAmounts()** : Calcule HT, TVA, et TTC
- **calculateDueDate()** : Calcule la date d'échéance

## 🚀 Installation et Migration

### Étape 1 : Exécuter la migration

```bash
# Exécuter le script TypeScript de migration
npx tsx scripts/add-invoices-migration.ts
```

Ou manuellement avec le fichier SQL :

```bash
# Se connecter à la base de données et exécuter
psql -d votre_database < scripts/migrations/add-invoices-table.sql
```

### Étape 2 : Vérifier la création de la table

```sql
-- Vérifier que la table existe
SELECT * FROM invoices LIMIT 1;

-- Vérifier l'enum
SELECT enum_range(NULL::invoice_status);
```

## 📊 Schéma de la Base de Données

```
quotes                           invoices
+------------------+            +---------------------+
| id (PK)          |            | id (PK)             |
| customerName     |            | invoiceNumber (UQ)  |
| customerEmail    |            | quoteId (FK) ------>|
| estimatedPrice   |            | customerName        |
| status           |            | amount (HT)         |
| ...              |            | taxRate             |
+------------------+            | taxAmount           |
                                | totalAmount (TTC)   |
                                | status              |
                                | issueDate           |
                                | dueDate             |
                                | paidDate            |
                                | ...                 |
                                +---------------------+
```

## 🔒 Permissions et Sécurité

### Permissions par Rôle

| Action                     | Admin | Manager | Customer | Driver |
|----------------------------|-------|---------|----------|--------|
| Voir toutes les factures   | ✅    | ✅      | ❌       | ❌     |
| Voir ses propres factures  | ✅    | ✅      | ✅       | ❌     |
| Créer une facture          | ✅    | ❌      | ❌       | ❌     |
| Modifier une facture       | ✅    | ✅      | ❌       | ❌     |
| Annuler une facture        | ✅    | ❌      | ❌       | ❌     |

### Vérifications de Sécurité

- ✅ Authentification requise pour toutes les routes
- ✅ Les clients ne peuvent accéder qu'à leurs propres factures
- ✅ Validation des données avant insertion
- ✅ Contraintes de base de données (montants > 0)
- ✅ Relation avec le devis en mode `RESTRICT` (empêche la suppression du devis si une facture existe)

## 💡 Exemple d'Utilisation

### Workflow Client

1. **Client demande un devis**
   ```
   POST /api/quotes
   ```

2. **Admin envoie le devis au client**
   ```
   POST /api/quotes/[id]/send
   ```

3. **Client accepte le devis**
   ```
   POST /api/quotes/client/actions
   {
     "quoteId": 123,
     "action": "accept",
     "message": "D'accord pour ce prix"
   }
   ```

4. **🎉 Facture générée automatiquement**
   ```json
   {
     "success": true,
     "newStatus": "accepted",
     "invoice": {
       "id": 1,
       "invoiceNumber": "INV-2024-00001",
       "totalAmount": "120.00",
       "dueDate": "2024-12-10T00:00:00Z"
     }
   }
   ```

5. **Client consulte sa facture**
   ```
   GET /api/quotes/123/invoice
   ```

### Workflow Admin

1. **Voir toutes les factures**
   ```
   GET /api/invoices
   ```

2. **Filtrer par statut**
   ```
   GET /api/invoices?status=pending
   ```

3. **Marquer une facture comme payée**
   ```
   PATCH /api/invoices/1
   {
     "status": "paid",
     "paymentMethod": "card"
   }
   ```

## 📈 Statistiques et Rapports

Les factures peuvent être utilisées pour générer des rapports :

- Chiffre d'affaires total
- Factures en attente
- Taux de paiement
- Factures en retard (overdue)

## 🔮 Évolutions Futures

### Phase 2 - Améliorations possibles

1. **Génération PDF**
   - Export PDF des factures
   - Template personnalisable
   - Logo de l'entreprise

2. **Notifications Email**
   - Email automatique lors de la génération
   - Rappels avant échéance
   - Alerte factures impayées

3. **Paiements en ligne**
   - Intégration Stripe/PayPal
   - Paiement direct depuis la facture
   - Statut de paiement en temps réel

4. **Numérotation avancée**
   - Préfixes personnalisables
   - Numérotation par client
   - Séries de factures

5. **Avoirs et remboursements**
   - Génération d'avoirs
   - Gestion des remboursements
   - Historique des transactions

## 🐛 Dépannage

### La facture n'est pas générée

**Vérifier :**
1. Le devis a bien un `estimatedPrice` défini
2. Le statut du devis est bien `sent` avant acceptation
3. Les logs dans la console pour voir l'erreur exacte

```bash
# Vérifier les logs
tail -f logs/application.log | grep "facture"
```

### Erreur "duplicate key value"

**Solution :** Le numéro de facture existe déjà. Cela peut arriver si :
- Plusieurs acceptations simultanées
- La séquence de numérotation a été réinitialisée

```sql
-- Vérifier la dernière facture
SELECT MAX(id), invoice_number FROM invoices;
```

## 📞 Support

Pour toute question ou problème :
- Consulter les logs : `/api/invoices` retourne des messages détaillés
- Vérifier la base de données : table `invoices`
- Contacter l'équipe technique

---

**Date de création :** 10 novembre 2024  
**Version :** 1.0.0  
**Auteur :** NavetteXpress Development Team
