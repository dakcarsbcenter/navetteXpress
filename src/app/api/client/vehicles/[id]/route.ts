export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { vehiclesTable, rolePermissionsTable } from '@/schema'
import { eq, and } from 'drizzle-orm'

// Vérifier si l'utilisateur a la permission de modifier/supprimer les véhicules
async function hasVehiclePermission(userRole: string, action: 'update' | 'delete'): Promise<boolean> {
  try {
    // Les admins ont toujours accès
    if (userRole === 'admin') {
      return true
    }

    // Vérifier les permissions dynamiques
    // 'manage' donne tous les droits
    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource, 'vehicles'),
        eq(rolePermissionsTable.action, action),
        eq(rolePermissionsTable.allowed, true)
      ))

    // Vérifier si l'utilisateur a 'manage' ou l'action spécifique
    return permissions.some(p => p.action === 'manage' || p.action === action)
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions vehicles:', error)
    return false
  }
}

// PATCH - Mettre à jour partiellement un véhicule (ex: changer le statut)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userRole = (session.user as any).role

    console.log('🔧 [PATCH Vehicle] User:', session.user.email, 'Role:', userRole)

    if (!userRole) {
      return NextResponse.json(
        { error: 'Rôle utilisateur non défini' },
        { status: 403 }
      )
    }

    // Vérifier la permission de mise à jour
    const hasPermission = await hasVehiclePermission(userRole, 'update')
    if (!hasPermission) {
      console.log('❌ [PATCH Vehicle] Permission refusée pour:', userRole)
      return NextResponse.json(
        { error: 'Vous n\'avez pas la permission de modifier les véhicules' },
        { status: 403 }
      )
    }

    const vehicleId = parseInt((await params).id)
    if (isNaN(vehicleId)) {
      return NextResponse.json(
        { error: 'ID de véhicule invalide' },
        { status: 400 }
      )
    }

    const data = await request.json()

    // Mise à jour partielle
    const updatedVehicle = await db
      .update(vehiclesTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(vehiclesTable.id, vehicleId))
      .returning()

    if (updatedVehicle.length === 0) {
      return NextResponse.json(
        { error: 'Véhicule non trouvé' },
        { status: 404 }
      )
    }

    console.log('✅ [PATCH Vehicle] Véhicule mis à jour:', vehicleId)

    return NextResponse.json({ 
      success: true, 
      vehicle: updatedVehicle[0] 
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour du véhicule:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour complètement un véhicule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userRole = (session.user as any).role

    console.log('🔧 [PUT Vehicle] User:', session.user.email, 'Role:', userRole)

    if (!userRole) {
      return NextResponse.json(
        { error: 'Rôle utilisateur non défini' },
        { status: 403 }
      )
    }

    // Vérifier la permission de mise à jour
    const hasPermission = await hasVehiclePermission(userRole, 'update')
    if (!hasPermission) {
      console.log('❌ [PUT Vehicle] Permission refusée pour:', userRole)
      return NextResponse.json(
        { error: 'Vous n\'avez pas la permission de modifier les véhicules' },
        { status: 403 }
      )
    }

    const vehicleId = parseInt((await params).id)
    if (isNaN(vehicleId)) {
      return NextResponse.json(
        { error: 'ID de véhicule invalide' },
        { status: 400 }
      )
    }

    const data = await request.json()
    const { 
      make, 
      model, 
      year, 
      plateNumber, 
      capacity, 
      photo,
      category,
      description,
      features,
      vehicleType,
      driverId,
      isActive 
    } = data

    if (!make || !model || !plateNumber) {
      return NextResponse.json(
        { error: 'Marque, modèle et plaque d\'immatriculation requis' },
        { status: 400 }
      )
    }

    const updatedVehicle = await db
      .update(vehiclesTable)
      .set({
        make,
        model,
        year: year || new Date().getFullYear(),
        plateNumber,
        capacity: capacity || 4,
        vehicleType: vehicleType || 'sedan',
        photo: photo || null,
        category: category || null,
        description: description || null,
        features: features || null,
        driverId: driverId || null,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      })
      .where(eq(vehiclesTable.id, vehicleId))
      .returning()

    if (updatedVehicle.length === 0) {
      return NextResponse.json(
        { error: 'Véhicule non trouvé' },
        { status: 404 }
      )
    }

    console.log('✅ [PUT Vehicle] Véhicule mis à jour:', vehicleId)

    return NextResponse.json({ 
      success: true, 
      vehicle: updatedVehicle[0] 
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour du véhicule:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un véhicule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userRole = (session.user as any).role

    console.log('🗑️ [DELETE Vehicle] User:', session.user.email, 'Role:', userRole)

    if (!userRole) {
      return NextResponse.json(
        { error: 'Rôle utilisateur non défini' },
        { status: 403 }
      )
    }

    // Vérifier la permission de suppression
    const hasPermission = await hasVehiclePermission(userRole, 'delete')
    if (!hasPermission) {
      console.log('❌ [DELETE Vehicle] Permission refusée pour:', userRole)
      return NextResponse.json(
        { error: 'Vous n\'avez pas la permission de supprimer les véhicules' },
        { status: 403 }
      )
    }

    const vehicleId = parseInt((await params).id)
    if (isNaN(vehicleId)) {
      return NextResponse.json(
        { error: 'ID de véhicule invalide' },
        { status: 400 }
      )
    }

    const deletedVehicle = await db
      .delete(vehiclesTable)
      .where(eq(vehiclesTable.id, vehicleId))
      .returning()

    if (deletedVehicle.length === 0) {
      return NextResponse.json(
        { error: 'Véhicule non trouvé' },
        { status: 404 }
      )
    }

    console.log('✅ [DELETE Vehicle] Véhicule supprimé:', vehicleId)

    return NextResponse.json({ 
      success: true,
      message: 'Véhicule supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la suppression du véhicule:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
