export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from "next-auth";
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { quotes } from '@/schema'
import { eq, and } from 'drizzle-orm'
import { sendWithRetry } from '@/lib/notification-queue'
import {
  createBookingsForQuote,
  createInvoiceForQuote,
  type BookingSummary,
} from '@/lib/quote-acceptance'

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
    let invoiceData: {
      id: number; invoiceNumber: string; totalAmount: string; dueDate: Date;
    } | null = null
    let bookingData: BookingSummary | null = null
    let bookingsData: BookingSummary[] = []

    if (action === 'accept') {
      console.log('📄 Génération automatique de la facture et réservation...')

      // Vérifier que le devis a un prix estimé
      if (!currentQuote.estimatedPrice) {
        console.error('❌ Le devis n\'a pas de prix estimé - BLOQUÉ')
        return NextResponse.json({
          success: false,
          error: 'Le devis doit avoir un prix estimé pour générer une facture et une réservation'
        }, { status: 400 })
      }

      // Facture et réservations sont indépendantes : on ne bloque pas
      // l'acceptation du devis si l'une des deux échoue.
      try {
        const newInvoice = await createInvoiceForQuote(currentQuote, {
          notes: sanitizedMessage ? `Note du client: ${sanitizedMessage}` : null,
        })
        invoiceData = {
          id: newInvoice.id,
          invoiceNumber: newInvoice.invoiceNumber,
          totalAmount: newInvoice.totalAmount,
          dueDate: newInvoice.dueDate
        }
      } catch (invoiceError) {
        console.error('❌ Erreur lors de la génération de la facture:', invoiceError)
        console.error('   Stack trace:', invoiceError instanceof Error ? invoiceError.stack : 'No stack trace')
      }

      try {
        bookingsData = await createBookingsForQuote(currentQuote, { clientMessage: sanitizedMessage })
        // Contrat de réponse historique : `booking` reste la première course.
        bookingData = bookingsData[0] ?? null
      } catch (bookingError) {
        console.error('❌ ERREUR lors de la création de la réservation!')
        console.error('   Message:', bookingError instanceof Error ? bookingError.message : String(bookingError))
        console.error('   Stack trace:', bookingError instanceof Error ? bookingError.stack : 'No stack trace')
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
