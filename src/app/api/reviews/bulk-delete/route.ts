export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { reviewsTable, rolePermissionsTable } from "@/schema"
import { inArray, and, eq } from "drizzle-orm"

async function hasReviewsPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
    try {
        if (userRole === 'admin') return true
        const permissions = await db
            .select()
            .from(rolePermissionsTable)
            .where(and(
                eq(rolePermissionsTable.roleName, userRole),
                eq(rolePermissionsTable.resource, 'reviews'),
                eq(rolePermissionsTable.action, action),
                eq(rolePermissionsTable.allowed, true)
            ))
        return permissions.length > 0
    } catch (error) {
        console.error('Erreur permissions:', error)
        return false
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
        if (!session?.user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
        }

        const userRole = session.user.role || 'customer'
        const hasPermission = await hasReviewsPermission(userRole, 'delete')
        if (!hasPermission) {
            return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
        }

        const body = await request.json()
        const { ids } = body

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Aucun identifiant fourni" }, { status: 400 })
        }

        const deletedReviews = await db
            .delete(reviewsTable)
            .where(inArray(reviewsTable.id, ids))
            .returning({ id: reviewsTable.id })

        return NextResponse.json({
            success: true,
            message: `${deletedReviews.length} avis supprimé(s)`,
            deletedIds: deletedReviews.map(r => r.id)
        })
    } catch (error) {
        console.error("Erreur bulk delete reviews:", error)
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
    }
}
