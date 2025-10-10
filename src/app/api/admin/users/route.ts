import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { users } from "@/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

// GET - Récupérer tous les utilisateurs
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification et le rôle admin
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const roleParam = searchParams.get('role')

    // Normaliser les rôles acceptés côté DB (FR: 'chauffeur', 'admin')
    const normalizedRole = (() => {
      if (!roleParam) return null
      const lower = roleParam.toLowerCase()
      if (lower === 'driver' || lower === 'chauffeur') return 'driver'
      if (lower === 'admin') return 'admin'
      return undefined
    })()

    if (normalizedRole === undefined) {
      return NextResponse.json(
        { success: false, error: "Rôle invalide. Utilisez 'admin' ou 'driver'." },
        { status: 400 }
      )
    }

    const baseSelect = db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      licenseNumber: users.licenseNumber,
      isActive: users.isActive,
      createdAt: users.createdAt
    }).from(users)

    const rows = normalizedRole
      ? await baseSelect.where(eq(users.role, normalizedRole))
      : await baseSelect

    return NextResponse.json({ success: true, data: rows })

  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return NextResponse.json({ success: false, error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et le rôle admin
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource." },
        { status: 403 }
      )
    }

    const { name, email, role, phone, licenseNumber, isActive, password } = await request.json()

    // Normaliser le rôle en entrée
    const normalizedRole = (() => {
      if (!role) return null
      const lower = String(role).toLowerCase()
      if (lower === 'driver' || lower === 'chauffeur') return 'driver'
      if (lower === 'admin') return 'admin'
      return undefined
    })()

    if (normalizedRole === undefined) {
      return NextResponse.json(
        { error: "Rôle invalide. Utilisez 'admin' ou 'driver'." },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      )
    }

    // Créer le nouvel utilisateur
    const userId = randomUUID()
    const finalPassword = password || "password123" // Utiliser le mot de passe fourni ou le défaut
    const hashedPassword = await bcrypt.hash(finalPassword, 12)

    const insertValues: {
      id: string;
      name: string;
      email: string;
      phone?: string;
      licenseNumber?: string;
      isActive: boolean;
      password: string;
      emailVerified: Date;
        role?: 'admin' | 'driver' | 'customer';
    } = {
      id: userId,
      name,
      email,
      phone,
      licenseNumber,
      isActive,
      password: hashedPassword,
      emailVerified: new Date(),
    }
    if (normalizedRole) insertValues.role = normalizedRole

    const newUser = await db
      .insert(users)
      .values(insertValues)
      .returning()

    return NextResponse.json(
      { message: "Utilisateur créé avec succès", user: newUser[0] },
      { status: 201 }
    )

  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}