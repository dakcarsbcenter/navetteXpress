import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { bookingsTable } from '@/schema'
import { eq, and } from 'drizzle-orm'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un chauffeur
    if (!('role' in session.user) || session.user.role !== 'driver') {
      return NextResponse.json({ error: 'Accès refusé - chauffeur requis' }, { status: 403 })
    }

    const bookingId = parseInt(id)
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: 'ID de réservation invalide' }, { status: 400 })
    }

    const body = await request.json()
    const { status } = body

    // Valider le nouveau statut (excluding 'pending' which is admin-only)
    const validStatuses = ['assigned', 'confirmed', 'in_progress', 'completed', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Statut invalide. Statuts autorisés pour les chauffeurs: ' + validStatuses.join(', ') 
      }, { status: 400 })
    }

    // Vérifier que la réservation existe et appartient au chauffeur connecté
    const existingBooking = await db.select()
      .from(bookingsTable)
      .where(and(
        eq(bookingsTable.id, bookingId),
        eq(bookingsTable.driverId, session.user.id)
      ))
      .limit(1)

    if (existingBooking.length === 0) {
      return NextResponse.json({ 
        error: 'Réservation non trouvée ou non assignée à ce chauffeur' 
      }, { status: 404 })
    }

    // Valider les transitions de statut autorisées pour le chauffeur
    // Note: 'pending' est exclu car c'est un statut réservé aux administrateurs
    const currentStatus = existingBooking[0].status
    const allowedTransitions: Record<string, string[]> = {
      'assigned': ['confirmed', 'cancelled'], // Chauffeur peut confirmer ou refuser
      'confirmed': ['in_progress', 'cancelled'], // Peut commencer ou annuler
      'in_progress': ['completed'], // Peut marquer comme terminé
      'completed': [], // Statut final
      'cancelled': [], // Statut final
      // 'pending' n'est pas inclus car c'est un statut admin-only
    }

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json({ 
        error: `Transition de statut non autorisée: ${currentStatus} → ${status}` 
      }, { status: 400 })
    }

    // Mettre à jour le statut
    await db.update(bookingsTable)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(bookingsTable.id, bookingId))

    return NextResponse.json({ 
      success: true, 
      message: 'Statut mis à jour avec succès',
      data: {
        id: bookingId,
        status,
        updatedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur lors de la mise à jour du statut' 
    }, { status: 500 })
  }
}