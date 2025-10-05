import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { sessions } from "@/schema"
import { eq } from "drizzle-orm"

// GET - Récupérer une session spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification et le rôle admin
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource." },
        { status: 403 }
      )
    }

    const sessionData = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, params.id))
      .limit(1)

    if (sessionData.length === 0) {
      return NextResponse.json(
        { error: "Session non trouvée" },
        { status: 404 }
      )
    }

    return NextResponse.json(sessionData[0])

  } catch (error) {
    console.error("Erreur lors de la récupération de la session:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification et le rôle admin
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource." },
        { status: 403 }
      )
    }

    // Vérifier si la session existe
    const existingSession = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, params.id))
      .limit(1)

    if (existingSession.length === 0) {
      return NextResponse.json(
        { error: "Session non trouvée" },
        { status: 404 }
      )
    }

    // Supprimer la session
    await db
      .delete(sessions)
      .where(eq(sessions.id, params.id))

    return NextResponse.json(
      { message: "Session supprimée avec succès" }
    )

  } catch (error) {
    console.error("Erreur lors de la suppression de la session:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
