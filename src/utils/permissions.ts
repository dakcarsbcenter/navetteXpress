import { db } from '@/db';
import { permissionsTable } from '@/schema';
import { eq, and } from 'drizzle-orm';

export type UserRole = 'admin' | 'chauffeur';
export type Resource = 'bookings' | 'vehicles' | 'users' | 'planning';
export type Action = 'create' | 'read' | 'update' | 'delete';

/**
 * Vérifie si un utilisateur a la permission d'effectuer une action sur une ressource
 */
export async function hasPermission(
  userRole: UserRole,
  resource: Resource,
  action: Action
): Promise<boolean> {
  try {
    const permission = await db
      .select()
      .from(permissionsTable)
      .where(
        and(
          eq(permissionsTable.role, userRole as 'admin' | 'manager' | 'driver' | 'customer'),
          eq(permissionsTable.resource, resource),
          eq(permissionsTable.action, action)
        )
      )
      .limit(1);

    return permission.length > 0 && permission[0].allowed;
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions:', error);
    return false;
  }
}

/**
 * Vérifie si un utilisateur est admin
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin';
}

/**
 * Vérifie si un utilisateur est chauffeur
 */
export function isChauffeur(userRole: UserRole): boolean {
  return userRole === 'chauffeur';
}

/**
 * Vérifie si un utilisateur peut accéder à une ressource (lecture)
 */
export async function canRead(userRole: UserRole, resource: Resource): Promise<boolean> {
  return hasPermission(userRole, resource, 'read');
}

/**
 * Vérifie si un utilisateur peut créer une ressource
 */
export async function canCreate(userRole: UserRole, resource: Resource): Promise<boolean> {
  return hasPermission(userRole, resource, 'create');
}

/**
 * Vérifie si un utilisateur peut modifier une ressource
 */
export async function canUpdate(userRole: UserRole, resource: Resource): Promise<boolean> {
  return hasPermission(userRole, resource, 'update');
}

/**
 * Vérifie si un utilisateur peut supprimer une ressource
 */
export async function canDelete(userRole: UserRole, resource: Resource): Promise<boolean> {
  return hasPermission(userRole, resource, 'delete');
}

/**
 * Vérifie si un utilisateur peut gérer les réservations
 */
export async function canManageBookings(userRole: UserRole): Promise<boolean> {
  return hasPermission(userRole, 'bookings', 'read');
}

/**
 * Vérifie si un utilisateur peut gérer les véhicules
 */
export async function canManageVehicles(userRole: UserRole): Promise<boolean> {
  return hasPermission(userRole, 'vehicles', 'read');
}

/**
 * Vérifie si un utilisateur peut gérer les utilisateurs
 */
export async function canManageUsers(userRole: UserRole): Promise<boolean> {
  return hasPermission(userRole, 'users', 'read');
}

/**
 * Vérifie si un utilisateur peut voir le planning
 */
export async function canViewPlanning(userRole: UserRole): Promise<boolean> {
  return hasPermission(userRole, 'planning', 'read');
}
