export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookingsTable, rolePermissionsTable } from '@/schema';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { eq, desc, and } from 'drizzle-orm';
import { sendBookingNotificationToAdmin } from '@/lib/resend-email';

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
      vehicle,
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
      // Champs pour utilisateurs connectés
      userId
    } = body;

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

    // Utiliser la session déjà récupérée
    const finalUserId = userId || session?.user?.id || null;
    const finalClientName = clientName || session?.user?.name || '';
    const finalClientEmail = fallbackClientEmail || session?.user?.email || '';

    // Créer la date/heure combinée
    const scheduledDateTime = new Date(`${date}T${time}`);

    // Calculer le prix estimé (logique simplifiée)
    const basePrice = 100; // Prix de base
    const vehicleMultiplier = vehicle === 'limousine' ? 2.0 : 
                             vehicle === 'sprinter' ? 1.5 : 
                             vehicle === 'mercedes-s' ? 1.2 : 
                             vehicle === 'bmw-7' ? 1.1 : 
                             vehicle === 'audi-a8' ? 1.15 : 1.0;
    
    const serviceMultiplier = serviceType === 'event' ? 1.5 :
                             serviceType === 'airport' ? 1.2 :
                             serviceType === 'business' ? 1.1 : 1.0;

    const additionalServicesPrice = additionalServices?.reduce((total: number, serviceId: string) => {
      const servicePrices: { [key: string]: number } = {
        'wifi': 10,
        'refreshments': 25,
        'newspaper': 5,
        'child_seat': 15,
        'flowers': 35,
        'champagne': 50
      };
      return total + (servicePrices[serviceId] || 0);
    }, 0) || 0;

    const estimatedPrice = Math.round(
      (basePrice * vehicleMultiplier * serviceMultiplier * duration) + additionalServicesPrice
    );

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
        price: estimatedPrice.toString(),
        notes: `Service: ${serviceType}\nContact: ${contactPhone}${contactEmail ? ` - ${contactEmail}` : ''}\nServices additionnels: ${additionalServices?.join(', ') || 'Aucun'}\nDemandes spéciales: ${specialRequests || 'Aucune'}`
      })
      .returning();

    const createdBooking = newBooking[0];
    console.log(`✅ Réservation #${createdBooking.id} créée pour ${finalClientName}`);

    // Envoyer notification à l'admin via Resend
    try {
      console.log(`📧 Envoi notification admin pour nouvelle réservation #${createdBooking.id}...`);
      
      const emailResult = await sendBookingNotificationToAdmin({
        id: createdBooking.id,
        customerName: createdBooking.customerName,
        customerEmail: createdBooking.customerEmail,
        customerPhone: createdBooking.customerPhone || undefined,
        pickupAddress: createdBooking.pickupAddress,
        dropoffAddress: createdBooking.dropoffAddress,
        scheduledDateTime: createdBooking.scheduledDateTime.toISOString(),
        passengers: passengers || 1,
        price: createdBooking.price || undefined,
        notes: createdBooking.notes || undefined
      });

      if (emailResult.success) {
        console.log(`✅ Notification admin envoyée via Resend`);
      } else {
        console.error(`❌ Erreur notification admin:`, emailResult.error);
        // On continue même si l'email échoue
      }
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de la notification admin:', emailError);
      // On continue même si l'email échoue
    }

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
