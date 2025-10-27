export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { users, rolePermissionsTable } from "@/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

// Fonction pour vérifier les permissions dynamiques
async function hasUsersPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
  try {
    // Les admins ont toujours accès
    if (userRole === 'admin') {
      return true
    }

    // Vérifier les permissions dynamiques
    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource, 'users'),
        eq(rolePermissionsTable.action, action),
        eq(rolePermissionsTable.allowed, true)
      ))

    // Retourner true si la permission existe
    return permissions.length > 0
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions users:', error)
    return false
  }
}

// GET - Récupérer tous les utilisateurs
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const userRole = (session.user as { role?: string }).role
    if (!userRole) {
      return NextResponse.json(
        { error: "Rôle utilisateur non défini" },
        { status: 403 }
      )
    }

    // Vérifier les permissions (admin OU permission read/manage sur users)
    const hasPermission = await hasUsersPermission(userRole, 'read')
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de consulter les utilisateurs" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const roleParam = searchParams.get('role')

    // Normaliser les rôles acceptés côté DB (FR: 'chauffeur', 'admin', 'manager')
    const normalizedRole = (() => {
      if (!roleParam) return null
      const lower = roleParam.toLowerCase()
      if (lower === 'driver' || lower === 'chauffeur') return 'driver'
      if (lower === 'admin') return 'admin'
      if (lower === 'manager') return 'manager'
      return undefined
    })()

    if (normalizedRole === undefined) {
      return NextResponse.json(
        { success: false, error: "Rôle invalide. Utilisez 'admin', 'manager' ou 'driver'." },
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
      image: users.image,
      createdAt: users.createdAt
    }).from(users)

    let rows = normalizedRole
      ? await baseSelect.where(eq(users.role, normalizedRole))
      : await baseSelect

    // Filtrer les utilisateurs admin : seuls les admins peuvent voir d'autres admins
    if (userRole !== 'admin') {
      rows = rows.filter(user => user.role !== 'admin')
    }

    return NextResponse.json({ success: true, data: rows })

  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return NextResponse.json({ success: false, error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const userRole = (session.user as { role?: string }).role
    if (!userRole) {
      return NextResponse.json(
        { error: "Rôle utilisateur non défini" },
        { status: 403 }
      )
    }

    // Vérifier les permissions (admin OU permission create/manage sur users)
    const hasPermission = await hasUsersPermission(userRole, 'create')
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de créer des utilisateurs" },
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
      if (lower === 'manager') return 'manager'
      return undefined
    })()

    if (normalizedRole === undefined) {
      return NextResponse.json(
        { error: "Rôle invalide. Utilisez 'admin', 'manager' ou 'driver'." },
        { status: 400 }
      )
    }

    // Seuls les admins peuvent créer d'autres admins
    if (normalizedRole === 'admin' && userRole !== 'admin') {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent créer d'autres administrateurs" },
        { status: 403 }
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
        role?: 'admin' | 'manager' | 'driver' | 'customer';
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