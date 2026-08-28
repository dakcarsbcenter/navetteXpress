export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { bookingsTable, users } from '@/schema';
import { eq, and } from 'drizzle-orm';
import { sendWithRetry } from '@/lib/notification-queue';

// GET - Récupérer une réservation spécifique du client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID invalide' 
      }, { status: 400 });
    }

    // Récupérer la réservation en vérifiant qu'elle appartient bien au client
    const booking = await db
      .select()
      .from(bookingsTable)
      .where(and(
        eq(bookingsTable.id, id),
        eq(bookingsTable.userId, session.user.id)
      ))
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

// PUT/PATCH - Mettre à jour une réservation tant qu'elle n'est pas confirmée
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID invalide' 
      }, { status: 400 });
    }

    // Vérifier que la réservation existe et appartient au client
    const existingBooking = await db
      .select()
      .from(bookingsTable)
      .where(and(
        eq(bookingsTable.id, id),
        eq(bookingsTable.userId, session.user.id)
      ))
      .limit(1);

    if (existingBooking.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Réservation non trouvée' 
      }, { status: 404 });
    }

    const booking = existingBooking[0];
    const body = await request.json();

    // Annulation par le client de sa propre demande (jusqu'à 24h avant la date prévue)
    if (body.status === 'cancelled') {
      const nonCancellableStatuses = ['cancelled', 'completed', 'in_progress'];
      if (nonCancellableStatuses.includes(booking.status)) {
        return NextResponse.json({
          success: false,
          error: `Impossible d'annuler une réservation avec le statut "${booking.status}". Contactez le service client.`
        }, { status: 403 });
      }

      const hoursUntilDeparture = (booking.scheduledDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilDeparture < 24) {
        return NextResponse.json({
          success: false,
          error: "Vous ne pouvez plus annuler cette réservation à moins de 24h de la date prévue. Contactez le service client."
        }, { status: 403 });
      }

      let assignedDriverName: string | undefined;
      if (booking.driverId) {
        const driverData = await db
          .select()
          .from(users)
          .where(eq(users.id, booking.driverId))
          .limit(1);
        assignedDriverName = driverData[0]?.name || undefined;
      }

      const cancelledBooking = await db
        .update(bookingsTable)
        .set({
          status: 'cancelled',
          cancellationReason: body.reason || null,
          cancelledBy: session.user.id,
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(bookingsTable.id, id),
          eq(bookingsTable.userId, session.user.id)
        ))
        .returning();

      if (cancelledBooking.length === 0) {
        return NextResponse.json({
          success: false,
          error: "Erreur lors de l'annulation"
        }, { status: 500 });
      }

      // Seul l'admin est notifié : c'est à lui de réassigner ou d'avertir le chauffeur si besoin
      await sendWithRetry('whatsapp', 'whatsapp.sendBookingCancelledByClientWhatsAppToAdmin', [
        {
          id: booking.id,
          customerName: booking.customerName,
          pickupAddress: booking.pickupAddress,
          dropoffAddress: booking.dropoffAddress,
          scheduledDateTime: booking.scheduledDateTime.toISOString(),
          passengers: 1,
        },
        body.reason || undefined,
        assignedDriverName
      ]);

      return NextResponse.json({
        success: true,
        data: cancelledBooking[0],
        message: 'Réservation annulée avec succès'
      });
    }

    // Vérifier que la réservation n'est pas confirmée, terminée ou annulée
    const nonEditableStatuses = ['confirmed', 'in_progress', 'completed', 'cancelled'];
    if (nonEditableStatuses.includes(booking.status)) {
      return NextResponse.json({
        success: false,
        error: `Impossible de modifier une réservation avec le statut "${booking.status}". Contactez le service client.`
      }, { status: 403 });
    }

    // Construction de l'objet de mise à jour avec uniquement les champs modifiables par le client
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Champs modifiables par le client
    if (body.pickupAddress !== undefined) updateData.pickupAddress = body.pickupAddress;
    if (body.dropoffAddress !== undefined) updateData.dropoffAddress = body.dropoffAddress;
    if (body.scheduledDateTime !== undefined) {
      updateData.scheduledDateTime = new Date(body.scheduledDateTime);
    }
    if (body.customerPhone !== undefined) updateData.customerPhone = body.customerPhone;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Empêcher le client de modifier certains champs critiques
    // (status, driverId, vehicleId, price sont réservés à l'admin)

    const updatedBooking = await db
      .update(bookingsTable)
      .set(updateData)
      .where(and(
        eq(bookingsTable.id, id),
        eq(bookingsTable.userId, session.user.id)
      ))
      .returning();

    if (updatedBooking.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erreur lors de la mise à jour' 
      }, { status: 500 });
    }

    console.log(`✅ Réservation #${id} mise à jour par le client ${session.user.id}`);

    return NextResponse.json({ 
      success: true, 
      data: updatedBooking[0],
      message: 'Réservation mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réservation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// Alias PATCH vers PUT
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context);
}
