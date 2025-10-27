export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { reviewsTable, users, bookingsTable, rolePermissionsTable } from '@/schema'
import { eq, desc, sql, inArray, and } from 'drizzle-orm'

// Fonction pour vérifier les permissions dynamiques des reviews
async function hasReviewsPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
  try {
    // Les admins ont toujours accès
    if (userRole === 'admin') {
      return true;
    }

    // Vérifier les permissions dynamiques pour l'action spécifique
    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource, 'reviews'),
        eq(rolePermissionsTable.action, action),
        eq(rolePermissionsTable.allowed, true)
      ));

    // Retourner true si la permission existe
    return permissions.length > 0;
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions reviews:', error);
    return false;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userRole = (session.user as any).role || 'customer';
    const userId = (session.user as any).id;
    
    const hasReadPermission = await hasReviewsPermission(userRole, 'read');

    if (!hasReadPermission) {
      return NextResponse.json({ 
        error: 'Vous n\'avez pas la permission de voir les avis' 
      }, { status: 403 });
    }

    // Si l'utilisateur a la permission 'manage', il peut voir tous les avis
    const hasManagePermission = await hasReviewsPermission(userRole, 'update') || 
                                await hasReviewsPermission(userRole, 'delete');

    let reviewsData;

    if (hasManagePermission) {
      // Permission manage: voir tous les avis
      reviewsData = await db
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
        .orderBy(desc(reviewsTable.createdAt));
    } else {
      // Permission read only: voir uniquement ses propres avis
      reviewsData = await db
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
        .where(eq(reviewsTable.customerId, userId))
        .orderBy(desc(reviewsTable.createdAt));
    }

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

    const userRole = (session.user as any).role || 'customer';
    const hasCreatePermission = await hasReviewsPermission(userRole, 'create');

    if (!hasCreatePermission) {
      return NextResponse.json({ 
        error: 'Vous n\'avez pas la permission de créer des avis' 
      }, { status: 403 });
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