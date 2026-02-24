export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { permissionsTable } from "@/schema"
import { eq } from "drizzle-orm"

// GET - Récupérer une permission spécifique
export async function GET(
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

    const permission = await db
      .select()
      .from(permissionsTable)
      .where(eq(permissionsTable.id, parseInt((await params).id)))
      .limit(1)

    if (permission.length === 0) {
      return NextResponse.json(
        { error: "Permission non trouvée" },
        { status: 404 }
      )
    }

    return NextResponse.json(permission[0])

  } catch (error) {
    console.error("Erreur lors de la récupération de la permission:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour une permission
export async function PUT(
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

    const { role, resource, action } = await request.json()

    // Vérifier si la permission existe
    const existingPermission = await db
      .select()
      .from(permissionsTable)
      .where(eq(permissionsTable.id, parseInt((await params).id)))
      .limit(1)

    if (existingPermission.length === 0) {
      return NextResponse.json(
        { error: "Permission non trouvée" },
        { status: 404 }
      )
    }

    // Mettre à jour la permission
    const updatedPermission = await db
      .update(permissionsTable)
      .set({
        role,
        resource,
        action
      })
      .where(eq(permissionsTable.id, parseInt((await params).id)))
      .returning()

    return NextResponse.json(
      { message: "Permission mise à jour avec succès", permission: updatedPermission[0] }
    )

  } catch (error) {
    console.error("Erreur lors de la mise à jour de la permission:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une permission
export async function DELETE(
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

    // Vérifier si la permission existe
    const existingPermission = await db
      .select()
      .from(permissionsTable)
      .where(eq(permissionsTable.id, parseInt((await params).id)))
      .limit(1)

    if (existingPermission.length === 0) {
      return NextResponse.json(
        { error: "Permission non trouvée" },
        { status: 404 }
      )
    }

    // Supprimer la permission
    await db
      .delete(permissionsTable)
      .where(eq(permissionsTable.id, parseInt((await params).id)))

    return NextResponse.json(
      { message: "Permission supprimée avec succès" }
    )

  } catch (error) {
    console.error("Erreur lors de la suppression de la permission:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
