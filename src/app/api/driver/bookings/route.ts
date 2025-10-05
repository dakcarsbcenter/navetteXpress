import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { bookingsTable, users, vehiclesTable } from '@/schema';
import { eq, and, or } from 'drizzle-orm';

// GET - Récupérer les réservations du chauffeur connecté
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification et le rôle chauffeur
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'driver') {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les chauffeurs peuvent accéder à cette ressource." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Construire la requête avec filtres
    let query = db
      .select({
        booking: bookingsTable,
        vehicle: vehiclesTable,
      })
      .from(bookingsTable)
      .leftJoin(vehiclesTable, eq(bookingsTable.vehicleId, vehiclesTable.id))
      .where(eq(bookingsTable.driverId, session.user.id));

    // Filtrer par statut si spécifié
    if (status) {
      query = query.where(and(
        eq(bookingsTable.driverId, session.user.id),
        eq(bookingsTable.status, status as any)
      ));
    }

    const bookings = await query;

    return NextResponse.json({ 
      success: true, 
      data: bookings 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations du chauffeur:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}
