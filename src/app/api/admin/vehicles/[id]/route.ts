import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { vehiclesTable } from "@/schema"
import { eq } from "drizzle-orm"
import { requireVehiclesUpdate, requireVehiclesDelete } from "@/utils/admin-permissions"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireVehiclesUpdate()

    const vehicleId = parseInt((await params).id)
    if (isNaN(vehicleId)) {
      return NextResponse.json(
        { success: false, error: "ID de véhicule invalide" },
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
        { success: false, error: "Marque, modèle et plaque d'immatriculation requis" },
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
        { success: false, error: "Véhicule non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: updatedVehicle[0] })
  } catch (error) {
    console.error("Erreur lors de la mise à jour du véhicule:", error)
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireVehiclesDelete()

    const vehicleId = parseInt((await params).id)
    if (isNaN(vehicleId)) {
      return NextResponse.json(
        { success: false, error: "ID de véhicule invalide" },
        { status: 400 }
      )
    }

    const deletedVehicle = await db
      .delete(vehiclesTable)
      .where(eq(vehiclesTable.id, vehicleId))
      .returning()

    if (deletedVehicle.length === 0) {
      return NextResponse.json(
        { success: false, error: "Véhicule non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: deletedVehicle[0] })
  } catch (error) {
    console.error("Erreur lors de la suppression du véhicule:", error)
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}