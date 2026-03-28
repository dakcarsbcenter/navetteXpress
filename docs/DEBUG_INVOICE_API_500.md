# 🐛 Guide de Débogage - Erreur 500 API Invoices

## ✅ Corrections Apportées

### 1. **Mapping des données corrigé** (`/api/invoices/route.ts`)
```typescript
// Avant: Les types decimal retournaient des strings
const mappedInvoices = invoices.map(invoice => ({
  ...invoice,
  amountHT: parseFloat(invoice.amount),
  vatAmount: parseFloat(invoice.taxAmount),
  amountTTC: parseFloat(invoice.totalAmount),
}));

// Après: Mapping complet avec gestion des null
const mappedInvoices = invoices.map(invoice => ({
  id: invoice.id,
  invoiceNumber: invoice.invoiceNumber,
  quoteId: invoice.quoteId,
  customerId: invoice.customerEmail,
  customerName: invoice.customerName,
  amountHT: invoice.amount ? parseFloat(invoice.amount) : 0,
  vatAmount: invoice.taxAmount ? parseFloat(invoice.taxAmount) : 0,
  amountTTC: invoice.totalAmount ? parseFloat(invoice.totalAmount) : 0,
  // ... tous les autres champs
}));
```

### 2. **Import inutilisé supprimé**
```typescript
// Avant:
import { invoicesTable, users } from '@/schema';

// Après:
import { invoicesTable } from '@/schema';
```

### 3. **AdminInvoicesView corrigé**
```typescript
// Avant:
const data = await response.json()
setInvoices(data)

// Après:
const data = await response.json()
if (data.success) {
  setInvoices(data.invoices || [])
}
```

### 4. **Logs de débogage ajoutés**
- 🔍 Début de la requête
- 👤 Informations de session (email, role)
- ✅ Nombre de factures retournées
- ❌ Détails d'erreur avec stack trace

---

## 🧪 Tests Effectués

### Test 1: Connexion à la base ✅
```bash
node scripts/test-invoices-api.mjs
```
**Résultat:** Table `invoices` existe et est accessible

### Test 2: Création d'une facture de test ✅
```bash
node scripts/create-test-invoice.mjs
```
**Résultat:** Facture `INV-2025-00001` créée avec succès
- Client: Client Navette (clientnavette@gmail.com)
- Montant HT: 75000 FCFA
- TVA: 15000 FCFA
- Total TTC: 90000 FCFA
- Statut: pending

---

## 🔍 Comment Déboguer l'Erreur 500

### Étape 1: Vérifier les logs du serveur Next.js
1. Ouvrez le terminal où `npm run dev` tourne
2. Recherchez les messages de log:
   - `🔍 [API Invoices] Début de la requête GET`
   - `👤 [API Invoices] Session: ...`
   - `❌ [API Invoices] Erreur...`

### Étape 2: Vérifier la session utilisateur
```typescript
// L'API nécessite une session authentifiée
if (!session?.user) {
  return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
}
```

**Actions:**
- Vérifiez que vous êtes bien connecté
- Rechargez la page et reconnectez-vous si nécessaire
- Vérifiez les cookies de session dans les DevTools

### Étape 3: Vérifier la base de données
```bash
node scripts/test-invoices-api.mjs
```

Vérifie:
- ✅ Table existe
- ✅ Structure correcte
- ✅ Données accessibles

### Étape 4: Tester l'API directement
Ouvrez la console du navigateur et testez:

```javascript
// Test avec fetch
fetch('/api/invoices')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

---

## 🔧 Solutions Possibles

### Problème 1: Session non trouvée (401)
**Symptôme:** `{ success: false, error: 'Non authentifié' }`

**Solutions:**
1. Reconnectez-vous
2. Vérifiez les variables d'environnement NextAuth
3. Vérifiez que `NEXTAUTH_SECRET` est défini

### Problème 2: Erreur de parsing des données
**Symptôme:** `Cannot read properties of undefined`

**Solutions:**
1. ✅ Mapping corrigé avec gestion des null
2. ✅ Types decimal convertis en number
3. ✅ Valeurs par défaut ajoutées

### Problème 3: Erreur de base de données
**Symptôme:** `Database error` ou `Connection timeout`

**Solutions:**
1. Vérifier que la DB est accessible:
   ```bash
   node scripts/test-invoices-api.mjs
   ```
2. Vérifier la variable `DATABASE_URL` dans `.env`
3. Vérifier la connexion réseau à Neon

### Problème 4: Erreur TypeScript/Compilation
**Symptôme:** Erreur 500 sans logs détaillés

**Solutions:**
1. Arrêter le serveur: `Ctrl+C`
2. Nettoyer le cache: `rm -rf .next`
3. Redémarrer: `npm run dev`

---

## 📊 État Actuel du Système

| Composant | État | Note |
|-----------|------|------|
| Table `invoices` | ✅ | Créée et accessible |
| Factures de test | ✅ | 1 facture créée |
| API `/api/invoices` | ✅ | Corrigée avec logs |
| Mapping données | ✅ | decimal → number |
| Gestion null | ✅ | Valeurs par défaut |
| Logs débogage | ✅ | Ajoutés |
| AdminInvoicesView | ✅ | Parsing corrigé |
| ClientInvoicesView | ✅ | Déjà correct |

---

## 🚀 Prochaines Actions

1. **Recharger la page** dans le navigateur
2. **Ouvrir la console** (F12)
3. **Aller sur le menu Factures** 🧾
4. **Vérifier les logs** dans le terminal du serveur
5. **Vérifier les erreurs** dans la console navigateur

### Si l'erreur persiste:

1. **Capturer les logs complets:**
   ```bash
   # Dans le terminal serveur, recherchez:
   🔍 [API Invoices]
   👤 [API Invoices]
   ❌ [API Invoices]
   ```

2. **Vérifier la réponse exacte:**
   ```javascript
   // Dans la console navigateur
   fetch('/api/invoices')
     .then(async r => ({
       status: r.status,
       statusText: r.statusText,
       body: await r.json()
     }))
     .then(console.log)
   ```

3. **Redémarrer complètement:**
   ```bash
   # Terminal 1: Arrêter le serveur (Ctrl+C)
   rm -rf .next
   npm run dev
   
   # Terminal 2: Tester l'API
   node scripts/test-invoices-api.mjs
   ```

---

## 📞 Informations pour le Support

Si vous avez besoin d'aide, fournissez:

1. **Les logs du serveur** (autour de `[API Invoices]`)
2. **La réponse complète** de l'API (depuis la console)
3. **Le rôle de l'utilisateur** connecté (admin, client, etc.)
4. **Le navigateur utilisé** et sa version

---

**Date:** 11 novembre 2025  
**Version:** 1.1.0  
**Statut:** Corrections appliquées, en attente de test
