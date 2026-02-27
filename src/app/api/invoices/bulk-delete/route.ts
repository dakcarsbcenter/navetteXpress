export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { invoicesTable } from "@/schema"
import { inArray } from "drizzle-orm"

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as { user?: { role?: string } } | null
        if (!session?.user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
        }

        const userRole = session.user.role || 'customer'
        // Seuls admins et managers peuvent supprimer des factures (on peut adapter selon le besoin)
        if (userRole !== 'admin' && userRole !== 'manager') {
            return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
        }

        const body = await request.json()
        const { ids } = body

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Aucun identifiant fourni" }, { status: 400 })
        }

        const deletedInvoices = await db
            .delete(invoicesTable)
            .where(inArray(invoicesTable.id, ids))
            .returning({ id: invoicesTable.id })

        return NextResponse.json({
            success: true,
            message: `${deletedInvoices.length} facture(s) supprimée(s)`,
            deletedIds: deletedInvoices.map(i => i.id)
        })
    } catch (error) {
        console.error("Erreur bulk delete invoices:", error)
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
    }
}
