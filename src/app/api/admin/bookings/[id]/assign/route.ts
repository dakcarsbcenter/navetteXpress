export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { requireBookingsUpdate } from '@/utils/admin-permissions';
import { assignBookingToDriver } from '@/lib/booking-assignment';

// PUT - Assigner une réservation à un chauffeur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await requireBookingsUpdate(); // Vérification de la permission de mise à jour
    } catch (permError) {
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
    }

    const { id } = await params;
    const bookingId = parseInt(id);
    if (isNaN(bookingId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID invalide' 
      }, { status: 400 });
    }

    const { driverId } = await request.json();

    if (!driverId) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID du chauffeur requis' 
      }, { status: 400 });
    }

    // Vérification de disponibilité, mise à jour et notifications au chauffeur :
    // logique partagée avec la création d'une réservation par l'admin.
    const result = await assignBookingToDriver(bookingId, driverId);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        ...(result.code ? { code: result.code } : {}),
      }, { status: result.status });
    }

    return NextResponse.json({
      success: true, 
      data: result.booking,
      message: `Réservation assignée avec succès au chauffeur ${result.driverName}. Notification envoyée.`
    });
  } catch (error) {
    console.error('Erreur lors de l\'assignation de la réservation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}
