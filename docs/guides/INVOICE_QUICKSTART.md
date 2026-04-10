# 🚀 Guide de Démarrage Rapide - Système de Facturation

## 📦 Installation

### Étape 1 : Exécuter la migration de la base de données

```bash
npx tsx scripts/add-invoices-migration.ts
```

Cette commande va :
- ✅ Créer la table `invoices`
- ✅ Créer l'enum `invoice_status`
- ✅ Ajouter les index pour les performances
- ✅ Configurer les triggers et contraintes

### Étape 2 : Vérifier l'installation

```bash
npx tsx scripts/test-invoice-system.ts
```

Cette commande affiche :
- Le nombre de factures existantes
- Les statistiques par statut
- Les relations avec les devis
- Les devis acceptés sans facture

## 🎯 Comment ça fonctionne ?

### Scénario 1 : Génération Automatique

**Quand un client accepte un devis :**

1. Le client ouvre son dashboard et voit ses devis
2. Il clique sur "Accepter" pour un devis envoyé
3. 🎉 **Une facture est automatiquement générée** avec :
   - Numéro unique (ex: `INV-2024-00001`)
   - Montant HT, TVA (20%), et TTC
   - Date d'échéance à 30 jours
   - Statut "En attente"

### Scénario 2 : Consultation des Factures

**Client :**
```bash
# Voir toutes ses factures
GET /api/invoices

# Voir la facture d'un devis spécifique
GET /api/quotes/123/invoice
```

**Admin :**
```bash
# Voir toutes les factures
GET /api/invoices

# Filtrer par statut
GET /api/invoices?status=pending
GET /api/invoices?status=paid

# Voir une facture spécifique
GET /api/invoices/1
```

### Scénario 3 : Gestion des Factures (Admin)

**Marquer une facture comme payée :**
```bash
PATCH /api/invoices/1
{
  "status": "paid",
  "paymentMethod": "card",
  "paidDate": "2024-11-10T10:30:00Z"
}
```

**Annuler une facture :**
```bash
DELETE /api/invoices/1
```

## 📋 Fichiers Modifiés/Créés

### Nouveaux Fichiers

```
src/
├── lib/
│   └── invoice-utils.ts                    # Utilitaires (génération numéro, calculs)
├── app/
│   └── api/
│       ├── invoices/
│       │   ├── route.ts                    # GET/POST factures
│       │   └── [id]/
│       │       └── route.ts                # GET/PATCH/DELETE facture
│       └── quotes/
│           └── [id]/
│               └── invoice/
│                   └── route.ts            # GET facture d'un devis

scripts/
├── migrations/
│   └── add-invoices-table.sql              # Script SQL de migration
├── add-invoices-migration.ts               # Script TS pour exécuter la migration
└── test-invoice-system.ts                  # Script de test

INVOICE_SYSTEM_IMPLEMENTATION.md            # Documentation complète
```

### Fichiers Modifiés

```
src/
├── schema.ts                               # + Table invoices, enum, types
└── app/
    └── api/
        └── quotes/
            └── client/
                └── actions/
                    └── route.ts            # + Génération auto de facture
```

## 🧪 Tests Manuels

### Test 1 : Créer un devis et l'accepter

1. **Créer un devis** (en tant qu'admin ou via l'interface)
   ```bash
   POST /api/quotes
   {
     "customerName": "Jean Dupont",
     "customerEmail": "jean@example.com",
     "service": "Transport aéroport",
     "estimatedPrice": "100.00",
     ...
   }
   ```

2. **Envoyer le devis au client**
   ```bash
   POST /api/quotes/1/send
   ```

3. **Accepter le devis** (en tant que client)
   ```bash
   POST /api/quotes/client/actions
   {
     "quoteId": 1,
     "action": "accept",
     "message": "Parfait !"
   }
   ```

4. **Vérifier la facture générée**
   ```bash
   GET /api/quotes/1/invoice
   ```

### Test 2 : Consulter les factures

**En tant qu'admin :**
```bash
GET /api/invoices
```

**En tant que client :**
```bash
GET /api/invoices
# Ne retournera que les factures du client connecté
```

### Test 3 : Mettre à jour une facture

```bash
PATCH /api/invoices/1
{
  "status": "paid",
  "paymentMethod": "bank_transfer",
  "notes": "Paiement reçu le 10/11/2024"
}
```

## 🔧 Configuration

### TVA

Par défaut, la TVA est de 20%. Pour modifier :

```typescript
// Dans src/lib/invoice-utils.ts
export function calculateInvoiceAmounts(amount: number, taxRate: number = 20) {
  // Changer la valeur par défaut ici ↑
}
```

### Date d'échéance

Par défaut, l'échéance est à 30 jours. Pour modifier :

```typescript
// Dans src/lib/invoice-utils.ts
export function calculateDueDate(issueDate: Date = new Date(), daysToAdd: number = 30) {
  // Changer la valeur ici ↑
}
```

### Format du numéro de facture

Actuel : `INV-2024-00001`

Pour personnaliser, modifier la fonction `generateInvoiceNumber()` dans `src/lib/invoice-utils.ts`

## 🐛 Résolution de Problèmes

### La migration échoue

**Erreur:** `relation "invoices" already exists`

**Solution:** La table existe déjà, pas besoin de réexécuter la migration.

### La facture n'est pas générée

**Vérifications:**
1. Le devis a un `estimatedPrice` défini
2. Le statut du devis est `sent` avant acceptation
3. Vérifier les logs de l'API

```bash
# Voir les logs
tail -f logs/application.log | grep facture
```

### Erreur de permissions

**Erreur:** `Accès non autorisé`

**Solution:** Vérifier le rôle de l'utilisateur connecté. Les actions admin nécessitent le rôle `admin`.

## 📚 Documentation Complète

Pour plus de détails, consultez `INVOICE_SYSTEM_IMPLEMENTATION.md`

## ✅ Checklist de Déploiement

Avant de déployer en production :

- [ ] Migration exécutée sur la base de données
- [ ] Tests manuels effectués
- [ ] Vérification des permissions
- [ ] Backup de la base de données
- [ ] Documentation à jour
- [ ] Logs de monitoring configurés

## 📞 Support

En cas de problème, vérifier dans l'ordre :
1. Les logs de l'application
2. Les erreurs dans la console du navigateur
3. L'état de la base de données
4. La documentation complète

---

**Version:** 1.0.0  
**Date:** 10 novembre 2024
