import { db } from '../src/db'
import { bookingsTable, users } from '../src/schema'
import { desc } from 'drizzle-orm'

async function createTestBooking() {
  console.log('🚀 Création d\'une réservation de test...')
  
  // Récupérer un utilisateur driver et un client
  const allUsers = await db.select().from(users)
  const driver = allUsers.find((u: any) => u.role === 'driver')
  const client = allUsers.find((u: any) => u.role === 'customer')
  
  if (!driver || !client) {
    console.log('❌ Impossible de trouver un driver ou un client')
    return
  }
  
  console.log(`👨‍✈️ Driver trouvé: ${driver.name} (${driver.email})`)
  console.log(`👤 Client trouvé: ${client.name} (${client.email})`)
  
  // Créer une nouvelle réservation
  const newBooking = await db.insert(bookingsTable).values({
    customerName: client.name,
    customerEmail: client.email,
    customerPhone: client.phone || '0123456789',
    userId: client.id,
    driverId: driver.id,
    pickupAddress: 'Aéroport Charles de Gaulle',
    dropoffAddress: 'Hotel de Ville, Paris',
    scheduledDateTime: new Date('2024-02-15T10:00:00Z'),
    status: 'confirmed',
    price: '85.50',
    notes: 'Réservation de test pour vérifier les annulations'
  }).returning()
  
  if (newBooking[0]) {
    console.log(`✅ Réservation créée avec ID: ${newBooking[0].id}`)
    console.log(`📍 Trajet: ${newBooking[0].pickupAddress} → ${newBooking[0].dropoffAddress}`)
    console.log(`💰 Prix: ${newBooking[0].price}€`)
    console.log(`👥 Status: ${newBooking[0].status}`)
    return newBooking[0].id
  }
  
  return null
}

// Exécuter le script
createTestBooking()
  .then((bookingId) => {
    if (bookingId) {
      console.log(`\n🎯 Réservation ${bookingId} prête pour test d'annulation`)
      console.log('Vous pouvez maintenant tester l\'annulation avec un motif')
    }
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })