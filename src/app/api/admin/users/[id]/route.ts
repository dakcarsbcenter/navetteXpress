export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { users, rolePermissionsTable } from "@/schema"
import { eq, and } from "drizzle-orm"

// Fonction pour vérifier les permissions dynamiques
async function hasUsersPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
  try {
    // Les admins ont toujours accès
    if (userRole === 'admin') {
      return true
    }

    // Vérifier les permissions dynamiques pour l'action spécifique
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

// GET - Récupérer un utilisateur spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const userRole = (session.user as { role?: string }).role
    if (!userRole) {
      return NextResponse.json({ error: "Rôle utilisateur non défini" }, { status: 403 })
    }

    // Vérifier les permissions
    const hasPermission = await hasUsersPermission(userRole, 'read')
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de consulter les utilisateurs" },
        { status: 403 }
      )
    }

    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        phone: users.phone,
        licenseNumber: users.licenseNumber,
        isActive: users.isActive,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, (await params).id))
      .limit(1)

    if (user.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Seuls les admins peuvent voir d'autres admins
    if (user[0].role === 'admin' && userRole !== 'admin') {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      )
    }

    return NextResponse.json(user[0])

  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const userRole = (session.user as { role?: string }).role
    if (!userRole) {
      return NextResponse.json({ error: "Rôle utilisateur non défini" }, { status: 403 })
    }

    // Vérifier les permissions
    const hasPermission = await hasUsersPermission(userRole, 'update')
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de modifier les utilisateurs" },
        { status: 403 }
      )
    }

    const { name, email, role, phone, licenseNumber, isActive } = await request.json()

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

    // Seuls les admins peuvent modifier d'autres admins
    if (existingUser[0].role === 'admin' && userRole !== 'admin') {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier un administrateur" },
        { status: 403 }
      )
    }

    // Seuls les admins peuvent attribuer le rôle admin à quelqu'un
    if (role === 'admin' && userRole !== 'admin') {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent créer d'autres administrateurs" },
        { status: 403 }
      )
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email !== existingUser[0].email) {
      const emailExists = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (emailExists.length > 0) {
        return NextResponse.json(
          { error: "Un utilisateur avec cet email existe déjà" },
          { status: 400 }
        )
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await db
      .update(users)
      .set({
        name,
        email,
        role,
        phone: phone || null,
        licenseNumber: licenseNumber || null,
        isActive,
        updatedAt: new Date()
      })
      .where(eq(users.id, (await params).id))
      .returning()

    return NextResponse.json(
      { message: "Utilisateur mis à jour avec succès", user: updatedUser[0] }
    )

  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const userRole = (session.user as { role?: string }).role
    if (!userRole) {
      return NextResponse.json({ error: "Rôle utilisateur non défini" }, { status: 403 })
    }

    // Vérifier les permissions
    const hasPermission = await hasUsersPermission(userRole, 'delete')
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de supprimer des utilisateurs" },
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

    // Seuls les admins peuvent supprimer d'autres admins
    if (existingUser[0].role === 'admin' && userRole !== 'admin') {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer un administrateur" },
        { status: 403 }
      )
    }

    // Empêcher l'auto-suppression
    const userSession = session as unknown as { user: { id: string } }
    if (userSession.user.id === (await params).id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      )
    }

    // Supprimer l'utilisateur
    await db
      .delete(users)
      .where(eq(users.id, (await params).id))

    return NextResponse.json(
      { message: "Utilisateur supprimé avec succès" }
    )

  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
