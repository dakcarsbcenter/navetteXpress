# 🔐 Système de Permissions Granulaires - Matrice Complète

## 📋 Vue d'Ensemble

Le système de permissions est maintenant **granulaire** et vérifie chaque action spécifiquement. Un utilisateur avec la permission `read` ne peut **QUE** consulter, pas modifier ou supprimer.

---

## 🎯 Matrice des Permissions

### Actions Disponibles par Permission

| Permission | Lecture | Création | Modification | Suppression | Description |
|------------|---------|----------|--------------|-------------|-------------|
| **read** | ✅ | ❌ | ❌ | ❌ | Consulter uniquement (lecture seule) |
| **create** | ✅ | ✅ | ❌ | ❌ | Consulter et créer de nouveaux éléments |
| **update** | ✅ | ❌ | ✅ | ❌ | Consulter et modifier les éléments existants |
| **delete** | ✅ | ❌ | ❌ | ✅ | Consulter et supprimer des éléments |
| **manage** | ✅ | ✅ | ✅ | ✅ | Tous les droits (super-permission) |

---

## 🚗 Exemple : Permissions Véhicules

### Scénario 1 : Utilisateur avec `vehicles.read`

**Ce qu'il PEUT faire :**
- ✅ Voir la liste des véhicules
- ✅ Voir les détails d'un véhicule
- ✅ Accéder à l'onglet "Véhicules" dans le dashboard

**Ce qu'il NE PEUT PAS faire :**
- ❌ Ajouter un nouveau véhicule (bouton masqué)
- ❌ Modifier un véhicule (bouton "Modifier" masqué)
- ❌ Activer/désactiver un véhicule (bouton "Activer/Désactiver" masqué)
- ❌ Supprimer un véhicule (bouton "🗑️" masqué)

**Interface affichée :**
```
┌─────────────────────────────────┐
│  Gestion de la Flotte           │
│  [👁️ Mode lecture seule]        │
└─────────────────────────────────┘

┌───────────────────────────────┐
│ Toyota Camry 2023             │
│ ABC-123 | 4 passagers          │
│ [👁️ Mode lecture seule]       │  ← Pas de boutons d'action
└───────────────────────────────┘
```

---

### Scénario 2 : Utilisateur avec `vehicles.update`

**Ce qu'il PEUT faire :**
- ✅ Voir la liste des véhicules
- ✅ Voir les détails d'un véhicule
- ✅ Modifier un véhicule existant (bouton "✏️ Modifier" visible)
- ✅ Activer/désactiver un véhicule (bouton "🚫 Désactiver" / "✅ Activer" visible)

**Ce qu'il NE PEUT PAS faire :**
- ❌ Ajouter un nouveau véhicule (bouton masqué)
- ❌ Supprimer un véhicule (bouton "🗑️" masqué)

**Interface affichée :**
```
┌───────────────────────────────┐
│ Toyota Camry 2023             │
│ ABC-123 | 4 passagers          │
│ [✏️ Modifier] [🚫 Désactiver] │  ← Boutons de modification visibles
└───────────────────────────────┘
```

---

### Scénario 3 : Utilisateur avec `vehicles.delete`

**Ce qu'il PEUT faire :**
- ✅ Voir la liste des véhicules
- ✅ Voir les détails d'un véhicule
- ✅ Supprimer un véhicule (bouton "🗑️" visible)

**Ce qu'il NE PEUT PAS faire :**
- ❌ Ajouter un nouveau véhicule
- ❌ Modifier un véhicule existant

**Interface affichée :**
```
┌───────────────────────────────┐
│ Toyota Camry 2023             │
│ ABC-123 | 4 passagers          │
│ [🗑️]                          │  ← Seulement le bouton supprimer
└───────────────────────────────┘
```

---

### Scénario 4 : Utilisateur avec `vehicles.manage`

**Ce qu'il PEUT faire :**
- ✅ Voir la liste des véhicules
- ✅ Ajouter un nouveau véhicule (bouton "➕ Ajouter" visible)
- ✅ Modifier un véhicule (bouton "✏️ Modifier" visible)
- ✅ Activer/désactiver un véhicule
- ✅ Supprimer un véhicule (bouton "🗑️" visible)

**Interface affichée :**
```
┌─────────────────────────────────┐
│  Gestion de la Flotte           │
│  [➕ Ajouter un véhicule]        │  ← Bouton d'ajout visible
└─────────────────────────────────┘

┌───────────────────────────────┐
│ Toyota Camry 2023             │
│ ABC-123 | 4 passagers          │
│ [✏️ Modifier] [🚫] [🗑️]       │  ← Tous les boutons visibles
└───────────────────────────────┘
```

---

## 🔧 Vérifications Côté Serveur

Chaque API vérifie **spécifiquement** la permission requise :

### API GET /api/client/vehicles
```typescript
// Vérifie : read OU manage OU create OU update OU delete
// → Permet de consulter si l'utilisateur a AU MOINS une permission
```

### API PATCH /api/client/vehicles/[id]
```typescript
// Vérifie : update OU manage
// → Refuse si l'utilisateur a seulement 'read'
```

### API DELETE /api/client/vehicles/[id]
```typescript
// Vérifie : delete OU manage
// → Refuse si l'utilisateur a seulement 'read', 'create' ou 'update'
```

### API POST /api/client/vehicles
```typescript
// Vérifie : create OU manage
// → Refuse si l'utilisateur a seulement 'read', 'update' ou 'delete'
```

---

## 🎯 Exemple Concret de Configuration

### Configuration Recommandée pour un Rôle "Customer"

**Objectif** : Le customer peut consulter les véhicules mais pas les modifier

```sql
-- Assigner uniquement la permission 'read'
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES ('customer', 'vehicles', 'read', true)
ON CONFLICT (role_name, resource, action) 
DO UPDATE SET allowed = true;

-- S'assurer qu'il n'a PAS les autres permissions
UPDATE role_permissions 
SET allowed = false 
WHERE role_name = 'customer' 
  AND resource = 'vehicles' 
  AND action IN ('create', 'update', 'delete', 'manage');
```

**Résultat** :
- ✅ Onglet "Véhicules" visible dans le dashboard
- ✅ Liste des véhicules affichée
- ❌ Bouton "Ajouter un véhicule" masqué
- ❌ Boutons "Modifier", "Activer/Désactiver", "Supprimer" masqués
- 👁️ Badge "Mode lecture seule" affiché

---

### Configuration pour un Rôle "Fleet Manager"

**Objectif** : Le fleet manager peut tout faire sur les véhicules

```sql
-- Assigner la permission 'manage' (donne tous les droits)
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES ('fleet_manager', 'vehicles', 'manage', true)
ON CONFLICT (role_name, resource, action) 
DO UPDATE SET allowed = true;
```

**Résultat** :
- ✅ Tous les boutons visibles
- ✅ Toutes les actions possibles

---

### Configuration pour un Rôle "Maintenance"

**Objectif** : Le technicien peut modifier les véhicules mais pas les supprimer

```sql
-- Assigner les permissions 'read' et 'update'
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES 
  ('maintenance', 'vehicles', 'read', true),
  ('maintenance', 'vehicles', 'update', true)
ON CONFLICT (role_name, resource, action) 
DO UPDATE SET allowed = true;

-- S'assurer qu'il ne peut pas supprimer
UPDATE role_permissions 
SET allowed = false 
WHERE role_name = 'maintenance' 
  AND resource = 'vehicles' 
  AND action IN ('delete', 'create');
```

**Résultat** :
- ✅ Boutons "Modifier" et "Activer/Désactiver" visibles
- ❌ Boutons "Ajouter" et "Supprimer" masqués

---

## 🔍 Vérification des Permissions

### Dans la Console du Navigateur

```javascript
// Vérifier les permissions de l'utilisateur connecté
fetch('/api/auth/permissions')
  .then(r => r.json())
  .then(data => {
    console.log('Permissions:', data.permissions)
    console.log('Permissions véhicules:', data.permissions.vehicles)
  })
```

**Exemple de sortie pour `read` uniquement** :
```json
{
  "permissions": {
    "vehicles": ["read"]
  }
}
```

### Dans la Base de Données

```sql
-- Voir les permissions d'un rôle spécifique
SELECT resource, action, allowed 
FROM role_permissions 
WHERE role_name = 'customer' 
  AND resource = 'vehicles'
ORDER BY action;
```

---

## 🐛 Scénario de Bug Corrigé

### AVANT la Correction ❌

**Problème** : Un utilisateur avec `vehicles.read` pouvait supprimer les véhicules

**Cause** :
1. Le composant affichait tous les boutons sans vérifier les permissions
2. L'API utilisée (`/api/admin/vehicles`) ne vérifiait que le rôle admin
3. Pas de vérification granulaire des actions

**Comportement** :
```
User avec 'read' → Voit tous les boutons
User clique sur 🗑️ → Appel API /api/admin/vehicles/123
API vérifie → "Est-ce un admin ?" → Non → Erreur 403
Mais le bouton était quand même visible et cliquable !
```

---

### APRÈS la Correction ✅

**Solution** :
1. ✅ Composant charge les permissions via `/api/auth/permissions`
2. ✅ Composant vérifie `canUpdate` et `canDelete` avant d'afficher les boutons
3. ✅ Nouvelle API `/api/client/vehicles/[id]` vérifie les permissions spécifiques
4. ✅ L'API refuse l'action si l'utilisateur n'a pas la bonne permission

**Comportement** :
```
User avec 'read' → Boutons masqués
User avec 'update' → Boutons Modifier visibles
User avec 'delete' → Bouton Supprimer visible
User avec 'manage' → Tous les boutons visibles

Si un utilisateur tente de contourner l'UI :
API vérifie → "A-t-il 'delete' ou 'manage' ?" → Non → 403 Forbidden
```

---

## 📊 Tableau Récapitulatif : Boutons Visibles par Permission

| Permission(s) | ➕ Ajouter | ✏️ Modifier | 🚫 Activer/Désactiver | 🗑️ Supprimer | 👁️ Badge "Lecture seule" |
|---------------|-----------|------------|---------------------|-------------|------------------------|
| **Aucune** | ❌ | ❌ | ❌ | ❌ | ❌ (onglet masqué) |
| **read** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **create** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **update** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **delete** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **create + update** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **update + delete** | ❌ | ✅ | ✅ | ✅ | ❌ |
| **manage** | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 🎓 Bonnes Pratiques

### ✅ À FAIRE

1. **Toujours assigner la permission minimale nécessaire**
   - Un utilisateur qui doit juste consulter → `read`
   - Un utilisateur qui doit modifier → `update`

2. **Utiliser `manage` avec parcimonie**
   - Réserver aux rôles admin ou gestionnaires
   - Donne TOUS les droits

3. **Combiner les permissions si nécessaire**
   - Ex: `read` + `update` pour un éditeur
   - Ex: `read` + `delete` pour un modérateur

### ❌ À ÉVITER

1. **Donner `manage` à tout le monde**
   - Trop permissif
   - Risque de sécurité

2. **Oublier de retirer les permissions inutilisées**
   - Nettoyer régulièrement les permissions
   - Faire des audits

3. **Ne pas tester les permissions**
   - Toujours tester avec un vrai utilisateur
   - Vérifier que les boutons sont bien masqués

---

## 🚀 Prochaines Étapes

1. ✅ Appliquer le même système aux autres ressources :
   - `bookings` (réservations)
   - `reviews` (avis)
   - `quotes` (devis)
   - `users` (utilisateurs)

2. ✅ Ajouter des logs de sécurité :
   - Tracer qui fait quoi
   - Alerter en cas de tentative non autorisée

3. ✅ Créer une interface d'audit :
   - Dashboard des permissions par rôle
   - Historique des modifications de permissions

---

**Date de création** : 16 octobre 2025  
**Dernière mise à jour** : 16 octobre 2025  
**Statut** : ✅ Système de Permissions Granulaires Implémenté
