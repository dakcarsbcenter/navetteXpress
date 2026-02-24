import { db } from '@/db'
import { bookingsTable } from '@/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🚫 Simulation d\'une annulation...')
    
    // Chercher une réservation confirmée à annuler
    const confirmedBookings = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.status, 'confirmed'))
      .limit(1)
    
    let bookingId: number
    
    if (confirmedBookings.length === 0) {
      console.log('❌ Aucune réservation confirmée trouvée')
      
      // Créer une réservation simple pour le test
      const newBooking = await db.insert(bookingsTable).values({
        customerName: 'Test Client Annulation',
        customerEmail: 'test-cancel@example.com',
        customerPhone: '0123456789',
        pickupAddress: 'Aéroport Roissy',
        dropoffAddress: 'Tour Eiffel',
        scheduledDateTime: new Date('2024-02-20T14:00:00Z'),
        status: 'confirmed',
        price: '75.00',
        notes: 'Réservation de test pour annulation'
      }).returning()
      
      console.log(`✅ Nouvelle réservation créée: ${newBooking[0].id}`)
      bookingId = newBooking[0].id
      
    } else {
      bookingId = confirmedBookings[0].id
      console.log(`📋 Réservation existante trouvée: ${bookingId}`)
    }
    
    // Annuler la réservation avec un motif
    const cancelled = await db
      .update(bookingsTable)
      .set({
        status: 'cancelled',
        cancellationReason: 'Problème technique véhicule - Test de motif d\'annulation',
        cancelledAt: new Date(),
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning()
    
    console.log(`🚫 Réservation ${cancelled[0].id} annulée avec motif: "${cancelled[0].cancellationReason}"`)
    
    // Vérifier immédiatement
    const verification = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
    
    const booking = verification[0]
    
    return NextResponse.json({
      success: true,
      message: 'Annulation simulée avec succès',
      booking: {
        id: booking.id,
        status: booking.status,
        cancellationReason: booking.cancellationReason,
        cancelledAt: booking.cancelledAt,
        customerName: booking.customerName,
        route: `${booking.pickupAddress} → ${booking.dropoffAddress}`
      },
      verification: {
        hasReason: !!booking.cancellationReason,
        reason: booking.cancellationReason,
        status: booking.status
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la simulation:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la simulation d\'annulation',
      details: String(error)
    })
  }
}
