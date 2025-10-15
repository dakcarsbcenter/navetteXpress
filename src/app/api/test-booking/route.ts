import { db } from '@/db'
import { bookingsTable, users } from '@/schema'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🚀 Création d\'une réservation de test...')
    
    // Récupérer un utilisateur driver et un client
    const allUsers = await db.select().from(users)
    const driver = allUsers.find((u: any) => u.role === 'driver')
    const client = allUsers.find((u: any) => u.role === 'customer')
    
    if (!driver || !client) {
      console.log('❌ Impossible de trouver un driver ou un client')
      return NextResponse.json({ 
        error: 'Impossible de trouver un driver ou un client',
        users: allUsers.map(u => ({ name: u.name, email: u.email, role: u.role }))
      })
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
      return NextResponse.json({
        success: true,
        booking: {
          id: newBooking[0].id,
          route: `${newBooking[0].pickupAddress} → ${newBooking[0].dropoffAddress}`,
          price: newBooking[0].price,
          status: newBooking[0].status,
          driver: driver.name,
          client: client.name
        },
        message: `Réservation ${newBooking[0].id} prête pour test d'annulation`
      })
    }
    
    return NextResponse.json({ error: 'Erreur lors de la création' })
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur', details: String(error) })
  }
}