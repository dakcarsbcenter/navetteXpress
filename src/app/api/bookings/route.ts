export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookingsTable, rolePermissionsTable, pricingSegmentsTable } from '@/schema';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { eq, desc, and, asc } from 'drizzle-orm';
import { sendWithRetry } from '@/lib/notification-queue';
import { resolvePrice } from '@/lib/pricing';

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
    const {
      serviceType,
      date,
      time,
      pickupAddress,
      destinationAddress,
      passengers,
      duration,
      additionalServices,
      specialRequests,
      contactPhone,
      contactEmail,
      clientName,
      clientEmail: fallbackClientEmail,
      passengerName,
      passengerPhone,
      flightNumber,
      airline,
      vehicleType,
      // Secteur tarifaire retenu par le client quand plusieurs tarifs couvrent le même
      // couple de lieux (un par quartier). Le montant lui-même n'est pas lu depuis le
      // corps de la requête : il est recalculé ci-dessous.
      pricingSegmentId,
      // Champs pour utilisateurs connectés
      userId
    } = body;

    const requestedVehicleType = vehicleType === 'suv' ? 'suv' : 'berline';

    // Validation des champs obligatoires
    if (!pickupAddress || !destinationAddress || !date || !time || !contactPhone) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tous les champs obligatoires doivent être renseignés' 
      }, { status: 400 });
    }

    // Pour les utilisateurs non connectés, vérifier les champs client
    if (!userId && (!clientName || !fallbackClientEmail)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nom et email requis pour les utilisateurs non connectés' 
      }, { status: 400 });
    }

    // Réservation pour un tiers : le client qui réserve reste le contact et le
    // destinataire des notifications, passengerName identifie la personne réellement
    // transportée (cas courant : un proche réserve pour quelqu'un qui ne lit pas).
    const finalPassengerName = typeof passengerName === 'string' ? passengerName.trim() : '';
    const finalPassengerPhone = typeof passengerPhone === 'string' ? passengerPhone.trim() : '';

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

    // Créer la date/heure combinée
    const scheduledDateTime = new Date(`${date}T${time}`);

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
    const requestedSegmentId =
      typeof pricingSegmentId === 'number' && Number.isInteger(pricingSegmentId) ? pricingSegmentId : null;

    const pricingSegments = await db
      .select()
      .from(pricingSegmentsTable)
      .where(eq(pricingSegmentsTable.isActive, true))
      .orderBy(asc(pricingSegmentsTable.sortOrder), asc(pricingSegmentsTable.id));

    const pricing = resolvePrice(
      pricingSegments,
      pickupAddress,
      destinationAddress,
      requestedVehicleType,
      requestedSegmentId,
    );

    const zoneIsAmbiguous =
      pricing.alternatives.length > 1 &&
      !pricing.alternatives.some((alt) => alt.segment.id === requestedSegmentId);

    const resolvedPrice = !zoneIsAmbiguous && pricing.price !== null ? pricing.price : 0;

    if (zoneIsAmbiguous) {
      console.warn(
        `⚠️ Secteur tarifaire non précisé pour ${pickupAddress} → ${destinationAddress} : prix laissé à fixer par l'admin`
      );
    }

    // Créer la réservation
    const newBooking = await db
      .insert(bookingsTable)
      .values({
        customerName: finalClientName,
        customerEmail: finalClientEmail,
        customerPhone: contactPhone,
        userId: finalUserId,
        pickupAddress,
        dropoffAddress: destinationAddress,
        scheduledDateTime,
        status: 'pending',
        passengers: passengers || 1,
        luggage: body.luggage || 1,
        duration: duration ? duration.toString() : '2',
        driverId: null, // Sera assigné plus tard par l'admin
        vehicleId: null, // Sera assigné plus tard par l'admin
        requestedVehicleType,
        price: resolvedPrice.toString(),
        passengerName: finalPassengerName || null,
        passengerPhone: finalPassengerPhone || null,
        flightNumber: flightNumber || null,
        airline: airline || null,
        notes: `Service: ${serviceType}\nVéhicule souhaité: ${requestedVehicleType === 'suv' ? 'SUV' : 'Berline'}\nContact: ${contactPhone}${contactEmail ? ` - ${contactEmail}` : ''}\nServices additionnels: ${additionalServices?.join(', ') || 'Aucun'}\nDemandes spéciales: ${flatSpecialRequests || 'Aucune'}`,
        updatedAt: new Date()
      })
      .returning();

    const createdBooking = newBooking[0];
    console.log(`✅ Réservation #${createdBooking.id} créée pour ${finalClientName}`);

    // Envoyer notification uniquement à l'admin (pas au client)
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
        passengers: passengers || 1,
        luggage: createdBooking.luggage || 1,
        passengerName: createdBooking.passengerName,
        passengerPhone: createdBooking.passengerPhone
      }
    ]);

    // Accusé de réception WhatsApp au client uniquement. Il n'y a pas d'alerte
    // dispatch WhatsApp vers l'admin : le numéro qui émet les notifications est
    // celui configuré dans Geskap, et un numéro ne peut pas s'envoyer un message
    // à lui-même. L'admin est prévenu par email (sendNewBookingRequestEmail ci-dessus).
    await sendWithRetry('whatsapp', 'whatsapp.sendReservationCreeeClient', [createdBooking]);

    return NextResponse.json({
      success: true, 
      data: createdBooking,
      message: 'Réservation créée avec succès et notification admin envoyée'
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
