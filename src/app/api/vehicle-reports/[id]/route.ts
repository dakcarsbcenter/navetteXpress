export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { vehicleReportsTable } from '@/schema';
import { eq, and } from 'drizzle-orm';

// PATCH - Mettre à jour un rapport (seulement si status === 'open')
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;
        if (!session?.user || (session.user as { role?: string }).role !== 'driver') {
            return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
        }

        const reportId = parseInt(params.id);
        const userId = session.user.id as string;
        const body = await request.json();

        // Vérifier si le rapport appartient au chauffeur et est toujours 'open'
        const report = await db
            .select()
            .from(vehicleReportsTable)
            .where(and(eq(vehicleReportsTable.id, reportId), eq(vehicleReportsTable.driverId, userId)))
            .limit(1);

        if (report.length === 0) {
            return NextResponse.json({ error: "Rapport non trouvé" }, { status: 404 });
        }

        if (report[0].status !== 'open') {
            return NextResponse.json({ error: "Modification impossible (déjà traité)" }, { status: 400 });
        }

        const [updatedReport] = await db
            .update(vehicleReportsTable)
            .set({
                ...body,
                updatedAt: new Date(),
            })
            .where(eq(vehicleReportsTable.id, reportId))
            .returning();

        return NextResponse.json({ success: true, data: updatedReport });
    } catch (error) {
        console.error('Erreur API report PATCH:', error);
        return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }
}

// DELETE - Supprimer un rapport (seulement si status === 'open')
export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;
        if (!session?.user || (session.user as { role?: string }).role !== 'driver') {
            return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
        }

        const reportId = parseInt(params.id);
        const userId = session.user.id as string;

        const result = await db
            .delete(vehicleReportsTable)
            .where(and(
                eq(vehicleReportsTable.id, reportId),
                eq(vehicleReportsTable.driverId, userId),
                eq(vehicleReportsTable.status, 'open')
            ))
            .returning();

        if (result.length === 0) {
            return NextResponse.json({ error: "Suppression impossible (non trouvé ou déjà traité)" }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: "Rapport supprimé" });
    } catch (error) {
        console.error('Erreur API report DELETE:', error);
        return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }
}
