export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { quotes, invoicesTable, bookingsTable } from '@/schema'
import { eq, and } from 'drizzle-orm'
import { generateInvoiceNumber, calculateInvoiceAmounts, calculateDueDate } from '@/lib/invoice-utils'
import { sendInvoiceEmail, sendQuoteAcceptedEmail, sendQuoteRejectedEmail } from '@/lib/resend-mailer'

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

    // Si le devis est accepté, générer automatiquement une facture et une réservation
    let invoiceData = null
    let bookingData = null
    
    if (action === 'accept') {
      console.log('📄 Génération automatique de la facture et réservation...')
      console.log(`   📋 Devis #${currentQuote.id}:`, {
        customerName: currentQuote.customerName,
        estimatedPrice: currentQuote.estimatedPrice,
        preferredDate: currentQuote.preferredDate,
        service: currentQuote.service
      })
      
      try {
        // Vérifier que le devis a un prix estimé
        if (!currentQuote.estimatedPrice) {
          console.error('❌ Le devis n\'a pas de prix estimé - BLOQUÉ')
          return NextResponse.json({
            success: false,
            error: 'Le devis doit avoir un prix estimé pour générer une facture et une réservation'
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

        // Envoyer l'email de notification de facture au client
        try {
          console.log('📧 Envoi de l\'email de facture à:', newInvoice.customerEmail)
          
          await sendInvoiceEmail(newInvoice.customerEmail, {
            invoiceNumber: newInvoice.invoiceNumber,
            customerName: newInvoice.customerName,
            service: newInvoice.service,
            amountHT: `${parseFloat(newInvoice.amount).toLocaleString('fr-FR')} FCFA`,
            vatAmount: `${parseFloat(newInvoice.taxAmount).toLocaleString('fr-FR')} FCFA`,
            amountTTC: `${parseFloat(newInvoice.totalAmount).toLocaleString('fr-FR')} FCFA`,
            issueDate: new Date(newInvoice.issueDate).toLocaleDateString('fr-FR'),
            dueDate: new Date(newInvoice.dueDate).toLocaleDateString('fr-FR'),
            invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/client/factures/${newInvoice.id}`
          })
          
          console.log('✅ Email de facture envoyé avec succès')
        } catch (emailError) {
          console.error('❌ Erreur lors de l\'envoi de l\'email de facture:', emailError)
          // Ne pas bloquer si l'email échoue
        }

      } catch (invoiceError) {
        console.error('❌ Erreur lors de la génération de la facture:', invoiceError)
        console.error('   Stack trace:', invoiceError instanceof Error ? invoiceError.stack : 'No stack trace')
        console.error('   Message:', invoiceError instanceof Error ? invoiceError.message : String(invoiceError))
        // On ne bloque pas l'acceptation du devis même si la facture échoue
      }

      // Créer automatiquement une réservation confirmée
      // Cette section s'exécute INDÉPENDAMMENT du succès de la facture
      console.log('\n📅 Création automatique de la réservation confirmée...')
      
      try {
        // Extraire les informations de la demande de devis pour créer la réservation
        // Le message du devis contient normalement les détails (pickup, dropoff, date, etc.)
        const quoteMessage = currentQuote.message || ''
        
        // Extraire le point de départ et la destination depuis le message
        let pickupAddress = 'À définir'
        let dropoffAddress = 'À définir'
        let passengers = 1
        let luggage = 1
        
        // Regex pour extraire les informations du message
        const departMatch = quoteMessage.match(/Départ:\s*(.+?)(?:\n|$)/i)
        const destinationMatch = quoteMessage.match(/Destination:\s*(.+?)(?:\n|$)/i)
        const passengersMatch = quoteMessage.match(/(\d+)\s*personne/i)
        const cabinBaggageMatch = quoteMessage.match(/Bagages cabine:\s*(\d+)/i)
        const checkedBaggageMatch = quoteMessage.match(/Bagages soute:\s*(\d+)/i)
        
        if (departMatch && departMatch[1]) {
          pickupAddress = departMatch[1].trim()
          console.log(`   ✓ Point de départ extrait: ${pickupAddress}`)
        }
        
        if (destinationMatch && destinationMatch[1]) {
          dropoffAddress = destinationMatch[1].trim()
          console.log(`   ✓ Destination extraite: ${dropoffAddress}`)
        }
        
        if (passengersMatch && passengersMatch[1]) {
          passengers = parseInt(passengersMatch[1])
          console.log(`   ✓ Nombre de passagers: ${passengers}`)
        }
        
        // Calculer le total des bagages
        const cabinBaggage = cabinBaggageMatch ? parseInt(cabinBaggageMatch[1]) : 0
        const checkedBaggage = checkedBaggageMatch ? parseInt(checkedBaggageMatch[1]) : 0
        luggage = cabinBaggage + checkedBaggage
        console.log(`   ✓ Nombre de bagages: ${luggage} (cabine: ${cabinBaggage}, soute: ${checkedBaggage})`)
        
        // Utiliser la date préférée si disponible, sinon une date par défaut
        const scheduledDateTime = currentQuote.preferredDate 
          ? new Date(currentQuote.preferredDate)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours à partir de maintenant si pas de date

        // Préparer les données de la réservation
        const bookingValues = {
          customerName: currentQuote.customerName,
          customerEmail: currentQuote.customerEmail,
          customerPhone: currentQuote.customerPhone || '',
          pickupAddress,
          dropoffAddress,
          scheduledDateTime,
          status: 'confirmed' as const, // Statut confirmé directement
          price: currentQuote.estimatedPrice,
          notes: `Réservation créée automatiquement suite à l'acceptation du devis #${currentQuote.id}\n\nService: ${currentQuote.service}\n\nDétails du devis:\n${quoteMessage}\n\n${message ? `Message du client: ${message}` : ''}`,
          passengers,
          luggage,
          updatedAt: new Date()
        }
        
        console.log('   📝 Données de réservation à insérer:', {
          customerName: bookingValues.customerName,
          customerEmail: bookingValues.customerEmail,
          pickupAddress: bookingValues.pickupAddress,
          dropoffAddress: bookingValues.dropoffAddress,
          scheduledDateTime: bookingValues.scheduledDateTime,
          status: bookingValues.status,
          passengers: bookingValues.passengers,
          luggage: bookingValues.luggage,
          price: bookingValues.price
        })

        // Créer la réservation avec le statut "confirmed"
        const [newBooking] = await db.insert(bookingsTable).values(bookingValues).returning()

        console.log(`\n✅ Réservation créée avec succès!`)
        console.log(`   ID: ${newBooking.id}`)
        console.log(`   Statut: ${newBooking.status}`)
        console.log(`   Date: ${newBooking.scheduledDateTime}`)
        console.log(`   De: ${newBooking.pickupAddress}`)
        console.log(`   À: ${newBooking.dropoffAddress}`)
        
        bookingData = {
          id: newBooking.id,
          status: newBooking.status,
          scheduledDateTime: newBooking.scheduledDateTime,
          pickupAddress: newBooking.pickupAddress,
          dropoffAddress: newBooking.dropoffAddress
        }

      } catch (bookingError) {
        console.error('\n❌ ERREUR lors de la création de la réservation!')
        console.error('   Type:', bookingError instanceof Error ? bookingError.name : typeof bookingError)
        console.error('   Message:', bookingError instanceof Error ? bookingError.message : String(bookingError))
        console.error('   Stack trace:', bookingError instanceof Error ? bookingError.stack : 'No stack trace')
        // On ne bloque pas l'acceptation du devis même si la création de réservation échoue
      }

      // Envoyer email à l'admin pour notifier l'acceptation du devis
      try {
        console.log(`📧 Envoi notification admin pour devis accepté #${currentQuote.id}...`);
        
        await sendQuoteAcceptedEmail({
          quoteId: `QUOTE-${currentQuote.id}`,
          customerName: currentQuote.customerName,
          customerEmail: currentQuote.customerEmail,
          service: currentQuote.service,
          price: parseFloat(currentQuote.estimatedPrice || '0')
        });

        console.log(`✅ Notification admin devis accepté envoyée`);
      } catch (emailError) {
        console.error('❌ Erreur lors de l\'envoi de la notification admin:', emailError);
      }
    }

    // Si le devis est rejeté, envoyer email à l'admin
    if (action === 'reject') {
      try {
        console.log(`📧 Envoi notification admin pour devis rejeté #${currentQuote.id}...`);
        
        await sendQuoteRejectedEmail({
          quoteId: `QUOTE-${currentQuote.id}`,
          customerName: currentQuote.customerName,
          customerEmail: currentQuote.customerEmail,
          service: currentQuote.service,
          rejectionReason: message
        });

        console.log(`✅ Notification admin devis rejeté envoyée`);
      } catch (emailError) {
        console.error('❌ Erreur lors de l\'envoi de la notification admin:', emailError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Action effectuée avec succès',
      newStatus,
      timestamp: new Date().toISOString(),
      invoice: invoiceData, // Inclure les données de la facture si générée
      booking: bookingData // Inclure les données de la réservation si créée
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