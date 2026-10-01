export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { db } from '@/db';
import { bookingsTable, rolePermissionsTable, pricingSegmentsTable } from '@/schema';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { eq, desc, and, asc } from 'drizzle-orm';
import { sendWithRetry } from '@/lib/notification-queue';
import { normalizePhoneForStorage } from '@/lib/phone';
import { resolvePrice } from '@/lib/pricing';
import { BookingTripSchema, MAX_BOOKING_TRIPS, type BookingTripParsed } from '@/lib/booking-trips';
import { guardPublicFormSubmission } from '@/lib/security/publicFormGuard';

// Fonction pour vérifier les permissions dynamiques des bookings
async function hasBookingsPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
  try {
    // Les admins ont toujours accès
    if (userRole === 'admin') {
      return true;
    }

    // Vérifier les permissions dynamiques
    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource, 'bookings'),
        eq(rolePermissionsTable.action, action),
        eq(rolePermissionsTable.allowed, true)
      ));

    // Retourner true si la permission existe
    return permissions.length > 0;
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions bookings:', error);
    return false;
  }
}

// POST - Créer une nouvelle réservation (accessible aux utilisateurs connectés et non connectés)
export async function POST(request: NextRequest) {
  try {
    // Récupérer la session pour vérifier les permissions
    const session = await getServerSession(authOptions) as { user?: { id?: string; name?: string; email?: string; role?: string } } | null;
    
    // Si l'utilisateur est connecté, vérifier les permissions
    if (session?.user?.id) {
      const userRole = session.user.role || 'customer';

      // Politique métier: la création d'une demande de réservation est toujours
      // autorisée pour les clients (customer), qu'ils soient connectés ou non.
      // On ne bloque donc pas les clients sur l'action "create" même si la
      // matrice n'accorde pas explicitement cette action.
      if (userRole !== 'customer') {
        const hasPermission = await hasBookingsPermission(userRole, 'create');
        if (!hasPermission) {
          return NextResponse.json({ 
            success: false, 
            error: 'Vous n\'avez pas la permission de créer des réservations' 
          }, { status: 403 });
        }
      }
    }
    
    const body = await request.json();

    // Une demande peut porter plusieurs trajets (aller-retour, séjour enchaînant
    // plusieurs transferts) : le formulaire envoie alors `trips`. Les appels plus
    // anciens — et tout POST direct existant — continuent d'envoyer les champs du
    // trajet à plat : on les replie ici en un tableau d'un seul élément pour que la
    // suite n'ait qu'un seul chemin à traiter.
    const rawTrips: unknown[] = Array.isArray(body.trips) && body.trips.length > 0
      ? body.trips
      : [{
          serviceType: body.serviceType,
          customServiceType: body.customServiceType,
          pickupAddress: body.pickupAddress,
          destinationAddress: body.destinationAddress,
          date: body.date,
          time: body.time,
          passengers: body.passengers,
          luggage: body.luggage,
          duration: body.duration,
          vehicleType: body.vehicleType,
          pricingSegmentId: body.pricingSegmentId,
          flightNumber: body.flightNumber,
          airline: body.airline,
        }];

    const {
      additionalServices,
      specialRequests,
      contactPhone,
      contactEmail,
      clientName,
      clientEmail: fallbackClientEmail,
      passengerName,
      passengerPhone,
      // Champs pour utilisateurs connectés
      userId
    } = body;

    if (rawTrips.length > MAX_BOOKING_TRIPS) {
      return NextResponse.json({
        success: false,
        error: `Une demande ne peut pas dépasser ${MAX_BOOKING_TRIPS} trajets`
      }, { status: 400 });
    }

    // Champs obligatoires du trajet. Le message reste celui d'avant pour une demande
    // à un seul trajet ; au-delà, il désigne le trajet fautif.
    const isBlank = (value: unknown) => typeof value !== 'string' || value.trim() === '';
    for (let i = 0; i < rawTrips.length; i++) {
      const trip = rawTrips[i] as Record<string, unknown>;
      if (isBlank(trip?.pickupAddress) || isBlank(trip?.destinationAddress) || isBlank(trip?.date) || isBlank(trip?.time)) {
        const suffix = rawTrips.length > 1 ? ` (trajet ${i + 1})` : '';
        return NextResponse.json({
          success: false,
          error: `Tous les champs obligatoires doivent être renseignés${suffix}`
        }, { status: 400 });
      }
    }

    if (isBlank(contactPhone)) {
      return NextResponse.json({
        success: false,
        error: 'Tous les champs obligatoires doivent être renseignés'
      }, { status: 400 });
    }

    // Bornes et coercitions (passagers, bagages, véhicule...) : un POST direct ne doit
    // pas pouvoir écrire n'importe quoi là où le formulaire n'offre que des listes fermées.
    const parsedTrips = z.array(BookingTripSchema).min(1).max(MAX_BOOKING_TRIPS).safeParse(rawTrips);
    if (!parsedTrips.success) {
      const issue = parsedTrips.error.issues[0];
      const position = typeof issue?.path?.[0] === 'number' ? Number(issue.path[0]) + 1 : null;
      const suffix = position && rawTrips.length > 1 ? ` (trajet ${position})` : '';
      return NextResponse.json({
        success: false,
        error: `Données de trajet invalides${suffix}`
      }, { status: 400 });
    }
    const trips: BookingTripParsed[] = parsedTrips.data;

    // Pour les utilisateurs non connectés, vérifier les champs client
    if (!userId && (!clientName || !fallbackClientEmail)) {
      return NextResponse.json({
        success: false,
        error: 'Nom et email requis pour les utilisateurs non connectés'
      }, { status: 400 });
    }

    // Honeypot, délai de remplissage, origine, token applicatif, rate limit par IP et
    // par email, adresses jetables — comme /api/quotes et /api/convention. Avant toute
    // écriture : une requête acceptée crée jusqu'à dix courses et déclenche deux
    // notifications.
    //
    // Uniquement pour les demandes anonymes : un client connecté a déjà passé la
    // création de compte et l'activation par email, et le faire buter sur une adresse
    // ayant rebondi une fois l'empêcherait de réserver.
    if (!session?.user?.id) {
      const guard = await guardPublicFormSubmission(request, {
        scope: 'booking',
        email: fallbackClientEmail,
        body,
        decoyResponse: () => NextResponse.json({
          success: true,
          message: 'Réservation créée avec succès et notification admin envoyée'
        }, { status: 201 }),
      });
      if (!guard.ok) return guard.response;
    }

    // Réservation pour un tiers : le client qui réserve reste le contact et le
    // destinataire des notifications, passengerName identifie la personne réellement
    // transportée (cas courant : un proche réserve pour quelqu'un qui ne lit pas).
    const finalPassengerName = typeof passengerName === 'string' ? passengerName.trim() : '';
    const finalPassengerPhone = typeof passengerPhone === 'string' ? passengerPhone.trim() : '';
    // Numéro remis au format international dès la saisie : la ligne `Contact:` des
    // notes et la colonne customer_phone doivent afficher la même chose.
    const normalizedContactPhone = normalizePhoneForStorage(contactPhone) ?? contactPhone;

    if (finalPassengerName && finalPassengerName.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Nom du passager invalide'
      }, { status: 400 });
    }

    // Utiliser la session déjà récupérée
    const finalUserId = userId || session?.user?.id || null;
    const finalClientName = clientName || session?.user?.name || '';
    const finalClientEmail = fallbackClientEmail || session?.user?.email || '';

    // `notes` est un format à une ligne par champ, relu par parseBookingNotes()
    // (src/lib/whatsapp/templates.ts) avec /Demandes spéciales:\s*(.+)/ : `.` ne
    // matchant pas \n, un retour à la ligne tapé dans le textarea tronquerait la
    // demande du client dans les e-mails et les messages WhatsApp. On l'aplatit ici,
    // seul point où ce format est construit.
    const flatSpecialRequests =
      typeof specialRequests === 'string' ? specialRequests.replace(/\s*\n+\s*/g, ' · ').trim() : '';

    // Prix ferme annoncé au client : il est recalculé ici depuis les segments de tarifs
    // paramétrés en admin (/tarifs), jamais lu dans le corps de la requête. Le montant
    // engage l'entreprise — accepter celui envoyé par le navigateur laissait fixer
    // n'importe quelle valeur par un POST direct. Le formulaire transmet seulement le
    // secteur choisi (`pricingSegmentId`), qui désigne lequel des tarifs du trajet
    // s'applique, et resolvePrice() est la même fonction que celle utilisée pour
    // l'afficher côté client et dans le back-office.
    //
    // Reste à 0 — l'admin fixera le prix à la main, comme avant — quand aucun tarif ne
    // couvre le trajet ("SUR DEVIS", adresse libre) et quand le trajet a plusieurs
    // secteurs tarifés sans que le client en ait désigné un (requête hors formulaire,
    // ou ancien bundle encore en cache) : on ne devine pas un quartier à sa place.
    //
    // Les segments sont chargés une seule fois pour toute la demande, puis résolus
    // trajet par trajet : chacun a son propre couple de lieux, son véhicule et son secteur.
    const pricingSegments = await db
      .select()
      .from(pricingSegmentsTable)
      .where(eq(pricingSegmentsTable.isActive, true))
      .orderBy(asc(pricingSegmentsTable.sortOrder), asc(pricingSegmentsTable.id));

    const priceForTrip = (trip: BookingTripParsed): number => {
      const requestedSegmentId =
        typeof trip.pricingSegmentId === 'number' && Number.isInteger(trip.pricingSegmentId)
          ? trip.pricingSegmentId
          : null;

      const pricing = resolvePrice(
        pricingSegments,
        trip.pickupAddress,
        trip.destinationAddress,
        trip.vehicleType,
        requestedSegmentId,
      );

      const zoneIsAmbiguous =
        pricing.alternatives.length > 1 &&
        !pricing.alternatives.some((alt) => alt.segment.id === requestedSegmentId);

      if (zoneIsAmbiguous) {
        console.warn(
          `⚠️ Secteur tarifaire non précisé pour ${trip.pickupAddress} → ${trip.destinationAddress} : prix laissé à fixer par l'admin`
        );
        return 0;
      }

      return pricing.price !== null ? pricing.price : 0;
    };

    // Une demande à plusieurs trajets donne une course par trajet : l'assignation
    // chauffeur, le prix et le suivi se font de toute façon course par course. Le
    // groupe garde la trace qu'elles viennent d'une même soumission. NULL pour une
    // demande à un seul trajet : pas de faux groupe.
    const bookingGroupId = trips.length > 1 ? randomUUID() : null;

    // Tout ou rien : une demande ne doit jamais se retrouver à moitié créée, le client
    // repartirait avec la moitié de son séjour réservée sans le savoir.
    const createdBookings = await db.transaction(async (tx) => {
      const rows = [];
      for (let i = 0; i < trips.length; i++) {
        const trip = trips[i];
        const scheduledDateTime = new Date(`${trip.date}T${trip.time}`);
        // `Service:` garde le slug brut : parseBookingNotes() le passe a getServiceById()
        // pour retrouver le libelle traduit. La precision libre du client part donc sur
        // sa propre ligne, ajoutee en fin de notes.
        const customServiceLine = trip.customServiceType
          ? `
Precision service: ${trip.customServiceType}`
          : '';
        // Ligne supplémentaire, jamais intercalée : les regex de parseBookingNotes()
        // lisent chaque champ sur sa propre ligne, ajouter à la fin ne casse rien.
        const tripLine = trips.length > 1 ? `\nTrajet: ${i + 1}/${trips.length} de la demande` : '';

        const inserted = await tx
          .insert(bookingsTable)
          .values({
            customerName: finalClientName,
            customerEmail: finalClientEmail,
            customerPhone: normalizedContactPhone,
            userId: finalUserId,
            pickupAddress: trip.pickupAddress,
            dropoffAddress: trip.destinationAddress,
            scheduledDateTime,
            status: 'pending',
            passengers: trip.passengers,
            luggage: trip.luggage,
            duration: trip.duration !== undefined ? trip.duration.toString() : '2',
            driverId: null, // Sera assigné plus tard par l'admin
            vehicleId: null, // Sera assigné plus tard par l'admin
            requestedVehicleType: trip.vehicleType,
            price: priceForTrip(trip).toString(),
            passengerName: finalPassengerName || null,
            passengerPhone: normalizePhoneForStorage(finalPassengerPhone),
            flightNumber: trip.flightNumber || null,
            airline: trip.airline || null,
            bookingGroupId,
            notes: `Service: ${trip.serviceType}\nVéhicule souhaité: ${trip.vehicleType === 'suv' ? 'SUV' : 'Berline'}\nContact: ${normalizedContactPhone}${contactEmail ? ` - ${contactEmail}` : ''}\nServices additionnels: ${additionalServices?.join(', ') || 'Aucun'}\nDemandes spéciales: ${flatSpecialRequests || 'Aucune'}${customServiceLine}${tripLine}`,
            updatedAt: new Date()
          })
          .returning();

        rows.push(inserted[0]);
      }
      return rows;
    });

    const createdBooking = createdBookings[0];
    console.log(
      `✅ ${createdBookings.length} réservation(s) créée(s) pour ${finalClientName} : ${createdBookings.map((b) => `#${b.id}`).join(', ')}`
    );

    // Une seule notification par demande, pas une par trajet : le client a rempli un
    // formulaire, il reçoit un accusé, et l'admin reçoit une alerte listant les courses.
    // sendWithRetry ne lève jamais : en cas d'échec immédiat, le job est mis
    // en file et rejoué plus tard par le worker (src/lib/notification-queue.ts)
    const adminEmail = process.env.ADMIN_EMAIL || 'onboarding@resend.dev';

    await sendWithRetry('email', 'resend-mailer.sendNewBookingRequestEmail', [
      adminEmail,
      {
        bookingId: `BOOK-${createdBooking.id}`,
        customerName: createdBooking.customerName,
        pickupLocation: createdBooking.pickupAddress,
        dropoffLocation: createdBooking.dropoffAddress,
        pickupDate: new Date(createdBooking.scheduledDateTime).toLocaleDateString('fr-FR'),
        pickupTime: new Date(createdBooking.scheduledDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        passengers: createdBooking.passengers,
        luggage: createdBooking.luggage || 1,
        passengerName: createdBooking.passengerName,
        passengerPhone: createdBooking.passengerPhone,
        // Les trajets de la demande sont listés sous la fiche du premier : l'admin voit
        // d'un coup d'œil que la demande en compte plusieurs et peut les traiter ensemble.
        trips: createdBookings.length > 1
          ? createdBookings.map((booking, index) => ({
              position: index + 1,
              reference: `BOOK-${booking.id}`,
              pickupLocation: booking.pickupAddress,
              dropoffLocation: booking.dropoffAddress,
              pickupDate: new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR'),
              pickupTime: new Date(booking.scheduledDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            }))
          : undefined,
      }
    ]);

    // Accusé de réception WhatsApp au client uniquement. Il n'y a pas d'alerte
    // dispatch WhatsApp vers l'admin : le numéro qui émet les notifications est
    // celui configuré dans Geskap, et un numéro ne peut pas s'envoyer un message
    // à lui-même. L'admin est prévenu par email (sendNewBookingRequestEmail ci-dessus).
    //
    // Un seul message pour toute la demande : le gabarit Meta a un nombre de variables
    // figé, on ne peut pas y détailler N trajets, et N messages pour une seule
    // soumission seraient vécus comme du spam. Le contexte de groupe se glisse dans
    // les variables existantes (référence et libellé du service).
    await sendWithRetry('whatsapp', 'whatsapp.sendReservationCreeeClient', [
      createdBooking,
      createdBookings.length > 1
        ? {
            total: createdBookings.length,
            bookingIds: createdBookings.map((booking) => booking.id),
          }
        : undefined,
    ]);

    return NextResponse.json({
      success: true,
      // `data` reste la première réservation : les appelants existants lisent ce champ.
      data: createdBooking,
      bookings: createdBookings,
      bookingGroupId,
      message: createdBookings.length > 1
        ? `${createdBookings.length} réservations créées avec succès et notification admin envoyée`
        : 'Réservation créée avec succès et notification admin envoyée'
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// GET - Récupérer les réservations de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Non authentifié'
      }, { status: 401 });
    }

    const userRole = session.user.role || 'customer';
    const hasReadPermission = await hasBookingsPermission(userRole, 'read');

    if (!hasReadPermission) {
      return NextResponse.json({
        success: false,
        error: 'Vous n\'avez pas la permission de voir les réservations'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Si l'utilisateur a la permission 'manage', il peut voir toutes les réservations
    const hasManagePermission = await hasBookingsPermission(userRole, 'update') || 
                                await hasBookingsPermission(userRole, 'delete');

    let userBookings;

    if (hasManagePermission && userId) {
      // Permission manage: peut voir les réservations d'autres utilisateurs
      userBookings = await db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.userId, userId))
        .orderBy(desc(bookingsTable.createdAt));
    } else if (hasManagePermission && !userId) {
      // Permission manage sans userId: voir toutes les réservations
      userBookings = await db
        .select()
        .from(bookingsTable)
        .orderBy(desc(bookingsTable.createdAt));
    } else {
      // Permission read only: voir uniquement ses propres réservations
      userBookings = await db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.userId, session.user.id))
        .orderBy(desc(bookingsTable.createdAt));
    }

    return NextResponse.json({ 
      success: true, 
      data: userBookings 
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}
