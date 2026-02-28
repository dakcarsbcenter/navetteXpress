export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { servicesTable } from '@/schema';
import { requireAdminRole } from '@/utils/admin-permissions';
import { eq } from 'drizzle-orm';

type Params = { params: { id: string } };

// PATCH — modifier ou basculer isActive
export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        await requireAdminRole();
        const id = parseInt(params.id, 10);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'ID invalide' }, { status: 400 });
        }

        const body = await req.json();
        const updateData: Partial<typeof servicesTable.$inferInsert> = {};

        if (body.name !== undefined) updateData.name = body.name.trim();
        if (body.description !== undefined) updateData.description = body.description.trim();
        if (body.icon !== undefined) updateData.icon = body.icon.trim();
        if (body.slug !== undefined) updateData.slug = body.slug.trim();
        if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: false, error: 'Aucune donnée à mettre à jour' }, { status: 400 });
        }

        const [updated] = await db
            .update(servicesTable)
            .set({ ...updateData, updatedAt: new Date() })
            .where(eq(servicesTable.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json({ success: false, error: 'Service introuvable' }, { status: 404 });
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

// DELETE — supprimer définitivement
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await requireAdminRole();
        const id = parseInt(params.id, 10);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'ID invalide' }, { status: 400 });
        }

        const [deleted] = await db
            .delete(servicesTable)
            .where(eq(servicesTable.id, id))
            .returning();

        if (!deleted) {
            return NextResponse.json({ success: false, error: 'Service introuvable' }, { status: 404 });
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
