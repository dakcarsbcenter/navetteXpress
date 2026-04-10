# 🔧 Correction : Erreur "Erreur interne du serveur" lors de la création de devis

## 🐛 Problème Identifié

Lors de la création d'un nouveau devis via l'interface admin (`ModernQuotesManagement.tsx`), une erreur se produisait :

```
❌ Erreur API response: "{"success":false,"error":"Erreur interne du serveur"}"
```

### Cause Racine

Le problème venait de la définition du schéma de la table `quotes` dans `src/schema.ts`. Le champ `updatedAt` était défini comme :

```typescript
updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date())
```

**Problème** : 
- Le champ est marqué comme `notNull()` (obligatoire)
- Il utilise `$onUpdate()` pour se mettre à jour automatiquement lors d'un UPDATE
- **Mais il n'avait pas de `defaultNow()`** pour fournir une valeur initiale lors de l'INSERT

Résultat : Lors de la création d'un devis, PostgreSQL retournait une erreur car le champ `updatedAt` était NULL alors qu'il est marqué comme NOT NULL.

## ✅ Solution Appliquée

### 1. Correction du Schéma

Ajout de `.defaultNow()` à tous les champs `updatedAt` dans `src/schema.ts` :

```typescript
// AVANT (incorrect)
updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date())

// APRÈS (correct)
updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date())
```

**Tables corrigées** :
- ✅ `users`
- ✅ `vehiclesTable`
- ✅ `bookingsTable`
- ✅ `quotesTable`
- ✅ `invoicesTable`
- ✅ `customRolesTable`

### 2. Correction de l'API (temporaire)

Dans `src/app/api/quotes/route.ts`, ajout explicite du champ `updatedAt` lors de l'insertion (peut être retiré après la migration du schéma) :

```typescript
const newQuote = await db
  .insert(quotesTable)
  .values({
    customerName,
    customerEmail,
    customerPhone: customerPhone || null,
    service,
    preferredDate: preferredDate ? new Date(preferredDate) : null,
    message,
    status: 'pending',
    updatedAt: new Date() // ← Ajouté pour éviter l'erreur
  })
  .returning();
```

## 📋 Migration de la Base de Données Requise

Pour que les changements de schéma prennent effet, il faut exécuter une migration Drizzle :

```bash
# Générer la migration
npm run db:generate

# Appliquer la migration
npm run db:push
```

Ou manuellement en SQL :

```sql
-- Pour chaque table, ajouter la valeur par défaut
ALTER TABLE users 
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE vehicles 
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE bookings 
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE quotes 
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE invoices 
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE custom_roles 
  ALTER COLUMN updated_at SET DEFAULT NOW();
```

## ✨ Avantages de la Correction

1. **Robustesse** : Plus besoin de spécifier manuellement `updatedAt` lors des INSERT
2. **Cohérence** : Toutes les tables utilisent le même pattern
3. **Prévention** : Évite les erreurs similaires sur d'autres tables
4. **Meilleures pratiques** : Suit les conventions Drizzle ORM

## 🧪 Test

Pour vérifier que le problème est résolu :

1. Accédez à l'interface admin
2. Cliquez sur "Gestion des Devis"
3. Cliquez sur "Nouveau Devis"
4. Remplissez le formulaire
5. Cliquez sur "Créer le devis"
6. ✅ Le devis devrait être créé avec succès sans erreur

## 📊 Résumé des Modifications

| Fichier | Action | Lignes |
|---------|--------|--------|
| `src/schema.ts` | Ajout `.defaultNow()` à 6 tables | 6 lignes |
| `src/app/api/quotes/route.ts` | Ajout `updatedAt: new Date()` | 1 ligne |

## 🔍 Impact

- **Impact utilisateur** : ✅ Résolution de l'erreur lors de la création de devis
- **Impact base de données** : ⚠️ Migration requise pour appliquer les DEFAULT
- **Impact code existant** : ✅ Pas d'impact (rétrocompatible)

## 📝 Notes Importantes

- Les valeurs `updatedAt` explicites dans le code peuvent être retirées après la migration
- Cette correction s'applique également aux futures insertions dans toutes les tables
- Les enregistrements existants ne sont pas affectés

---

**Date de correction** : 12 novembre 2024  
**Statut** : ✅ Corrigé (migration DB requise)  
**Priorité** : 🔴 Haute (bloquait la création de devis)
