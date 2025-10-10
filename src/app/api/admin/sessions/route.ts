import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { sessions, users } from "@/schema"
import { eq, desc } from "drizzle-orm"

// GET - Récupérer toutes les sessions avec les détails des utilisateurs
export async function GET() {
  try {
    // Vérifier l'authentification et le rôle admin
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource." },
        { status: 403 }
      )
    }

    const allSessions = await db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        expires: sessions.expires,
        sessionToken: sessions.sessionToken,
        user: {
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(sessions)
      .leftJoin(users, eq(sessions.userId, users.id))
      .orderBy(desc(sessions.expires))

    return NextResponse.json(allSessions)

  } catch (error) {
    console.error("Erreur lors de la récupération des sessions:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
