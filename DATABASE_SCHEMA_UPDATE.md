# 📊 Mise à Jour du Schéma de Base de Données - Passengers & Luggage

## 🎯 Objectif

Ajouter des colonnes dédiées pour stocker les informations de passagers, valises et durée dans la table `bookings`, au lieu de tout mettre dans le champ texte `notes`.

---

## 📋 Changements Effectués

### 1. **Fichier Schéma (`src/schema.ts`)**

#### Nouvelles Colonnes Ajoutées

```typescript
export const bookingsTable = pgTable('bookings', {
  // ... colonnes existantes ...
  
  // NOUVELLES COLONNES
  passengers: integer('passengers').notNull().default(1),
  luggage: integer('luggage').notNull().default(1),
  duration: decimal('duration', { precision: 4, scale: 2 }).default('2'),
  
  // ... autres colonnes ...
}, (table) => ({
  // NOUVELLES CONTRAINTES
  passengersCheck: check('passengers_check', sql`${table.passengers} > 0`),
  luggageCheck: check('luggage_check', sql`${table.luggage} >= 0`),
}));
```

#### Description des Colonnes

| Colonne | Type | Default | Nullable | Contrainte |
|---------|------|---------|----------|------------|
| `passengers` | INTEGER | 1 | NON | > 0 |
| `luggage` | INTEGER | 1 | NON | ≥ 0 |
| `duration` | NUMERIC(4,2) | 2 | OUI | - |

---

### 2. **API Bookings (`src/app/api/bookings/route.ts`)**

#### Avant

```typescript
.values({
  // ...
  notes: `Service: ${serviceType}\nPassagers: ${passengers}\nValises: ${luggage}\nDurée: ${duration}h\n...`
})
```

#### Après

```typescript
.values({
  // ...
  passengers: passengers || 1,
  luggage: body.luggage || 1,
  duration: duration ? duration.toString() : '2',
  notes: `Service: ${serviceType}\nContact: ${contactPhone}...`  // Simplifié
})
```

**Amélioration** : Les données structurées sont dans des colonnes dédiées, `notes` ne contient plus que les informations textuelles supplémentaires.

---

### 3. **Migration SQL (`migrations/add-passengers-luggage-duration.sql`)**

#### Étapes de la Migration

1. **Ajout des colonnes**
   ```sql
   ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passengers INTEGER NOT NULL DEFAULT 1;
   ALTER TABLE bookings ADD COLUMN IF NOT EXISTS luggage INTEGER NOT NULL DEFAULT 1;
   ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration NUMERIC(4, 2) DEFAULT 2;
   ```

2. **Ajout des contraintes**
   ```sql
   ALTER TABLE bookings ADD CONSTRAINT passengers_check CHECK (passengers > 0);
   ALTER TABLE bookings ADD CONSTRAINT luggage_check CHECK (luggage >= 0);
   ```

3. **Migration des données existantes** (depuis le champ `notes`)
   ```sql
   -- Extraction via regex depuis notes:
   -- "Passagers: 5" → passengers = 5
   -- "Valises: 3" → luggage = 3
   -- "Durée: 2.5h" → duration = 2.5
   ```

4. **Ajout de commentaires**
   ```sql
   COMMENT ON COLUMN bookings.passengers IS 'Nombre de passagers pour la réservation';
   ```

---

## 🔧 Utilisation

### Exécuter la Migration

```bash
# Option 1: Via script Node.js
node apply-passengers-luggage-migration.js

# Option 2: Via Drizzle Kit
npx drizzle-kit push

# Option 3: Manuellement via psql
psql $DATABASE_URL -f migrations/add-passengers-luggage-duration.sql
```

### Vérification Post-Migration

```sql
-- Vérifier que les colonnes existent
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name IN ('passengers', 'luggage', 'duration');

-- Statistiques
SELECT 
  COUNT(*) as total,
  AVG(passengers) as avg_passengers,
  MAX(passengers) as max_passengers,
  AVG(luggage) as avg_luggage,
  MAX(luggage) as max_luggage
FROM bookings;
```

---

## 📊 Impact sur les Requêtes

### Anciennes Requêtes (Avant)

```typescript
// Récupérer les infos depuis notes (parsing requis)
const booking = await db.select().from(bookingsTable).where(eq(bookingsTable.id, 1));
const notesText = booking.notes; // "Passagers: 5\nValises: 3..."
const passengers = parseInt(notesText.match(/Passagers:\s*(\d+)/)?.[1] || '1');
```

### Nouvelles Requêtes (Après)

```typescript
// Accès direct aux colonnes
const booking = await db.select().from(bookingsTable).where(eq(bookingsTable.id, 1));
const passengers = booking.passengers; // ✅ Type-safe, direct
const luggage = booking.luggage;       // ✅ Type-safe, direct
const duration = booking.duration;     // ✅ Type-safe, direct
```

---

## 🎯 Avantages

### 1. **Performance**
- ✅ Pas de parsing de texte
- ✅ Index possibles sur les colonnes numériques
- ✅ Requêtes SQL directes (WHERE, ORDER BY, AVG, etc.)

### 2. **Type Safety**
- ✅ TypeScript connaît les types exacts
- ✅ Validation au niveau de la base de données
- ✅ Contraintes CHECK pour garantir la cohérence

### 3. **Requêtes Complexes**
```sql
-- Possible maintenant:
SELECT * FROM bookings WHERE passengers > 10;
SELECT AVG(passengers) FROM bookings WHERE status = 'completed';
SELECT * FROM bookings ORDER BY luggage DESC;
```

### 4. **Analytique**
- ✅ Statistiques faciles (moyenne, max, min)
- ✅ Groupements par nombre de passagers
- ✅ Rapports sur les capacités de véhicules

---

## 🔄 Compatibilité

### Rétrocompatibilité

- ✅ **Nouvelles réservations** : Utilisent les colonnes dédiées
- ✅ **Anciennes réservations** : Migration automatique depuis `notes`
- ✅ **Champ `notes`** : Conservé pour informations supplémentaires

### Gestion des Valeurs Personnalisées (+10)

```typescript
// Formulaire envoie:
passengers: 11 (code pour "+10")
customPassengers: "25"

// API traite:
passengers: formData.passengers === 11 
  ? parseInt(formData.customPassengers) || 11 
  : formData.passengers

// Base de données stocke: 25
```

---

## 📝 Checklist Post-Migration

- [x] Schéma mis à jour (`src/schema.ts`)
- [x] Migration SQL créée (`migrations/add-passengers-luggage-duration.sql`)
- [x] Script de migration créé (`apply-passengers-luggage-migration.js`)
- [x] API mise à jour (`src/app/api/bookings/route.ts`)
- [x] Contraintes CHECK ajoutées
- [x] Documentation créée
- [ ] **Migration exécutée** (à faire)
- [ ] **Tests de l'API** (à faire)
- [ ] **Vérification des données migrées** (à faire)

---

## 🚨 Notes Importantes

### Données Existantes

Si des réservations existent déjà dans la base:
1. La migration tentera d'extraire les valeurs depuis `notes`
2. Si l'extraction échoue, les valeurs par défaut seront utilisées
3. Le champ `notes` est conservé (pas de perte de données)

### Rollback (si nécessaire)

```sql
-- Supprimer les colonnes ajoutées
ALTER TABLE bookings DROP COLUMN IF EXISTS passengers;
ALTER TABLE bookings DROP COLUMN IF EXISTS luggage;
ALTER TABLE bookings DROP COLUMN IF EXISTS duration;

-- Supprimer les contraintes
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS passengers_check;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS luggage_check;
```

---

## 📞 Support

Si des problèmes surviennent lors de la migration:
1. Vérifier les logs du script de migration
2. Examiner la structure de la table: `\d bookings` (psql)
3. Consulter les erreurs de contraintes
4. Vérifier que `DATABASE_URL` est correctement configuré

---

**Date de mise à jour** : 10 novembre 2025  
**Version** : 1.0.0  
**Statut** : ✅ Prêt pour migration
