export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { bookingsTable, vehiclesTable } from '@/schema';
import { eq, and, ne } from 'drizzle-orm';

// GET - Récupérer les réservations du chauffeur connecté
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification et le rôle chauffeur
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;
    if (!session?.user || (session.user as { role?: string }).role !== 'driver') {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les chauffeurs peuvent accéder à cette ressource." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const userSession = session as unknown as { user: { id: string } }

    // Construire la requête avec filtres
    // Exclure automatiquement les réservations "pending" pour les chauffeurs (réservées aux admins)
    const whereConditions = status 
      ? and(
          eq(bookingsTable.driverId, userSession.user.id),
          eq(bookingsTable.status, status as 'assigned' | 'approved' | 'rejected' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'),
          // Exclure les statuts "pending" qui sont réservés aux admins
          ne(bookingsTable.status, 'pending')
        )
      : and(
          eq(bookingsTable.driverId, userSession.user.id),
          // Exclure les statuts "pending" qui sont réservés aux admins
          ne(bookingsTable.status, 'pending')
        );

    const bookings = await db
      .select({
        booking: bookingsTable,
        vehicle: vehiclesTable,
      })
      .from(bookingsTable)
      .leftJoin(vehiclesTable, eq(bookingsTable.vehicleId, vehiclesTable.id))
      .where(whereConditions);

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
