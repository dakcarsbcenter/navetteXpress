export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { bookingsTable } from '@/schema';
import { eq, and } from 'drizzle-orm';
import { sendBookingPriceAcceptedEmail, sendBookingPriceRejectedEmail } from '@/lib/resend-mailer';

/**
 * POST /api/client/bookings/[id]/respond-price
 * Permet au client d'accepter ou rejeter une proposition de prix
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = parseInt(id);
    
    if (isNaN(bookingId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID de réservation invalide' 
      }, { status: 400 });
    }

    const { response, message } = await request.json();

    // Valider la réponse
    if (!response || !['accepted', 'rejected'].includes(response)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Réponse invalide. Doit être "accepted" ou "rejected"' 
      }, { status: 400 });
    }

    // Récupérer la réservation
    const booking = await db.select()
      .from(bookingsTable)
      .where(and(
        eq(bookingsTable.id, bookingId),
        eq(bookingsTable.customerEmail, session.user.email)
      ))
      .limit(1);

    if (!booking.length) {
      return NextResponse.json({ 
        success: false, 
        error: 'Réservation non trouvée' 
      }, { status: 404 });
    }

    const currentBooking = booking[0];

    // Vérifier qu'un prix a été proposé
    if (!currentBooking.price || !currentBooking.priceProposedAt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Aucun prix n\'a été proposé pour cette réservation' 
      }, { status: 400 });
    }

    // Vérifier que le client n'a pas déjà répondu
    if (currentBooking.clientResponse && currentBooking.clientResponse !== 'pending') {
      return NextResponse.json({ 
        success: false, 
        error: 'Vous avez déjà répondu à cette proposition' 
      }, { status: 400 });
    }

    // Mettre à jour la réservation
    const updateData: any = {
      clientResponse: response,
      clientResponseAt: new Date(),
      clientResponseMessage: message || null,
      updatedAt: new Date()
    };

    // Si accepté, passer le statut à "confirmed"
    if (response === 'accepted') {
      updateData.status = 'confirmed';
    }
    // Si rejeté, repasser à "pending" pour que l'admin puisse modifier
    else if (response === 'rejected') {
      updateData.status = 'pending';
    }

    const [updatedBooking] = await db.update(bookingsTable)
      .set(updateData)
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    console.log(`✅ Client ${response === 'accepted' ? 'accepté' : 'rejeté'} le prix pour réservation #${bookingId}`);

    // Envoyer email à l'admin
    try {
      if (response === 'accepted') {
        await sendBookingPriceAcceptedEmail({
          bookingId: updatedBooking.id,
          customerName: updatedBooking.customerName,
          customerEmail: updatedBooking.customerEmail,
          pickupAddress: updatedBooking.pickupAddress,
          dropoffAddress: updatedBooking.dropoffAddress,
          scheduledDateTime: updatedBooking.scheduledDateTime.toISOString(),
          price: updatedBooking.price || '0'
        });
        console.log('✅ Email prix accepté envoyé à l\'admin');
      } else if (response === 'rejected') {
        await sendBookingPriceRejectedEmail({
          bookingId: updatedBooking.id,
          customerName: updatedBooking.customerName,
          customerEmail: updatedBooking.customerEmail,
          pickupAddress: updatedBooking.pickupAddress,
          dropoffAddress: updatedBooking.dropoffAddress,
          scheduledDateTime: updatedBooking.scheduledDateTime.toISOString(),
          price: updatedBooking.price || '0',
          rejectionMessage: message
        });
        console.log('✅ Email prix rejeté envoyé à l\'admin');
      }
    } catch (emailError) {
      console.error('⚠️ Erreur envoi email:', emailError);
      // Ne pas bloquer la réponse même si l'email échoue
    }

    return NextResponse.json({ 
      success: true, 
      message: response === 'accepted' 
        ? 'Proposition acceptée avec succès' 
        : 'Proposition rejetée. L\'admin a été notifié.',
      data: updatedBooking
    });

  } catch (error) {
    console.error('Erreur lors de la réponse au prix:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}
