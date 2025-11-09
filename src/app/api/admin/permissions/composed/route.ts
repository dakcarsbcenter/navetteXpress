export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { rolePermissionsTable } from '@/schema'
import { eq, and, inArray } from 'drizzle-orm'

// Définition des permissions composées
type ComposedPermission = {
  name: string
  label: string
  actions: string[]
  description: string
}

const COMPOSED_PERMISSIONS: Record<string, ComposedPermission> = {
  'manage': {
    name: 'manage',
    label: 'Gérer',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Accès complet (créer, lire, modifier, supprimer)'
  },
  'read': {
    name: 'read',
    label: 'Lire',
    actions: ['read'],
    description: 'Lecture seule'
  },
  'update': {
    name: 'update',
    label: 'Modifier',
    actions: ['update'],
    description: 'Modification uniquement'
  },
  'delete': {
    name: 'delete',
    label: 'Supprimer',
    actions: ['delete'],
    description: 'Suppression uniquement'
  }
}

// GET - Obtenir les permissions composées pour la matrice
export async function GET(request: NextRequest) {
  try {
    console.log('🔐 GET /api/admin/permissions/composed - Début de la requête')
    
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    console.log('👤 Session:', session ? `User: ${(session.user as any)?.email}, Role: ${userRole}` : 'Non authentifié')
    
    // Seuls les admins peuvent voir la matrice de permissions
    if (!session?.user || userRole !== 'admin') {
      console.log('❌ Accès refusé - Role:', userRole)
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roleName = searchParams.get('role')
    console.log('🎯 Rôle demandé:', roleName)

    if (!roleName) {
      console.log('❌ Paramètre role manquant')
      return NextResponse.json({ error: 'Rôle requis' }, { status: 400 })
    }

    // Récupérer toutes les permissions atomiques du rôle
    console.log(`🔍 Récupération des permissions pour ${roleName}...`)
    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, roleName),
        eq(rolePermissionsTable.allowed, true)
      ))

    console.log(`📊 Permissions atomiques pour ${roleName}:`, permissions.map(p => `${p.resource}.${p.action}`))

    // Grouper par ressource
    const permissionsByResource = permissions.reduce((acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = []
      }
      acc[perm.resource].push(perm.action)
      return acc
    }, {} as Record<string, string[]>)

    console.log(`📦 Groupées par ressource:`, permissionsByResource)

    // NE PAS convertir en permissions composées !
    // Le composant a besoin des actions atomiques pour calculer lui-même les permissions composées
    console.log(`✅ Permissions atomiques par ressource pour ${roleName}:`, permissionsByResource)

    return NextResponse.json({
      success: true,
      role: roleName,
      permissions: permissionsByResource  // Retourner les actions atomiques, pas composées
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des permissions:', error)
    if (error instanceof Error) {
      console.error('Message d\'erreur:', error.message)
      console.error('Stack trace:', error.stack)
    }
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des permissions' },
      { status: 500 }
    )
  }
}

// POST - Mettre à jour les permissions composées
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    
    // Seuls les admins peuvent modifier la matrice de permissions
    if (!session?.user || userRole !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { roleName, resource, composedPermission, enabled } = body

    if (!roleName || !resource || !composedPermission) {
      return NextResponse.json(
        { error: 'Données incomplètes' },
        { status: 400 }
      )
    }

    const permission = COMPOSED_PERMISSIONS[composedPermission]
    if (!permission) {
      return NextResponse.json(
        { error: 'Permission composée invalide' },
        { status: 400 }
      )
    }

    if (enabled) {
      // Activer la permission composée
      // Pour "manage", on ajoute toutes les actions
      // Pour les autres, on ajoute uniquement l'action spécifique
      
      // Récupérer les permissions existantes
      const existingPermissions = await db
        .select()
        .from(rolePermissionsTable)
        .where(and(
          eq(rolePermissionsTable.roleName, roleName),
          eq(rolePermissionsTable.resource, resource)
        ))

      // Créer un set des actions déjà activées
      const existingActions = new Set(
        existingPermissions
          .filter(p => p.allowed)
          .map(p => p.action)
      )

      // Ajouter les nouvelles actions de la permission composée
      permission.actions.forEach(action => existingActions.add(action))

      // Supprimer toutes les permissions pour cette ressource
      await db
        .delete(rolePermissionsTable)
        .where(and(
          eq(rolePermissionsTable.roleName, roleName),
          eq(rolePermissionsTable.resource, resource)
        ))

      // Réinsérer toutes les actions (les 4 au total)
      const allActions = ['create', 'read', 'update', 'delete']
      const permissionsToInsert = allActions.map(action => ({
        roleName,
        resource,
        action,
        allowed: existingActions.has(action)
      }))

      await db.insert(rolePermissionsTable).values(permissionsToInsert)

    } else {
      // Désactiver la permission composée
      // Récupérer les permissions existantes
      const existingPermissions = await db
        .select()
        .from(rolePermissionsTable)
        .where(and(
          eq(rolePermissionsTable.roleName, roleName),
          eq(rolePermissionsTable.resource, resource)
        ))

      // Créer un set des actions activées
      const activeActions = new Set(
        existingPermissions
          .filter(p => p.allowed)
          .map(p => p.action)
      )

      // Retirer les actions de la permission composée
      permission.actions.forEach(action => activeActions.delete(action))

      // Supprimer toutes les permissions pour cette ressource
      await db
        .delete(rolePermissionsTable)
        .where(and(
          eq(rolePermissionsTable.roleName, roleName),
          eq(rolePermissionsTable.resource, resource)
        ))

      // Réinsérer avec les nouvelles valeurs
      const allActions = ['create', 'read', 'update', 'delete']
      const permissionsToInsert = allActions.map(action => ({
        roleName,
        resource,
        action,
        allowed: activeActions.has(action)
      }))

      await db.insert(rolePermissionsTable).values(permissionsToInsert)
    }

    return NextResponse.json({
      success: true,
      message: `Permission ${composedPermission} ${enabled ? 'activée' : 'désactivée'} pour ${resource}`
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour des permissions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des permissions' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour plusieurs permissions à la fois
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    
    // Seuls les admins peuvent modifier la matrice de permissions
    if (!session?.user || userRole !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { roleName, permissions } = body

    if (!roleName || !permissions) {
      return NextResponse.json(
        { error: 'Données incomplètes' },
        { status: 400 }
      )
    }

    // Supprimer toutes les permissions existantes du rôle
    await db
      .delete(rolePermissionsTable)
      .where(eq(rolePermissionsTable.roleName, roleName))

    // Ajouter les nouvelles permissions
    const permissionsToInsert: any[] = []

    for (const [resource, composedPermissions] of Object.entries(permissions as Record<string, string[]>)) {
      for (const composedPermission of composedPermissions) {
        const permission = COMPOSED_PERMISSIONS[composedPermission]
        if (permission) {
          for (const action of permission.actions) {
            permissionsToInsert.push({
              roleName,
              resource,
              action,
              allowed: true,
              description: `${permission.label} ${resource}`
            })
          }
        }
      }
    }

    if (permissionsToInsert.length > 0) {
      await db.insert(rolePermissionsTable).values(permissionsToInsert)
    }

    return NextResponse.json({
      success: true,
      message: `Permissions mises à jour pour le rôle ${roleName}`,
      count: permissionsToInsert.length
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour des permissions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des permissions' },
      { status: 500 }
    )
  }
}
