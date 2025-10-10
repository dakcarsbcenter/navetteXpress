import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { users } from "@/schema"
import { eq } from "drizzle-orm"

// PUT - Mettre à jour le profil du client
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; name?: string; email?: string; role?: string } } | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un client
    if ((session.user as { role?: string }).role !== 'customer') {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { name, email, phone } = await request.json()

    // Validation des données
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Le nom et l'email sont obligatoires" },
        { status: 400 }
      )
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      )
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email.trim() !== session.user.email) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email.trim()))
        .limit(1)

      if (existingUser.length > 0) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé par un autre compte" },
          { status: 400 }
        )
      }
    }

    // Mettre à jour le profil utilisateur
    const updatedUser = await db
      .update(users)
      .set({
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null
      })
      .where(eq(users.id, (session as unknown as { user: { id: string } }).user.id))
      .returning()

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Profil mis à jour avec succès",
      user: {
        id: updatedUser[0].id,
        name: updatedUser[0].name,
        email: updatedUser[0].email,
        phone: updatedUser[0].phone,
        role: updatedUser[0].role
      }
    })

  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// GET - Récupérer le profil du client
export async function GET() {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; name?: string; email?: string; role?: string } } | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un client
    if ((session.user as { role?: string }).role !== 'customer') {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Récupérer les informations utilisateur
    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, (session as unknown as { user: { id: string } }).user.id))
      .limit(1)

    if (user.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: user[0]
    })

  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
