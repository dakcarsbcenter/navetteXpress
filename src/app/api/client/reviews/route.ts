import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { reviewsTable, bookingsTable, rolePermissionsTable } from "@/schema"
import { eq, desc, and } from "drizzle-orm"

// Vérifier si l'utilisateur a la permission de gérer les avis
async function hasReviewPermission(userRole: string): Promise<boolean> {
  try {
    // Les admins ont toujours accès
    if (userRole === 'admin') {
      return true
    }

    // Les customers ont accès par défaut (comportement legacy)
    if (userRole === 'customer') {
      return true
    }

    // Vérifier les permissions dynamiques pour autres rôles
    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource, 'reviews'),
        eq(rolePermissionsTable.allowed, true)
      ))

    return permissions.length > 0
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions reviews:', error)
    return false
  }
}

// GET - Récupérer les avis du client
export async function GET() {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userRole = (session.user as { role?: string }).role || 'customer'

    // Vérifier les permissions
    const hasPermission = await hasReviewPermission(userRole)
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas les permissions nécessaires pour accéder aux avis' },
        { status: 403 }
      )
    }

    // Récupérer les avis du client avec les informations de réservation
    const reviews = await db
      .select({
        id: reviewsTable.id,
        bookingId: reviewsTable.bookingId,
        rating: reviewsTable.rating,
        comment: reviewsTable.comment,
        createdAt: reviewsTable.createdAt,
        booking: {
          pickupAddress: bookingsTable.pickupAddress,
          dropoffAddress: bookingsTable.dropoffAddress,
          scheduledDateTime: bookingsTable.scheduledDateTime
        }
      })
      .from(reviewsTable)
      .leftJoin(bookingsTable, eq(reviewsTable.bookingId, bookingsTable.id))
      .where(eq(reviewsTable.customerId, (session as unknown as { user: { id: string } }).user.id))
      .orderBy(desc(reviewsTable.createdAt))

    return NextResponse.json({ 
      success: true,
      reviews: reviews
    })

  } catch (error) {
    console.error("Erreur lors de la récupération des avis client:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer un nouvel avis (clients seulement)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userRole = (session.user as { role?: string }).role || 'customer'

    // Vérifier les permissions
    const hasPermission = await hasReviewPermission(userRole)
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas les permissions nécessaires pour créer des avis' },
        { status: 403 }
      )
    }

    const { bookingId, rating, comment } = await request.json()

    // Validation des données
    if (!bookingId || !rating) {
      return NextResponse.json(
        { error: "bookingId et rating sont obligatoires" },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "La note doit être entre 1 et 5" },
        { status: 400 }
      )
    }

    // Vérifier que la réservation appartient au client et est terminée
    const booking = await db
      .select({
        id: bookingsTable.id,
        userId: bookingsTable.userId,
        driverId: bookingsTable.driverId,
        status: bookingsTable.status
      })
      .from(bookingsTable)
      .where(eq(bookingsTable.id, parseInt(bookingId)))
      .limit(1)

    if (booking.length === 0) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      )
    }

    const bookingData = booking[0]

    // Vérifier que la réservation appartient au client
    const userSession = session as unknown as { user: { id: string } }
    if (bookingData.userId !== userSession.user.id) {
      return NextResponse.json(
        { error: "Cette réservation ne vous appartient pas" },
        { status: 403 }
      )
    }

    // Vérifier que la réservation est terminée
    if (bookingData.status !== 'completed') {
      return NextResponse.json(
        { error: "Vous ne pouvez évaluer que les trajets terminés" },
        { status: 400 }
      )
    }

    // Vérifier qu'un chauffeur a été assigné
    if (!bookingData.driverId) {
      return NextResponse.json(
        { error: "Aucun chauffeur n'a été assigné à cette réservation" },
        { status: 400 }
      )
    }

    // Vérifier qu'un avis n'existe pas déjà pour cette réservation
    const existingReview = await db
      .select()
      .from(reviewsTable)
      .where(
        and(
          eq(reviewsTable.bookingId, parseInt(bookingId)),
          eq(reviewsTable.customerId, userSession.user.id)
        )
      )
      .limit(1)

    if (existingReview.length > 0) {
      return NextResponse.json(
        { error: "Vous avez déjà évalué cette course" },
        { status: 400 }
      )
    }

    // Créer l'avis
    const newReview = await db
      .insert(reviewsTable)
      .values({
        bookingId: parseInt(bookingId),
        customerId: userSession.user.id,
        driverId: bookingData.driverId,
        rating,
        comment: comment || null
      })
      .returning()

    return NextResponse.json(
      { 
        success: true,
        message: "Avis créé avec succès", 
        review: newReview[0] 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Erreur lors de la création de l'avis:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}