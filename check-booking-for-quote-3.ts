// Vérifier si une réservation a été créée pour le devis #3
import { db } from './src/db/index.ts'
import { quotes, bookingsTable } from './src/schema.ts'
import { eq } from 'drizzle-orm'

async function checkBookingForQuote() {
  try {
    console.log('\n🔍 Vérification du devis #3 et de sa réservation associée...\n')

    // 1. Récupérer le devis
    const quote = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, 3))
      .limit(1)

    if (!quote.length) {
      console.log('❌ Devis #3 non trouvé')
      process.exit(1)
    }

    const q = quote[0]
    console.log('📋 Devis #3:')
    console.log(`   Client: ${q.customerName} (${q.customerEmail})`)
    console.log(`   Statut: ${q.status}`)
    console.log(`   Prix estimé: ${q.estimatedPrice} FCFA`)
    console.log(`   Service: ${q.service}`)
    console.log(`   Mis à jour: ${q.updatedAt?.toLocaleString('fr-FR')}`)

    // 2. Chercher les réservations pour ce client
    console.log('\n🔍 Recherche de réservations pour ce client...')
    const bookings = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.customerEmail, q.customerEmail))

    console.log(`\n📊 ${bookings.length} réservation(s) trouvée(s) pour ${q.customerEmail}:`)
    
    if (bookings.length === 0) {
      console.log('\n❌ AUCUNE RÉSERVATION TROUVÉE !')
      console.log('\n🔍 Raisons possibles:')
      console.log('   1. Le devis n\'avait pas de prix estimé au moment de l\'acceptation')
      console.log('   2. Une erreur s\'est produite lors de la création')
      console.log('   3. Le devis a été accepté avant la mise en place de cette fonctionnalité')
      console.log('\n💡 Solution: Créez manuellement la réservation depuis l\'interface admin')
    } else {
      bookings.forEach((booking, index) => {
        console.log(`\n   Réservation #${index + 1}:`)
        console.log(`      ID: ${booking.id}`)
        console.log(`      Statut: ${booking.status}`)
        console.log(`      De: ${booking.pickupAddress}`)
        console.log(`      À: ${booking.dropoffAddress}`)
        console.log(`      Date: ${booking.scheduledDateTime?.toLocaleString('fr-FR')}`)
        console.log(`      Prix: ${booking.price} FCFA`)
        console.log(`      Créée le: ${booking.createdAt?.toLocaleString('fr-FR')}`)
        
        // Vérifier si elle est liée au devis
        if (booking.notes?.includes('devis #3')) {
          console.log(`      ✅ LIÉE AU DEVIS #3`)
        } else {
          console.log(`      ⚠️  Pas de mention du devis #3 dans les notes`)
        }
      })
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
    }
  } finally {
    process.exit(0)
  }
}

checkBookingForQuote()
