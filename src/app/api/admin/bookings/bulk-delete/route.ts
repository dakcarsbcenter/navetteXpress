export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { bookingsTable } from "@/schema"
import { inArray } from "drizzle-orm"
import { requireBookingsDelete } from "@/utils/admin-permissions"

export async function DELETE(request: NextRequest) {
    try {
        try {
            await requireBookingsDelete();
        } catch (permError) {
            const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
            const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
            return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
        }

        const body = await request.json()
        const { ids } = body

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Aucun identifiant fourni" }, { status: 400 })
        }

        const deletedBookings = await db
            .delete(bookingsTable)
            .where(inArray(bookingsTable.id, ids))
            .returning({ id: bookingsTable.id })

        return NextResponse.json({
            success: true,
            message: `${deletedBookings.length} réservation(s) supprimée(s)`,
            deletedIds: deletedBookings.map(b => b.id)
        })
    } catch (error) {
        console.error("Erreur bulk delete bookings:", error)
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
    }
}
