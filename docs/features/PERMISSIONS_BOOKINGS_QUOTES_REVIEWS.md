# Système de Permissions pour Bookings, Quotes et Reviews

## 🎯 Objectif

Implémenter un système de permissions granulaire pour les **réservations (bookings)**, **devis (quotes)** et **avis (reviews)** permettant de différencier entre :
- **Permission `read`** : Voir uniquement ses propres données
- **Permission `manage`** : Créer, modifier, supprimer toutes les données (équivalent à `create` + `update` + `delete`)
- **Permissions spécifiques** : `create`, `update`, `delete` pour un contrôle fin

## 📊 Architecture du système

### Logique de permissions

```
┌─────────────────────────────────────────────────┐
│           Vérification des permissions          │
├─────────────────────────────────────────────────┤
│ 1. Admin → Toujours accès complet              │
│ 2. manage → create + update + delete            │
│ 3. read → Voir uniquement ses propres données  │
│ 4. Actions spécifiques → create, update, delete│
└─────────────────────────────────────────────────┘
```

### Filtrage des données selon les permissions

| Permission | Données visibles | Actions autorisées |
|-----------|------------------|-------------------|
| **read** | Ses propres données uniquement | Lecture seule |
| **manage** | Toutes les données | Create, Read, Update, Delete |
| **create** | Ses propres données | Lecture + Création |
| **update** | Ses propres données | Lecture + Modification |
| **delete** | Ses propres données | Lecture + Suppression |

## 🔧 Modifications apportées

### 1. API Routes - Bookings (`/api/bookings/route.ts`)

#### a) Fonction de vérification des permissions

```typescript
async function hasBookingsPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
  try {
    // Les admins ont toujours accès
    if (userRole === 'admin') {
      return true;
    }

    // Vérifier les permissions dynamiques
    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource, 'bookings'),
        eq(rolePermissionsTable.allowed, true)
      ));

    // Vérifier si l'utilisateur a 'manage' ou l'action spécifique
    return permissions.some(p => p.action === 'manage' || p.action === action);
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions bookings:', error);
    return false;
  }
}
```

#### b) POST - Création de réservation

```typescript
export async function POST(request: NextRequest) {
  // Vérifier la permission 'create' si l'utilisateur est connecté
  if (session?.user?.id) {
    const userRole = session.user.role || 'customer';
    const hasPermission = await hasBookingsPermission(userRole, 'create');
    
    if (!hasPermission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Vous n\'avez pas la permission de créer des réservations' 
      }, { status: 403 });
    }
  }
  // Suite de la logique de création...
}
```

#### c) GET - Récupération des réservations avec filtrage

```typescript
export async function GET(request: NextRequest) {
  const userRole = session.user.role || 'customer';
  const hasReadPermission = await hasBookingsPermission(userRole, 'read');
  
  if (!hasReadPermission) {
    return NextResponse.json({
      success: false,
      error: 'Vous n\'avez pas la permission de voir les réservations'
    }, { status: 403 });
  }

  // Si l'utilisateur a la permission 'manage', il peut voir toutes les réservations
  const hasManagePermission = await hasBookingsPermission(userRole, 'update') || 
                              await hasBookingsPermission(userRole, 'delete');

  let userBookings;

  if (hasManagePermission && userId) {
    // Permission manage: peut voir les réservations d'autres utilisateurs
    userBookings = await db.select().from(bookingsTable)
      .where(eq(bookingsTable.userId, userId))
      .orderBy(desc(bookingsTable.createdAt));
  } else if (hasManagePermission && !userId) {
    // Permission manage sans userId: voir toutes les réservations
    userBookings = await db.select().from(bookingsTable)
      .orderBy(desc(bookingsTable.createdAt));
  } else {
    // Permission read only: voir uniquement ses propres réservations
    userBookings = await db.select().from(bookingsTable)
      .where(eq(bookingsTable.userId, session.user.id))
      .orderBy(desc(bookingsTable.createdAt));
  }

  return NextResponse.json({ success: true, data: userBookings });
}
```

### 2. API Routes - Quotes (`/api/quotes/route.ts` et `/api/quotes/client/route.ts`)

#### a) Fonction de vérification des permissions

```typescript
async function hasQuotesPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
  try {
    if (userRole === 'admin') {
      return true;
    }

    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource, 'quotes'),
        eq(rolePermissionsTable.allowed, true)
      ));

    return permissions.some(p => p.action === 'manage' || p.action === action);
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions quotes:', error);
    return false;
  }
}
```

#### b) GET - Récupération des devis avec filtrage (`/api/quotes/route.ts`)

```typescript
export async function GET() {
  const userRole = session.user.role || 'customer';
  const hasReadPermission = await hasQuotesPermission(userRole, 'read');

  if (!hasReadPermission) {
    return NextResponse.json({ 
      success: false, 
      error: 'Vous n\'avez pas la permission de voir les devis' 
    }, { status: 403 });
  }

  const hasManagePermission = await hasQuotesPermission(userRole, 'update') || 
                              await hasQuotesPermission(userRole, 'delete');

  let quotes;

  if (hasManagePermission) {
    // Permission manage: voir tous les devis
    quotes = await db.select().from(quotesTable)
      .orderBy(desc(quotesTable.createdAt));
  } else {
    // Permission read only: voir uniquement ses propres devis
    const userEmail = session.user.email;
    quotes = await db.select().from(quotesTable)
      .where(eq(quotesTable.customerEmail, userEmail))
      .orderBy(desc(quotesTable.createdAt));
  }

  return NextResponse.json({ success: true, data: quotes });
}
```

#### c) GET - Récupération des devis client (`/api/quotes/client/route.ts`)

```typescript
export async function GET(request: NextRequest) {
  const userRole = (session.user as any).role || 'customer';
  const hasPermission = await hasQuotesPermission(userRole, 'read');
  
  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Vous n\'avez pas les permissions nécessaires pour accéder aux devis' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  const hasManagePermission = await hasQuotesPermission(userRole, 'update') || 
                              await hasQuotesPermission(userRole, 'delete');

  let quotes;

  if (hasManagePermission && email) {
    // Permission manage: peut voir les devis d'autres clients
    quotes = await db.select().from(quotesTable)
      .where(eq(quotesTable.customerEmail, email))
      .orderBy(desc(quotesTable.createdAt));
  } else if (hasManagePermission && !email) {
    // Permission manage sans email: voir tous les devis
    quotes = await db.select().from(quotesTable)
      .orderBy(desc(quotesTable.createdAt));
  } else {
    // Permission read only: voir uniquement ses propres devis
    const userEmail = (session.user as any).email;
    quotes = await db.select().from(quotesTable)
      .where(eq(quotesTable.customerEmail, userEmail))
      .orderBy(desc(quotesTable.createdAt));
  }

  return NextResponse.json({ success: true, data: quotes });
}
```

#### d) Routes UPDATE et DELETE (`/api/quotes/[id]/route.ts`)

```typescript
// PUT - Mettre à jour un devis
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userRole = session.user.role || 'customer';
  const hasUpdatePermission = await hasQuotesPermission(userRole, 'update');

  if (!hasUpdatePermission) {
    return NextResponse.json({ 
      success: false, 
      error: 'Vous n\'avez pas la permission de modifier ce devis' 
    }, { status: 403 });
  }
  // Suite de la logique...
}

// DELETE - Supprimer un devis
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userRole = session.user.role || 'customer';
  const hasDeletePermission = await hasQuotesPermission(userRole, 'delete');

  if (!hasDeletePermission) {
    return NextResponse.json({ 
      success: false, 
      error: 'Vous n\'avez pas la permission de supprimer ce devis' 
    }, { status: 403 });
  }
  // Suite de la logique...
}
```

### 3. API Routes - Reviews (`/api/reviews/route.ts`)

#### a) Fonction de vérification des permissions

```typescript
async function hasReviewsPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
  try {
    if (userRole === 'admin') {
      return true;
    }

    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource, 'reviews'),
        eq(rolePermissionsTable.allowed, true)
      ));

    return permissions.some(p => p.action === 'manage' || p.action === action);
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions reviews:', error);
    return false;
  }
}
```

#### b) GET - Récupération des avis avec filtrage

```typescript
export async function GET() {
  const userRole = (session.user as any).role || 'customer';
  const userId = (session.user as any).id;
  
  const hasReadPermission = await hasReviewsPermission(userRole, 'read');

  if (!hasReadPermission) {
    return NextResponse.json({ 
      error: 'Vous n\'avez pas la permission de voir les avis' 
    }, { status: 403 });
  }

  const hasManagePermission = await hasReviewsPermission(userRole, 'update') || 
                              await hasReviewsPermission(userRole, 'delete');

  let reviewsData;

  if (hasManagePermission) {
    // Permission manage: voir tous les avis
    reviewsData = await db.select({...}).from(reviewsTable)
      .orderBy(desc(reviewsTable.createdAt));
  } else {
    // Permission read only: voir uniquement ses propres avis
    reviewsData = await db.select({...}).from(reviewsTable)
      .where(eq(reviewsTable.customerId, userId))
      .orderBy(desc(reviewsTable.createdAt));
  }

  return NextResponse.json({ success: true, data: formattedReviews });
}
```

#### c) POST - Création d'avis avec permission

```typescript
export async function POST(request: NextRequest) {
  const userRole = (session.user as any).role || 'customer';
  const hasCreatePermission = await hasReviewsPermission(userRole, 'create');

  if (!hasCreatePermission) {
    return NextResponse.json({ 
      error: 'Vous n\'avez pas la permission de créer des avis' 
    }, { status: 403 });
  }
  // Suite de la logique...
}
```

#### d) Routes UPDATE et DELETE (`/api/reviews/[id]/route.ts`)

```typescript
// PUT - Mettre à jour un avis
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userRole = (session.user as any).role || 'customer';
  const hasUpdatePermission = await hasReviewsPermission(userRole, 'update');

  if (!hasUpdatePermission) {
    return NextResponse.json({ 
      error: 'Vous n\'avez pas la permission de modifier cet avis' 
    }, { status: 403 });
  }
  // Suite de la logique...
}

// DELETE - Supprimer un avis
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const userRole = (session.user as any).role || 'customer';
  const hasDeletePermission = await hasReviewsPermission(userRole, 'delete');

  if (!hasDeletePermission) {
    return NextResponse.json({ 
      error: 'Vous n\'avez pas la permission de supprimer cet avis' 
    }, { status: 403 });
  }
  // Suite de la logique...
}
```

### 4. Client Dashboard - Interface utilisateur (`/client/dashboard/page.tsx`)

#### a) Variables de permissions ajoutées

```typescript
// Permissions pour bookings
const hasBookingsManagePermission = userPermissions.bookings?.includes('manage')
const hasBookingsReadPermission = userPermissions.bookings?.includes('read')
const hasBookingsCreatePermission = userPermissions.bookings?.includes('create') || hasBookingsManagePermission
const hasBookingsUpdatePermission = userPermissions.bookings?.includes('update') || hasBookingsManagePermission
const hasBookingsDeletePermission = userPermissions.bookings?.includes('delete') || hasBookingsManagePermission

// Permissions pour quotes
const hasQuotesManagePermission = userPermissions.quotes?.includes('manage')
const hasQuotesReadPermission = userPermissions.quotes?.includes('read')
const hasQuotesCreatePermission = userPermissions.quotes?.includes('create') || hasQuotesManagePermission
const hasQuotesUpdatePermission = userPermissions.quotes?.includes('update') || hasQuotesManagePermission
const hasQuotesDeletePermission = userPermissions.quotes?.includes('delete') || hasQuotesManagePermission

// Permissions pour reviews
const hasReviewsManagePermission = userPermissions.reviews?.includes('manage')
const hasReviewsReadPermission = userPermissions.reviews?.includes('read')
const hasReviewsCreatePermission = userPermissions.reviews?.includes('create') || hasReviewsManagePermission
const hasReviewsUpdatePermission = userPermissions.reviews?.includes('update') || hasReviewsManagePermission
const hasReviewsDeletePermission = userPermissions.reviews?.includes('delete') || hasReviewsManagePermission

// Permissions pour afficher les onglets
const canManageQuotes = hasQuotesReadPermission || hasQuotesManagePermission
const canManageReviews = hasReviewsReadPermission || hasReviewsManagePermission
const canViewBookings = hasBookingsReadPermission || hasBookingsManagePermission
```

#### b) Boutons conditionnels dans l'onglet Réservations

```tsx
{/* En-tête avec boutons conditionnels */}
<div className="flex gap-2">
  {hasQuotesCreatePermission && (
    <Link href="/quote-request" className="bg-purple-600...">
      Demander un devis
    </Link>
  )}
  {hasBookingsCreatePermission && (
    <Link href="/reservation" className="bg-blue-600...">
      Nouvelle réservation
    </Link>
  )}
</div>

{/* Liste des réservations avec boutons d'action */}
{bookings.map((booking) => (
  <div key={booking.id}>
    <div className="flex items-center gap-2">
      {getStatusBadge(booking.status)}
      {hasBookingsUpdatePermission && (
        <button title="Modifier la réservation">✏️</button>
      )}
      {hasBookingsDeletePermission && (
        <button title="Supprimer la réservation">🗑️</button>
      )}
    </div>
  </div>
))}

{/* Message si aucune réservation */}
{bookings.length === 0 && hasBookingsCreatePermission && (
  <Link href="/reservation" className="...">
    Faire ma première réservation
  </Link>
)}
```

#### c) Boutons conditionnels dans l'onglet Avis à créer

```tsx
{/* Bouton pour évaluer un trajet */}
<button
  onClick={() => {
    setSelectedBookingForReview(booking)
    setIsReviewModalOpen(true)
  }}
  disabled={!hasReviewsCreatePermission}
  title={hasReviewsCreatePermission 
    ? "Évaluer ce trajet" 
    : "Vous n'avez pas la permission de créer des avis"
  }
  className="bg-blue-600..."
>
  <span>⭐</span> Évaluer
</button>

{/* Message si aucun trajet à évaluer */}
{reviewableBookings.length === 0 && hasBookingsCreatePermission && (
  <Link href="/reservation" className="...">
    Faire une nouvelle réservation
  </Link>
)}
```

#### d) Onglets dynamiques

```tsx
const tabs = [
  { id: 'overview' as TabType, label: 'Vue d\'ensemble', icon: '📊' },
  ...(canViewBookings ? [{ id: 'bookings' as TabType, label: 'Mes réservations', icon: '📅' }] : []),
  ...(canManageQuotes ? [{ id: 'quotes' as TabType, label: 'Mes devis', icon: '📋' }] : []),
  ...(canManageReviews ? [{ id: 'reviews' as TabType, label: 'Mes avis', icon: '⭐' }] : []),
  // ...autres onglets
]
```

## 📋 Récapitulatif des fichiers modifiés

### API Routes
1. ✅ `src/app/api/bookings/route.ts`
   - Ajout de `hasBookingsPermission()`
   - Vérification `create` dans POST
   - Vérification `read` dans GET avec filtrage manage/read only

2. ✅ `src/app/api/quotes/route.ts`
   - Ajout de `hasQuotesPermission()`
   - Vérification `read` dans GET avec filtrage manage/read only

3. ✅ `src/app/api/quotes/client/route.ts`
   - Ajout de `hasQuotesPermission()`
   - Vérification `read` dans GET avec filtrage manage/read only/email

4. ✅ `src/app/api/quotes/[id]/route.ts`
   - Ajout de `hasQuotesPermission()`
   - Vérification `read` dans GET
   - Vérification `update` dans PUT
   - Vérification `delete` dans DELETE

5. ✅ `src/app/api/reviews/route.ts`
   - Ajout de `hasReviewsPermission()`
   - Vérification `read` dans GET avec filtrage manage/read only
   - Vérification `create` dans POST

6. ✅ `src/app/api/reviews/[id]/route.ts`
   - Ajout de `hasReviewsPermission()`
   - Vérification `update` dans PUT
   - Vérification `delete` dans DELETE

### Interface utilisateur
7. ✅ `src/app/client/dashboard/page.tsx`
   - Ajout de variables de permissions granulaires
   - Boutons conditionnels pour créer/modifier/supprimer
   - Onglets dynamiques basés sur les permissions
   - Messages conditionnels selon les permissions

## 🧪 Scénarios de test

### Test 1: Utilisateur avec permission `read` uniquement

#### Configuration
```sql
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES 
  ('customer', 'bookings', 'read', true),
  ('customer', 'quotes', 'read', true),
  ('customer', 'reviews', 'read', true);
```

#### Comportement attendu
- ✅ Peut voir ses propres réservations
- ✅ Peut voir ses propres devis
- ✅ Peut voir ses propres avis
- ❌ Ne peut PAS créer de réservation
- ❌ Ne peut PAS créer de devis
- ❌ Ne peut PAS créer d'avis
- ❌ Ne voit PAS les boutons modifier/supprimer
- ❌ Ne voit PAS les données des autres utilisateurs

### Test 2: Utilisateur avec permission `manage`

#### Configuration
```sql
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES 
  ('manager', 'bookings', 'manage', true),
  ('manager', 'quotes', 'manage', true),
  ('manager', 'reviews', 'manage', true);
```

#### Comportement attendu
- ✅ Peut voir TOUTES les réservations
- ✅ Peut voir TOUS les devis
- ✅ Peut voir TOUS les avis
- ✅ Peut créer des réservations
- ✅ Peut créer des devis
- ✅ Peut créer des avis
- ✅ Voit les boutons modifier/supprimer
- ✅ Peut modifier/supprimer n'importe quelle donnée

### Test 3: Utilisateur avec permissions mixtes

#### Configuration
```sql
INSERT INTO role_permissions (role_name, resource, action, allowed)
VALUES 
  ('customer', 'bookings', 'read', true),
  ('customer', 'bookings', 'create', true),
  ('customer', 'quotes', 'manage', true),
  ('customer', 'reviews', 'read', true);
```

#### Comportement attendu

**Bookings:**
- ✅ Peut voir ses propres réservations (read)
- ✅ Peut créer des réservations (create)
- ❌ Ne peut PAS modifier/supprimer (pas update/delete)
- ❌ Ne voit PAS les boutons modifier/supprimer

**Quotes:**
- ✅ Peut voir TOUS les devis (manage)
- ✅ Peut créer des devis (manage)
- ✅ Peut modifier des devis (manage)
- ✅ Peut supprimer des devis (manage)
- ✅ Voit les boutons modifier/supprimer

**Reviews:**
- ✅ Peut voir ses propres avis (read)
- ❌ Ne peut PAS créer d'avis (pas create)
- ❌ Bouton "Évaluer" désactivé

### Test 4: Admin

#### Comportement attendu
- ✅ Accès complet à toutes les ressources
- ✅ Pas besoin de vérifier les permissions dynamiques
- ✅ Voit TOUTES les données de TOUS les utilisateurs
- ✅ Tous les boutons visibles et actifs

## 🎯 Matrice des permissions

| Ressource | Action | Admin | manage | read | create | update | delete |
|-----------|--------|-------|---------|------|--------|--------|--------|
| **bookings** | Voir toutes | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Voir les siennes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Créer | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| | Modifier | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| | Supprimer | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **quotes** | Voir toutes | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Voir les siennes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Créer | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| | Modifier | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| | Supprimer | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **reviews** | Voir toutes | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Voir les siennes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Créer | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| | Modifier | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| | Supprimer | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

## 🚀 Avantages du système

### 1. **Sécurité renforcée**
- ✅ Isolation des données entre utilisateurs
- ✅ Contrôle granulaire des actions
- ✅ Protection contre les accès non autorisés

### 2. **Flexibilité**
- ✅ Permissions configurables par rôle
- ✅ Support de permissions mixtes
- ✅ Évolutif pour de nouvelles ressources

### 3. **Expérience utilisateur**
- ✅ Interface adaptée aux permissions
- ✅ Boutons visibles uniquement si autorisés
- ✅ Messages clairs en cas de restriction

### 4. **Maintenabilité**
- ✅ Code centralisé dans des fonctions réutilisables
- ✅ Logique cohérente entre les ressources
- ✅ Facile à étendre

## 📝 Notes importantes

### Permission `manage` vs permissions spécifiques

La permission `manage` est un raccourci qui équivaut à avoir `create` + `update` + `delete`. 

**Exemple:**
```typescript
// Ces deux configurations sont équivalentes:

// Configuration 1: Utiliser manage
{ role: 'manager', resource: 'bookings', action: 'manage' }

// Configuration 2: Utiliser les permissions spécifiques
{ role: 'manager', resource: 'bookings', action: 'create' }
{ role: 'manager', resource: 'bookings', action: 'update' }
{ role: 'manager', resource: 'bookings', action: 'delete' }
{ role: 'manager', resource: 'bookings', action: 'read' }
```

### Filtrage des données

Le filtrage se fait au niveau de l'API, pas au niveau du client:
- **read** → Filtre par `userId` ou `email`
- **manage** → Pas de filtre, toutes les données

### Hiérarchie des permissions

```
Admin (role = 'admin')
    ↓ Accès complet sans vérification
manage (action = 'manage')
    ↓ Équivaut à create + update + delete + read toutes données
Permissions spécifiques (create, update, delete)
    ↓ Actions ciblées sur ses propres données
read (action = 'read')
    ↓ Lecture seule de ses propres données
Aucune permission
    ↓ Accès refusé (403)
```

## 🎉 Résultat final

Le système de permissions est maintenant:
- ✅ **Complet**: Couvre bookings, quotes et reviews
- ✅ **Granulaire**: Différencie read/manage et actions spécifiques
- ✅ **Sécurisé**: Filtrage côté serveur
- ✅ **Intuitif**: Interface adaptée aux permissions
- ✅ **Évolutif**: Facile d'ajouter de nouvelles ressources

Les clients peuvent maintenant avoir un accès précis aux fonctionnalités selon leurs besoins ! 🚀
