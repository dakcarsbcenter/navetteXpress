import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { reviewsTable } from '@/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = await params
    const reviewId = parseInt(id)
    
    // Mettre à jour les propriétés de l'avis
    await db.update(reviewsTable)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(reviewsTable.id, reviewId))
    
    return NextResponse.json({
      success: true,
      message: 'Avis mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'avis:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'avis' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const reviewId = parseInt(params.id)
    
    await db.delete(reviewsTable).where(eq(reviewsTable.id, reviewId))

    return NextResponse.json({
      success: true,
      message: 'Avis supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'avis:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'avis' },
      { status: 500 }
    )
  }
}