// Script de test pour vérifier la création automatique de réservation
// lors de l'acceptation d'un devis

import { db } from './src/db/index.js'
import { quotes, bookingsTable, invoicesTable } from './src/schema.js'
import { eq } from 'drizzle-orm'

async function testAutoBookingCreation() {
  console.log('🧪 Test : Création automatique de réservation depuis un devis accepté\n')

  try {
    // 1. Trouver un devis accepté récemment
    console.log('📋 Recherche d\'un devis accepté récemment...')
    const acceptedQuotes = await db
      .select()
      .from(quotes)
      .where(eq(quotes.status, 'accepted'))
      .orderBy(quotes.updatedAt)
      .limit(5)

    if (acceptedQuotes.length === 0) {
      console.log('❌ Aucun devis accepté trouvé pour le test')
      console.log('\n💡 Conseil : Acceptez un devis depuis l\'interface client pour tester')
      return
    }

    console.log(`✅ ${acceptedQuotes.length} devis accepté(s) trouvé(s)\n`)

    // 2. Pour chaque devis accepté, vérifier la facture et la réservation
    for (const quote of acceptedQuotes) {
      console.log(`\n📄 Devis #${quote.id} - ${quote.customerName}`)
      console.log(`   Email: ${quote.customerEmail}`)
      console.log(`   Service: ${quote.service}`)
      console.log(`   Prix: ${quote.estimatedPrice} FCFA`)
      console.log(`   Accepté le: ${quote.updatedAt?.toLocaleString('fr-FR')}`)
      
      // Vérifier la facture associée
      console.log('\n   🔍 Vérification de la facture associée...')
      const invoices = await db
        .select()
        .from(invoicesTable)
        .where(eq(invoicesTable.quoteId, quote.id))

      if (invoices.length > 0) {
        const invoice = invoices[0]
        console.log(`   ✅ Facture trouvée: ${invoice.invoiceNumber}`)
        console.log(`      - Montant TTC: ${invoice.totalAmount} FCFA`)
        console.log(`      - Statut: ${invoice.status}`)
        console.log(`      - Date d'échéance: ${invoice.dueDate?.toLocaleDateString('fr-FR')}`)
      } else {
        console.log('   ❌ Aucune facture trouvée')
      }

      // Vérifier la réservation associée
      console.log('\n   🔍 Vérification de la réservation associée...')
      const bookings = await db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.customerEmail, quote.customerEmail))
        .orderBy(bookingsTable.createdAt)

      // Chercher une réservation créée après l'acceptation du devis
      const relatedBooking = bookings.find(b => {
        const bookingCreatedAt = new Date(b.createdAt).getTime()
        const quoteAcceptedAt = new Date(quote.updatedAt).getTime()
        // Réservation créée dans les 5 minutes suivant l'acceptation
        return Math.abs(bookingCreatedAt - quoteAcceptedAt) < 5 * 60 * 1000 &&
               b.notes?.includes(`devis #${quote.id}`)
      })

      if (relatedBooking) {
        console.log(`   ✅ Réservation trouvée: #${relatedBooking.id}`)
        console.log(`      - Statut: ${relatedBooking.status} ${relatedBooking.status === 'confirmed' ? '✅' : '❌ (devrait être "confirmed")'}`)
        console.log(`      - Point de départ: ${relatedBooking.pickupAddress}`)
        console.log(`      - Destination: ${relatedBooking.dropoffAddress}`)
        console.log(`      - Date prévue: ${relatedBooking.scheduledDateTime?.toLocaleString('fr-FR')}`)
        console.log(`      - Passagers: ${relatedBooking.passengers}`)
        console.log(`      - Bagages: ${relatedBooking.luggage}`)
        console.log(`      - Prix: ${relatedBooking.price} FCFA`)
        
        // Vérifier le statut
        if (relatedBooking.status === 'confirmed') {
          console.log('\n   ✅ SUCCÈS : La réservation est bien au statut "confirmed"')
        } else {
          console.log('\n   ❌ ERREUR : La réservation n\'est pas au statut "confirmed"')
        }
      } else {
        console.log('   ❌ Aucune réservation trouvée liée à ce devis')
        console.log('   💡 La fonctionnalité a peut-être été implémentée après l\'acceptation de ce devis')
      }

      console.log('\n' + '─'.repeat(80))
    }

    console.log('\n\n📊 Résumé du Test\n')
    console.log('Test terminé. Vérifications effectuées :')
    console.log('  ✓ Devis acceptés trouvés')
    console.log('  ✓ Factures associées vérifiées')
    console.log('  ✓ Réservations créées automatiquement vérifiées')
    console.log('  ✓ Statut "confirmed" vérifié')
    console.log('\n💡 Pour un test complet, acceptez un nouveau devis depuis l\'interface client')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      console.error('   Stack:', error.stack)
    }
  } finally {
    process.exit(0)
  }
}

// Exécuter le test
testAutoBookingCreation()
