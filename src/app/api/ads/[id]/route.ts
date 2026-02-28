import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { advertisements } from '@/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const ad = await db.select().from(advertisements).where(eq(advertisements.id, id)).limit(1);
        if (!ad[0]) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
        return NextResponse.json(ad[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération de la publicité:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Auth admin
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin' && (session.user as any).role !== 'manager') {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    try {
        const { id } = await params;
        const body = await req.json();

        // Prepare update data
        const updateData: any = { ...body, updatedAt: new Date() };

        // Convert dates if they exist in body
        if (body.startDate) updateData.startDate = new Date(body.startDate);
        if (body.endDate) updateData.endDate = new Date(body.endDate);

        const updated = await db
            .update(advertisements)
            .set(updateData)
            .where(eq(advertisements.id, id))
            .returning();

        if (!updated[0]) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });

        return NextResponse.json(updated[0]);
    } catch (error) {
        console.error('Erreur lors de la modification de la publicité:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Auth admin
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin' && (session.user as any).role !== 'manager') {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    try {
        const { id } = await params;
        const deleted = await db.delete(advertisements).where(eq(advertisements.id, id)).returning();
        if (!deleted[0]) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la suppression de la publicité:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
