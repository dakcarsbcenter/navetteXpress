# 🎯 DÉMARRAGE RAPIDE - Matrice des Permissions Composées

## ⚡ En 3 Étapes

### Étape 1️⃣ : Exécuter la Migration (30 secondes)

```bash
cd c:\Users\labs\Documents\navetteXpress
node scripts/run-restructure-permissions.js
```

**Ce que ça fait :**
- Efface les anciennes permissions atomiques
- Crée 20 permissions par rôle (4 par ressource × 5 ressources)
- Configure les permissions par défaut pour admin, manager, customer, driver

**Résultat attendu :**
```
🔄 Lecture du fichier de migration...
📝 Exécution de la migration...
✅ Migration exécutée avec succès!

📊 Permissions créées:
  - 4 permissions par ressource (manage, read, update, delete)
  - 5 ressources (users, vehicles, bookings, quotes, reviews)
  - 4 rôles (admin, manager, customer, driver)
```

---

### Étape 2️⃣ : Tester les Permissions (30 secondes)

```bash
node scripts/test-composed-permissions.js
```

**Ce que ça vérifie :**
- Structure de la base de données
- Permissions par rôle
- Conversion atomique → composé
- Cohérence des données

**Résultat attendu :**
```
🧪 Test de la Structure des Permissions Composées

🔐 RÔLE: ADMIN
  👥 users        → ⚡ Gérer
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

✅ Test terminé avec succès!
```

---

### Étape 3️⃣ : Accéder à la Matrice (1 minute)

1. **Démarrer le serveur** (si pas déjà fait)
   ```bash
   npm run dev
   ```

2. **Se connecter en tant qu'admin**
   - URL : http://localhost:3000/auth/signin
   - Email : admin@example.com (ou votre email admin)
   - Mot de passe : votre mot de passe

3. **Accéder à la matrice**
   - Aller sur http://localhost:3000/admin/dashboard
   - Cliquer sur l'onglet **🔐 Permissions**

4. **Vous devriez voir :**
   ```
   ┌─────────────────────────────────────────┐
   │ 🎯 Matrice des Permissions             │
   │ Contrôlez l'accès et les droits        │
   └─────────────────────────────────────────┘
   
   [Stats: 4 Rôles | 20 Permissions | X Utilisateurs | 5 Ressources]
   
   [Tableau avec 20 lignes : 4 permissions × 5 ressources]
   ```

---

## 🧪 Test Complet (5 minutes)

### Test A : Modifier les Permissions de "customer"

1. **Dans la matrice, pour le rôle "customer" :**
   - Activer "⚡ Gérer bookings" (cliquer sur la case vide)
   - Vous devriez voir : ✓ vert avec animation

2. **Vérification en base de données :**
   ```bash
   node scripts/test-composed-permissions.js
   ```
   
   Résultat : customer devrait avoir "⚡ Gérer" sur bookings

3. **Test dans l'application :**
   - Se déconnecter
   - Se connecter en tant que customer
   - Aller sur http://localhost:3000/client/dashboard
   - Vérifier : boutons "Nouvelle réservation", "Modifier", "Supprimer" visibles

### Test B : Permissions en Lecture Seule

1. **Dans la matrice, pour "customer" :**
   - Désactiver "⚡ Gérer bookings" (cliquer sur ✓)
   - Activer uniquement "👁️ Lire bookings"

2. **Test dans l'application :**
   - Rafraîchir le dashboard customer
   - Vérifier : seules les réservations sont affichées, pas de boutons d'édition

### Test C : Protection Admin

1. **Dans la matrice :**
   - Essayer de cliquer sur une case du rôle "admin"
   - Vérifier : cases grisées, non cliquables, avec message "Admin a toujours toutes les permissions"

---

## 📊 Comprendre la Matrice

### Légende des Icônes

```
⚡ Gérer     → Tous les droits (create, read, update, delete)
               + Voir les données de TOUS les utilisateurs

👁️ Lire      → Lecture seule (read)
               + Voir uniquement SES PROPRES données

✏️ Modifier   → Modification uniquement (update)
               + Modifier uniquement SES PROPRES données

🗑️ Supprimer  → Suppression uniquement (delete)
               + Supprimer uniquement SES PROPRES données
```

### Les 5 Ressources

```
👥 Utilisateurs (users)
🚗 Véhicules (vehicles)
📅 Réservations (bookings)
📋 Devis (quotes)
⭐ Avis (reviews)
```

### Configuration Typique

| Rôle | Description | Permissions Typiques |
|------|-------------|---------------------|
| **Admin** | Tous les droits | ⚡ sur tout |
| **Manager** | Gestion opérationnelle | ⚡ sur vehicles, bookings, quotes, reviews + 👁️ users |
| **Customer** | Client final | 👁️ sur bookings, quotes, reviews |
| **Driver** | Chauffeur | 👁️ sur bookings, vehicles |

---

## 🔧 Personnalisation

### Cas d'usage 1 : Customer peut créer des réservations

```
1. Dans la matrice, pour "customer" + "bookings"
2. Activer "⚡ Gérer" (coche toutes les actions)
   OU
   Activer individuellement :
   - "👁️ Lire" (voir ses réservations)
   - "✏️ Modifier" (modifier ses réservations)
   - "🗑️ Supprimer" (supprimer ses réservations)
   + créer manuellement l'action 'create' si nécessaire
```

### Cas d'usage 2 : Driver peut voir toutes les réservations

```
1. Dans la matrice, pour "driver" + "bookings"
2. Activer "⚡ Gérer"
   (permet de voir toutes les réservations)
```

### Cas d'usage 3 : Manager ne peut que lire les utilisateurs

```
1. Dans la matrice, pour "manager" + "users"
2. Désactiver "⚡ Gérer"
3. Activer uniquement "👁️ Lire"
```

---

## 🐛 Dépannage

### Problème : Migration échoue

**Erreur :** `Cannot find module '../src/lib/db'`

**Solution :**
```bash
# Vérifier que vous êtes dans le bon dossier
cd c:\Users\labs\Documents\navetteXpress

# Vérifier que node_modules existe
npm install

# Réessayer
node scripts/run-restructure-permissions.js
```

### Problème : API retourne 401

**Erreur :** `Non autorisé` dans la console du navigateur

**Solution :**
1. Vérifier que vous êtes connecté en tant qu'admin
2. Vérifier dans la console : `session.user.role === 'admin'`
3. Se déconnecter et se reconnecter

### Problème : Matrice ne s'affiche pas

**Symptômes :** Page blanche ou erreur

**Solution :**
1. Ouvrir la console du navigateur (F12)
2. Vérifier les erreurs
3. Vérifier que la migration a été exécutée
4. Tester l'API directement :
   ```bash
   curl http://localhost:3000/api/admin/permissions/composed?role=customer
   ```

### Problème : Permissions ne se sauvegardent pas

**Symptômes :** Clic sur une case, mais rien ne se passe

**Solution :**
1. Vérifier la console du navigateur
2. Vérifier les logs du serveur
3. Tester avec curl :
   ```bash
   curl -X POST http://localhost:3000/api/admin/permissions/composed \
     -H "Content-Type: application/json" \
     -d '{"roleName":"customer","resource":"bookings","composedPermission":"manage","enabled":true}'
   ```

---

## 📞 Support

### Commandes Utiles

```bash
# Voir les permissions en base de données
node scripts/test-composed-permissions.js

# Réexécuter la migration (⚠️ efface tout)
node scripts/run-restructure-permissions.js

# Voir les logs du serveur
# (ils s'affichent dans le terminal où vous avez lancé npm run dev)

# Tester l'API
curl http://localhost:3000/api/admin/permissions/composed?role=customer
```

### Fichiers Importants

```
📁 Composant principal
  → src/components/admin/ComposedPermissionsMatrix.tsx

📁 API
  → src/app/api/admin/permissions/composed/route.ts

📁 Migration
  → migrations/restructure-permissions.sql
  → scripts/run-restructure-permissions.js

📁 Documentation
  → PERMISSIONS_COMPOSED_STRUCTURE.md          (architecture)
  → COMPOSED_PERMISSIONS_IMPLEMENTATION_GUIDE.md (guide complet)
  → PERMISSIONS_MATRIX_SUMMARY.md              (résumé)
  → QUICK_START_PERMISSIONS.md                 (ce fichier)
```

---

## ✅ Checklist

Avant de considérer que tout fonctionne :

- [ ] Migration exécutée sans erreur
- [ ] Test des permissions affiche les bonnes données
- [ ] Matrice s'affiche dans l'admin dashboard
- [ ] Clic sur une case change son état (vide ↔ ✓)
- [ ] Notification de succès s'affiche
- [ ] Permissions se reflètent dans l'application client
- [ ] Rôle admin est protégé (cases grisées)
- [ ] API répond correctement (testée avec curl)

---

## 🎉 C'est Fait !

Si toutes les étapes ci-dessus fonctionnent, vous avez maintenant :

✅ Un système de permissions moderne et intuitif
✅ Une interface visuelle claire
✅ Une gestion simplifiée des droits
✅ Une base solide pour évolutions futures

**Enjoy!** 🚀

---

**Créé le :** Aujourd'hui  
**Version :** 1.0.0  
**Prêt pour :** Production ✅
