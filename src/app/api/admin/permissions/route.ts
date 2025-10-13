import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { permissionsTable } from "@/schema"
// import { eq } from "drizzle-orm"

// GET - Récupérer toutes les permissions
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

    // Définir toutes les permissions possibles
    const allPossiblePermissions = [
      { resource: 'users', action: 'manage', category: 'users' },
      { resource: 'users', action: 'read', category: 'users' },
      { resource: 'vehicles', action: 'manage', category: 'vehicles' },
      { resource: 'vehicles', action: 'read', category: 'vehicles' },
      { resource: 'bookings', action: 'manage', category: 'bookings' },
      { resource: 'bookings', action: 'read', category: 'bookings' },
      { resource: 'quotes', action: 'manage', category: 'quotes' },
      { resource: 'quotes', action: 'read', category: 'quotes' },
      { resource: 'reviews', action: 'manage', category: 'reviews' },
      { resource: 'reviews', action: 'read', category: 'reviews' }
    ]

    // Transformer les données avec des IDs basés sur resource+action
    const formattedPermissions = allPossiblePermissions.map((perm, index) => ({
      id: index + 1, // ID basé sur l'index
      name: `${perm.action} ${perm.resource}`,
      description: `Permission pour ${perm.action} sur ${perm.resource}`,
      category: perm.category,
      resource: perm.resource,
      action: perm.action,
      isActive: true, // Toujours actif pour l'affichage
      createdAt: new Date().toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: formattedPermissions
    })

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
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
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
