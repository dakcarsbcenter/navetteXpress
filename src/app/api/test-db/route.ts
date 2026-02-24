import { NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/schema"

export async function GET() {
  try {
    // Test simple de connexion à la base de données
    const result = await db.select().from(users).limit(1)
    
    return NextResponse.json({
      success: true,
      message: "Connexion à la base de données réussie",
      userCount: result.length
    })
  } catch (error) {
    console.error("Erreur de connexion à la base de données:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 })
  }
}
