# ⚡ QUICK REFERENCE - Système de Permissions Composées

## 🎯 En Bref

**Nouveau système de permissions avec matrice visuelle moderne**
- 4 permissions par ressource (Gérer, Lire, Modifier, Supprimer)
- 5 ressources (Users, Vehicles, Bookings, Quotes, Reviews)
- Interface interactive dans Admin Dashboard

---

## 🚀 Installation (2 minutes)

```bash
# 1. Migration (30s)
node scripts/run-restructure-permissions.js

# 2. Test (30s)
node scripts/test-composed-permissions.js

# 3. Interface (1min)
# → Se connecter en admin
# → Admin Dashboard → Onglet "Permissions"
```

---

## 📊 Les 4 Permissions

| Permission | Icône | Actions | Portée |
|------------|-------|---------|--------|
| **Gérer** | ⚡ | create + read + update + delete | Toutes les données |
| **Lire** | 👁️ | read | Ses propres données |
| **Modifier** | ✏️ | update | Ses propres données |
| **Supprimer** | 🗑️ | delete | Ses propres données |

---

## 🗂️ Fichiers Essentiels

```
✅ src/components/admin/ComposedPermissionsMatrix.tsx  ← Interface
✅ src/app/api/admin/permissions/composed/route.ts    ← API
✅ migrations/restructure-permissions.sql              ← Migration
✅ scripts/run-restructure-permissions.js              ← Exécution
✅ scripts/test-composed-permissions.js                ← Tests

📚 PERMISSIONS_DONE.md              ← COMMENCEZ ICI
📚 QUICK_START_PERMISSIONS.md       ← Guide détaillé
📚 PERMISSIONS_INDEX.md             ← Navigation complète
```

---

## 🔧 Commandes Utiles

```bash
# Exécuter la migration
node scripts/run-restructure-permissions.js

# Tester les permissions
node scripts/test-composed-permissions.js

# Démarrer le serveur
npm run dev

# Tester l'API
curl http://localhost:3000/api/admin/permissions/composed?role=customer
```

---

## 📋 Permissions par Défaut

```
Admin    : ⚡ sur tout
Manager  : ⚡ sur vehicles, bookings, quotes, reviews + 👁️ users
Customer : 👁️ sur bookings, quotes, reviews
Driver   : 👁️ sur bookings, vehicles
```

---

## 🎨 Interface

```
Admin Dashboard → Onglet "🔐 Permissions"

┌─────────────────────────────────────┐
│ 🎯 Matrice des Permissions          │
│ [4 Rôles | 20 Permissions | ...]   │
└─────────────────────────────────────┘

Tableau : 20 lignes (4 permissions × 5 ressources)
Cliquer sur case vide → Active (✓ vert)
Cliquer sur case cochée → Désactive (○ gris)
Admin protégé (cases grisées)
```

---

## 🧪 Test Rapide

1. Activer "⚡ Gérer bookings" pour customer
2. Se connecter en tant que customer
3. Vérifier : boutons Créer/Modifier/Supprimer visibles

---

## 🐛 Problèmes Courants

### Erreur "Cannot find module"
```bash
cd c:\Users\labs\Documents\navetteXpress
npm install
```

### Matrice ne s'affiche pas
```bash
# Vérifier migration
node scripts/test-composed-permissions.js

# Vérifier API
curl http://localhost:3000/api/admin/permissions/composed?role=customer
```

### Permissions ne se sauvegardent pas
- Vérifier : connecté en tant qu'admin
- Vérifier : console du navigateur (F12)
- Vérifier : logs du serveur

---

## 📚 Documentation Complète

| Fichier | Contenu | Temps de lecture |
|---------|---------|------------------|
| **PERMISSIONS_DONE.md** | Résumé du travail | 2 min |
| **QUICK_START_PERMISSIONS.md** | Guide en 3 étapes | 10 min |
| **PERMISSIONS_MATRIX_SUMMARY.md** | Vue d'ensemble | 15 min |
| **PERMISSIONS_COMPOSED_STRUCTURE.md** | Architecture | 20 min |
| **PERMISSIONS_INDEX.md** | Navigation | 5 min |

---

## ✅ Checklist

Installation :
- [ ] Migration exécutée
- [ ] Tests passés
- [ ] Interface visible

Vérification :
- [ ] 4 rôles affichés
- [ ] 5 ressources × 4 permissions
- [ ] Clic change l'état (✓ ↔ ○)
- [ ] Admin protégé
- [ ] Notifications fonctionnent

Fonctionnel :
- [ ] Modifier permission customer
- [ ] Tester en tant que customer
- [ ] Droits changés dans l'appli

---

## 🎉 C'est Tout !

**Système complet et fonctionnel en 2 minutes**

Pour plus de détails → [PERMISSIONS_DONE.md](./PERMISSIONS_DONE.md)

---

**Version** : 1.0.0  
**Status** : ✅ Prêt pour production  
**Date** : Aujourd'hui
