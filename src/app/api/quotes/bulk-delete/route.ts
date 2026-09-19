export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { quotesTable, invoicesTable, rolePermissionsTable } from "@/schema"
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

        // Normaliser les identifiants : le client peut envoyer des chaînes, et une
        // comparaison string/number ferait passer un devis facturé au travers du filtre
        const quoteIds = Array.from(new Set(
            ids.map((id: unknown) => parseInt(String(id), 10)).filter((id: number) => !isNaN(id) && id > 0)
        ))

        if (quoteIds.length === 0) {
            return NextResponse.json({ error: "Aucun identifiant valide fourni" }, { status: 400 })
        }

        // Les devis liés à une facture ne peuvent pas être supprimés (contrainte "restrict")
        const linkedInvoices = await db
            .select({ quoteId: invoicesTable.quoteId })
            .from(invoicesTable)
            .where(inArray(invoicesTable.quoteId, quoteIds))

        const blockedIds = new Set(linkedInvoices.map(i => i.quoteId))
        const deletableIds = quoteIds.filter((id: number) => !blockedIds.has(id))

        const deletedQuotes = deletableIds.length > 0
            ? await db
                .delete(quotesTable)
                .where(inArray(quotesTable.id, deletableIds))
                .returning({ id: quotesTable.id })
            : []

        if (deletedQuotes.length === 0) {
            return NextResponse.json({
                error: "Ce(s) devis ne peuvent pas être supprimés car ils ont une facture associée"
            }, { status: 409 })
        }

        const message = blockedIds.size > 0
            ? `${deletedQuotes.length} devis supprimé(s), ${blockedIds.size} ignoré(s) car lié(s) à une facture`
            : `${deletedQuotes.length} devis supprimé(s)`

        return NextResponse.json({
            success: true,
            message,
            deletedIds: deletedQuotes.map(q => q.id),
            skippedIds: Array.from(blockedIds)
        })
    } catch (error: any) {
        console.error("Erreur bulk delete quotes:", error)
        // Filet de sécurité : une facture peut avoir été créée entre la vérification et le DELETE
        if (error?.code === '23503') {
            return NextResponse.json({
                error: "Ce(s) devis ne peuvent pas être supprimés car ils ont une facture associée"
            }, { status: 409 })
        }
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
    }
}
