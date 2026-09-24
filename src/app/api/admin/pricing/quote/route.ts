export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pricingSegmentsTable } from '@/schema';
import { asc, eq } from 'drizzle-orm';
import { requireBookingsUpdate } from '@/utils/admin-permissions';
import { resolvePrice, type VehicleTypeKey } from '@/lib/pricing';

/**
 * GET /api/admin/pricing/quote?pickup=&dropoff=&vehicleType=&segmentId=
 *
 * Tarif paramétré (page /tarifs) correspondant à un trajet, pour reproposer un prix à
 * l'admin quand il corrige le départ/la destination d'une réservation. Même logique de
 * matching que le formulaire public — elle est partagée dans src/lib/pricing.ts.
 */
export async function GET(request: NextRequest) {
  try {
    try {
      await requireBookingsUpdate();
    } catch (permError) {
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
    }

    const { searchParams } = new URL(request.url);
    const pickup = searchParams.get('pickup')?.trim();
    const dropoff = searchParams.get('dropoff')?.trim();
    const vehicleType: VehicleTypeKey = searchParams.get('vehicleType') === 'suv' ? 'suv' : 'berline';
    const segmentIdRaw = searchParams.get('segmentId');
    const segmentId = segmentIdRaw && !isNaN(parseInt(segmentIdRaw)) ? parseInt(segmentIdRaw) : null;

    if (!pickup || !dropoff) {
      return NextResponse.json(
        { success: false, error: 'Départ et destination sont requis' },
        { status: 400 }
      );
    }

    const segments = await db
      .select()
      .from(pricingSegmentsTable)
      .where(eq(pricingSegmentsTable.isActive, true))
      .orderBy(asc(pricingSegmentsTable.sortOrder), asc(pricingSegmentsTable.id));

    const resolved = resolvePrice(segments, pickup, dropoff, vehicleType, segmentId);

    return NextResponse.json({
      success: true,
      data: {
        price: resolved.price,
        vehicleType,
        segment: resolved.segment
          ? { id: resolved.segment.id, route: resolved.segment.route }
          : null,
        // Secteurs alternatifs quand plusieurs tarifs couvrent le même couple de lieux
        alternatives: resolved.alternatives.map((alt) => ({
          segmentId: alt.segment.id,
          label: alt.label,
          route: alt.segment.route,
          price: alt.price,
        })),
      },
    });
  } catch (error) {
    console.error('Erreur lors du calcul du tarif:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
