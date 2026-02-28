export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { servicesTable } from '@/schema';
import { requireAdminRole } from '@/utils/admin-permissions';
import { eq, asc } from 'drizzle-orm';

// GET — liste tous les services (admin)
export async function GET() {
    try {
        await requireAdminRole();
        const services = await db
            .select()
            .from(servicesTable)
            .orderBy(asc(servicesTable.sortOrder), asc(servicesTable.id));
        return NextResponse.json({ success: true, data: services });
    } catch (error: any) {
        const isAuth = error?.message?.includes('Unauthorized') || error?.message?.includes('Forbidden');
        return NextResponse.json(
            { success: false, error: error?.message || 'Erreur serveur' },
            { status: isAuth ? 403 : 500 }
        );
    }
}

// POST — créer un nouveau service
export async function POST(req: NextRequest) {
    try {
        await requireAdminRole();
        const body = await req.json();
        const { name, description, icon, slug, features, sortOrder, isActive } = body;

        if (!name?.trim() || !description?.trim() || !slug?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Nom, description et slug sont requis' },
                { status: 400 }
            );
        }

        // Vérifier l'unicité du slug
        const existing = await db
            .select({ id: servicesTable.id })
            .from(servicesTable)
            .where(eq(servicesTable.slug, slug.trim()));

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Un service avec ce slug existe déjà' },
                { status: 400 }
            );
        }

        const [created] = await db
            .insert(servicesTable)
            .values({
                name: name.trim(),
                description: description.trim(),
                icon: icon?.trim() || '✈️',
                slug: slug.trim(),
                features: Array.isArray(features) ? features : null,
                sortOrder: sortOrder ?? 0,
                isActive: isActive !== undefined ? isActive : true,
            })
            .returning();

        return NextResponse.json({ success: true, data: created }, { status: 201 });
    } catch (error: any) {
        const isAuth = error?.message?.includes('Unauthorized') || error?.message?.includes('Forbidden');
        return NextResponse.json(
            { success: false, error: error?.message || 'Erreur serveur' },
            { status: isAuth ? 403 : 500 }
        );
    }
}
