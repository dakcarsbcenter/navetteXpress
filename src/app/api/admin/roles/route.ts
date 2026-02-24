export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users, permissionsTable, customRolesTable, rolePermissionsTable } from '@/schema'
import { eq, sql, count } from 'drizzle-orm'

export async function GET() {
  try {
    console.log('👑 GET /api/admin/roles - Début de la requête')
    
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    console.log('🔐 Session:', session ? `User: ${(session.user as any)?.email}, Role: ${userRole}` : 'Non authentifié')
    
    // Seuls les admins peuvent gérer les rôles (matrice de permissions)
    if (!session?.user || userRole !== 'admin') {
      console.log('❌ Accès refusé - Role:', userRole)
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier si les nouvelles tables de rôles existent
    let useCustomRoles = false
    try {
      await db.execute(sql`SELECT 1 FROM custom_roles LIMIT 1`)
      useCustomRoles = true
      console.log('✅ Tables custom_roles disponibles')
    } catch (error) {
      console.log('⚠️ Tables custom_roles non disponibles, utilisation du système legacy')
    }

    if (useCustomRoles) {
      console.log('🔄 Utilisation du système de rôles personnalisés')
      // Utiliser le nouveau système de rôles
      return await getCustomRoles()
    } else {
      console.log('🔄 Utilisation du système de rôles legacy')
      // Utiliser l'ancien système statique
      return await getLegacyRoles()
    }

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des rôles:', error)
    if (error instanceof Error) {
      console.error('Message d\'erreur:', error.message)
      console.error('Stack trace:', error.stack)
    }
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des rôles' },
      { status: 500 }
    )
  }
}

// Nouvelle méthode utilisant les tables custom_roles
async function getCustomRoles() {
  try {
    // Compter les utilisateurs par rôle
    const userCounts = await db
      .select({
        role: users.role,
        count: count()
      })
      .from(users)
      .groupBy(users.role)

    const getUserCount = (roleName: string) => {
      const found = userCounts.find(uc => uc.role === roleName)
      return found ? found.count : 0
    }

    // Récupérer les rôles personnalisés
    const customRoles = await db.select().from(customRolesTable)
    
    // Récupérer les permissions pour chaque rôle
    const allRolePermissions = await db.select().from(rolePermissionsTable)
    
    // Définir le mapping des permissions
    const permissionMapping = [
      { id: 1, resource: 'users', action: 'manage' },
      { id: 2, resource: 'users', action: 'read' },
      { id: 3, resource: 'vehicles', action: 'manage' },
      { id: 4, resource: 'vehicles', action: 'read' },
      { id: 5, resource: 'bookings', action: 'manage' },
      { id: 6, resource: 'bookings', action: 'read' },
      { id: 7, resource: 'quotes', action: 'manage' },
      { id: 8, resource: 'quotes', action: 'read' },
      { id: 9, resource: 'reviews', action: 'manage' },
      { id: 10, resource: 'reviews', action: 'read' },
      { id: 11, resource: 'profile', action: 'read' },
      { id: 12, resource: 'profile', action: 'update' }
    ]

    const formatPermissions = (roleName: string) => {
      const rolePermissions = allRolePermissions.filter(rp => rp.roleName === roleName)
      return permissionMapping.map(pm => {
        const hasPermission = rolePermissions.some(rp => 
          rp.resource === pm.resource && rp.action === pm.action && rp.allowed
        )
        return {
          id: pm.id,
          name: `${pm.action}_${pm.resource}`,
          description: `${pm.action} ${pm.resource}`,
          resource: pm.resource,
          action: pm.action
        }
      }).filter(p => {
        const hasPermission = rolePermissions.some(rp => 
          rp.resource === p.resource && rp.action === p.action && rp.allowed
        )
        return hasPermission
      })
    }

    const roles = customRoles.map(role => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      color: role.color,
      level: role.level,
      permissions: formatPermissions(role.name),
      userCount: getUserCount(role.name),
      isSystem: role.isSystem,
      createdAt: role.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: roles,
      message: `${roles.length} rôles récupérés (système personnalisé)`
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des rôles personnalisés:', error)
    throw error
  }
}

// Ancienne méthode legacy
async function getLegacyRoles() {
  try {
    // Compter les utilisateurs par rôle
    const userCounts = await db
      .select({
        role: users.role,
        count: count()
      })
      .from(users)
      .groupBy(users.role)

    const getUserCount = (roleName: string) => {
      const found = userCounts.find(uc => uc.role === roleName)
      return found ? found.count : 0
    }

    // Récupérer toutes les permissions pour les associer aux rôles
    const allPermissions = await db.select().from(permissionsTable)
    
    // Définir le mapping des permissions avec les mêmes IDs que l'API permissions
    const permissionMapping = [
      { id: 1, resource: 'users', action: 'manage' },
      { id: 2, resource: 'users', action: 'read' },
      { id: 3, resource: 'vehicles', action: 'manage' },
      { id: 4, resource: 'vehicles', action: 'read' },
      { id: 5, resource: 'bookings', action: 'manage' },
      { id: 6, resource: 'bookings', action: 'read' },
      { id: 7, resource: 'quotes', action: 'manage' },
      { id: 8, resource: 'quotes', action: 'read' },
      { id: 9, resource: 'reviews', action: 'manage' },
      { id: 10, resource: 'reviews', action: 'read' },
      { id: 11, resource: 'profile', action: 'read' },
      { id: 12, resource: 'profile', action: 'update' }
    ]
    
    const formatPermissions = (roleName: string) => {
      return permissionMapping
        .filter(perm => {
          // Vérifier si cette permission est accordée à ce rôle dans la DB
          const dbPermission = allPermissions.find(p => 
            p.role === roleName && 
            p.resource === perm.resource && 
            p.action === perm.action && 
            p.allowed === true
          )
          return !!dbPermission
        })
        .map(perm => ({
          id: perm.id,
          name: `${perm.action} ${perm.resource}`,
          description: `Permission pour ${perm.action} sur ${perm.resource}`,
          category: perm.resource,
          resource: perm.resource,
          action: perm.action,
          isActive: true,
          createdAt: new Date().toISOString()
        }))
    }

    // Définir les rôles avec leurs permissions
    const roleDefinitions = [
      {
        id: 1,
        name: 'admin',
        displayName: 'Admin',
        description: 'Administrateur de la plateforme',
        color: '#7c3aed',
        level: 4,
        isSystem: true,
        userCount: getUserCount('admin'),
        permissions: formatPermissions('admin')
      },
      {
        id: 2,
        name: 'manager',
        displayName: 'Manager',
        description: 'Gestionnaire de la plateforme',
        color: '#f59e0b',
        level: 3,
        isSystem: true,
        userCount: getUserCount('manager'),
        permissions: formatPermissions('manager')
      },
      {
        id: 3,
        name: 'driver',
        displayName: 'Chauffeur',
        description: 'Chauffeur de la flotte',
        color: '#2563eb',
        level: 2,
        isSystem: true,
        userCount: getUserCount('driver'),
        permissions: formatPermissions('driver')
      },
      {
        id: 4,
        name: 'customer',
        displayName: 'Client',
        description: 'Client de la plateforme',
        color: '#059669',
        level: 1,
        isSystem: true,
        userCount: getUserCount('customer'),
        permissions: formatPermissions('customer')
      }
    ]

    return NextResponse.json({
      success: true,
      data: roleDefinitions
    })

  } catch (error) {
    console.error('Erreur lors du chargement des rôles:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des rôles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    
    // Seuls les admins peuvent gérer les rôles (matrice de permissions)
    if (!session?.user || userRole !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier si les nouvelles tables de rôles existent
    let useCustomRoles = false
    try {
      await db.execute(sql`SELECT 1 FROM custom_roles LIMIT 1`)
      useCustomRoles = true
    } catch (error) {
      console.log('Tables custom_roles non disponibles')
    }

    if (!useCustomRoles) {
      return NextResponse.json(
        { error: 'La création de nouveaux rôles nécessite une migration de base de données. Veuillez d\'abord exécuter la migration.' },
        { status: 501 }
      )
    }

    const body = await request.json()
    const { name, description, displayName } = body

    // Validation
    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Le nom et le nom d\'affichage sont obligatoires' },
        { status: 400 }
      )
    }

    // Vérifier si le rôle existe déjà
    const existingRole = await db.select()
      .from(customRolesTable)
      .where(eq(customRolesTable.name, name.toLowerCase().replace(/\s+/g, '_')))
      .limit(1)

    if (existingRole.length > 0) {
      return NextResponse.json(
        { error: 'Un rôle avec ce nom existe déjà' },
        { status: 409 }
      )
    }

    // Créer le nouveau rôle
    const newRole = await db.insert(customRolesTable).values({
      name: name.toLowerCase().replace(/\s+/g, '_'),
      displayName: displayName,
      description: description || '',
      color: '#6366f1', // Couleur par défaut
      level: 2, // Niveau intermédiaire par défaut
      isSystem: false
    }).returning()

    // Ajouter quelques permissions par défaut pour les nouveaux rôles
    const defaultPermissions = [
      { resource: 'users', action: 'read' },
      { resource: 'bookings', action: 'read' }
    ]

    for (const perm of defaultPermissions) {
      try {
        await db.insert(rolePermissionsTable).values({
          roleName: newRole[0].name,
          resource: perm.resource,
          action: perm.action,
          allowed: true
        })
      } catch (error) {
        // Ignorer les erreurs de doublons
        console.log('Permission déjà existante:', perm)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Rôle créé avec succès',
      data: {
        id: newRole[0].id,
        name: newRole[0].name,
        displayName: newRole[0].displayName,
        description: newRole[0].description,
        color: newRole[0].color,
        level: newRole[0].level,
        isSystem: newRole[0].isSystem,
        permissions: defaultPermissions.map((p, i) => ({
          id: i + 1,
          name: `${p.action}_${p.resource}`,
          description: `${p.action} ${p.resource}`,
          resource: p.resource,
          action: p.action
        })),
        userCount: 0,
        createdAt: newRole[0].createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Erreur lors de la création du rôle:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du rôle' },
      { status: 500 }
    )
  }
}
