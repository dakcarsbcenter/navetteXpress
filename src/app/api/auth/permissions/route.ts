export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { customRolesTable, rolePermissionsTable, permissionsTable } from '@/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (!userRole) {
      return NextResponse.json({ permissions: [] })
    }

    // Vérifier si les nouvelles tables de rôles existent
    let useCustomRoles = false
    try {
      await db.execute(sql`SELECT 1 FROM custom_roles LIMIT 1`)
      useCustomRoles = true
    } catch (error) {
      console.log('Tables custom_roles non disponibles, utilisation du système legacy')
    }

    let permissions = []

    if (useCustomRoles) {
      // Utiliser le nouveau système de rôles
      permissions = await db
        .select({
          resource: rolePermissionsTable.resource,
          action: rolePermissionsTable.action,
          allowed: rolePermissionsTable.allowed
        })
        .from(rolePermissionsTable)
        .where(and(
          eq(rolePermissionsTable.roleName, userRole),
          eq(rolePermissionsTable.allowed, true)
        ))
    } else {
      // Utiliser l'ancien système
      permissions = await db
        .select({
          resource: permissionsTable.resource,
          action: permissionsTable.action,
          allowed: permissionsTable.allowed
        })
        .from(permissionsTable)
        .where(and(
          eq(permissionsTable.role, userRole),
          eq(permissionsTable.allowed, true)
        ))
    }

    // Organiser les permissions par ressource
    const permissionsByResource = permissions.reduce((acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = []
      }
      acc[perm.resource].push(perm.action)
      return acc
    }, {} as Record<string, string[]>)

    return NextResponse.json({
      success: true,
      role: userRole,
      permissions: permissionsByResource
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des permissions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des permissions' },
      { status: 500 }
    )
  }
}