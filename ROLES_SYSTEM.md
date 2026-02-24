# Système de Rôles Utilisateurs

## Vue d'ensemble

Le système utilise un système de rôles basé sur PostgreSQL avec trois rôles principaux :
- **customer** (client) - Rôle par défaut pour les nouveaux utilisateurs
- **driver** (chauffeur) - Pour les chauffeurs partenaires
- **admin** (administrateur) - Pour la gestion de la plateforme

## Configuration de la Base de Données

### Énumération des Rôles
```sql
-- Défini dans schema.ts
export const userRoleEnum = pgEnum('user_role', ['admin', 'driver', 'customer']);
```

### Table Users
```sql
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  password: text('password'),
  role: userRoleEnum('role').notNull().default('customer'), // 👈 Rôle par défaut
  phone: text('phone'),
  licenseNumber: text('license_number').unique(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});
```

## Rôle "Customer" (Client)

### Caractéristiques
- ✅ **Rôle par défaut** : Automatiquement assigné lors de l'inscription
- ✅ **Non modifiable** : Les clients ne peuvent pas changer leur rôle
- ✅ **Permissions** : Créer des réservations, voir l'historique, gérer le profil

### Processus d'Inscription

#### 1. Inscription Standard
- Page : `/auth/signup`
- Rôle : `customer` assigné automatiquement
- Validation : Email unique, mot de passe 8+ caractères

#### 2. Inscription Rapide (depuis réservation)
- Composant : `QuickSignupModal`
- Flux : Création compte → Connexion automatique → Retour à la réservation
- Préremplissage possible avec données de réservation

#### 3. API d'Inscription
```typescript
// /api/auth/register/route.ts
const newUser = await db
  .insert(users)
  .values({
    id: userId,
    name,
    email,
    password: hashedPassword,
    role: 'customer', // 👈 Toujours forcé à 'customer'
    emailVerified: new Date(),
  })
  .returning()
```

## Intégration avec NextAuth.js

### Configuration Auth
```typescript
// lib/auth.ts
return {
  id: user.id,
  email: user.email,
  name: user.name,
  image: user.image,
  role: user.role, // 👈 Inclus dans la session
}
```

### Session Utilisateur
```typescript
// Accès au rôle dans les composants
const { data: session } = useSession()
const userRole = session?.user?.role // 'customer', 'driver', ou 'admin'
```

## Flux d'Authentification depuis Réservation

### Nouveaux Utilisateurs
1. **Détection** : Utilisateur non connecté sur `/reservation`
2. **Options** : 
   - "J'ai déjà un compte" → Connexion inline
   - "Créer un compte" → Modal d'inscription
   - "Continuer sans compte" → Formulaire standard
3. **Post-création** : Connexion automatique + retour au formulaire

### Composants Impliqués
- `AuthPrompt` : Interface principale d'authentification
- `QuickSignupModal` : Modal de création de compte
- Formulaire de réservation : Intégration seamless

## Sécurité et Validation

### Contrôles d'Accès
- ✅ Rôle `customer` forcé lors de l'inscription publique
- ✅ Validation email unique
- ✅ Hashage bcrypt des mots de passe
- ✅ Session JWT sécurisée

### Contraintes Base de Données
```sql
-- Vérification pour les chauffeurs
driverLicenseCheck: check('driver_license_check', 
  sql`(${table.role} != 'driver') OR (${table.licenseNumber} IS NOT NULL)`)
```

## Permissions par Rôle

### Customer (Client)
- ✅ Créer des réservations
- ✅ Voir ses réservations
- ✅ Modifier son profil
- ❌ Accès admin/dashboard
- ❌ Gestion véhicules

### Driver (Chauffeur)
- ✅ Voir les réservations assignées
- ✅ Mettre à jour le statut des courses
- ✅ Gérer son profil et véhicule
- ❌ Accès admin complet

### Admin (Administrateur)
- ✅ Gestion complète des utilisateurs
- ✅ Gestion des réservations
- ✅ Gestion des véhicules
- ✅ Statistiques et rapports

## Utilisation

### Vérification de Rôle
```typescript
// Dans un composant
if (session?.user?.role === 'customer') {
  // Fonctionnalités client
}

// Protection de route
if (session?.user?.role !== 'admin') {
  redirect('/unauthorized')
}
```

### Middleware de Protection
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Protection des routes selon les rôles
}
```

## Migration et Données Existantes

### Utilisateurs Existants
- Rôle par défaut : `customer` si non spécifié
- Migration automatique lors de la première connexion

### Nouveaux Rôles
- Modification de l'enum dans `schema.ts`
- Migration de base de données
- Mise à jour des permissions

## Bonnes Pratiques

1. **Toujours vérifier le rôle** avant d'afficher du contenu sensible
2. **Utiliser l'enum TypeScript** pour la cohérence des types
3. **Centraliser la logique de permissions** dans des utilities
4. **Logger les changements de rôle** pour l'audit
5. **Tester tous les scénarios** de flux d'authentification

## Tests

### Scénarios à Tester
- ✅ Inscription avec rôle customer par défaut
- ✅ Impossible de modifier le rôle depuis l'interface client
- ✅ Connexion/déconnexion depuis réservation
- ✅ Persistance du rôle en session
- ✅ Protection des routes selon rôle

### Commandes de Test
```bash
# Test de l'API d'inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"testpass123"}'

# Vérification en base
SELECT id, name, email, role FROM users WHERE email = 'test@example.com';
```
