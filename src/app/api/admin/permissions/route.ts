import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { permissionsTable } from "@/schema"
import { eq } from "drizzle-orm"

// GET - Récupérer toutes les permissions
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification et le rôle admin
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource." },
        { status: 403 }
      )
    }

    const permissions = await db.select().from(permissionsTable)

    return NextResponse.json(permissions)

  } catch (error) {
    console.error("Erreur lors de la récupération des permissions:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle permission
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et le rôle admin
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource." },
        { status: 403 }
      )
    }

    const { role, resource, action } = await request.json()

    if (!role || !resource || !action) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires" },
        { status: 400 }
      )
    }

    const newPermission = await db
      .insert(permissionsTable)
      .values({
        role,
        resource,
        action
      })
      .returning()

    return NextResponse.json(
      { message: "Permission créée avec succès", permission: newPermission[0] },
      { status: 201 }
    )

  } catch (error) {
    console.error("Erreur lors de la création de la permission:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
