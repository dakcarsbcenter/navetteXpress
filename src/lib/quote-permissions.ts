/**
 * Permissions dynamiques sur les devis.
 *
 * Extrait de src/app/api/quotes/[id]/route.ts pour etre partage avec la route
 * de generation du PDF, qui doit appliquer exactement la meme regle.
 */

import { db } from '@/db';
import { rolePermissionsTable } from '@/schema';
import { and, eq } from 'drizzle-orm';

export type QuoteAction = 'read' | 'create' | 'update' | 'delete';

export async function hasQuotesPermission(userRole: string, action: QuoteAction): Promise<boolean> {
  try {
    // Les admins ont toujours acces.
    if (userRole === 'admin') {
      return true;
    }

    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(
        and(
          eq(rolePermissionsTable.roleName, userRole),
          eq(rolePermissionsTable.resource, 'quotes'),
          eq(rolePermissionsTable.action, action),
          eq(rolePermissionsTable.allowed, true),
        ),
      );

    // Verifier si l'utilisateur a 'manage' ou l'action specifique.
    return permissions.some((p) => p.action === 'manage' || p.action === action);
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions quotes:', error);
    return false;
  }
}
