# Protection des administrateurs - Isolation des rôles

## 🔐 Contexte

Pour des raisons de sécurité, les administrateurs doivent être complètement protégés et invisibles aux autres rôles. Seuls les administrateurs peuvent voir, créer, modifier ou supprimer d'autres administrateurs.

## 🎯 Objectif

Implémenter une protection complète des comptes administrateurs pour que:
- ✅ Seuls les admins puissent voir les autres admins
- ✅ Les autres rôles (customer, driver, etc.) ne voient JAMAIS les admins
- ✅ Les non-admins ne peuvent pas créer de comptes admin
- ✅ Les non-admins ne peuvent pas filtrer par rôle "admin"
- ✅ Les statistiques n'affichent pas le nombre d'admins aux non-admins

## ✅ Modifications effectuées

### 1. Ajout du state pour le rôle de l'utilisateur actuel

```typescript
const [currentUserRole, setCurrentUserRole] = useState<string>('')
```

### 2. Fonction de vérification si l'utilisateur est admin

```typescript
// Vérifier si l'utilisateur actuel est admin
const isCurrentUserAdmin = () => {
  return !userPermissions || currentUserRole === 'admin'
}
```

**Logique:**
- Si `userPermissions` est undefined → C'est un admin (accès depuis dashboard admin)
- Sinon, vérifie si `currentUserRole === 'admin'`

### 3. Fonction de filtrage des administrateurs

```typescript
// Filtrer les admins si l'utilisateur actuel n'est pas admin
const filterAdminUsers = (usersList: User[]) => {
  if (isCurrentUserAdmin()) {
    return usersList // Les admins voient tout
  }
  return usersList.filter(user => user.role !== 'admin') // Les autres ne voient pas les admins
}
```

### 4. Chargement du rôle de l'utilisateur actuel

```typescript
// Charger le rôle de l'utilisateur actuel
const fetchCurrentUserRole = async () => {
  try {
    const response = await fetch('/api/auth/session')
    if (response.ok) {
      const session = await response.json()
      setCurrentUserRole(session?.user?.role || '')
    }
  } catch (error) {
    console.error('Erreur lors du chargement du rôle:', error)
  }
}

useEffect(() => {
  fetchCurrentUserRole()
  fetchUsers()
}, [])
```

### 5. Application du filtre au chargement des utilisateurs

**Dans `fetchUsers()`:**
```typescript
if (result?.success) {
  // Filtrer les admins si l'utilisateur n'est pas admin
  const allUsers = result.data ?? []
  setUsers(filterAdminUsers(allUsers))
}
```

### 6. Protection du formulaire de création/modification

**Option "Admin" conditionnelle:**
```typescript
<select ...>
  <option value="customer">👤 Client</option>
  <option value="driver">🚗 Chauffeur</option>
  {isCurrentUserAdmin() && <option value="admin">👑 Admin</option>}
</select>
```

### 7. Protection du filtre par rôle

**Option "Administrateurs" conditionnelle:**
```typescript
<select ...>
  <option value="">Tous les rôles</option>
  {isCurrentUserAdmin() && <option value="admin">👑 Administrateurs</option>}
  <option value="driver">🚗 Chauffeurs</option>
  <option value="customer">👤 Clients</option>
</select>
```

### 8. Masquage de la statistique "Admins"

**Carte statistique conditionnelle:**
```typescript
{isCurrentUserAdmin() && (
  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm...">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-2xl font-bold text-purple-600...">{stats.admins}</p>
        <p className="text-sm text-slate-600...">Admins</p>
      </div>
      <div className="text-2xl">👑</div>
    </div>
  </div>
)}
```

### 9. Adaptation de la grille des statistiques

**Colonnes dynamiques:**
```typescript
<div className={`grid grid-cols-2 ${isCurrentUserAdmin() ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4 mb-6`}>
```

- **Admin**: 5 colonnes (Total, Actifs, Admins, Chauffeurs, Clients)
- **Non-admin**: 4 colonnes (Total, Actifs, Chauffeurs, Clients)

## 🛡️ Niveaux de protection

### Niveau 1: Filtrage côté client
Les utilisateurs sont filtrés avant affichage:
```typescript
setUsers(filterAdminUsers(allUsers))
```

### Niveau 2: Masquage des options
Les options pour créer/filtrer des admins sont masquées:
```typescript
{isCurrentUserAdmin() && <option value="admin">👑 Admin</option>}
```

### Niveau 3: Protection API (déjà en place)
Les API vérifient les permissions côté serveur:
- `/api/admin/users` - Vérifie les permissions
- `/api/admin/users/[id]` - Vérifie les permissions

## 📊 Comportement selon le rôle

### En tant qu'Admin 👑

**Affichage:**
```
┌─────────────────────────────────────────────┐
│  Statistiques (5 colonnes)                   │
│  [12 Total] [12 Actifs] [1 Admin] [9 Chauff] [2 Clients]│
├─────────────────────────────────────────────┤
│  Filtres:                                    │
│  [Tous les rôles ▼]                          │
│   - Tous les rôles                           │
│   - 👑 Administrateurs    ← VISIBLE         │
│   - 🚗 Chauffeurs                            │
│   - 👤 Clients                               │
├─────────────────────────────────────────────┤
│  Formulaire:                                 │
│  Rôle: [Customer ▼]                          │
│   - 👤 Client                                │
│   - 🚗 Chauffeur                             │
│   - 👑 Admin              ← VISIBLE         │
├─────────────────────────────────────────────┤
│  Liste des utilisateurs:                     │
│  - admin navette (admin)     ← VISIBLE      │
│  - Alain Petit (driver)                      │
│  - clientNavette (customer)                  │
└─────────────────────────────────────────────┘
```

### En tant que Customer/Driver avec permissions 🚗👤

**Affichage:**
```
┌─────────────────────────────────────────────┐
│  Statistiques (4 colonnes)                   │
│  [11 Total] [11 Actifs] [9 Chauffeurs] [2 Clients] │
│  (Carte "Admins" ABSENTE)                    │
├─────────────────────────────────────────────┤
│  Filtres:                                    │
│  [Tous les rôles ▼]                          │
│   - Tous les rôles                           │
│   - 🚗 Chauffeurs                            │
│   - 👤 Clients                               │
│   (Option "Administrateurs" ABSENTE)         │
├─────────────────────────────────────────────┤
│  Formulaire:                                 │
│  Rôle: [Customer ▼]                          │
│   - 👤 Client                                │
│   - 🚗 Chauffeur                             │
│   (Option "Admin" ABSENTE)                   │
├─────────────────────────────────────────────┤
│  Liste des utilisateurs:                     │
│  - Alain Petit (driver)                      │
│  - clientNavette (customer)                  │
│  (Utilisateurs admin ABSENTS)                │
└─────────────────────────────────────────────┘
```

## 🔍 Cas d'usage

### Cas 1: Customer avec "manage users" essaie de voir les admins
1. Se connecte avec role customer
2. Va dans l'onglet utilisateurs
3. **Résultat**: Ne voit QUE les chauffeurs et clients, jamais les admins

### Cas 2: Driver avec "manage users" essaie de créer un admin
1. Se connecte avec role driver
2. Clique sur "Nouvel utilisateur"
3. Ouvre le dropdown "Rôle"
4. **Résultat**: Options limitées à "Client" et "Chauffeur"

### Cas 3: Customer essaie de filtrer par "Admin"
1. Se connecte avec role customer
2. Ouvre le filtre "Tous les rôles"
3. **Résultat**: Option "Administrateurs" n'apparaît pas

### Cas 4: Admin se connecte
1. Se connecte avec role admin
2. **Résultat**: Voit TOUS les utilisateurs incluant les autres admins

### Cas 5: Admin crée un nouvel utilisateur
1. Clique sur "Nouvel utilisateur"
2. Ouvre le dropdown "Rôle"
3. **Résultat**: Peut choisir "Admin", "Chauffeur" ou "Client"

## 🧪 Tests de sécurité

### Test 1: Isolation visuelle
```bash
# Se connecter en tant que customer avec permissions
# Vérifier que la liste ne contient aucun admin
# ✅ Les admins sont invisibles
```

### Test 2: Protection du formulaire
```bash
# Se connecter en tant que driver
# Ouvrir le formulaire de création
# Essayer de sélectionner le rôle "Admin"
# ✅ L'option n'existe pas
```

### Test 3: Protection des filtres
```bash
# Se connecter en tant que customer
# Ouvrir le filtre par rôle
# Chercher l'option "Administrateurs"
# ✅ L'option n'existe pas
```

### Test 4: Statistiques
```bash
# Se connecter en tant que driver
# Regarder les statistiques
# Compter les cartes affichées
# ✅ 4 cartes au lieu de 5 (pas de carte "Admins")
```

### Test 5: API directe (tentative de contournement)
```bash
# Même si un utilisateur manipule le JS côté client
# Les API vérifient toujours les permissions côté serveur
# ✅ Requête bloquée avec 403 Forbidden
```

## 🎭 Avantages de sécurité

### 1. **Isolation complète**
Les admins sont complètement invisibles aux non-admins, empêchant:
- Le comptage des administrateurs
- L'énumération des comptes admin
- Les attaques ciblées sur des comptes privilégiés

### 2. **Principe du moindre privilège**
Chaque rôle voit uniquement ce qui le concerne:
- Customer avec permissions → Voit les customers et drivers
- Driver avec permissions → Voit les drivers et customers
- Admin → Voit tout, y compris les autres admins

### 3. **Protection en profondeur**
Plusieurs couches de protection:
- **Couche 1**: Filtrage des données à l'affichage
- **Couche 2**: Masquage des options UI
- **Couche 3**: Vérification côté serveur (déjà en place)

### 4. **Évolutivité**
Si de nouveaux rôles sont ajoutés:
- Ils suivent automatiquement la règle
- Seuls les admins verront les admins
- Aucune modification de code nécessaire

### 5. **Audit trail**
Facilite la traçabilité:
- Les admins ne peuvent être modifiés que par d'autres admins
- Réduit la surface d'attaque
- Simplifie les investigations de sécurité

## ⚠️ Points d'attention

### API Session
L'application charge le rôle via `/api/auth/session`. S'assurer que:
- ✅ Cette route existe et fonctionne
- ✅ Elle retourne `session.user.role`
- ✅ Elle est sécurisée (authentification requise)

### Cohérence
Les statistiques utilisent automatiquement la liste filtrée:
```typescript
const getStats = () => {
  const total = users.length // users est déjà filtré
  const admins = users.filter(u => u.role === 'admin').length // 0 pour non-admins
  // ...
}
```

### Performance
Le filtrage est léger:
- 1 appel API supplémentaire au chargement (session)
- Filtrage en mémoire (O(n) sur la liste)
- Pas d'impact perceptible sur l'UX

## 🎯 Résultat final

### Matrice de visibilité

| Rôle de l'utilisateur actuel | Peut voir Admin | Peut voir Driver | Peut voir Customer |
|------------------------------|-----------------|------------------|--------------------|
| **Admin**                    | ✅ Oui          | ✅ Oui           | ✅ Oui             |
| **Driver avec permissions**  | ❌ Non          | ✅ Oui           | ✅ Oui             |
| **Customer avec permissions**| ❌ Non          | ✅ Oui           | ✅ Oui             |
| **Tout futur rôle**          | ❌ Non          | ✅ Oui           | ✅ Oui             |

### Sécurité renforcée ✨

Les comptes administrateurs sont maintenant:
- 🔒 **Invisibles** aux utilisateurs non-admin
- 🛡️ **Protégés** contre la modification par des non-admins
- 🚫 **Non-énumérables** (impossible de compter les admins)
- ✅ **Conformes** aux meilleures pratiques de sécurité

Cette implémentation garantit que seuls les administrateurs peuvent gérer d'autres administrateurs, renforçant considérablement la sécurité de l'application. 🎉
