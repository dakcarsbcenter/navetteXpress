import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { reviewsTable, users, bookingsTable } from '@/schema'
import { eq, desc, sql, inArray } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer tous les avis avec les informations du client et du chauffeur
    const reviewsData = await db
      .select({
        id: reviewsTable.id,
        bookingId: reviewsTable.bookingId,
        rating: reviewsTable.rating,
        comment: reviewsTable.comment,
        response: reviewsTable.response,
        respondedBy: reviewsTable.respondedBy,
        respondedAt: reviewsTable.respondedAt,
        isPublic: reviewsTable.isPublic,
        isApproved: reviewsTable.isApproved,
        createdAt: reviewsTable.createdAt,
        updatedAt: reviewsTable.updatedAt,
        customerId: reviewsTable.customerId,
        driverId: reviewsTable.driverId
      })
      .from(reviewsTable)
      .orderBy(desc(reviewsTable.createdAt))

    // Récupérer les informations des utilisateurs séparément
    const customerIds = [...new Set(reviewsData.map(r => r.customerId))]
    const driverIds = [...new Set(reviewsData.map(r => r.driverId))]
    const allUserIds = [...new Set([...customerIds, ...driverIds])]
    
    const usersData = allUserIds.length > 0 ? await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email
      })
      .from(users)
      .where(inArray(users.id, allUserIds)) : []

    const usersMap = usersData.reduce((acc, user) => {
      acc[user.id] = user
      return acc
    }, {} as Record<string, any>)

    // Transformer les données pour correspondre au format attendu par le composant moderne
    const formattedReviews = reviewsData.map(review => ({
      id: review.id,
      customerName: usersMap[review.customerId]?.name || 'Client Inconnu',
      customerEmail: usersMap[review.customerId]?.email || '',
      service: 'Transport', // Service par défaut, peut être enrichi plus tard
      rating: review.rating,
      comment: review.comment || '',
      isPublic: review.isPublic ?? true,
      isApproved: review.isApproved ?? false,
      response: review.response,
      respondedBy: review.respondedBy,
      respondedAt: review.respondedAt?.toISOString() || null,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt?.toISOString() || review.createdAt.toISOString(),
      bookingId: review.bookingId,
      tags: [] // Pas de tags pour l'instant
    }))

    return NextResponse.json({
      success: true,
      data: formattedReviews
    })

  } catch (error) {
    console.error('Erreur lors du chargement des avis:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des avis' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, rating, comment } = body

    if (!bookingId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Données invalides. La note doit être entre 1 et 5.' },
        { status: 400 }
      )
    }

    // Vérifier que la réservation existe et appartient au client
    const booking = await db
      .select({
        id: bookingsTable.id,
        userId: bookingsTable.userId,
        driverId: bookingsTable.driverId
      })
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1)

    if (!booking.length) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      )
    }

    if (booking[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas noter cette réservation' },
        { status: 403 }
      )
    }

    // Créer l'avis
    const newReview = await db.insert(reviewsTable).values({
      bookingId,
      customerId: session.user.id,
      driverId: booking[0].driverId!,
      rating,
      comment: comment || null
    }).returning()

    return NextResponse.json({
      success: true,
      data: newReview[0]
    })

  } catch (error) {
    console.error('Erreur lors de la création de l\'avis:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'avis' },
      { status: 500 }
    )
  }
}