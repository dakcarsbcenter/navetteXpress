export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { vehicleReportsTable, vehiclesTable } from '@/schema';
import { eq, desc, and } from 'drizzle-orm';

// GET - Récupérer les rapports du chauffeur connecté
export async function GET() {
    try {
        const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;
        if (!session?.user || (session.user as { role?: string }).role !== 'driver') {
            return NextResponse.json(
                { error: "Accès refusé. Chauffeurs uniquement." },
                { status: 403 }
            );
        }

        const userId = session.user.id as string;

        const reports = await db
            .select({
                id: vehicleReportsTable.id,
                title: vehicleReportsTable.title,
                description: vehicleReportsTable.description,
                category: vehicleReportsTable.category,
                severity: vehicleReportsTable.severity,
                status: vehicleReportsTable.status,
                reportedAt: vehicleReportsTable.reportedAt,
                vehicleInfo: {
                    make: vehiclesTable.make,
                    model: vehiclesTable.model,
                    plateNumber: vehiclesTable.plateNumber,
                    year: vehiclesTable.year,
                }
            })
            .from(vehicleReportsTable)
            .leftJoin(vehiclesTable, eq(vehicleReportsTable.vehicleTableId, vehiclesTable.id))
            .where(eq(vehicleReportsTable.driverId, userId))
            .orderBy(desc(vehicleReportsTable.reportedAt));

        return NextResponse.json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error('Erreur API reports GET:', error);
        return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }
}

// POST - Créer un nouveau rapport
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;
        if (!session?.user || (session.user as { role?: string }).role !== 'driver') {
            return NextResponse.json(
                { error: "Accès refusé. Chauffeurs uniquement." },
                { status: 403 }
            );
        }

        const { title, description, category, severity, vehicleId } = await request.json();

        // Note: vehicleId reçu du front est l'ID technique (mercedes-classe-s). 
        // Je dois trouver l'ID numérique correspondant.
        // Mais pour simplifier, si le front envoie déjà l'ID numérique ça serait mieux.
        // Je vais adapter le front pour envoyer l'ID numérique.

        if (!title || !description || !category || !severity || !vehicleId) {
            return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
        }

        const [newReport] = await db.insert(vehicleReportsTable).values({
            title,
            description,
            category,
            severity,
            vehicleTableId: parseInt(vehicleId),
            driverId: session.user.id as string,
            status: 'open',
        }).returning();

        // Récupérer les infos du véhicule pour la réponse
        const vehicle = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, parseInt(vehicleId))).limit(1);

        return NextResponse.json({
            success: true,
            ...newReport,
            vehicleInfo: vehicle[0] || {}
        });
    } catch (error) {
        console.error('Erreur API reports POST:', error);
        return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }
}
