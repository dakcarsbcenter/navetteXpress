import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { advertisements } from '@/schema';
import { eq, and, lt } from 'drizzle-orm';

export async function POST(req: NextRequest) {
    // Sécuriser avec un secret header
    const secret = req.headers.get('x-cron-secret');
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const now = new Date();
    try {
        const expired = await db
            .update(advertisements)
            .set({ status: 'expired', updatedAt: now })
            .where(
                and(
                    eq(advertisements.status, 'active'),
                    lt(advertisements.endDate, now)
                )
            )
            .returning({ id: advertisements.id });

        return NextResponse.json({ expired: expired.length });
    } catch (error) {
        console.error('Erreur lors de l expiration des publicités:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
