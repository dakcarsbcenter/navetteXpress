import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { reviewsTable, bookingsTable } from "@/schema"
import { eq, desc } from "drizzle-orm"

// GET - Récupérer tous les avis avec les détails des réservations
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification et le rôle admin
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource." },
        { status: 403 }
      )
    }

    const reviews = await db
      .select({
        id: reviewsTable.id,
        bookingId: reviewsTable.bookingId,
        rating: reviewsTable.rating,
        comment: reviewsTable.comment,
        createdAt: reviewsTable.createdAt,
        booking: {
          customerName: bookingsTable.customerName,
          customerEmail: bookingsTable.customerEmail,
          pickupAddress: bookingsTable.pickupAddress,
          dropoffAddress: bookingsTable.dropoffAddress,
          scheduledDateTime: bookingsTable.scheduledDateTime
        }
      })
      .from(reviewsTable)
      .leftJoin(bookingsTable, eq(reviewsTable.bookingId, bookingsTable.id))
      .orderBy(desc(reviewsTable.createdAt))

    return NextResponse.json(reviews)

  } catch (error) {
    console.error("Erreur lors de la récupération des avis:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer un nouvel avis
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et le rôle admin
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource." },
        { status: 403 }
      )
    }

    const { bookingId, rating, comment } = await request.json()

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

    const newReview = await db
      .insert(reviewsTable)
      .values({
        bookingId: parseInt(bookingId),
        rating,
        comment
      })
      .returning()

    return NextResponse.json(
      { message: "Avis créé avec succès", review: newReview[0] },
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
