import { db } from '../src/db'
import { bookingsTable } from '../src/schema'
import { eq } from 'drizzle-orm'

async function simulateCancellation() {
  console.log('🚫 Simulation d\'une annulation...')
  
  try {
    // Chercher une réservation confirmée à annuler
    const confirmedBookings = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.status, 'confirmed'))
      .limit(1)
    
    if (confirmedBookings.length === 0) {
      console.log('❌ Aucune réservation confirmée trouvée')
      
      // Créer une réservation simple pour le test
      const newBooking = await db.insert(bookingsTable).values({
        customerName: 'Test Client',
        customerEmail: 'test@example.com',
        customerPhone: '0123456789',
        pickupAddress: 'Aéroport Roissy',
        dropoffAddress: 'Tour Eiffel',
        scheduledDateTime: new Date('2024-02-20T14:00:00Z'),
        status: 'confirmed',
        price: '75.00',
        notes: 'Réservation de test'
      }).returning()
      
      console.log(`✅ Nouvelle réservation créée: ${newBooking[0].id}`)
      
      // Maintenant annuler cette réservation
      const cancelled = await db
        .update(bookingsTable)
        .set({
          status: 'cancelled',
          cancellationReason: 'Problème technique véhicule',
          cancelledAt: new Date(),
          notes: 'Réservation annulée pour test'
        })
        .where(eq(bookingsTable.id, newBooking[0].id))
        .returning()
      
      console.log(`🚫 Réservation ${cancelled[0].id} annulée avec motif: "${cancelled[0].cancellationReason}"`)
      return cancelled[0].id
      
    } else {
      // Annuler la réservation existante
      const bookingToCancel = confirmedBookings[0]
      
      const cancelled = await db
        .update(bookingsTable)
        .set({
          status: 'cancelled',
          cancellationReason: 'Embouteillage imprévu',
          cancelledAt: new Date()
        })
        .where(eq(bookingsTable.id, bookingToCancel.id))
        .returning()
      
      console.log(`🚫 Réservation ${cancelled[0].id} annulée avec motif: "${cancelled[0].cancellationReason}"`)
      return cancelled[0].id
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    return null
  }
}

// Test de vérification après annulation
async function verifyCancellation(bookingId: number) {
  console.log(`\n🔍 Vérification de la réservation ${bookingId}...`)
  
  const booking = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId))
  
  if (booking[0]) {
    console.log(`📋 Status: ${booking[0].status}`)
    console.log(`📝 Motif: ${booking[0].cancellationReason || 'AUCUN'}`)
    console.log(`📅 Annulée le: ${booking[0].cancelledAt || 'NON DÉFINIE'}`)
    console.log(`👤 Annulée par: ${booking[0].cancelledBy || 'NON DÉFINIE'}`)
    
    return {
      hasReason: !!booking[0].cancellationReason,
      reason: booking[0].cancellationReason,
      status: booking[0].status
    }
  }
  
  return null
}

// Exécuter le test
simulateCancellation()
  .then((bookingId) => {
    if (bookingId) {
      return verifyCancellation(bookingId)
    }
    return null
  })
  .then((result) => {
    if (result) {
      console.log('\n✅ Test d\'annulation terminé')
      console.log(`🎯 Motif présent: ${result.hasReason ? 'OUI' : 'NON'}`)
      if (result.hasReason) {
        console.log(`📝 Motif: "${result.reason}"`)
      }
    }
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })