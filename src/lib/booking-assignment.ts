/**
 * Assignation d'une réservation à un chauffeur.
 *
 * Extrait de admin/bookings/[id]/assign/route.ts pour être partagé avec la création
 * d'une réservation par l'admin (POST /api/admin/bookings), qui peut assigner le
 * chauffeur dans le même geste : les deux chemins doivent vérifier la disponibilité
 * et envoyer exactement les mêmes notifications au chauffeur.
 */

import { db } from '@/db';
import { bookingsTable, users } from '@/schema';
import { eq, and } from 'drizzle-orm';
import { checkDriverAvailability } from '@/lib/driver-availability';
import { sendWithRetry } from '@/lib/notification-queue';

type Booking = typeof bookingsTable.$inferSelect;

export type AssignBookingResult =
  | { success: true; booking: Booking; driverName: string }
  | { success: false; error: string; status: number; code?: 'DRIVER_NOT_AVAILABLE' };

export async function assignBookingToDriver(
  bookingId: number,
  driverId: string
): Promise<AssignBookingResult> {
  // Vérifier que le chauffeur existe et est actif
  const driverRows = await db
    .select()
    .from(users)
    .where(and(eq(users.id, driverId), eq(users.role, 'driver'), eq(users.isActive, true)))
    .limit(1);

  if (driverRows.length === 0) {
    return { success: false, error: 'Chauffeur non trouvé ou inactif', status: 404 };
  }

  const existingBooking = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId))
    .limit(1);

  if (existingBooking.length === 0) {
    return { success: false, error: 'Réservation non trouvée', status: 404 };
  }

  const assignedDriver = driverRows[0];
  const booking = existingBooking[0];

  // Vérifier la disponibilité du chauffeur à la date/heure de la réservation
  console.log(`🔍 Vérification de la disponibilité du chauffeur ${assignedDriver.name}...`);
  const availabilityCheck = await checkDriverAvailability(driverId, booking.scheduledDateTime);

  if (!availabilityCheck.available) {
    console.log(`❌ Chauffeur non disponible: ${availabilityCheck.message}`);
    return {
      success: false,
      error: availabilityCheck.message || "Le chauffeur n'est pas disponible à cette date et heure",
      code: 'DRIVER_NOT_AVAILABLE',
      status: 409,
    };
  }

  const updatedBooking = await db
    .update(bookingsTable)
    .set({
      driverId,
      status: 'assigned',
      updatedAt: new Date(),
    })
    .where(eq(bookingsTable.id, bookingId))
    .returning();

  const assignedBooking = updatedBooking[0];
  console.log(`✅ Réservation #${assignedBooking.id} assignée au chauffeur ${assignedDriver.name}`);

  // Notification au chauffeur assigné (retry automatique en cas d'échec)
  await sendWithRetry('email', 'resend-email.sendBookingAssignedToDriver', [
    {
      id: assignedBooking.id,
      customerName: assignedBooking.customerName,
      customerEmail: assignedBooking.customerEmail,
      customerPhone: assignedBooking.customerPhone || undefined,
      pickupAddress: assignedBooking.pickupAddress,
      dropoffAddress: assignedBooking.dropoffAddress,
      scheduledDateTime: assignedBooking.scheduledDateTime.toISOString(),
      passengers: assignedBooking.passengers,
      price: assignedBooking.price || undefined,
      notes: assignedBooking.notes || undefined,
      passengerName: assignedBooking.passengerName,
      passengerPhone: assignedBooking.passengerPhone,
    },
    {
      name: assignedDriver.name,
      email: assignedDriver.email,
    },
  ]);

  // Unique message WhatsApp envoyé au chauffeur : le gabarit 2chauffeur_assigne
  // porte lui-même les boutons Accepter/Refuser, traités par le webhook Geskap.
  await sendWithRetry('whatsapp', 'whatsapp.sendChauffeurAssigne', [
    assignedBooking,
    {
      name: assignedDriver.name,
      phone: assignedDriver.phone,
      vehicleBrand: assignedDriver.vehicleBrand,
      vehicleModel: assignedDriver.vehicleModel,
      vehiclePlateNumber: assignedDriver.vehiclePlateNumber,
    },
  ]);

  return { success: true, booking: assignedBooking, driverName: assignedDriver.name };
}
