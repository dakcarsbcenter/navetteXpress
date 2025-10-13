import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users, permissionsTable } from '@/schema'
import { eq, sql, count } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Pour l'instant, créons des rôles statiques basés sur le schéma existant
    // Plus tard, on pourra migrer vers un vrai système de rôles
    
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
      { id: 10, resource: 'reviews', action: 'read' }
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
        description: 'Administrateur de la plateforme',
        color: '#7c3aed',
        level: 4,
        isSystem: true,
        userCount: getUserCount('admin'),
        permissions: formatPermissions('admin')
      },
      {
        id: 2,
        name: 'driver',
        description: 'Chauffeur de la flotte',
        color: '#2563eb',
        level: 2,
        isSystem: true,
        userCount: getUserCount('driver'),
        permissions: formatPermissions('driver')
      },
      {
        id: 3,
        name: 'customer',
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
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Pour l'instant, la création de nouveaux rôles n'est pas supportée
    // car le système utilise un enum statique
    return NextResponse.json(
      { error: 'La création de nouveaux rôles n\'est pas encore supportée' },
      { status: 501 }
    )

  } catch (error) {
    console.error('Erreur lors de la création du rôle:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du rôle' },
      { status: 500 }
    )
  }
}