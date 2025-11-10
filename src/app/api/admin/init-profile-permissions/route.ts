export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { rolePermissionsTable } from '@/schema'
import { eq, and } from 'drizzle-orm'

// POST - Initialiser les permissions de profil pour tous les rôles
export async function POST() {
  try {
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
    
    // Seuls les admins peuvent initialiser les permissions
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    console.log('🔄 Initialisation des permissions de profil...')

    const permissions = [
      // Customer permissions
      { roleName: 'customer', resource: 'profile', action: 'read', allowed: true },
      { roleName: 'customer', resource: 'profile', action: 'update', allowed: true },
      
      // Manager permissions
      { roleName: 'manager', resource: 'profile', action: 'read', allowed: true },
      { roleName: 'manager', resource: 'profile', action: 'update', allowed: true },
      
      // Driver permissions
      { roleName: 'driver', resource: 'profile', action: 'read', allowed: true },
      { roleName: 'driver', resource: 'profile', action: 'update', allowed: true },
    ]

    const results = []

    for (const perm of permissions) {
      // Vérifier si la permission existe déjà
      const existing = await db
        .select()
        .from(rolePermissionsTable)
        .where(and(
          eq(rolePermissionsTable.roleName, perm.roleName),
          eq(rolePermissionsTable.resource, perm.resource),
          eq(rolePermissionsTable.action, perm.action)
        ))
        .limit(1)

      if (existing.length === 0) {
        // Créer la permission
        await db.insert(rolePermissionsTable).values(perm)
        results.push({ status: 'created', ...perm })
        console.log(`✅ Permission créée: ${perm.roleName} - ${perm.action} ${perm.resource}`)
      } else {
        // Mettre à jour la permission
        await db
          .update(rolePermissionsTable)
          .set({ allowed: perm.allowed })
          .where(and(
            eq(rolePermissionsTable.roleName, perm.roleName),
            eq(rolePermissionsTable.resource, perm.resource),
            eq(rolePermissionsTable.action, perm.action)
          ))
        results.push({ status: 'updated', ...perm })
        console.log(`🔄 Permission mise à jour: ${perm.roleName} - ${perm.action} ${perm.resource}`)
      }
    }

    // Récupérer toutes les permissions de profil pour vérification
    const allProfilePermissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(eq(rolePermissionsTable.resource, 'profile'))

    return NextResponse.json({
      success: true,
      message: 'Permissions de profil initialisées avec succès',
      results,
      profilePermissions: allProfilePermissions
    })

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des permissions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation des permissions' },
      { status: 500 }
    )
  }
}
