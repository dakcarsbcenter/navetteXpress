export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookingsTable, users } from '@/schema';
import { eq } from 'drizzle-orm';
import { requireBookingsRead, requireBookingsUpdate, requireBookingsDelete } from '@/utils/admin-permissions';
import { sendBookingConfirmedToClient, sendBookingAssignedToDriver } from '@/lib/resend-email';

// GET - Récupérer une réservation par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireBookingsRead(); // Vérification de la permission de lecture

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

// PATCH - Mettre à jour partiellement une réservation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireBookingsUpdate(); // Vérification de la permission de mise à jour

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID invalide' 
      }, { status: 400 });
    }

    const body = await request.json();
    
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
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Ajout conditionnel des champs à mettre à jour
    const oldStatus = body.oldStatus; // Pour détecter les changements
    if (body.status !== undefined) updateData.status = body.status;
    if (body.driverId !== undefined) updateData.driverId = body.driverId;
    if (body.vehicleId !== undefined) updateData.vehicleId = body.vehicleId;
    if (body.notes !== undefined) updateData.notes = body.notes;
    
    // Si l'admin définit ou modifie le prix
    if (body.price !== undefined) {
      updateData.price = body.price;
      // Si c'est la première fois qu'un prix est défini OU si le prix change
      if (!oldBooking.price || oldBooking.price !== body.price) {
        updateData.priceProposedAt = new Date();
        updateData.clientResponse = 'pending'; // En attente de réponse du client
        updateData.clientResponseAt = null;
        updateData.clientResponseMessage = null;
      }
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

    // Envoyer notification au client si la réservation est confirmée
    if (body.status === 'confirmed' && oldStatus !== 'confirmed') {
      try {
        console.log(`📧 Envoi notification confirmation au client pour réservation #${booking.id}...`);
        
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
              email: driverData[0].email
            };
          }
        }

        const emailResult = await sendBookingConfirmedToClient({
          id: booking.id,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone || undefined,
          pickupAddress: booking.pickupAddress,
          dropoffAddress: booking.dropoffAddress,
          scheduledDateTime: booking.scheduledDateTime.toISOString(),
          passengers: 1, // À ajuster si disponible
          price: booking.price || undefined,
          notes: booking.notes || undefined
        }, driver);

        if (emailResult.success) {
          console.log(`✅ Notification client envoyée via Resend`);
        } else {
          console.error(`❌ Erreur notification client:`, emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Erreur lors de l\'envoi de la notification client:', emailError);
      }
    }

    // Envoyer notification au chauffeur si un chauffeur est assigné
    if (body.driverId && body.driverId !== oldStatus) {
      try {
        console.log(`📧 Envoi notification assignation au chauffeur pour réservation #${booking.id}...`);
        
        const driverData = await db
          .select()
          .from(users)
          .where(eq(users.id, body.driverId))
          .limit(1);

        if (driverData.length > 0) {
          const driver = {
            name: driverData[0].name,
            email: driverData[0].email
          };

          const emailResult = await sendBookingAssignedToDriver({
            id: booking.id,
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone || undefined,
            pickupAddress: booking.pickupAddress,
            dropoffAddress: booking.dropoffAddress,
            scheduledDateTime: booking.scheduledDateTime.toISOString(),
            passengers: 1, // À ajuster si disponible
            price: booking.price || undefined,
            notes: booking.notes || undefined
          }, driver);

          if (emailResult.success) {
            console.log(`✅ Notification chauffeur envoyée via Resend`);
          } else {
            console.error(`❌ Erreur notification chauffeur:`, emailResult.error);
          }
        }
      } catch (emailError) {
        console.error('❌ Erreur lors de l\'envoi de la notification chauffeur:', emailError);
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

// PUT - Mettre à jour une réservation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireBookingsUpdate(); // Vérification de la permission de mise à jour

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID invalide' 
      }, { status: 400 });
    }

    const body = await request.json();
    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      pickupAddress, 
      dropoffAddress, 
      scheduledDateTime, 
      status,
      driverId,
      vehicleId,
      price,
      notes 
    } = body;

    const updatedBooking = await db
      .update(bookingsTable)
      .set({
        customerName,
        customerEmail,
        customerPhone,
        pickupAddress,
        dropoffAddress,
        scheduledDateTime: scheduledDateTime ? new Date(scheduledDateTime) : undefined,
        status,
        driverId,
        vehicleId,
        price,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(bookingsTable.id, id))
      .returning();

    if (updatedBooking.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Réservation non trouvée' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedBooking[0] 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réservation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// DELETE - Supprimer une réservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireBookingsDelete(); // Vérification de la permission de suppression

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

