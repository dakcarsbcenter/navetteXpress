export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { vehiclesTable, users, rolePermissionsTable } from '@/schema'
import { eq, and, sql } from 'drizzle-orm'

// Vérifier si l'utilisateur a la permission de gérer les véhicules
async function hasVehiclePermission(userRole: string): Promise<boolean> {
  try {
    // Les admins ont toujours accès
    if (userRole === 'admin') {
      return true
    }

    // Vérifier les permissions dynamiques
    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource, 'vehicles'),
        eq(rolePermissionsTable.allowed, true)
      ))

    return permissions.length > 0
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions:', error)
    return false
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    
    console.log('🚗 [API Client Vehicles] Session user:', {
      email: session.user.email,
      role: userRole,
      sessionUser: session.user
    })

    if (!userRole) {
      console.error('❌ [API Client Vehicles] Aucun rôle trouvé pour l\'utilisateur')
      return NextResponse.json(
        { error: 'Rôle utilisateur non défini' },
        { status: 403 }
      )
    }

    // Vérifier si l'utilisateur a les permissions
    const hasPermission = await hasVehiclePermission(userRole)
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas les permissions nécessaires pour accéder aux véhicules' },
        { status: 403 }
      )
    }

    // Récupérer tous les véhicules avec les informations du chauffeur
    const vehicles = await db
      .select({
        id: vehiclesTable.id,
        make: vehiclesTable.make,
        model: vehiclesTable.model,
        year: vehiclesTable.year,
        plateNumber: vehiclesTable.plateNumber,
        capacity: vehiclesTable.capacity,
        vehicleType: vehiclesTable.vehicleType,
        photo: vehiclesTable.photo,
        category: vehiclesTable.category,
        description: vehiclesTable.description,
        features: vehiclesTable.features,
        isActive: vehiclesTable.isActive,
        driverId: vehiclesTable.driverId,
        driverName: users.name,
        createdAt: vehiclesTable.createdAt,
      })
      .from(vehiclesTable)
      .leftJoin(users, eq(vehiclesTable.driverId, users.id))
      .orderBy(vehiclesTable.createdAt)

    return NextResponse.json({
      success: true,
      vehicles
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des véhicules:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des véhicules' },
      { status: 500 }
    )
  }
}
