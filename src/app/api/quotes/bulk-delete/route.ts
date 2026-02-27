export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { quotesTable, rolePermissionsTable } from "@/schema"
import { inArray, and, eq } from "drizzle-orm"

async function hasQuotesPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
    try {
        if (userRole === 'admin') return true
        const permissions = await db
            .select()
            .from(rolePermissionsTable)
            .where(and(
                eq(rolePermissionsTable.roleName, userRole),
                eq(rolePermissionsTable.resource, 'quotes'),
                eq(rolePermissionsTable.action, action),
                eq(rolePermissionsTable.allowed, true)
            ))
        return permissions.some(p => p.action === 'manage' || p.action === action)
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
        const hasPermission = await hasQuotesPermission(userRole, 'delete')
        if (!hasPermission) {
            return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
        }

        const body = await request.json()
        const { ids } = body

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Aucun identifiant fourni" }, { status: 400 })
        }

        const deletedQuotes = await db
            .delete(quotesTable)
            .where(inArray(quotesTable.id, ids))
            .returning({ id: quotesTable.id })

        return NextResponse.json({
            success: true,
            message: `${deletedQuotes.length} devis supprimé(s)`,
            deletedIds: deletedQuotes.map(q => q.id)
        })
    } catch (error) {
        console.error("Erreur bulk delete quotes:", error)
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
    }
}
