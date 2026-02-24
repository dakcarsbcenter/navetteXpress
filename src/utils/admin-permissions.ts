import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { users, rolePermissionsTable } from '@/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Vérifie si l'utilisateur actuel a le rôle admin
 */
export async function checkAdminRole(userId?: string): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = userId || session?.user?.id;
    if (!currentUserId) return false;

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1);

    return user.length > 0 && user[0].role === 'admin';
  } catch (error) {
    console.error('Erreur lors de la vérification du rôle admin:', error);
    return false;
  }
}

/**
 * Vérifie si l'utilisateur a une permission spécifique sur une ressource
 */
export async function hasResourcePermission(
  userId: string,
  resource: string,
  action: 'read' | 'create' | 'update' | 'delete'
): Promise<boolean> {
  try {
    // Récupérer l'utilisateur
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) return false;

    const userRole = user[0].role;

    // Les admins ont toujours accès
    if (userRole === 'admin') return true;

    // Vérifier les permissions dynamiques pour l'action spécifique
    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource, resource),
        eq(rolePermissionsTable.action, action),
        eq(rolePermissionsTable.allowed, true)
      ));

    // Retourner true si la permission existe
    return permissions.length > 0;
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions:', error);
    return false;
  }
}

/**
 * Middleware pour protéger les routes admin (admin uniquement)
 */
export async function requireAdminRole(): Promise<string> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    console.error('Aucune session utilisateur trouvée');
    throw new Error('Unauthorized: No session found');
  }

  const isAdmin = await checkAdminRole(session.user.id);
  if (!isAdmin) {
    console.error('Utilisateur non autorisé - rôle admin requis');
    throw new Error('Forbidden: Admin role required');
  }

  return session.user.id;
}

/**
 * Middleware pour protéger les routes avec permissions dynamiques
 * Les admins ont toujours accès, les autres doivent avoir la permission
 */
export async function requireResourcePermission(
  resource: string,
  action: 'read' | 'create' | 'update' | 'delete'
): Promise<string> {
  const session = await getServerSession(authOptions);
  
  console.log('🔍 [Permissions] Vérification session:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    hasId: !!session?.user?.id,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    resource,
    action
  });
  
  if (!session?.user?.id) {
    console.error('❌ [Permissions] Aucune session utilisateur trouvée');
    throw new Error('Unauthorized: No session found');
  }

  const hasPermission = await hasResourcePermission(session.user.id, resource, action);
  if (!hasPermission) {
    console.error(`❌ [Permissions] Utilisateur non autorisé - permission '${action}' sur '${resource}' requise`);
    throw new Error(`Forbidden: Permission '${action}' on '${resource}' required`);
  }

  console.log(`✅ [Permissions] Accès autorisé pour ${session.user.email} - ${resource}.${action}`);
  return session.user.id;
}

/**
 * Récupère le rôle d'un utilisateur
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user.length > 0 ? user[0].role : null;
  } catch (error) {
    console.error('Erreur lors de la récupération du rôle utilisateur:', error);
    return null;
  }
}

/**
 * Assigne un rôle à un utilisateur
 */
export async function assignUserRole(userId: string, role: 'driver' | 'admin'): Promise<void> {
  try {
    // Mettre à jour le rôle de l'utilisateur
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error('Erreur lors de l\'assignation du rôle:', error);
    throw error;
  }
}

/**
 * Helpers spécifiques pour chaque ressource
 */
export const requireVehiclesRead = () => requireResourcePermission('vehicles', 'read');
export const requireVehiclesCreate = () => requireResourcePermission('vehicles', 'create');
export const requireVehiclesUpdate = () => requireResourcePermission('vehicles', 'update');
export const requireVehiclesDelete = () => requireResourcePermission('vehicles', 'delete');

export const requireBookingsRead = () => requireResourcePermission('bookings', 'read');
export const requireBookingsCreate = () => requireResourcePermission('bookings', 'create');
export const requireBookingsUpdate = () => requireResourcePermission('bookings', 'update');
export const requireBookingsDelete = () => requireResourcePermission('bookings', 'delete');

export const requireQuotesRead = () => requireResourcePermission('quotes', 'read');
export const requireQuotesCreate = () => requireResourcePermission('quotes', 'create');
export const requireQuotesUpdate = () => requireResourcePermission('quotes', 'update');
export const requireQuotesDelete = () => requireResourcePermission('quotes', 'delete');

export const requireReviewsRead = () => requireResourcePermission('reviews', 'read');
export const requireReviewsCreate = () => requireResourcePermission('reviews', 'create');
export const requireReviewsUpdate = () => requireResourcePermission('reviews', 'update');
export const requireReviewsDelete = () => requireResourcePermission('reviews', 'delete');

export const requireUsersRead = () => requireResourcePermission('users', 'read');
export const requireUsersCreate = () => requireResourcePermission('users', 'create');
export const requireUsersUpdate = () => requireResourcePermission('users', 'update');
export const requireUsersDelete = () => requireResourcePermission('users', 'delete');

export const requireProfileRead = () => requireResourcePermission('profile', 'read');
export const requireProfileUpdate = () => requireResourcePermission('profile', 'update');

