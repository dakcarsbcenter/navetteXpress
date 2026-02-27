import { NextResponse } from 'next/server';
import { db } from '@/db';
import { locationsTable } from '@/schema';
import { eq, desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Récupère tous les lieux actifs ou tous les lieux selon le rôle
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const all = searchParams.get('all') === 'true';

        // Rendre la table plus ordonnée pour l'admin, on récupère tout
        let query = db.select().from(locationsTable).orderBy(desc(locationsTable.createdAt));

        // Si c'est pour le client, on ne récupère que les actifs
        // (Cependant, pour l'admin 'all' est utilisé)
        if (!all) {
            // @ts-ignore
            query = db.select().from(locationsTable).where(eq(locationsTable.isActive, true)).orderBy(desc(locationsTable.createdAt));
        }

        const locations = await query;
        return NextResponse.json({ success: true, data: locations });
    } catch (error) {
        console.error('Erreur GET locations:', error);
        return NextResponse.json({ success: false, error: 'Erreur lors de la récupération des lieux' }, { status: 500 });
    }
}

/**
 * Ajoute un nouveau lieu (Admin/Manager uniquement)
 */
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;

        if (!session || (userRole !== 'admin' && userRole !== 'manager')) {
            return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
        }

        const body = await request.json();
        const { name, isActive } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Le nom est requis' }, { status: 400 });
        }

        const newLocation = await db.insert(locationsTable).values({
            name,
            isActive: isActive !== undefined ? isActive : true
        }).returning();

        return NextResponse.json({ success: true, data: newLocation[0] });
    } catch (error: any) {
        console.error('Erreur POST locations:', error);
        // Gestion rudimentaire de contrainte d'unicité
        if (error.code === '23505') {
            return NextResponse.json({ success: false, error: 'Ce lieu existe déjà' }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: 'Erreur lors de la création du lieu' }, { status: 500 });
    }
}
