export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { bookingsTable, users, vehiclesTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { requireBookingsRead, requireBookingsCreate } from '@/utils/admin-permissions';
import { assignBookingToDriver } from '@/lib/booking-assignment';
import { sendWithRetry } from '@/lib/notification-queue';

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
 * Création d'une demande de réservation par l'admin, au téléphone, pour le compte d'un
 * client qui ne peut pas remplir le formulaire lui-même (client analphabète, appel
 * entrant, client sans smartphone). Les champs reprennent ceux du formulaire public
 * (POST /api/bookings) pour que la course soit indiscernable d'une demande en ligne
 * côté chauffeur, notifications et facturation.
 *
 * Deux écarts assumés par rapport au formulaire public :
 *  - l'email du client est optionnel (un client analphabète n'en a souvent pas) ;
 *    la colonne étant NOT NULL, on stocke une chaîne vide et les envois d'email au
 *    client sont sautés côté notifications ;
 *  - aucune alerte email n'est envoyée à l'admin : c'est lui qui saisit la demande.
 */
const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const BookingCreateSchema = z.object({
  customerName: z.string().trim().min(2, 'Nom du client trop court').max(120),
  // Optionnel : un client analphabète n'a souvent pas d'adresse email.
  customerEmail: z.preprocess(
    emptyToUndefined,
    z.string().trim().email("Format d'email invalide").max(255).optional()
  ),
  customerPhone: z.string().trim().min(6, 'Téléphone trop court').max(30),
  pickupAddress: z.string().trim().min(2, 'Lieu de départ requis').max(255),
  dropoffAddress: z.string().trim().min(2, 'Destination requise').max(255),
  scheduledDateTime: z
    .string()
    .refine((v) => !isNaN(new Date(v).getTime()), 'Date programmée invalide'),
  passengers: z.number().int().min(1, 'Au moins 1 passager').max(50).optional(),
  luggage: z.number().int().min(0, 'Nombre de bagages négatif').max(50).optional(),
  requestedVehicleType: z.enum(['berline', 'suv']).optional(),
  duration: z.number().min(0.5).max(24).optional(),
  price: z.union([z.number().min(0), z.null()]).optional(),
  serviceType: z.string().trim().max(60).optional(),
  additionalServices: z.array(z.string().trim().max(40)).max(20).optional(),
  specialRequests: z.string().trim().max(2000).optional(),

  // Réservation pour un tiers : le contact reste le client, passengerName identifie
  // la personne réellement transportée.
  passengerName: z.preprocess(emptyToUndefined, z.string().trim().min(2, 'Nom du passager invalide').max(120).optional()),
  passengerPhone: z.preprocess(emptyToUndefined, z.string().trim().max(30).optional()),

  flightNumber: z.preprocess(emptyToUndefined, z.string().trim().max(20).optional()),
  airline: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()),

  /** Compte client existant à rattacher, pour que la course apparaisse dans son espace. */
  userId: z.preprocess(emptyToUndefined, z.string().trim().max(64).optional()),
  /** Assignation immédiate du chauffeur, dans le même geste que la création. */
  driverId: z.preprocess(emptyToUndefined, z.string().trim().max(64).optional()),
  /** Accusé de réception WhatsApp au client (inutile pour un client qui ne lit pas). */
  notifyClient: z.boolean().optional(),
});

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

    const scheduledDateTime = new Date(body.scheduledDateTime);
    const requestedVehicleType = body.requestedVehicleType ?? 'berline';
    const passengers = body.passengers ?? 1;
    const luggage = body.luggage ?? 1;

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

    const [admin] = await db.select({ name: users.name }).from(users).where(eq(users.id, adminId)).limit(1);

    // `notes` suit le format à une ligne par champ relu par parseBookingNotes()
    // (src/lib/whatsapp/templates.ts) : `.` ne matchant pas \n, on aplatit les
    // demandes spéciales pour ne pas tronquer le texte dans les emails et WhatsApp.
    const flatSpecialRequests = (body.specialRequests ?? '').replace(/\s*\n+\s*/g, ' · ').trim();
    const notes = [
      `Service: ${body.serviceType || 'autres'}`,
      `Véhicule souhaité: ${requestedVehicleType === 'suv' ? 'SUV' : 'Berline'}`,
      `Contact: ${body.customerPhone}${customerEmail ? ` - ${customerEmail}` : ''}`,
      `Services additionnels: ${body.additionalServices?.length ? body.additionalServices.join(', ') : 'Aucun'}`,
      `Demandes spéciales: ${flatSpecialRequests || 'Aucune'}`,
      // Traçabilité : cette demande n'a pas été saisie par le client lui-même.
      `Saisie: par ${admin?.name || 'un administrateur'} pour le compte du client (téléphone)`,
    ].join('\n');

    const newBooking = await db
      .insert(bookingsTable)
      .values({
        customerName: body.customerName,
        customerEmail,
        customerPhone: body.customerPhone,
        userId: body.userId ?? null,
        pickupAddress: body.pickupAddress,
        dropoffAddress: body.dropoffAddress,
        scheduledDateTime,
        status: 'pending',
        passengers,
        luggage,
        duration: (body.duration ?? 2).toString(),
        driverId: null,
        vehicleId: null,
        requestedVehicleType,
        price: (body.price ?? 0).toString(),
        passengerName: body.passengerName ?? null,
        passengerPhone: body.passengerPhone ?? null,
        flightNumber: body.flightNumber ?? null,
        airline: body.airline ?? null,
        notes,
        updatedAt: new Date(),
      })
      .returning();

    let createdBooking = newBooking[0];
    console.log(`✅ Réservation #${createdBooking.id} créée par l'admin pour ${createdBooking.customerName}`);

    // Assignation immédiate si l'admin a déjà choisi le chauffeur. Un échec
    // (chauffeur indisponible) ne doit pas perdre la demande : elle reste en
    // attente et l'admin est averti pour assigner quelqu'un d'autre.
    let assignmentWarning: string | undefined;
    let assignedDriverName: string | undefined;

    if (body.driverId) {
      const assignment = await assignBookingToDriver(createdBooking.id, body.driverId);
      if (assignment.success) {
        createdBooking = assignment.booking;
        assignedDriverName = assignment.driverName;
      } else {
        assignmentWarning = assignment.error;
        console.warn(`⚠️ Réservation #${createdBooking.id} créée mais non assignée: ${assignment.error}`);
      }
    }

    // Accusé de réception WhatsApp au client, seulement si l'admin le demande :
    // inutile pour un client qui ne lit pas, utile quand un proche suit le dossier.
    if (body.notifyClient) {
      await sendWithRetry('whatsapp', 'whatsapp.sendReservationCreeeClient', [createdBooking]);
    }

    return NextResponse.json({
      success: true,
      data: createdBooking,
      ...(assignedDriverName ? { assignedDriverName } : {}),
      ...(assignmentWarning ? { assignmentWarning } : {}),
      message: assignedDriverName
        ? `Réservation #${createdBooking.id} créée et assignée à ${assignedDriverName}.`
        : `Réservation #${createdBooking.id} créée.`,
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur interne du serveur'
    }, { status: 500 });
  }
}
