export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { users, rolePermissionsTable } from "@/schema"
import { eq, and, inArray } from "drizzle-orm"

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

// GET - Liste des demandes de passage en compte professionnel
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const userRole = session.user.role
    if (!userRole || !(await hasUsersPermission(userRole, 'read'))) {
      return NextResponse.json({ error: "Vous n'avez pas la permission de consulter les demandes" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status') || 'pending'
    const statuses = statusParam === 'all'
      ? ['pending', 'approved', 'rejected']
      : statusParam.split(',').filter((s) => ['pending', 'approved', 'rejected'].includes(s))

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        companyType: users.companyType,
        companyName: users.companyName,
        ninea: users.ninea,
        raisonSociale: users.raisonSociale,
        companyAddress: users.companyAddress,
        companyPhone: users.companyPhone,
        bp: users.bp,
        companyStatus: users.companyStatus,
        companyRequestedAt: users.companyRequestedAt,
        companyReviewedAt: users.companyReviewedAt,
        companyRejectionReason: users.companyRejectionReason,
      })
      .from(users)
      .where(inArray(users.companyStatus, statuses.length > 0 ? statuses as ('pending' | 'approved' | 'rejected')[] : ['pending']))

    rows.sort((a, b) => {
      const dateA = a.companyRequestedAt ? new Date(a.companyRequestedAt).getTime() : 0
      const dateB = b.companyRequestedAt ? new Date(b.companyRequestedAt).getTime() : 0
      return dateB - dateA
    })

    return NextResponse.json({ success: true, requests: rows })
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes compte pro:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
