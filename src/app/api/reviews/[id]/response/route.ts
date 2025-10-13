import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { reviewsTable } from '@/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { response, makePublic } = body
    const { id } = await params
    const reviewId = parseInt(id)
    
    if (!response || !response.trim()) {
      return NextResponse.json(
        { error: 'La réponse ne peut pas être vide' },
        { status: 400 }
      )
    }

    // Mettre à jour l'avis avec la réponse
    await db.update(reviewsTable)
      .set({
        response: response.trim(),
        respondedBy: session.user.email || 'Admin',
        respondedAt: new Date(),
        isPublic: makePublic,
        updatedAt: new Date()
      })
      .where(eq(reviewsTable.id, reviewId))
    
    return NextResponse.json({
      success: true,
      message: 'Réponse ajoutée avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de l\'ajout de la réponse:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout de la réponse' },
      { status: 500 }
    )
  }
}