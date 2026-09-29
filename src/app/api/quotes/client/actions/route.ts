export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from "next-auth";
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { quotes, quoteTripsTable, invoicesTable, bookingsTable } from '@/schema'
import { eq, and } from 'drizzle-orm'
import { generateInvoiceNumber, calculateInvoiceAmounts, calculateDueDate } from '@/lib/invoice-utils'
import { sendWithRetry } from '@/lib/notification-queue'
import { getQuoteTrips } from '@/lib/quote-trips'
import { parseQuoteMessage } from '@/lib/quote-services'
import { buildQuoteDocumentData } from '@/lib/quote-document'

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    
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

    // Validate quoteId is a positive integer to prevent format string vulnerabilities
    const sanitizedQuoteId = parseInt(String(quoteId), 10)
    if (isNaN(sanitizedQuoteId) || sanitizedQuoteId <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID du devis invalide' 
      }, { status: 400 })
    }

    // Sanitize message to prevent format string vulnerabilities
    // Convert to string, trim whitespace, and limit length to 500 characters
    const sanitizedMessage = message ? String(message).trim().slice(0, 500) : null

    // Vérifier que le devis appartient au client
    const quote = await db.select()
      .from(quotes)
      .where(and(
        eq(quotes.id, sanitizedQuoteId),
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

    let newStatus: 'accepted' | 'rejected' | 'pending'
    let clientNotes = currentQuote.clientNotes || ''

    switch (action) {
      case 'accept':
        newStatus = 'accepted'
        clientNotes += `\n[${new Date().toLocaleString('fr-FR')}] Devis accepté par le client`
        if (sanitizedMessage) {
          clientNotes += `\nMessage du client: ${sanitizedMessage}`
        }
        break
      
      case 'reject':
        newStatus = 'rejected'
        clientNotes += `\n[${new Date().toLocaleString('fr-FR')}] Devis rejeté par le client`
        if (sanitizedMessage) {
          clientNotes += `\nRaison du rejet: ${sanitizedMessage}`
        }
        break
      
      case 'negotiate':
        newStatus = 'pending'
        clientNotes += `\n[${new Date().toLocaleString('fr-FR')}] Demande de négociation du client`
        if (sanitizedMessage) {
          clientNotes += `\nMessage de négociation: ${sanitizedMessage}`
        }
        break
      
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Action non reconnue' 
        }, { status: 400 })
    }

    // Mettre à jour le devis
    console.log('Mise à jour du devis avec:', { status: newStatus, clientNotes, quoteId: sanitizedQuoteId })
    
    await db.update(quotes)
      .set({
        status: newStatus,
        clientNotes,
        updatedAt: new Date()
      })
      .where(eq(quotes.id, sanitizedQuoteId))
      
    console.log('Devis mis à jour avec succès')

    // Si le devis est accepté, générer automatiquement une facture et une réservation
    let invoiceData = null
    type BookingSummary = {
      id: number; status: string; scheduledDateTime: Date;
      pickupAddress: string; dropoffAddress: string;
    }
    let bookingData: BookingSummary | null = null
    const bookingsData: BookingSummary[] = []
    
    if (action === 'accept') {
      console.log('📄 Génération automatique de la facture et réservation...')
      console.log('   📋 Devis:', {
        id: currentQuote.id,
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

        // Calculer les montants (HT, TVA, TTC) — TVA sénégalaise à 18 %
        const estimatedPrice = parseFloat(currentQuote.estimatedPrice)
        const amounts = calculateInvoiceAmounts(estimatedPrice)
        console.log(`   ✓ Montants calculés: HT=${amounts.amount}, TVA=${amounts.taxAmount}, TTC=${amounts.totalAmount} FCFA`)

        // Lignes de prestation figées à l'émission : la facture ne doit pas
        // suivre les modifications ultérieures du devis dont elle découle.
        const quoteDocument = await buildQuoteDocumentData(currentQuote.id)

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
          notes: sanitizedMessage ? `Note du client: ${sanitizedMessage}` : null,
          // Champs du document officiel, repris du devis accepté
          quoteReference: quoteDocument?.reference ?? null,
          documentObject: quoteDocument?.object ?? null,
          customerAddress: currentQuote.customerAddress,
          customerNinea: currentQuote.customerNinea,
          items: quoteDocument?.items ?? null
        }).returning()

        console.log(`✅ Facture ${invoiceNumber} créée avec succès (ID: ${newInvoice.id})`)
        
        invoiceData = {
          id: newInvoice.id,
          invoiceNumber: newInvoice.invoiceNumber,
          totalAmount: newInvoice.totalAmount,
          dueDate: newInvoice.dueDate
        }

        // Envoyer l'email de notification de facture au client (retry automatique en cas d'échec)
        await sendWithRetry('email', 'resend-mailer.sendInvoiceEmail', [
          newInvoice.customerEmail,
          {
            invoiceNumber: newInvoice.invoiceNumber,
            customerName: newInvoice.customerName,
            service: newInvoice.service,
            amountHT: `${parseFloat(newInvoice.amount).toLocaleString('fr-FR')} FCFA`,
            vatAmount: `${parseFloat(newInvoice.taxAmount).toLocaleString('fr-FR')} FCFA`,
            amountTTC: `${parseFloat(newInvoice.totalAmount).toLocaleString('fr-FR')} FCFA`,
            issueDate: new Date(newInvoice.issueDate).toLocaleDateString('fr-FR'),
            dueDate: new Date(newInvoice.dueDate).toLocaleDateString('fr-FR'),
            invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/client/factures/${newInvoice.id}`,
            invoiceDbId: newInvoice.id
          }
        ])

      } catch (invoiceError) {
        console.error('❌ Erreur lors de la génération de la facture:', invoiceError)
        console.error('   Stack trace:', invoiceError instanceof Error ? invoiceError.stack : 'No stack trace')
        console.error('   Message:', invoiceError instanceof Error ? invoiceError.message : String(invoiceError))
        // On ne bloque pas l'acceptation du devis même si la facture échoue
      }

      // Créer automatiquement une réservation confirmée par trajet du devis.
      // Cette section s'exécute INDÉPENDAMMENT du succès de la facture
      console.log('\n📅 Création automatique des réservations confirmées...')

      try {
        const quoteMessage = currentQuote.message || ''
        const trips = await getQuoteTrips(currentQuote.id)

        // Date de repli quand le client n'a pas fixé d'heure de prise en charge.
        const fallbackDateTime = currentQuote.preferredDate
          ? new Date(currentQuote.preferredDate)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        // Devis multi-trajets : une réservation par ligne, chacune assignable à
        // un chauffeur. Devis antérieurs à la table quote_trips : on relit le
        // message comme avant, ce qui donne une seule course.
        const legs = trips.length > 0
          ? trips.map((trip) => ({
              tripId: trip.id as number | null,
              position: trip.position,
              pickupAddress: trip.departure,
              dropoffAddress: trip.destination,
              scheduledDateTime: trip.scheduledDateTime ? new Date(trip.scheduledDateTime) : fallbackDateTime,
              passengers: trip.passengers,
              luggage: trip.luggage,
              price: trip.estimatedPrice,
              note: trip.note,
            }))
          : (() => {
              const parsed = parseQuoteMessage(quoteMessage)
              return [{
                tripId: null,
                position: 1,
                pickupAddress: parsed.departure || 'À définir',
                dropoffAddress: parsed.destination || 'À définir',
                scheduledDateTime: fallbackDateTime,
                passengers: parsed.numberOfPeople ? parseInt(parsed.numberOfPeople, 10) : 1,
                luggage: 1,
                price: currentQuote.estimatedPrice,
                note: null as string | null,
              }]
            })()

        console.log(`   ✓ ${legs.length} trajet(s) à convertir en réservation`)

        for (const leg of legs) {
          const legLabel = legs.length > 1 ? ` (trajet ${leg.position}/${legs.length})` : ''
          const notes = [
            `Réservation créée automatiquement suite à l'acceptation du devis #${currentQuote.id}${legLabel}`,
            `Service: ${currentQuote.service}`,
            leg.note ? `Note du trajet: ${leg.note}` : null,
            sanitizedMessage ? `Message du client: ${sanitizedMessage}` : null,
          ].filter(Boolean).join('\n\n')

          const [newBooking] = await db.insert(bookingsTable).values({
            customerName: currentQuote.customerName,
            customerEmail: currentQuote.customerEmail,
            customerPhone: currentQuote.customerPhone || '',
            pickupAddress: leg.pickupAddress,
            dropoffAddress: leg.dropoffAddress,
            scheduledDateTime: leg.scheduledDateTime,
            status: 'confirmed' as const,
            // Prix de la ligne quand l'admin a chiffré trajet par trajet ; sinon
            // le montant global, pour ne pas laisser la course sans tarif.
            price: leg.price || currentQuote.estimatedPrice,
            notes,
            passengers: leg.passengers > 0 ? leg.passengers : 1,
            luggage: leg.luggage,
            // Devis passé pour un tiers : le chauffeur doit chercher le passager.
            passengerName: currentQuote.passengerName,
            passengerPhone: currentQuote.passengerPhone,
            updatedAt: new Date()
          }).returning()

          if (leg.tripId) {
            await db.update(quoteTripsTable)
              .set({ bookingId: newBooking.id, updatedAt: new Date() })
              .where(eq(quoteTripsTable.id, leg.tripId))
          }

          console.log(`   ✅ Réservation ${newBooking.id} — ${newBooking.pickupAddress} → ${newBooking.dropoffAddress} (${newBooking.scheduledDateTime})`)

          bookingsData.push({
            id: newBooking.id,
            status: newBooking.status,
            scheduledDateTime: newBooking.scheduledDateTime,
            pickupAddress: newBooking.pickupAddress,
            dropoffAddress: newBooking.dropoffAddress
          })
        }

        // Contrat de réponse historique : `booking` reste la première course.
        bookingData = bookingsData[0] ?? null

      } catch (bookingError) {
        console.error('\n❌ ERREUR lors de la création de la réservation!')
        console.error('   Type:', bookingError instanceof Error ? bookingError.name : typeof bookingError)
        console.error('   Message:', bookingError instanceof Error ? bookingError.message : String(bookingError))
        console.error('   Stack trace:', bookingError instanceof Error ? bookingError.stack : 'No stack trace')
        // On ne bloque pas l'acceptation du devis même si la création de réservation échoue
      }

      // Envoyer email à l'admin pour notifier l'acceptation du devis (retry automatique en cas d'échec)
      await sendWithRetry('email', 'resend-mailer.sendQuoteAcceptedEmail', [{
        quoteId: `QUOTE-${currentQuote.id}`,
        customerName: currentQuote.customerName,
        customerEmail: currentQuote.customerEmail,
        service: currentQuote.service,
        price: parseFloat(currentQuote.estimatedPrice || '0')
      }]);
    }

    // Si le devis est rejeté, envoyer email à l'admin
    if (action === 'reject') {
      await sendWithRetry('email', 'resend-mailer.sendQuoteRejectedEmail', [{
        quoteId: `QUOTE-${currentQuote.id}`,
        customerName: currentQuote.customerName,
        customerEmail: currentQuote.customerEmail,
        service: currentQuote.service,
        rejectionReason: sanitizedMessage
      }]);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Action effectuée avec succès',
      newStatus,
      timestamp: new Date().toISOString(),
      invoice: invoiceData, // Inclure les données de la facture si générée
      booking: bookingData, // Première réservation créée (contrat historique)
      bookings: bookingsData // Une réservation par trajet du devis
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
