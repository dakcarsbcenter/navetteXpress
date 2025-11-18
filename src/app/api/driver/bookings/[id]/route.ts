export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { bookingsTable, usersTable } from '@/schema'
import { eq, and } from 'drizzle-orm'
import { sendBookingConfirmedByDriverEmail } from '@/lib/resend-mailer'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un chauffeur
    if (!('role' in session.user) || session.user.role !== 'driver') {
      return NextResponse.json({ error: 'Accès refusé - chauffeur requis' }, { status: 403 })
    }

    const bookingId = parseInt(id)
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: 'ID de réservation invalide' }, { status: 400 })
    }

    const body = await request.json()
    const { status, cancellationReason } = body

    // Valider le nouveau statut (excluding 'pending' which is admin-only)
    const validStatuses = ['assigned', 'confirmed', 'in_progress', 'completed', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Statut invalide. Statuts autorisés pour les chauffeurs: ' + validStatuses.join(', ') 
      }, { status: 400 })
    }

    // Vérifier que la réservation existe et appartient au chauffeur connecté
    const existingBooking = await db.select()
      .from(bookingsTable)
      .where(and(
        eq(bookingsTable.id, bookingId),
        eq(bookingsTable.driverId, session.user.id)
      ))
      .limit(1)

    if (existingBooking.length === 0) {
      return NextResponse.json({ 
        error: 'Réservation non trouvée ou non assignée à ce chauffeur' 
      }, { status: 404 })
    }

    // Valider les transitions de statut autorisées pour le chauffeur
    // Note: 'pending' est exclu car c'est un statut réservé aux administrateurs
    const currentStatus = existingBooking[0].status
    const allowedTransitions: Record<string, string[]> = {
      'assigned': ['confirmed', 'cancelled'], // Chauffeur peut confirmer ou refuser
      'confirmed': ['in_progress', 'cancelled'], // Peut commencer ou annuler
      'in_progress': ['completed'], // Peut marquer comme terminé
      'completed': [], // Statut final
      'cancelled': [], // Statut final
      // 'pending' n'est pas inclus car c'est un statut admin-only
    }

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json({ 
        error: `Transition de statut non autorisée: ${currentStatus} → ${status}` 
      }, { status: 400 })
    }

    // Mettre à jour le statut
    const updateData: any = { 
      status,
      updatedAt: new Date()
    }

    // Si c'est une annulation, enregistrer le motif et les détails
    if (status === 'cancelled') {
      updateData.cancellationReason = cancellationReason || 'Aucune raison spécifiée'
      updateData.cancelledBy = session.user.id
      updateData.cancelledAt = new Date()
    }

    await db.update(bookingsTable)
      .set(updateData)
      .where(eq(bookingsTable.id, bookingId))

    // Envoyer email au client si le chauffeur confirme la réservation
    if (status === 'confirmed') {
      try {
        console.log(`📧 Envoi email de confirmation au client pour réservation #${bookingId}...`);
        
        // Récupérer les informations du chauffeur
        const driverInfo = await db.select({
          name: usersTable.name,
          phone: usersTable.phone
        })
          .from(usersTable)
          .where(eq(usersTable.id, session.user.id))
          .limit(1);

        const booking = existingBooking[0];
        
        await sendBookingConfirmedByDriverEmail(booking.customerEmail, {
          bookingId: `BOOK-${bookingId}`,
          customerName: booking.customerName,
          driverName: driverInfo[0]?.name || 'Votre chauffeur',
          driverPhone: driverInfo[0]?.phone || undefined,
          pickupLocation: booking.pickupAddress,
          dropoffLocation: booking.dropoffAddress,
          pickupDate: new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR'),
          pickupTime: new Date(booking.scheduledDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        });

        console.log(`✅ Email de confirmation envoyé au client`);
      } catch (emailError) {
        console.error('❌ Erreur lors de l\'envoi de l\'email au client:', emailError);
        // On continue même si l'email échoue
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Statut mis à jour avec succès',
      data: {
        id: bookingId,
        status,
        updatedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur lors de la mise à jour du statut' 
    }, { status: 500 })
  }
}