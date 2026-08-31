export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pricingSegmentsTable } from '@/schema';
import { requireAdminRole } from '@/utils/admin-permissions';
import { isRouteNodeKey } from '@/lib/route-nodes';
import { eq } from 'drizzle-orm';

const VALID_DOTS = ['accent', 'ink', 'gold'];

type Params = { params: Promise<{ id: string }> };

// PATCH — modifier un segment de tarif (ou basculer isActive)
export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        await requireAdminRole();
        const { id: idParam } = await params;
        const id = parseInt(idParam, 10);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'ID invalide' }, { status: 400 });
        }

        const body = await req.json();
        const updateData: Partial<typeof pricingSegmentsTable.$inferInsert> = {};

        if (body.route !== undefined) updateData.route = body.route.trim();
        if (body.distance !== undefined) updateData.distance = body.distance.trim();
        if (body.duree !== undefined) updateData.duree = body.duree.trim();
        if (body.berline !== undefined) {
            const n = Number(body.berline);
            if (!Number.isFinite(n) || n < 0) {
                return NextResponse.json({ success: false, error: 'Prix berline invalide' }, { status: 400 });
            }
            updateData.berline = n;
        }
        if (body.suv !== undefined) {
            const n = Number(body.suv);
            if (!Number.isFinite(n) || n < 0) {
                return NextResponse.json({ success: false, error: 'Prix SUV invalide' }, { status: 400 });
            }
            updateData.suv = n;
        }
        if (body.dot !== undefined) updateData.dot = VALID_DOTS.includes(body.dot) ? body.dot : 'accent';
        if (body.zones !== undefined) updateData.zones = Array.isArray(body.zones) ? body.zones : [];
        if (body.departNode !== undefined) updateData.departNode = isRouteNodeKey(body.departNode) ? body.departNode : null;
        if (body.arriveeNode !== undefined) updateData.arriveeNode = isRouteNodeKey(body.arriveeNode) ? body.arriveeNode : null;
        if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: false, error: 'Aucune donnée à mettre à jour' }, { status: 400 });
        }

        const [updated] = await db
            .update(pricingSegmentsTable)
            .set({ ...updateData, updatedAt: new Date() })
            .where(eq(pricingSegmentsTable.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json({ success: false, error: 'Segment introuvable' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        const isAuth = error?.message?.includes('Unauthorized') || error?.message?.includes('Forbidden');
        return NextResponse.json(
            { success: false, error: error?.message || 'Erreur serveur' },
            { status: isAuth ? 403 : 500 }
        );
    }
}

// DELETE — supprimer définitivement un segment de tarif
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await requireAdminRole();
        const { id: idParam } = await params;
        const id = parseInt(idParam, 10);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'ID invalide' }, { status: 400 });
        }

        const [deleted] = await db
            .delete(pricingSegmentsTable)
            .where(eq(pricingSegmentsTable.id, id))
            .returning();

        if (!deleted) {
            return NextResponse.json({ success: false, error: 'Segment introuvable' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: deleted });
    } catch (error: any) {
        const isAuth = error?.message?.includes('Unauthorized') || error?.message?.includes('Forbidden');
        return NextResponse.json(
            { success: false, error: error?.message || 'Erreur serveur' },
            { status: isAuth ? 403 : 500 }
        );
    }
}
