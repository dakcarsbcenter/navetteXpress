export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { servicesTable } from '@/schema';
import { eq, asc } from 'drizzle-orm';

// Retourne uniquement les services actifs — accessible sans authentification
export async function GET() {
    try {
        const services = await db
            .select()
            .from(servicesTable)
            .where(eq(servicesTable.isActive, true))
            .orderBy(asc(servicesTable.sortOrder), asc(servicesTable.id));

        return NextResponse.json({ success: true, data: services });
    } catch (error: any) {
        console.error('Erreur récupération services publics:', error);
        return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }
}
