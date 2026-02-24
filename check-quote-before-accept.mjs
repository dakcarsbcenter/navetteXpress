// Script de vérification des devis avant acceptation
// Pour s'assurer qu'un devis a bien un prix estimé avant de l'accepter

import { db } from './src/db/index.js'
import { quotes } from './src/schema.js'
import { eq } from 'drizzle-orm'

async function checkQuote() {
  const quoteId = process.argv[2]
  
  if (!quoteId) {
    console.log('❌ Usage: node check-quote-before-accept.mjs <quoteId>')
    console.log('   Exemple: node check-quote-before-accept.mjs 123')
    process.exit(1)
  }

  try {
    console.log(`\n🔍 Vérification du devis #${quoteId}...\n`)

    const quote = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, parseInt(quoteId)))
      .limit(1)

    if (!quote.length) {
      console.log(`❌ Devis #${quoteId} non trouvé`)
      process.exit(1)
    }

    const q = quote[0]

    console.log('📋 Informations du devis:')
    console.log(`   ID: ${q.id}`)
    console.log(`   Client: ${q.customerName} (${q.customerEmail})`)
    console.log(`   Service: ${q.service}`)
    console.log(`   Statut: ${q.status}`)
    console.log(`   Date préférée: ${q.preferredDate ? q.preferredDate.toLocaleString('fr-FR') : 'Non spécifiée'}`)
    console.log(`   Prix estimé: ${q.estimatedPrice ? `${q.estimatedPrice} FCFA` : '❌ NON DÉFINI'}`)
    console.log(`   Créé le: ${q.createdAt.toLocaleString('fr-FR')}`)
    console.log(`   Mis à jour: ${q.updatedAt.toLocaleString('fr-FR')}`)

    console.log('\n📝 Message du devis:')
    console.log('─'.repeat(60))
    console.log(q.message)
    console.log('─'.repeat(60))

    // Vérifications
    console.log('\n✅ Vérifications pour acceptation:')
    
    let canAccept = true

    // 1. Statut
    if (q.status !== 'sent') {
      console.log(`   ❌ Statut incorrect: "${q.status}" (doit être "sent")`)
      canAccept = false
    } else {
      console.log(`   ✅ Statut correct: "${q.status}"`)
    }

    // 2. Prix estimé
    if (!q.estimatedPrice) {
      console.log('   ❌ Prix estimé manquant - LA FACTURE ET LA RÉSERVATION NE PEUVENT PAS ÊTRE CRÉÉES')
      canAccept = false
    } else {
      console.log(`   ✅ Prix estimé défini: ${q.estimatedPrice} FCFA`)
    }

    // 3. Date préférée
    if (!q.preferredDate) {
      console.log('   ⚠️  Date préférée manquante - Une date +7 jours sera utilisée pour la réservation')
    } else {
      console.log(`   ✅ Date préférée définie: ${q.preferredDate.toLocaleString('fr-FR')}`)
    }

    // 4. Extraction des adresses
    const departMatch = q.message.match(/Départ:\s*(.+?)(?:\n|$)/i)
    const destinationMatch = q.message.match(/Destination:\s*(.+?)(?:\n|$)/i)
    
    if (departMatch) {
      console.log(`   ✅ Point de départ trouvé: "${departMatch[1].trim()}"`)
    } else {
      console.log('   ⚠️  Point de départ non trouvé dans le message - "À définir" sera utilisé')
    }
    
    if (destinationMatch) {
      console.log(`   ✅ Destination trouvée: "${destinationMatch[1].trim()}"`)
    } else {
      console.log('   ⚠️  Destination non trouvée dans le message - "À définir" sera utilisée')
    }

    // Résultat final
    console.log('\n' + '═'.repeat(60))
    if (canAccept) {
      console.log('✅ CE DEVIS PEUT ÊTRE ACCEPTÉ')
      console.log('   → Une facture sera créée')
      console.log('   → Une réservation confirmée sera créée automatiquement')
    } else {
      console.log('❌ CE DEVIS NE PEUT PAS ÊTRE ACCEPTÉ')
      console.log('   → Veuillez d\'abord ajouter un prix estimé')
      console.log('   → Ensuite, envoyez le devis au client')
    }
    console.log('═'.repeat(60))

  } catch (error) {
    console.error('❌ Erreur:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      console.error('   Stack:', error.stack)
    }
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

checkQuote()
