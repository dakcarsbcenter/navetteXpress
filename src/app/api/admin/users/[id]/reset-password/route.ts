export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { users } from "@/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

// Fonction pour générer un mot de passe temporaire aléatoire
function generateTempPassword(): string {
  const length = 10
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

// POST - Réinitialiser le mot de passe d'un utilisateur avec un mot de passe temporaire
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification et le rôle admin
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource." },
        { status: 403 }
      )
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, (await params).id))
      .limit(1)

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Générer un mot de passe temporaire
    const tempPassword = generateTempPassword()

    // Hasher le mot de passe temporaire
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Mettre à jour le mot de passe
    const updatedUser = await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, (await params).id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role
      })

    return NextResponse.json(
      { 
        message: "Mot de passe réinitialisé avec succès", 
        tempPassword: tempPassword,
        user: updatedUser[0] 
      }
    )

  } catch (error) {
    console.error("Erreur lors de la réinitialisation du mot de passe:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
