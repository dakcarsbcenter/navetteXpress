/**
 * Logique partagée pour la réponse d'un chauffeur à une course assignée
 * (accepter/refuser), utilisée à la fois par PUT /api/driver/bookings/[id]/response
 * (session chauffeur authentifiée) et par le webhook Geskap (réponse via les
 * boutons WhatsApp "Accepter"/"Refuser" du template confirmation_chauffeur).
 *
 * Extrait ici pour éviter une troisième implémentation divergente du même
 * état — voir project-driver-booking-response-flows (mémoire) sur les deux
 * endpoints déjà trouvés désynchronisés par le passé.
 */

import { db } from '@/db';
import { bookingsTable, users } from '@/schema';
import { eq, and } from 'drizzle-orm';
import { sendWithRetry } from '@/lib/notification-queue';
import { toGeskapPhone } from '@/lib/whatsapp/geskap';

export type DriverBookingAction = 'approve' | 'reject';

/**
 * Retrouve un chauffeur par numéro de téléphone (réponse WhatsApp entrante,
 * webhook Geskap). Comparaison sur le numéro normalisé plutôt qu'une égalité
 * stricte : les numéros sont historiquement stockés sans indicatif pays en
 * base (voir toGeskapPhone), donc leur format brut n'est pas fiable.
 */
export async function findDriverIdByPhone(rawPhone: string): Promise<string | null> {
  const normalizedIncoming = toGeskapPhone(rawPhone);
  const drivers = await db.select({ id: users.id, phone: users.phone }).from(users).where(eq(users.role, 'driver'));
  const match = drivers.find((d) => d.phone && toGeskapPhone(d.phone) === normalizedIncoming);
  return match?.id ?? null;
}

interface RespondResult {
  success: boolean;
  error?: string;
  booking?: typeof bookingsTable.$inferSelect;
}

/** Une course en attente de réponse du chauffeur donné (statut 'assigned'). */
export async function findPendingAssignedBooking(driverId: string) {
  const rows = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.driverId, driverId), eq(bookingsTable.status, 'assigned')))
    .limit(1);
  return rows[0] ?? null;
}

export async function respondToAssignedBooking(
  bookingId: number,
  driverId: string,
  action: DriverBookingAction
): Promise<RespondResult> {
  const existingBooking = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.driverId, driverId), eq(bookingsTable.status, 'assigned')))
    .limit(1);

  if (existingBooking.length === 0) {
    return { success: false, error: 'Réservation non trouvée ou non assignée à ce chauffeur' };
  }

  const originalBooking = existingBooking[0];
  const newStatus = action === 'approve' ? 'confirmed' : 'pending';

  const updateData: Partial<typeof bookingsTable.$inferInsert> = {
    status: newStatus,
    updatedAt: new Date(),
  };
  if (action === 'reject') {
    updateData.driverId = null;
  }

  const updatedBooking = await db.update(bookingsTable).set(updateData).where(eq(bookingsTable.id, bookingId)).returning();
  const responseBooking = updatedBooking[0];

  console.log(`✅ Réservation #${responseBooking.id} ${action === 'approve' ? 'approuvée' : 'rejetée'} par le chauffeur`);

  const driverInfo = await db.select({ name: users.name, phone: users.phone }).from(users).where(eq(users.id, driverId)).limit(1);
  const driver = driverInfo[0];

  if (action === 'approve') {
    await sendWithRetry('email', 'resend-mailer.sendBookingConfirmedByDriverEmail', [
      originalBooking.customerEmail,
      {
        bookingId: `BOOK-${responseBooking.id}`,
        customerName: originalBooking.customerName,
        driverName: driver?.name || 'Votre chauffeur',
        driverPhone: driver?.phone || undefined,
        pickupLocation: originalBooking.pickupAddress,
        dropoffLocation: originalBooking.dropoffAddress,
        pickupDate: new Date(originalBooking.scheduledDateTime).toLocaleDateString('fr-FR'),
        pickupTime: new Date(originalBooking.scheduledDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    await sendWithRetry('whatsapp', 'whatsapp.sendReservationValidee', [
      responseBooking,
      { name: driver?.name || 'Votre chauffeur', phone: driver?.phone ?? null },
    ]);
  } else {
    await sendWithRetry('email', 'resend-mailer.sendBookingRejectedByDriverEmail', [
      {
        bookingId: responseBooking.id,
        customerName: originalBooking.customerName,
        driverName: driver?.name || 'Un chauffeur',
        pickupAddress: originalBooking.pickupAddress,
        dropoffAddress: originalBooking.dropoffAddress,
        scheduledDateTime: originalBooking.scheduledDateTime.toISOString(),
      },
    ]);
  }

  return { success: true, booking: responseBooking };
}
