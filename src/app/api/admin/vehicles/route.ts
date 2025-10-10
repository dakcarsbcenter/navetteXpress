import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { vehiclesTable } from "@/schema"
import { requireAdminRole } from "@/utils/admin-permissions"

export async function GET() {
  try {
    await requireAdminRole()

    const vehicles = await db.select().from(vehiclesTable)

    return NextResponse.json({ success: true, data: vehicles })
  } catch (error) {
    console.error("Erreur lors de la récupération des véhicules:", error)
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminRole()

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

    const newVehicle = await db
      .insert(vehiclesTable)
      .values({
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
      })
      .returning()

    return NextResponse.json({ success: true, data: newVehicle[0] })
  } catch (error) {
    console.error("Erreur lors de la création du véhicule:", error)
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}