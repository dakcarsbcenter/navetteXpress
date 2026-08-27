export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookingsTable, vehiclesTable, users } from '@/schema';
import { eq, and, gte, lt, ne } from 'drizzle-orm';
import { requireBookingsRead } from '@/utils/admin-permissions';
import { checkDriverAvailability } from '@/lib/driver-availability';

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  sedan: 'Berline',
  suv: 'SUV',
  van: 'Van',
  luxury: 'Luxe',
  bus: 'Bus',
};

// GET - Chauffeurs actifs et leur statut au moment de la course d'une réservation donnée
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await requireBookingsRead();
    } catch (permError) {
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
    }

    const resolvedParams = await params;
    const bookingId = parseInt(resolvedParams.id);
    if (isNaN(bookingId)) {
      return NextResponse.json({ success: false, error: 'ID invalide' }, { status: 400 });
    }

    const bookingRows = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (bookingRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Réservation non trouvée' }, { status: 404 });
    }
    const booking = bookingRows[0];
    const scheduledDateTime = new Date(booking.scheduledDateTime);
    const durationHours = Number(booking.duration ?? 2);
    const windowEnd = new Date(scheduledDateTime.getTime() + durationHours * 3600 * 1000);

    const dayStart = new Date(scheduledDateTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const driverRows = await db.select({ id: users.id, name: users.name })
      .from(users)
      .where(and(eq(users.role, 'driver'), eq(users.isActive, true)));

    const drivers = await Promise.all(driverRows.map(async (driver) => {
      const [vehicle] = await db.select({ vehicleType: vehiclesTable.vehicleType, category: vehiclesTable.category })
        .from(vehiclesTable)
        .where(and(eq(vehiclesTable.driverId, driver.id), eq(vehiclesTable.isActive, true)))
        .limit(1);

      const todaysBookings = await db.select({
        id: bookingsTable.id,
        status: bookingsTable.status,
        scheduledDateTime: bookingsTable.scheduledDateTime,
        duration: bookingsTable.duration,
      })
        .from(bookingsTable)
        .where(and(
          eq(bookingsTable.driverId, driver.id),
          gte(bookingsTable.scheduledDateTime, dayStart),
          lt(bookingsTable.scheduledDateTime, dayEnd),
          ne(bookingsTable.status, 'cancelled'),
        ));

      const overlapping = todaysBookings.find((b) => {
        if (b.id === bookingId) return false;
        const bStart = new Date(b.scheduledDateTime);
        const bEnd = new Date(bStart.getTime() + Number(b.duration ?? 2) * 3600 * 1000);
        return bStart < windowEnd && bEnd > scheduledDateTime;
      });

      const availability = await checkDriverAvailability(driver.id, scheduledDateTime);

      let status: 'available' | 'busy' | 'unavailable' = 'available';
      let reason: string | undefined;
      let busyUntil: string | undefined;

      if (overlapping && overlapping.status === 'in_progress') {
        status = 'busy';
        const busyUntilDate = new Date(
          new Date(overlapping.scheduledDateTime).getTime() + Number(overlapping.duration ?? 2) * 3600 * 1000
        );
        busyUntil = busyUntilDate.toISOString();
        reason = `Ce chauffeur est en course jusqu'à ${busyUntilDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}, soit après l'heure de prise en charge. L'assignation est bloquée pour éviter le chevauchement.`;
      } else if (overlapping) {
        status = 'unavailable';
        reason = `Ce chauffeur a déjà une course prévue à ${new Date(overlapping.scheduledDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`;
      } else if (!availability.available) {
        status = 'unavailable';
        reason = availability.message;
      }

      return {
        id: driver.id,
        name: driver.name,
        vehicleLabel: vehicle ? (vehicle.category || VEHICLE_TYPE_LABELS[vehicle.vehicleType] || 'Véhicule') : null,
        bookingsToday: todaysBookings.filter((b) => b.id !== bookingId).length,
        status,
        reason,
        busyUntil,
      };
    }));

    return NextResponse.json({
      success: true,
      data: {
        drivers,
        totalActiveDrivers: driverRows.length,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des chauffeurs disponibles:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
