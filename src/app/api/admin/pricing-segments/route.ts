export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pricingSegmentsTable } from '@/schema';
import { requireAdminRole } from '@/utils/admin-permissions';
import { asc } from 'drizzle-orm';

const VALID_DOTS = ['accent', 'ink', 'gold'];

// GET — liste tous les segments de tarifs (admin)
export async function GET() {
    try {
        await requireAdminRole();
        const segments = await db
            .select()
            .from(pricingSegmentsTable)
            .orderBy(asc(pricingSegmentsTable.sortOrder), asc(pricingSegmentsTable.id));
        return NextResponse.json({ success: true, data: segments });
    } catch (error: any) {
        const isAuth = error?.message?.includes('Unauthorized') || error?.message?.includes('Forbidden');
        return NextResponse.json(
            { success: false, error: error?.message || 'Erreur serveur' },
            { status: isAuth ? 403 : 500 }
        );
    }
}

// POST — créer un nouveau segment de tarif
export async function POST(req: NextRequest) {
    try {
        await requireAdminRole();
        const body = await req.json();
        const { route, distance, duree, berline, suv, dot, zones, sortOrder, isActive } = body;

        if (!route?.trim() || !distance?.trim() || !duree?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Trajet, distance et durée sont requis' },
                { status: 400 }
            );
        }

        const berlineNum = Number(berline);
        const suvNum = Number(suv);
        if (!Number.isFinite(berlineNum) || berlineNum < 0 || !Number.isFinite(suvNum) || suvNum < 0) {
            return NextResponse.json(
                { success: false, error: 'Les prix berline et SUV doivent être des nombres positifs' },
                { status: 400 }
            );
        }

        const [created] = await db
            .insert(pricingSegmentsTable)
            .values({
                route: route.trim(),
                distance: distance.trim(),
                duree: duree.trim(),
                berline: berlineNum,
                suv: suvNum,
                dot: VALID_DOTS.includes(dot) ? dot : 'accent',
                zones: Array.isArray(zones) ? zones : [],
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
