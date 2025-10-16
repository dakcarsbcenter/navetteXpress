import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { quotes } from '@/schema'
import { eq, and } from 'drizzle-orm'

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

    return NextResponse.json({ 
      success: true, 
      message: 'Action effectuée avec succès',
      newStatus,
      timestamp: new Date().toISOString()
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