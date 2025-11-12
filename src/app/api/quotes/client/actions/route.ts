export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { quotes, invoicesTable } from '@/schema'
import { eq, and } from 'drizzle-orm'
import { generateInvoiceNumber, calculateInvoiceAmounts, calculateDueDate } from '@/lib/invoice-utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    const { quoteId, action, message } = await request.json()

    if (!quoteId || !action) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID du devis et action requis' 
      }, { status: 400 })
    }

    // Vérifier que le devis appartient au client
    const quote = await db.select()
      .from(quotes)
      .where(and(
        eq(quotes.id, quoteId),
        eq(quotes.customerEmail, session.user.email)
      ))
      .limit(1)

    if (!quote.length) {
      return NextResponse.json({ 
        success: false, 
        error: 'Devis non trouvé ou non autorisé' 
      }, { status: 404 })
    }

    const currentQuote = quote[0]

    // Vérifier que le devis peut être modifié
    if (currentQuote.status !== 'sent') {
      return NextResponse.json({ 
        success: false, 
        error: 'Ce devis ne peut plus être modifié' 
      }, { status: 400 })
    }

    let newStatus: string
    let clientNotes = currentQuote.clientNotes || ''

    switch (action) {
      case 'accept':
        newStatus = 'accepted'
        clientNotes += `\n[${new Date().toLocaleString('fr-FR')}] Devis accepté par le client`
        if (message) {
          clientNotes += `\nMessage du client: ${message}`
        }
        break
      
      case 'reject':
        newStatus = 'rejected'
        clientNotes += `\n[${new Date().toLocaleString('fr-FR')}] Devis rejeté par le client`
        if (message) {
          clientNotes += `\nRaison du rejet: ${message}`
        }
        break
      
      case 'negotiate':
        newStatus = 'pending'
        clientNotes += `\n[${new Date().toLocaleString('fr-FR')}] Demande de négociation du client`
        if (message) {
          clientNotes += `\nMessage de négociation: ${message}`
        }
        break
      
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Action non reconnue' 
        }, { status: 400 })
    }

    // Mettre à jour le devis
    console.log('Mise à jour du devis avec:', { status: newStatus, clientNotes, quoteId })
    
    await db.update(quotes)
      .set({
        status: newStatus as any,
        clientNotes,
        updatedAt: new Date()
      })
      .where(eq(quotes.id, quoteId))
      
    console.log('Devis mis à jour avec succès')

    // Si le devis est accepté, générer automatiquement une facture
    let invoiceData = null
    if (action === 'accept') {
      console.log('📄 Génération automatique de la facture...')
      
      try {
        // Vérifier que le devis a un prix estimé
        if (!currentQuote.estimatedPrice) {
          console.error('❌ Le devis n\'a pas de prix estimé')
          return NextResponse.json({
            success: false,
            error: 'Le devis doit avoir un prix estimé pour générer une facture'
          }, { status: 400 })
        }

        // Générer le numéro de facture unique
        const invoiceNumber = await generateInvoiceNumber()
        console.log(`   ✓ Numéro de facture généré: ${invoiceNumber}`)

        // Calculer les montants (HT, TVA, TTC)
        const estimatedPrice = parseFloat(currentQuote.estimatedPrice)
        const amounts = calculateInvoiceAmounts(estimatedPrice, 20) // TVA 20% par défaut
        console.log(`   ✓ Montants calculés: HT=${amounts.amount}€, TVA=${amounts.taxAmount}€, TTC=${amounts.totalAmount}€`)

        // Calculer la date d'échéance (30 jours)
        const issueDate = new Date()
        const dueDate = calculateDueDate(issueDate, 30)
        console.log(`   ✓ Date d'échéance: ${dueDate.toLocaleDateString('fr-FR')}`)

        // Créer la facture dans la base de données
        const [newInvoice] = await db.insert(invoicesTable).values({
          invoiceNumber,
          quoteId: currentQuote.id,
          customerName: currentQuote.customerName,
          customerEmail: currentQuote.customerEmail,
          customerPhone: currentQuote.customerPhone,
          service: currentQuote.service,
          amount: amounts.amount,
          taxRate: amounts.taxRate,
          taxAmount: amounts.taxAmount,
          totalAmount: amounts.totalAmount,
          status: 'pending',
          issueDate,
          dueDate,
          notes: message ? `Note du client: ${message}` : null
        }).returning()

        console.log(`✅ Facture ${invoiceNumber} créée avec succès (ID: ${newInvoice.id})`)
        
        invoiceData = {
          id: newInvoice.id,
          invoiceNumber: newInvoice.invoiceNumber,
          totalAmount: newInvoice.totalAmount,
          dueDate: newInvoice.dueDate
        }

      } catch (invoiceError) {
        console.error('❌ Erreur lors de la génération de la facture:', invoiceError)
        // On ne bloque pas l'acceptation du devis même si la facture échoue
        // Mais on log l'erreur pour investigation
        console.error('Stack trace:', invoiceError instanceof Error ? invoiceError.stack : 'No stack trace')
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Action effectuée avec succès',
      newStatus,
      timestamp: new Date().toISOString(),
      invoice: invoiceData // Inclure les données de la facture si générée
    })

  } catch (error) {
    console.error('Erreur lors de l\'action sur le devis:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}