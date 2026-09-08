export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { vehiclesTable } from '@/schema';
import { eq, desc } from 'drizzle-orm';
import { isAuthorizedPublicApiCall } from '@/lib/security/appToken';

/**
 * API publique pour récupérer tous les véhicules actifs
 * Utilisée par la page Flotte pour afficher les véhicules disponibles
 */
export async function GET(request: Request) {
  if (!(await isAuthorizedPublicApiCall(request))) {
    return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
  }

  try {
    // Récupérer tous les véhicules actifs (les plus récents en premier)
    const vehicles = await db
      .select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.isActive, true))
      .orderBy(desc(vehiclesTable.createdAt));

    return NextResponse.json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des véhicules:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des véhicules',
      },
      { status: 500 }
    );
  }
}


