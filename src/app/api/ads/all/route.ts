import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { advertisements } from '@/schema';
import { desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    // Vérifier auth admin
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin' && (session.user as any).role !== 'manager') {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    try {
        const ads = await db.select().from(advertisements).orderBy(desc(advertisements.createdAt));
        return NextResponse.json(ads);
    } catch (error) {
        console.error('Erreur lors de la récupération de toutes les publicités:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
