export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { users, rolePermissionsTable } from "@/schema"
import { eq, and } from "drizzle-orm"

async function hasUsersPermission(userRole: string, action: 'read' | 'update'): Promise<boolean> {
  if (userRole === 'admin') return true

  const permissions = await db
    .select()
    .from(rolePermissionsTable)
    .where(and(
      eq(rolePermissionsTable.roleName, userRole),
      eq(rolePermissionsTable.resource, 'users'),
      eq(rolePermissionsTable.action, action),
      eq(rolePermissionsTable.allowed, true)
    ))

  return permissions.length > 0
}

// PATCH - Approuver ou refuser une demande de compte professionnel
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const userRole = session.user.role
    if (!userRole || !(await hasUsersPermission(userRole, 'update'))) {
      return NextResponse.json({ error: "Vous n'avez pas la permission de valider les demandes" }, { status: 403 })
    }

    const { id } = await params
    const { action, reason } = await request.json()

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 })
    }

    const targetRows = await db.select().from(users).where(eq(users.id, id)).limit(1)
    if (targetRows.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const target = targetRows[0]
    if (target.companyStatus !== 'pending') {
      return NextResponse.json({ error: "Cette demande n'est plus en attente" }, { status: 409 })
    }

    const updated = await db
      .update(users)
      .set({
        isCompany: action === 'approve',
        companyStatus: action === 'approve' ? 'approved' : 'rejected',
        companyReviewedAt: new Date(),
        companyReviewedBy: session.user.id,
        companyRejectionReason: action === 'reject' ? (reason?.trim() || null) : null,
      })
      .where(eq(users.id, id))
      .returning()

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? "Compte professionnel activé" : "Demande refusée",
      user: updated[0],
    })
  } catch (error) {
    console.error("Erreur lors du traitement de la demande compte pro:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
