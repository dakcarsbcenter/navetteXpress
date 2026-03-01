export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { users, rolePermissionsTable } from "@/schema"
import { eq, and } from "drizzle-orm"

// PUT - Mettre à jour le profil du client
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; name?: string; email?: string; role?: string } } | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userRole = (session.user as { role?: string }).role || 'customer'

    // Vérifier la permission de modification du profil
    // Les admins ont toujours accès
    if (userRole !== 'admin') {
      const profilePermission = await db
        .select()
        .from(rolePermissionsTable)
        .where(and(
          eq(rolePermissionsTable.roleName, userRole),
          eq(rolePermissionsTable.resource, 'profile'),
          eq(rolePermissionsTable.action, 'update'),
          eq(rolePermissionsTable.allowed, true)
        ))
        .limit(1)

      if (profilePermission.length === 0) {
        return NextResponse.json({
          error: "Vous n'avez pas la permission de modifier votre profil. Contactez un administrateur."
        }, { status: 403 })
      }
    }

    const {
      name,
      email,
      phone,
      image,
      address,
      isCompany,
      companyName,
      ninea,
      raisonSociale,
      companyAddress,
      companyPhone,
      bp
    } = await request.json()

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
        phone: phone?.trim() || null,
        image: image?.trim() || null,
        address: address?.trim() || null,
        isCompany: !!isCompany,
        companyName: companyName?.trim() || null,
        ninea: ninea?.trim() || null,
        raisonSociale: raisonSociale?.trim() || null,
        companyAddress: companyAddress?.trim() || null,
        companyPhone: companyPhone?.trim() || null,
        bp: bp?.trim() || null
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
        image: updatedUser[0].image,
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

    const userRole = (session.user as { role?: string }).role || 'customer'

    // Vérifier la permission de lecture du profil
    if (userRole !== 'admin') {
      const profilePermission = await db
        .select()
        .from(rolePermissionsTable)
        .where(and(
          eq(rolePermissionsTable.roleName, userRole),
          eq(rolePermissionsTable.resource, 'profile'),
          eq(rolePermissionsTable.action, 'read'),
          eq(rolePermissionsTable.allowed, true)
        ))
        .limit(1)

      if (profilePermission.length === 0) {
        return NextResponse.json({
          error: "Vous n'avez pas la permission de consulter votre profil."
        }, { status: 403 })
      }
    }

    // Récupérer les informations utilisateur
    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        image: users.image,
        address: users.address,
        isCompany: users.isCompany,
        companyName: users.companyName,
        ninea: users.ninea,
        raisonSociale: users.raisonSociale,
        companyAddress: users.companyAddress,
        companyPhone: users.companyPhone,
        bp: users.bp,
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
