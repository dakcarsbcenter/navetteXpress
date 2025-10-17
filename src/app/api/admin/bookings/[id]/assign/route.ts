import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookingsTable, users } from '@/schema';
import { eq, and } from 'drizzle-orm';
import { requireBookingsUpdate } from '@/utils/admin-permissions';
import { sendDriverAssignmentNotification } from '@/lib/brevo-email';

// PUT - Assigner une réservation à un chauffeur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireBookingsUpdate(); // Vérification de la permission de mise à jour

    const { id } = await params;
    const bookingId = parseInt(id);
    if (isNaN(bookingId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID invalide' 
      }, { status: 400 });
    }

    const { driverId } = await request.json();

    if (!driverId) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID du chauffeur requis' 
      }, { status: 400 });
    }

    // Vérifier que le chauffeur existe et est actif
    const driver = await db
      .select()
      .from(users)
      .where(and(eq(users.id, driverId), eq(users.role, 'driver'), eq(users.isActive, true)))
      .limit(1);

    if (driver.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chauffeur non trouvé ou inactif' 
      }, { status: 404 });
    }

    // Vérifier que la réservation existe
    const existingBooking = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);

    if (existingBooking.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Réservation non trouvée' 
      }, { status: 404 });
    }

    // Assigner la réservation au chauffeur
    const updatedBooking = await db
      .update(bookingsTable)
      .set({
        driverId,
        status: 'assigned', // Nouveau statut pour les réservations assignées
        updatedAt: new Date(),
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    const assignedBooking = updatedBooking[0];
    const assignedDriver = driver[0];
    
    console.log(`✅ Réservation #${assignedBooking.id} assignée au chauffeur ${assignedDriver.name}`);

    // Envoyer notification au chauffeur assigné
    try {
      console.log(`📧 Envoi notification chauffeur pour assignation #${assignedBooking.id}...`);
      
      const emailResult = await sendDriverAssignmentNotification(
        assignedDriver.email,
        assignedDriver.name || 'Chauffeur',
        {
          id: assignedBooking.id,
          customerName: assignedBooking.customerName,
          customerPhone: assignedBooking.customerPhone,
          pickupAddress: assignedBooking.pickupAddress,
          dropoffAddress: assignedBooking.dropoffAddress,
          scheduledDateTime: assignedBooking.scheduledDateTime.toISOString(),
          price: assignedBooking.price || "0",
          notes: assignedBooking.notes || undefined
        }
      );

      if (emailResult.success) {
        console.log(`✅ Notification chauffeur envoyée - Message ID: ${emailResult.messageId}`);
      } else {
        console.error(`❌ Erreur notification chauffeur: ${emailResult.error}`);
        // On continue même si l'email échoue
      }
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de la notification chauffeur:', emailError);
      // On continue même si l'email échoue
    }

    return NextResponse.json({ 
      success: true, 
      data: assignedBooking,
      message: `Réservation assignée avec succès au chauffeur ${assignedDriver.name}. Notification envoyée.`
    });
  } catch (error) {
    console.error('Erreur lors de l\'assignation de la réservation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}