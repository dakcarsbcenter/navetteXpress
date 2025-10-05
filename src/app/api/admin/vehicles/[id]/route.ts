import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { vehiclesTable } from "@/schema"
import { eq } from "drizzle-orm"
import { requireAdminRole } from "@/utils/admin-permissions"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminRole()

    const vehicleId = parseInt(params.id)
    if (isNaN(vehicleId)) {
      return NextResponse.json(
        { success: false, error: "ID de véhicule invalide" },
        { status: 400 }
      )
    }

    const { make, model, year, licensePlate, capacity, isActive } = await request.json()

    if (!make || !model || !licensePlate) {
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
        licensePlate,
        capacity: capacity || 4,
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
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminRole()

    const vehicleId = parseInt(params.id)
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