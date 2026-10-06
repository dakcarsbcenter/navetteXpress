export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { bookingsTable, users, vehiclesTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { requireBookingsRead, requireBookingsCreate } from '@/utils/admin-permissions';
import { assignBookingToDriver } from '@/lib/booking-assignment';
import { sendWithRetry } from '@/lib/notification-queue';
import { normalizePhoneForStorage } from '@/lib/phone';
import { emptyToUndefined, optionalCustomerEmail } from '@/lib/validation';
import { BookingTripSchema, MAX_BOOKING_TRIPS } from '@/lib/booking-trips';
import { buildBookingNotes } from '@/lib/booking-notes';

// Créer des alias pour les jointures multiples
const driverUsers = alias(users, 'driver_users');
const cancelledByUsers = alias(users, 'cancelled_by_users');

// GET - Récupérer toutes les réservations avec leurs détails
export async function GET() {
  try {
    console.log('📋 [API Bookings] Début de la requête GET')

    // Vérification de la permission de lecture
    try {
      await requireBookingsRead();
      console.log('✅ [API Bookings] Permission de lecture validée')
    } catch (permError) {
      console.error('❌ [API Bookings] Erreur de permission:', permError)
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: statusCode });
    }

    console.log('🔍 [API Bookings] Requête à la base de données...')
    const bookings = await db
      .select({
        booking: bookingsTable,
        driver: driverUsers,
        vehicle: vehiclesTable,
        cancelledByUser: {
          name: cancelledByUsers.name,
          role: cancelledByUsers.role
        },
      })
      .from(bookingsTable)
      .leftJoin(driverUsers, eq(bookingsTable.driverId, driverUsers.id))
      .leftJoin(vehiclesTable, eq(bookingsTable.vehicleId, vehiclesTable.id))
      .leftJoin(cancelledByUsers, eq(bookingsTable.cancelledBy, cancelledByUsers.id));

    console.log(`✅ [API Bookings] ${bookings.length} réservations récupérées`)
    return NextResponse.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('❌ [API Bookings] Erreur lors de la récupération:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

/**
 * Un trajet de la demande saisie par l'admin. On repart du contrat partagé avec le
 * formulaire public (BookingTripSchema) avec deux écarts assumés :
 *  - la date arrive déjà en ISO, le champ datetime-local ayant été converti côté
 *    client : pas de couple date + heure à recoller, donc pas d'ambiguïté de fuseau ;
 *  - le prix est transmis, car l'admin l'annonce au téléphone et il ne se déduit pas
 *    toujours des secteurs tarifés (course hors grille, geste commercial).
 */
const AdminTripSchema = BookingTripSchema
  .omit({ date: true, time: true, pricingSegmentId: true })
  .extend({
    scheduledDateTime: z
      .string()
      .refine((v) => !isNaN(new Date(v).getTime()), 'Date programmée invalide'),
    price: z.union([z.number().min(0), z.null()]).optional(),
  });

type AdminTrip = z.infer<typeof AdminTripSchema>;

/**
 * Création d'une demande de réservation par l'admin, au téléphone, pour le compte d'un
 * client qui ne peut pas remplir le formulaire lui-même (client analphabète, appel
 * entrant, client sans smartphone). Les champs reprennent ceux du formulaire public
 * (POST /api/bookings) pour que la course soit indiscernable d'une demande en ligne
 * côté chauffeur, notifications et facturation — y compris les demandes à plusieurs
 * trajets, qui donnent une réservation par trajet sous un même `bookingGroupId`.
 *
 * Deux écarts assumés par rapport au formulaire public :
 *  - l'email du client est optionnel (un client analphabète n'en a souvent pas) ;
 *    la colonne étant NOT NULL, on stocke une chaîne vide et les envois d'email au
 *    client sont sautés côté notifications ;
 *  - aucune alerte email n'est envoyée à l'admin : c'est lui qui saisit la demande.
 */
const BookingCreateSchema = z.object({
  customerName: z.string().trim().min(2, 'Nom du client trop court').max(120),
  // Optionnel : un client analphabète n'a souvent pas d'adresse email.
  customerEmail: optionalCustomerEmail,
  customerPhone: z.string().trim().min(6, 'Téléphone trop court').max(30),

  /** Demande multi-trajets. Absent, les champs à plat ci-dessous font foi. */
  trips: z.array(AdminTripSchema).min(1).max(MAX_BOOKING_TRIPS).optional(),

  // Champs d'une demande à un seul trajet, conservés pour les appelants qui ne
  // connaissent pas `trips` (même repli que la route publique).
  pickupAddress: z.string().trim().min(2, 'Lieu de départ requis').max(255).optional(),
  dropoffAddress: z.string().trim().min(2, 'Destination requise').max(255).optional(),
  scheduledDateTime: z
    .string()
    .refine((v) => !isNaN(new Date(v).getTime()), 'Date programmée invalide')
    .optional(),
  passengers: z.number().int().min(1, 'Au moins 1 passager').max(50).optional(),
  luggage: z.number().int().min(0, 'Nombre de bagages négatif').max(50).optional(),
  requestedVehicleType: z.enum(['berline', 'suv']).optional(),
  duration: z.number().min(0.5).max(24).optional(),
  price: z.union([z.number().min(0), z.null()]).optional(),
  serviceType: z.string().trim().max(60).optional(),
  flightNumber: z.preprocess(emptyToUndefined, z.string().trim().max(20).optional()),
  airline: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()),

  // Communs à toute la demande, quel que soit le nombre de trajets.
  additionalServices: z.array(z.string().trim().max(40)).max(20).optional(),
  specialRequests: z.string().trim().max(2000).optional(),

  // Réservation pour un tiers : le contact reste le client, passengerName identifie
  // la personne réellement transportée.
  passengerName: z.preprocess(emptyToUndefined, z.string().trim().min(2, 'Nom du passager invalide').max(120).optional()),
  passengerPhone: z.preprocess(emptyToUndefined, z.string().trim().max(30).optional()),

  /** Compte client existant à rattacher, pour que la course apparaisse dans son espace. */
  userId: z.preprocess(emptyToUndefined, z.string().trim().max(64).optional()),
  /** Assignation immédiate du chauffeur, dans le même geste que la création. */
  driverId: z.preprocess(emptyToUndefined, z.string().trim().max(64).optional()),
  /** Véhicule affecté dès la saisie : évite un second passage par la fiche. */
  vehicleId: z.union([z.number().int(), z.null()]).optional(),
  /** Accusé de réception WhatsApp au client (inutile pour un client qui ne lit pas). */
  notifyClient: z.boolean().optional(),
  /** Message d'assignation au chauffeur (envoyé par défaut). */
  notifyDriver: z.boolean().optional(),
});

type BookingCreateBody = z.infer<typeof BookingCreateSchema>;

/**
 * Trajets de la demande : ceux transmis, ou le repli sur les champs à plat d'une
 * demande à un seul trajet. Renvoie une erreur lisible plutôt qu'un 500 si ni l'un
 * ni l'autre n'est exploitable.
 */
function resolveTrips(body: BookingCreateBody): { trips: AdminTrip[] } | { error: string } {
  if (body.trips?.length) return { trips: body.trips };

  if (!body.pickupAddress) return { error: 'Lieu de départ requis' };
  if (!body.dropoffAddress) return { error: 'Destination requise' };
  if (!body.scheduledDateTime) return { error: 'Date programmée requise' };

  return {
    trips: [{
      serviceType: body.serviceType ?? '',
      customServiceType: null,
      pickupAddress: body.pickupAddress,
      destinationAddress: body.dropoffAddress,
      scheduledDateTime: body.scheduledDateTime,
      passengers: body.passengers ?? 1,
      luggage: body.luggage ?? 1,
      duration: body.duration,
      vehicleType: body.requestedVehicleType ?? 'berline',
      flightNumber: body.flightNumber ?? null,
      airline: body.airline ?? null,
      price: body.price ?? null,
    }],
  };
}

// POST - Créer une nouvelle réservation pour le compte d'un client
export async function POST(request: NextRequest) {
  try {
    let adminId: string;
    try {
      adminId = await requireBookingsCreate(); // Vérification de la permission de création
    } catch (permError) {
      console.error('❌ [API Bookings] Erreur de permission:', permError)
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: statusCode });
    }

    const rawBody = await request.json();
    const parsed = BookingCreateSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: 'Données de réservation invalides',
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const body = parsed.data;

    const resolved = resolveTrips(body);
    if ('error' in resolved) {
      return NextResponse.json({
        success: false,
        error: resolved.error,
      }, { status: 400 });
    }
    const trips = resolved.trips;

    // Le compte client rattaché doit exister : sinon la FK remonterait en 500.
    // On récupère aussi son email : plusieurs écrans côté client retrouvent une
    // réservation par `customerEmail` (proposition de prix, factures). Laisser la colonne
    // vide alors qu'un compte est rattaché rendait la course visible dans l'espace client
    // sans qu'il puisse répondre au prix proposé — d'où ce repli sur l'email du compte.
    let linkedAccountEmail: string | null = null;
    if (body.userId) {
      const clientRows = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, body.userId))
        .limit(1);
      if (clientRows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Compte client introuvable',
        }, { status: 400 });
      }
      linkedAccountEmail = clientRows[0].email ?? null;
    }

    const customerEmail = body.customerEmail ?? linkedAccountEmail ?? '';
    // Numéro remis au format international dès la saisie : la ligne `Contact:` des
    // notes et la colonne customer_phone doivent afficher la même chose.
    const customerPhone = normalizePhoneForStorage(body.customerPhone) ?? body.customerPhone;
    const passengerPhone = normalizePhoneForStorage(body.passengerPhone);

    const [admin] = await db.select({ name: users.name }).from(users).where(eq(users.id, adminId)).limit(1);

    // Une demande à plusieurs trajets donne une course par trajet, reliées par un
    // identifiant de groupe — comme le formulaire public. NULL pour un seul trajet.
    const bookingGroupId = trips.length > 1 ? randomUUID() : null;

    // Transaction : une demande partiellement créée laisserait le client avec un
    // aller sans retour, sans que personne ne le sache.
    const createdBookings = await db.transaction(async (tx) => {
      const inserted = [];
      for (let i = 0; i < trips.length; i++) {
        const trip = trips[i];
        const rows = await tx
          .insert(bookingsTable)
          .values({
            customerName: body.customerName,
            customerEmail,
            customerPhone,
            userId: body.userId ?? null,
            pickupAddress: trip.pickupAddress,
            dropoffAddress: trip.destinationAddress,
            scheduledDateTime: new Date(trip.scheduledDateTime),
            status: 'pending',
            passengers: trip.passengers,
            luggage: trip.luggage,
            duration: (trip.duration ?? 2).toString(),
            driverId: null,
            vehicleId: body.vehicleId ?? null,
            requestedVehicleType: trip.vehicleType,
            price: (trip.price ?? 0).toString(),
            passengerName: body.passengerName ?? null,
            passengerPhone,
            flightNumber: trip.flightNumber ?? null,
            airline: trip.airline ?? null,
            bookingGroupId,
            notes: buildBookingNotes({
              serviceType: trip.serviceType,
              vehicleType: trip.vehicleType,
              customerPhone,
              customerEmail,
              additionalServices: body.additionalServices,
              specialRequests: body.specialRequests,
              enteredBy: admin?.name ?? null,
              tripPosition: i + 1,
              tripTotal: trips.length,
            }),
            updatedAt: new Date(),
          })
          .returning();
        inserted.push(rows[0]);
      }
      return inserted;
    });

    let createdBooking = createdBookings[0];
    console.log(`✅ ${createdBookings.length} réservation(s) créée(s) par l'admin pour ${createdBooking.customerName}`);

    // Assignation immédiate si l'admin a déjà choisi le chauffeur. Un échec
    // (chauffeur indisponible) ne doit pas perdre la demande : elle reste en
    // attente et l'admin est averti pour assigner quelqu'un d'autre.
    let assignmentWarning: string | undefined;
    let availabilityWarning: string | undefined;
    let assignedDriverName: string | undefined;

    if (body.driverId) {
      // `force` : la décision de l'admin l'emporte sur le planning déclaré du
      // chauffeur (le plus souvent vide). Un chauffeur inexistant ou inactif reste
      // un échec, lui.
      const assignmentFailures: string[] = [];
      const availabilityNotices: string[] = [];

      for (let i = 0; i < createdBookings.length; i++) {
        const booking = createdBookings[i];
        const assignment = await assignBookingToDriver(booking.id, body.driverId, {
          force: true,
          notifyDriver: body.notifyDriver ?? true,
        });
        if (assignment.success) {
          createdBookings[i] = assignment.booking;
          assignedDriverName = assignment.driverName;
          if (assignment.availabilityWarning) availabilityNotices.push(assignment.availabilityWarning);
        } else {
          assignmentFailures.push(
            createdBookings.length > 1 ? `#${booking.id} : ${assignment.error}` : assignment.error
          );
          console.warn(`⚠️ Réservation #${booking.id} créée mais non assignée: ${assignment.error}`);
        }
      }

      createdBooking = createdBookings[0];
      // Un avertissement par course noierait l'information : on agrège.
      if (assignmentFailures.length) assignmentWarning = assignmentFailures.join(' · ');
      if (availabilityNotices.length) availabilityWarning = availabilityNotices[0];
    }

    // Accusé de réception WhatsApp au client, seulement si l'admin le demande :
    // inutile pour un client qui ne lit pas, utile quand un proche suit le dossier.
    // Un seul message pour toute la demande : le gabarit Meta a un nombre de
    // variables figé et N messages pour une seule saisie seraient vécus comme du spam.
    if (body.notifyClient) {
      await sendWithRetry('whatsapp', 'whatsapp.sendReservationCreeeClient', [
        createdBooking,
        createdBookings.length > 1
          ? {
              total: createdBookings.length,
              bookingIds: createdBookings.map((booking) => booking.id),
            }
          : undefined,
      ]);
    }

    const createdLabel = createdBookings.length > 1
      ? `${createdBookings.length} réservations créées (${createdBookings.map((b) => `#${b.id}`).join(', ')})`
      : `Réservation #${createdBooking.id} créée`;

    return NextResponse.json({
      success: true,
      // `data` reste la première réservation : les appelants existants lisent ce champ.
      data: createdBooking,
      bookings: createdBookings,
      bookingGroupId,
      ...(assignedDriverName ? { assignedDriverName } : {}),
      ...(assignmentWarning ? { assignmentWarning } : {}),
      ...(availabilityWarning ? { availabilityWarning } : {}),
      message: assignedDriverName
        ? `${createdLabel} et assignée${createdBookings.length > 1 ? 's' : ''} à ${assignedDriverName}.`
        : `${createdLabel}.`,
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur interne du serveur'
    }, { status: 500 });
  }
}
