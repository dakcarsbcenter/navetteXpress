export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { bookingsTable, users } from '@/schema';
import { eq } from 'drizzle-orm';
import { requireBookingsRead, requireBookingsUpdate, requireBookingsDelete } from '@/utils/admin-permissions';
import { sendWithRetry } from '@/lib/notification-queue';
import { formatDateTimeBilingual } from '@/lib/email-i18n';

// GET - Récupérer une réservation par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await requireBookingsRead(); // Vérification de la permission de lecture
    } catch (permError) {
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID invalide'
      }, { status: 400 });
    }

    const booking = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .limit(1);

    if (booking.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Réservation non trouvée'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: booking[0]
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

const BOOKING_STATUSES = [
  'pending',
  'assigned',
  'approved',
  'rejected',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
] as const;

/**
 * Validation du corps du PATCH. Sans elle, une valeur hors enum partait telle quelle vers
 * Postgres et remontait en 500 au lieu d'un 400 explicite. Les bornes passagers/bagages
 * reprennent les CHECK constraints de bookingsTable (passengers > 0, luggage >= 0).
 */
const nullableText = z.union([z.string(), z.null()]).optional();

const BookingPatchSchema = z.object({
  status: z.enum(BOOKING_STATUSES).optional(),
  oldStatus: z.string().optional(),
  driverId: z.union([z.string(), z.null()]).optional(),
  vehicleId: z.union([z.number().int(), z.null()]).optional(),
  price: z.union([z.string(), z.number(), z.null()]).optional(),
  notes: nullableText,
  cancellationReason: nullableText,

  // Champs métier ouverts à la correction par l'admin (réservations créées par des
  // visiteurs non connectés, qui ne peuvent pas corriger leur saisie eux-mêmes).
  customerName: z.string().trim().min(2, 'Nom trop court').max(120).optional(),
  customerEmail: z.string().trim().email('Format d\'email invalide').max(255).optional(),
  customerPhone: z.string().trim().min(6, 'Téléphone trop court').max(30).optional(),
  pickupAddress: z.string().trim().min(2, 'Lieu de départ requis').max(255).optional(),
  dropoffAddress: z.string().trim().min(2, 'Destination requise').max(255).optional(),
  scheduledDateTime: z
    .string()
    .refine((v) => !isNaN(new Date(v).getTime()), 'Date programmée invalide')
    .optional(),
  passengers: z.number().int().min(1, 'Au moins 1 passager').max(50).optional(),
  luggage: z.number().int().min(0, 'Nombre de bagages négatif').max(50).optional(),
  requestedVehicleType: z.enum(['berline', 'suv']).optional(),
  flightNumber: nullableText,
  airline: nullableText,

  // Réservation pour un tiers : une chaîne vide repasse la course en "le client voyage lui-même".
  passengerName: z.union([z.string().trim().max(120), z.null()]).optional(),
  passengerPhone: z.union([z.string().trim().max(30), z.null()]).optional(),

  /** Envoi (ou non) des notifications de modification au client et au chauffeur. */
  notifyOnUpdate: z.boolean().optional(),
});

/** Champs dont la modification intéresse réellement le client et le chauffeur. */
const TRACKED_FIELDS = [
  { key: 'passengerName', labelFr: 'Passager', labelEn: 'Passenger' },
  { key: 'pickupAddress', labelFr: 'Départ', labelEn: 'Pick-up' },
  { key: 'dropoffAddress', labelFr: 'Destination', labelEn: 'Drop-off' },
  { key: 'scheduledDateTime', labelFr: 'Date et heure', labelEn: 'Date and time' },
  { key: 'passengers', labelFr: 'Passagers', labelEn: 'Passengers' },
  { key: 'luggage', labelFr: 'Bagages', labelEn: 'Luggage' },
  { key: 'requestedVehicleType', labelFr: 'Véhicule', labelEn: 'Vehicle' },
  { key: 'flightNumber', labelFr: 'Vol', labelEn: 'Flight' },
  { key: 'airline', labelFr: 'Compagnie', labelEn: 'Airline' },
] as const;

export interface BookingChange {
  labelFr: string;
  labelEn: string;
  before: string;
  after: string;
}

function displayValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'scheduledDateTime') return formatDateTimeBilingual(value as Date | string);
  if (key === 'requestedVehicleType') return value === 'suv' ? 'SUV' : 'Berline';
  return String(value);
}

// PATCH - Mettre à jour partiellement une réservation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let adminUserId: string;
    try {
      adminUserId = await requireBookingsUpdate(); // Vérification de la permission de mise à jour
    } catch (permError) {
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID invalide'
      }, { status: 400 });
    }

    const validation = BookingPatchSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Données invalides',
        details: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }
    const body = validation.data;

    // Récupérer la réservation actuelle pour comparer
    const currentBooking = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .limit(1);

    if (currentBooking.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Réservation non trouvée'
      }, { status: 404 });
    }

    const oldBooking = currentBooking[0];

    // Construction dynamique de l'objet de mise à jour
    const updateData: Partial<typeof bookingsTable.$inferInsert> = {
      updatedAt: new Date(),
    };

    // Ajout conditionnel des champs à mettre à jour
    const oldStatus = body.oldStatus; // Pour détecter les changements
    if (body.status !== undefined) updateData.status = body.status;
    if (body.driverId !== undefined) updateData.driverId = body.driverId;
    if (body.vehicleId !== undefined) updateData.vehicleId = body.vehicleId;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Champs métier corrigeables par l'admin
    if (body.customerName !== undefined) updateData.customerName = body.customerName;
    if (body.customerEmail !== undefined) updateData.customerEmail = body.customerEmail;
    if (body.customerPhone !== undefined) updateData.customerPhone = body.customerPhone;
    if (body.pickupAddress !== undefined) updateData.pickupAddress = body.pickupAddress;
    if (body.dropoffAddress !== undefined) updateData.dropoffAddress = body.dropoffAddress;
    if (body.scheduledDateTime !== undefined) updateData.scheduledDateTime = new Date(body.scheduledDateTime);
    if (body.passengers !== undefined) updateData.passengers = body.passengers;
    if (body.luggage !== undefined) updateData.luggage = body.luggage;
    if (body.requestedVehicleType !== undefined) updateData.requestedVehicleType = body.requestedVehicleType;
    if (body.flightNumber !== undefined) updateData.flightNumber = body.flightNumber;
    if (body.airline !== undefined) updateData.airline = body.airline;
    if (body.passengerName !== undefined) updateData.passengerName = body.passengerName || null;
    if (body.passengerPhone !== undefined) updateData.passengerPhone = body.passengerPhone || null;

    // Annulation définitive déclenchée par l'admin : seule cette action notifie le client
    if (body.status === 'cancelled' && oldStatus !== 'cancelled') {
      updateData.cancelledBy = adminUserId;
      updateData.cancelledAt = new Date();
      if (body.cancellationReason !== undefined) updateData.cancellationReason = body.cancellationReason;
    }

    // Si l'admin définit ou modifie le prix
    if (body.price !== undefined) {
      const newPrice = body.price === null ? null : String(body.price);
      updateData.price = newPrice;
      // Si c'est la première fois qu'un prix est défini OU si le prix change
      if (!oldBooking.price || oldBooking.price !== newPrice) {
        updateData.priceProposedAt = new Date();
        updateData.clientResponse = 'pending'; // En attente de réponse du client
        updateData.clientResponseAt = null;
        updateData.clientResponseMessage = null;
      }
    }

    // Différentiel métier calculé AVANT l'écriture, pour lister "ancienne → nouvelle valeur"
    // dans les notifications de modification.
    const changes: BookingChange[] = [];
    for (const field of TRACKED_FIELDS) {
      const next = (updateData as Record<string, unknown>)[field.key];
      if (next === undefined) continue;
      const previous = (oldBooking as Record<string, unknown>)[field.key];
      const beforeLabel = displayValue(field.key, previous);
      const afterLabel = displayValue(field.key, next);
      if (beforeLabel === afterLabel) continue;
      changes.push({
        labelFr: field.labelFr,
        labelEn: field.labelEn,
        before: beforeLabel,
        after: afterLabel,
      });
    }

    const updatedBooking = await db
      .update(bookingsTable)
      .set(updateData)
      .where(eq(bookingsTable.id, id))
      .returning();

    if (updatedBooking.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Réservation non trouvée'
      }, { status: 404 });
    }

    const booking = updatedBooking[0];

    // Envoyer notification au client si la réservation est confirmée (retry automatique en cas d'échec)
    if (body.status === 'confirmed' && oldStatus !== 'confirmed') {
      // Récupérer les infos du chauffeur si assigné
      let driver = undefined;
      if (booking.driverId) {
        const driverData = await db
          .select()
          .from(users)
          .where(eq(users.id, booking.driverId))
          .limit(1);
        if (driverData.length > 0) {
          driver = {
            name: driverData[0].name,
            email: driverData[0].email,
            phone: driverData[0].phone
          };
        }
      }

      await sendWithRetry('email', 'resend-email.sendBookingConfirmedToClient', [
        {
          id: booking.id,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone || undefined,
          pickupAddress: booking.pickupAddress,
          dropoffAddress: booking.dropoffAddress,
          scheduledDateTime: booking.scheduledDateTime.toISOString(),
          passengers: booking.passengers,
          price: booking.price || undefined,
          notes: booking.notes || undefined
        },
        driver
      ]);

      await sendWithRetry('whatsapp', 'whatsapp.sendReservationValidee', [
        booking,
        { name: driver?.name || 'Votre chauffeur', phone: driver?.phone ?? null }
      ]);
    }

    // Annulation définitive : seul l'admin peut déclencher cette notification au client
    if (body.status === 'cancelled' && oldStatus !== 'cancelled') {
      await sendWithRetry('email', 'resend-email.sendBookingCancelledToClient', [
        {
          id: booking.id,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone || undefined,
          pickupAddress: booking.pickupAddress,
          dropoffAddress: booking.dropoffAddress,
          scheduledDateTime: booking.scheduledDateTime.toISOString(),
          passengers: booking.passengers,
        },
        booking.cancellationReason || undefined
      ]);
    }

    // Envoyer notification au chauffeur si un chauffeur est nouvellement assigné.
    // Fix: la condition comparait auparavant body.driverId (un id chauffeur) à
    // oldStatus (un statut de réservation) — toujours faux en pratique, ce qui
    // aurait fait renvoyer les notifications à chaque sauvegarde du formulaire
    // admin, même sans changement de chauffeur. On compare au bon avant/après.
    const driverJustAssigned = Boolean(body.driverId && body.driverId !== oldBooking.driverId);
    if (driverJustAssigned) {
      const driverData = await db
        .select()
        .from(users)
        .where(eq(users.id, body.driverId as string))
        .limit(1);

      if (driverData.length > 0) {
        const driver = {
          name: driverData[0].name,
          email: driverData[0].email,
          phone: driverData[0].phone
        };

        await sendWithRetry('email', 'resend-email.sendBookingAssignedToDriver', [
          {
            id: booking.id,
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone || undefined,
            pickupAddress: booking.pickupAddress,
            dropoffAddress: booking.dropoffAddress,
            scheduledDateTime: booking.scheduledDateTime.toISOString(),
            passengers: booking.passengers,
            price: booking.price || undefined,
            notes: booking.notes || undefined,
            passengerName: booking.passengerName,
            passengerPhone: booking.passengerPhone
          },
          driver
        ]);

        await sendWithRetry('whatsapp', 'whatsapp.sendChauffeurAssigne', [booking, driver]);
        await sendWithRetry('whatsapp', 'whatsapp.sendConfirmationChauffeur', [booking, driver]);
      }
    }

    // Notification de modification : uniquement si un champ métier a réellement changé, et
    // seulement si l'admin n'a pas décoché la case (correction d'une coquille en silence).
    // On ne renvoie rien au chauffeur qui vient d'être assigné : il reçoit déjà le détail
    // complet de la course juste au-dessus.
    if (changes.length > 0 && body.notifyOnUpdate !== false) {
      const bookingSummary = {
        id: booking.id,
        reference: `NX-${booking.id}`,
        customerName: booking.customerName,
        pickupAddress: booking.pickupAddress,
        dropoffAddress: booking.dropoffAddress,
        scheduledDateTime: formatDateTimeBilingual(booking.scheduledDateTime),
        passengers: booking.passengers,
        luggage: booking.luggage,
        price: booking.price,
      };

      if (booking.customerEmail) {
        await sendWithRetry('email', 'resend-mailer.sendBookingUpdatedEmail', [
          booking.customerEmail,
          { ...bookingSummary, changes, recipient: 'client' },
        ]);
      }

      await sendWithRetry('whatsapp', 'whatsapp.sendReservationModifiee', [booking, changes, 'client']);

      if (booking.driverId && !driverJustAssigned) {
        const assignedDriver = await db
          .select()
          .from(users)
          .where(eq(users.id, booking.driverId))
          .limit(1);

        if (assignedDriver.length > 0) {
          if (assignedDriver[0].email) {
            await sendWithRetry('email', 'resend-mailer.sendBookingUpdatedEmail', [
              assignedDriver[0].email,
              { ...bookingSummary, changes, recipient: 'driver' },
            ]);
          }
          await sendWithRetry('whatsapp', 'whatsapp.sendReservationModifiee', [
            booking,
            changes,
            'driver',
            { name: assignedDriver[0].name, phone: assignedDriver[0].phone },
          ]);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réservation:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// NOTE: la méthode PUT a été supprimée. Elle dupliquait PATCH sans gérer passengers/luggage
// ni les notifications, et n'était appelée par aucun écran — tout passe désormais par PATCH.

// DELETE - Supprimer une réservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await requireBookingsDelete(); // Vérification de la permission de suppression
    } catch (permError) {
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID invalide'
      }, { status: 400 });
    }

    const deletedBooking = await db
      .delete(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .returning();

    if (deletedBooking.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Réservation non trouvée'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Réservation supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la réservation:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}
