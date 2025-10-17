import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { permissionsTable, customRolesTable, rolePermissionsTable } from '@/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { permissionId, action } = body
    const { roleId } = await params
    
    // Vérifier si les nouvelles tables de rôles existent
    let useCustomRoles = false
    try {
      await db.execute(sql`SELECT 1 FROM custom_roles LIMIT 1`)
      useCustomRoles = true
    } catch (error) {
      console.log('Tables custom_roles non disponibles, utilisation du système legacy')
    }

    if (useCustomRoles) {
      return await updateCustomRolePermission(roleId, permissionId, action)
    } else {
      return await updateLegacyRolePermission(roleId, permissionId, action)
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour des permissions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des permissions' },
      { status: 500 }
    )
  }
}

// Nouvelle méthode pour le système de rôles custom
async function updateCustomRolePermission(roleId: string, permissionId: number, action: string) {
  // Trouver le rôle par ID ou nom
  let roleName: string
  
  if (isNaN(parseInt(roleId))) {
    // roleId est déjà un nom de rôle
    roleName = roleId
  } else {
    // Convertir ID numérique en nom de rôle
    const role = await db.select()
      .from(customRolesTable)
      .where(eq(customRolesTable.id, parseInt(roleId)))
      .limit(1)
    
    if (role.length === 0) {
      return NextResponse.json({ error: 'Rôle non trouvé' }, { status: 404 })
    }
    
    roleName = role[0].name
  }

  // Mapper l'ID de permission vers resource/action
  const permissionMap: { [key: string]: { resource: string, action: string } } = {
    '1': { resource: 'users', action: 'manage' },
    '2': { resource: 'users', action: 'read' },
    '3': { resource: 'vehicles', action: 'manage' },
    '4': { resource: 'vehicles', action: 'read' },
    '5': { resource: 'bookings', action: 'manage' },
    '6': { resource: 'bookings', action: 'read' },
    '7': { resource: 'quotes', action: 'manage' },
    '8': { resource: 'quotes', action: 'read' },
    '9': { resource: 'reviews', action: 'manage' },
    '10': { resource: 'reviews', action: 'read' }
  }
  
  const permissionInfo = permissionMap[permissionId.toString()]
  if (!permissionInfo) {
    return NextResponse.json({ error: 'Permission invalide' }, { status: 400 })
  }

  const { resource, action: permAction } = permissionInfo

  if (action === 'add') {
    // Vérifier si la permission existe déjà
    const existingPermission = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, roleName),
        eq(rolePermissionsTable.resource, resource),
        eq(rolePermissionsTable.action, permAction)
      ))
      .limit(1)

    if (existingPermission.length > 0) {
      // Mettre à jour la permission existante
      await db.update(rolePermissionsTable)
        .set({ 
          allowed: true
        })
        .where(and(
          eq(rolePermissionsTable.roleName, roleName),
          eq(rolePermissionsTable.resource, resource),
          eq(rolePermissionsTable.action, permAction)
        ))
    } else {
      // Créer une nouvelle permission
      await db.insert(rolePermissionsTable).values({
        roleName: roleName,
        resource: resource,
        action: permAction,
        allowed: true
      })
    }
  } else if (action === 'remove') {
    // Supprimer ou désactiver la permission
    await db.update(rolePermissionsTable)
      .set({ allowed: false })
      .where(and(
        eq(rolePermissionsTable.roleName, roleName),
        eq(rolePermissionsTable.resource, resource),
        eq(rolePermissionsTable.action, permAction)
      ))
  }
  
  return NextResponse.json({
    success: true,
    message: `Permission ${action === 'add' ? 'accordée' : 'retirée'} avec succès`
  })
}

// Ancienne méthode pour le système legacy
async function updateLegacyRolePermission(roleId: string, permissionId: number, action: string) {
  // Convertir roleId en nom de rôle
  const roleMap: { [key: string]: string } = {
    '1': 'admin',
    '2': 'driver', 
    '3': 'customer'
  }
  
  const roleName = roleMap[roleId]
  if (!roleName) {
    return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
  }

  // Mapper l'ID de permission vers resource/action
  const permissionMap: { [key: string]: { resource: string, action: string } } = {
    '1': { resource: 'users', action: 'manage' },
    '2': { resource: 'users', action: 'read' },
    '3': { resource: 'vehicles', action: 'manage' },
    '4': { resource: 'vehicles', action: 'read' },
    '5': { resource: 'bookings', action: 'manage' },
    '6': { resource: 'bookings', action: 'read' },
    '7': { resource: 'quotes', action: 'manage' },
    '8': { resource: 'quotes', action: 'read' },
    '9': { resource: 'reviews', action: 'manage' },
    '10': { resource: 'reviews', action: 'read' }
  }
  
  const permissionInfo = permissionMap[permissionId.toString()]
  if (!permissionInfo) {
    return NextResponse.json({ error: 'Permission invalide' }, { status: 400 })
  }

  const { resource, action: permAction } = permissionInfo

  if (action === 'add') {
    // Ajouter une nouvelle permission pour ce rôle
    try {
      await db.insert(permissionsTable).values({
        role: roleName as any,
        resource: resource,
        action: permAction,
        allowed: true
      })
    } catch (error: any) {
      // Si la permission existe déjà, la mettre à jour
      if (error.code === '23505') { // Violation de contrainte unique
        await db.update(permissionsTable)
          .set({ allowed: true })
          .where(and(
            eq(permissionsTable.role, roleName as any),
            eq(permissionsTable.resource, resource),
            eq(permissionsTable.action, permAction)
          ))
      } else {
        throw error
      }
    }
  } else if (action === 'remove') {
    // Supprimer ou désactiver la permission
    await db.update(permissionsTable)
      .set({ allowed: false })
      .where(and(
        eq(permissionsTable.role, roleName as any),
        eq(permissionsTable.resource, resource),
        eq(permissionsTable.action, permAction)
      ))
  }
  
  return NextResponse.json({
    success: true,
    message: `Permission ${action === 'add' ? 'accordée' : 'retirée'} avec succès`
  })
}