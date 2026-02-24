# 🔧 Scripts - Gestion des Permissions Composées

Ce dossier contient les scripts utilitaires pour gérer le système de permissions composées.

## 📜 Scripts Disponibles

### 1. `run-restructure-permissions.js`

**Fonction :** Migre la base de données vers le nouveau système de permissions composées

**Utilisation :**
```bash
node scripts/run-restructure-permissions.js
```

**Ce qu'il fait :**
- Lit le fichier `migrations/restructure-permissions.sql`
- Exécute la migration (⚠️ efface toutes les permissions existantes)
- Crée 20 permissions par rôle (4 permissions × 5 ressources)
- Configure les permissions par défaut

**Résultat attendu :**
```
🔄 Lecture du fichier de migration...
📝 Exécution de la migration...
✅ Migration exécutée avec succès!

📊 Permissions créées:
  - 4 permissions par ressource (manage, read, update, delete)
  - 5 ressources (users, vehicles, bookings, quotes, reviews)
  - 4 rôles (admin, manager, customer, driver)

🔐 Permissions par défaut:
  - Admin: Toutes les permissions (manage)
  - Manager: Manage vehicles, bookings, quotes, reviews + read users
  - Customer: Read sur bookings, quotes, reviews
  - Driver: Read sur bookings, vehicles
```

**⚠️ Attention :**
- Ce script **efface toutes les permissions existantes**
- Sauvegardez vos permissions avant de l'exécuter si nécessaire
- Ne peut pas être annulé (pas de rollback automatique)

---

### 2. `test-composed-permissions.js`

**Fonction :** Teste et affiche l'état actuel des permissions

**Utilisation :**
```bash
node scripts/test-composed-permissions.js
```

**Ce qu'il fait :**
- Lit toutes les permissions de la base de données
- Convertit les permissions atomiques en permissions composées
- Affiche les permissions par rôle
- Vérifie la cohérence des données
- Affiche des statistiques

**Résultat attendu :**
```
🧪 Test de la Structure des Permissions Composées

📊 PERMISSIONS EN BASE DE DONNÉES
✅ Total: 80 permissions atomiques trouvées

🔐 RÔLE: ADMIN
  👥 users        → ⚡ Gérer
  🚗 vehicles     → ⚡ Gérer
  📅 bookings     → ⚡ Gérer
  📋 quotes       → ⚡ Gérer
  ⭐ reviews      → ⚡ Gérer

🔐 RÔLE: MANAGER
  👥 users        → 👁️ Lire
  🚗 vehicles     → ⚡ Gérer
  📅 bookings     → ⚡ Gérer
  📋 quotes       → ⚡ Gérer
  ⭐ reviews      → ⚡ Gérer

🔐 RÔLE: CUSTOMER
  👥 users        → ❌ Aucun
  🚗 vehicles     → ❌ Aucun
  📅 bookings     → 👁️ Lire
  📋 quotes       → 👁️ Lire
  ⭐ reviews      → 👁️ Lire

🔐 RÔLE: DRIVER
  👥 users        → ❌ Aucun
  🚗 vehicles     → 👁️ Lire
  📅 bookings     → 👁️ Lire
  📋 quotes       → ❌ Aucun
  ⭐ reviews      → ❌ Aucun

📊 STATISTIQUES
  • Rôles: 4
  • Ressources: 5
  • Permissions par rôle: 20 max
  • Permissions atomiques en base: 80
  • Permissions composées par rôle: 20

✅ VÉRIFICATIONS
  ✅ admin: 20 permissions (OK)
  ✅ manager: 20 permissions (OK)
  ✅ customer: 20 permissions (OK)
  ✅ driver: 20 permissions (OK)

✅ Test terminé avec succès!
```

**Utilité :**
- Vérifier que la migration a fonctionné
- Voir l'état actuel des permissions
- Débugger les problèmes de permissions
- Comprendre la conversion atomique → composé

---

## 🔄 Workflow Typique

### Première Installation

```bash
# 1. Exécuter la migration
node scripts/run-restructure-permissions.js

# 2. Vérifier que tout est OK
node scripts/test-composed-permissions.js
```

### Après Modification dans la Matrice

```bash
# Vérifier les changements
node scripts/test-composed-permissions.js
```

### Réinitialisation Complète

```bash
# ⚠️ Remet tout à zéro avec les permissions par défaut
node scripts/run-restructure-permissions.js
```

---

## 📊 Permissions par Défaut

### Admin
- **users:** ⚡ Gérer (create, read, update, delete)
- **vehicles:** ⚡ Gérer (create, read, update, delete)
- **bookings:** ⚡ Gérer (create, read, update, delete)
- **quotes:** ⚡ Gérer (create, read, update, delete)
- **reviews:** ⚡ Gérer (create, read, update, delete)

### Manager
- **users:** 👁️ Lire (read)
- **vehicles:** ⚡ Gérer (create, read, update, delete)
- **bookings:** ⚡ Gérer (create, read, update, delete)
- **quotes:** ⚡ Gérer (create, read, update, delete)
- **reviews:** ⚡ Gérer (create, read, update, delete)

### Customer
- **users:** ❌ Aucun
- **vehicles:** ❌ Aucun
- **bookings:** 👁️ Lire (read)
- **quotes:** 👁️ Lire (read)
- **reviews:** 👁️ Lire (read)

### Driver
- **users:** ❌ Aucun
- **vehicles:** 👁️ Lire (read)
- **bookings:** 👁️ Lire (read)
- **quotes:** ❌ Aucun
- **reviews:** ❌ Aucun

---

## 🐛 Dépannage

### Erreur : "Cannot find module '../src/lib/db'"

**Cause :** Vous n'êtes pas dans le bon dossier ou node_modules manque

**Solution :**
```bash
# Aller à la racine du projet
cd c:\Users\labs\Documents\navetteXpress

# Installer les dépendances
npm install

# Réessayer
node scripts/run-restructure-permissions.js
```

### Erreur : "ENOENT: no such file or directory"

**Cause :** Le fichier de migration n'existe pas

**Solution :**
```bash
# Vérifier que le fichier existe
dir migrations\restructure-permissions.sql

# Si le fichier n'existe pas, vérifier le chemin
```

### Erreur lors de l'exécution SQL

**Cause :** Problème de connexion à la base de données

**Solution :**
```bash
# Vérifier que la DB est accessible
# Vérifier les variables d'environnement dans .env
# Vérifier que PostgreSQL est démarré
```

### Test affiche des permissions incohérentes

**Cause :** La migration n'a pas été exécutée ou a échoué

**Solution :**
```bash
# Réexécuter la migration
node scripts/run-restructure-permissions.js

# Vérifier à nouveau
node scripts/test-composed-permissions.js
```

---

## 🔍 Détails Techniques

### Conversion Atomique → Composé

```javascript
// Si toutes les actions sont présentes
if (actions.includes('create') && 
    actions.includes('read') && 
    actions.includes('update') && 
    actions.includes('delete')) {
  return ['⚡ Gérer']
}

// Sinon, retourner les actions individuelles
if (actions.includes('read')) perms.push('👁️ Lire')
if (actions.includes('update')) perms.push('✏️ Modifier')
if (actions.includes('delete')) perms.push('🗑️ Supprimer')
```

### Structure de la Table `role_permissions`

```sql
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT false,
  description TEXT
);
```

**Exemple de données :**
```sql
-- Admin a toutes les permissions sur users
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES 
  ('admin', 'users', 'create', true),
  ('admin', 'users', 'read', true),
  ('admin', 'users', 'update', true),
  ('admin', 'users', 'delete', true);
```

---

## 📚 Documentation Complète

Pour plus d'informations, consultez :
- **[QUICK_START_PERMISSIONS.md](../QUICK_START_PERMISSIONS.md)** - Démarrage rapide
- **[PERMISSIONS_COMPOSED_STRUCTURE.md](../PERMISSIONS_COMPOSED_STRUCTURE.md)** - Architecture
- **[COMPOSED_PERMISSIONS_IMPLEMENTATION_GUIDE.md](../COMPOSED_PERMISSIONS_IMPLEMENTATION_GUIDE.md)** - Guide complet
- **[PERMISSIONS_INDEX.md](../PERMISSIONS_INDEX.md)** - Index de toute la documentation

---

## ✅ Checklist Avant Migration

Avant d'exécuter `run-restructure-permissions.js` :

- [ ] Sauvegarder les permissions actuelles (si nécessaire)
- [ ] Vérifier que le serveur est arrêté (ou non, ça marche aussi en live)
- [ ] Vérifier que PostgreSQL est démarré
- [ ] Vérifier les variables d'environnement (.env)
- [ ] Être sûr de vouloir effacer les permissions existantes

Après la migration :

- [ ] Exécuter `test-composed-permissions.js`
- [ ] Vérifier les 4 rôles
- [ ] Vérifier les 5 ressources
- [ ] Tester dans l'interface admin
- [ ] Tester en tant que customer

---

**Bon développement ! 🚀**
