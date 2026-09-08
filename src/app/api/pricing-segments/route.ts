export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { pricingSegmentsTable } from '@/schema';
import { eq, asc } from 'drizzle-orm';
import { isAuthorizedPublicApiCall } from '@/lib/security/appToken';

// GET — liste les segments de tarifs actifs (public, page /tarifs)
export async function GET(request: Request) {
    if (!(await isAuthorizedPublicApiCall(request))) {
        return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    try {
        const segments = await db
            .select()
            .from(pricingSegmentsTable)
            .where(eq(pricingSegmentsTable.isActive, true))
            .orderBy(asc(pricingSegmentsTable.sortOrder), asc(pricingSegmentsTable.id));
        return NextResponse.json({ success: true, data: segments });
    } catch (error) {
        console.error('Erreur GET pricing-segments:', error);
        return NextResponse.json({ success: false, error: 'Erreur lors de la récupération des tarifs' }, { status: 500 });
    }
}
