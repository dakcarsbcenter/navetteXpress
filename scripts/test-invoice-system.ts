import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { quotesTable, invoicesTable } from '../src/schema'
import { eq } from 'drizzle-orm'
import * as schema from '../src/schema'

// Utiliser l'URL depuis drizzle.config.ts
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_4JAmYGR2ENSu@ep-sweet-resonance-ab6ilynd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const sql = postgres(DATABASE_URL)
const db = drizzle(sql, { schema })

/**
 * Script de test pour vérifier le système de facturation
 * Ce script :
 * 1. Vérifie que la table invoices existe
 * 2. Liste les factures existantes
 * 3. Vérifie les relations avec les devis
 */

async function testInvoiceSystem() {
  console.log('🧪 Test du système de facturation\n')

  try {
    // Test 1 : Vérifier que la table existe
    console.log('📋 Test 1 : Vérification de la table invoices')
    try {
      const invoices = await db.select().from(invoicesTable).limit(1)
      console.log('   ✅ Table invoices accessible')
    } catch (error) {
      console.log('   ❌ La table invoices n\'existe pas encore')
      console.log('   💡 Exécutez : npx tsx scripts/add-invoices-migration.ts')
      return
    }

    // Test 2 : Compter les factures
    console.log('\n📊 Test 2 : Statistiques des factures')
    const allInvoices = await db.select().from(invoicesTable)
    console.log(`   ✓ Nombre total de factures : ${allInvoices.length}`)

    if (allInvoices.length > 0) {
      const pending = allInvoices.filter(inv => inv.status === 'pending').length
      const paid = allInvoices.filter(inv => inv.status === 'paid').length
      const cancelled = allInvoices.filter(inv => inv.status === 'cancelled').length
      
      console.log(`   ✓ Factures en attente : ${pending}`)
      console.log(`   ✓ Factures payées : ${paid}`)
      console.log(`   ✓ Factures annulées : ${cancelled}`)
    }

    // Test 3 : Lister les dernières factures
    if (allInvoices.length > 0) {
      console.log('\n📄 Test 3 : Dernières factures créées')
      const recentInvoices = allInvoices.slice(-5).reverse()
      
      for (const invoice of recentInvoices) {
        console.log(`\n   Facture ${invoice.invoiceNumber}`)
        console.log(`   ├─ Client: ${invoice.customerName} (${invoice.customerEmail})`)
        console.log(`   ├─ Service: ${invoice.service}`)
        console.log(`   ├─ Montant HT: ${invoice.amount}€`)
        console.log(`   ├─ TVA (${invoice.taxRate}%): ${invoice.taxAmount}€`)
        console.log(`   ├─ Total TTC: ${invoice.totalAmount}€`)
        console.log(`   ├─ Statut: ${invoice.status}`)
        console.log(`   ├─ Date d'émission: ${invoice.issueDate.toLocaleDateString('fr-FR')}`)
        console.log(`   └─ Date d'échéance: ${invoice.dueDate.toLocaleDateString('fr-FR')}`)
      }
    }

    // Test 4 : Vérifier les relations avec les devis
    console.log('\n🔗 Test 4 : Vérification des relations devis-factures')
    if (allInvoices.length > 0) {
      for (const invoice of allInvoices.slice(-3)) {
        const quote = await db.select()
          .from(quotesTable)
          .where(eq(quotesTable.id, invoice.quoteId))
          .limit(1)
        
        if (quote.length > 0) {
          console.log(`   ✓ Facture ${invoice.invoiceNumber} liée au devis #${quote[0].id} (statut: ${quote[0].status})`)
        } else {
          console.log(`   ⚠️  Facture ${invoice.invoiceNumber} liée à un devis introuvable (#${invoice.quoteId})`)
        }
      }
    } else {
      console.log('   ℹ️  Aucune facture à vérifier')
    }

    // Test 5 : Vérifier les devis acceptés sans facture
    console.log('\n🔍 Test 5 : Devis acceptés sans facture')
    const acceptedQuotes = await db.select()
      .from(quotesTable)
      .where(eq(quotesTable.status, 'accepted'))
    
    console.log(`   ✓ Nombre de devis acceptés : ${acceptedQuotes.length}`)
    
    for (const quote of acceptedQuotes) {
      const invoice = await db.select()
        .from(invoicesTable)
        .where(eq(invoicesTable.quoteId, quote.id))
        .limit(1)
      
      if (invoice.length === 0) {
        console.log(`   ⚠️  Devis #${quote.id} accepté mais sans facture`)
        console.log(`      Client: ${quote.customerName}`)
        console.log(`      Prix estimé: ${quote.estimatedPrice || 'Non défini'}€`)
      }
    }

    console.log('\n✅ Tests terminés avec succès')
    console.log('\n💡 Notes:')
    console.log('   - Les factures sont générées automatiquement lors de l\'acceptation des devis')
    console.log('   - Format du numéro: INV-YYYY-XXXXX')
    console.log('   - TVA par défaut: 20%')
    console.log('   - Échéance: 30 jours après émission')

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'Pas de stack trace')
    process.exit(1)
  }
}

// Exécuter les tests
testInvoiceSystem()
  .then(async () => {
    console.log('\n✅ Script de test terminé')
    await sql.end()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('❌ Erreur fatale:', error)
    await sql.end()
    process.exit(1)
  })
