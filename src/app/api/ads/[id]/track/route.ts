import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { advertisements } from '@/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { type } = await req.json(); // type: 'impression' | 'click'

        if (type === 'impression') {
            await db.update(advertisements)
                .set({ impressions: sql`${advertisements.impressions} + 1` })
                .where(eq(advertisements.id, params.id));
        } else if (type === 'click') {
            await db.update(advertisements)
                .set({ clicks: sql`${advertisements.clicks} + 1` })
                .where(eq(advertisements.id, params.id));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur lors du tracking de la publicité:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
