import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { advertisements } from '@/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/ads?placement=... — Récupérer les pubs actives pour un emplacement
export async function GET(req: NextRequest) {
    const placement = req.nextUrl.searchParams.get('placement');
    if (!placement) {
        return NextResponse.json({ error: 'placement requis' }, { status: 400 });
    }

    const now = new Date();

    try {
        const ads = await db
            .select()
            .from(advertisements)
            .where(
                and(
                    eq(advertisements.placement, placement as any),
                    eq(advertisements.status, 'active'),
                    lte(advertisements.startDate, now),
                    gte(advertisements.endDate, now),
                )
            )
            .limit(3); // Max 3 pubs par emplacement

        return NextResponse.json(ads);
    } catch (error) {
        console.error('Erreur lors de la récupération des publicités:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// POST /api/ads — Créer une publicité (admin)
export async function POST(req: NextRequest) {
    // Vérifier auth admin
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin' && (session.user as any).role !== 'manager') {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    try {
        const body = await req.json();

        // Validation basique
        const required = ['title', 'advertiser', 'type', 'placement', 'destinationUrl', 'startDate', 'endDate'];
        for (const field of required) {
            if (!body[field]) {
                return NextResponse.json({ error: `Champ requis : ${field}` }, { status: 400 });
            }
        }

        // Vérifier que endDate > startDate
        if (new Date(body.endDate) <= new Date(body.startDate)) {
            return NextResponse.json({ error: 'La date de fin doit être après la date de début' }, { status: 400 });
        }

        const dataToInsert = {
            ...body,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            createdBy: (session.user as any).id,
            status: body.status ?? 'draft',
        };

        const newAd = await db.insert(advertisements).values(dataToInsert).returning();

        return NextResponse.json(newAd[0], { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création de la publicité:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
