import { NextResponse } from 'next/server';
import { db } from '@/db';
import { locationsTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Met à jour un lieu (Ex: toggler actif/inactif, modifier le nom)
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;

        if (!session || (userRole !== 'admin' && userRole !== 'manager')) {
            return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
        }

        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'ID invalide' }, { status: 400 });
        }

        const body = await request.json();

        // Récupérer le lieu existant
        const existingLocations = await db.select().from(locationsTable).where(eq(locationsTable.id, id));
        if (existingLocations.length === 0) {
            return NextResponse.json({ success: false, error: 'Lieu introuvable' }, { status: 404 });
        }

        const updatedLocation = await db
            .update(locationsTable)
            .set({
                ...body,
                updatedAt: new Date()
            })
            .where(eq(locationsTable.id, id))
            .returning();

        return NextResponse.json({ success: true, data: updatedLocation[0] });
    } catch (error: any) {
        console.error('Erreur PUT locations:', error);
        if (error.code === '23505') {
            return NextResponse.json({ success: false, error: 'Ce nom de lieu existe déjà' }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: 'Erreur lors de la mise à jour du lieu' }, { status: 500 });
    }
}

/**
 * Supprime un lieu
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;

        if (!session || (userRole !== 'admin' && userRole !== 'manager')) {
            return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
        }

        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'ID invalide' }, { status: 400 });
        }

        await db.delete(locationsTable).where(eq(locationsTable.id, id));

        return NextResponse.json({ success: true, message: 'Lieu supprimé avec succès' });
    } catch (error) {
        console.error('Erreur DELETE locations:', error);
        return NextResponse.json({ success: false, error: 'Erreur lors de la suppression du lieu' }, { status: 500 });
    }
}
