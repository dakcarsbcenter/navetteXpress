import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { vehiclesTable } from "@/schema"
import { requireAdminRole } from "@/utils/admin-permissions"

export async function GET(request: NextRequest) {
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

    const { make, model, year, licensePlate, capacity, isActive } = await request.json()

    if (!make || !model || !licensePlate) {
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
        licensePlate,
        capacity: capacity || 4,
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