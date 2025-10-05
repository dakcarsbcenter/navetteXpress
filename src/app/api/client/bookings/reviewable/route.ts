import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { bookingsTable, reviewsTable, users } from "@/schema"
import { eq, desc, and, isNull } from "drizzle-orm"

// GET - Récupérer les réservations terminées qui peuvent être évaluées
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un client
    if (session.user.role !== 'customer') {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Récupérer les réservations terminées avec chauffeur assigné mais sans avis
    const reviewableBookings = await db
      .select({
        booking: {
          id: bookingsTable.id,
          pickupAddress: bookingsTable.pickupAddress,
          dropoffAddress: bookingsTable.dropoffAddress,
          scheduledDateTime: bookingsTable.scheduledDateTime,
          createdAt: bookingsTable.createdAt,
          driverId: bookingsTable.driverId
        },
        driver: {
          id: users.id,
          name: users.name,
          email: users.email
        },
        hasReview: reviewsTable.id
      })
      .from(bookingsTable)
      .leftJoin(users, eq(bookingsTable.driverId, users.id))
      .leftJoin(reviewsTable, 
        and(
          eq(reviewsTable.bookingId, bookingsTable.id),
          eq(reviewsTable.customerId, session.user.id)
        )
      )
      .where(
        and(
          eq(bookingsTable.userId, session.user.id),
          eq(bookingsTable.status, 'completed'),
          // Réservation avec chauffeur assigné
          eq(bookingsTable.driverId, users.id),
          // Pas d'avis existant
          isNull(reviewsTable.id)
        )
      )
      .orderBy(desc(bookingsTable.scheduledDateTime))

    // Formater les résultats
    const formattedBookings = reviewableBookings.map(item => ({
      id: item.booking.id,
      pickupAddress: item.booking.pickupAddress,
      dropoffAddress: item.booking.dropoffAddress,
      scheduledDateTime: item.booking.scheduledDateTime,
      createdAt: item.booking.createdAt,
      driver: {
        id: item.driver.id,
        name: item.driver.name,
        email: item.driver.email
      }
    }))

    return NextResponse.json({ 
      success: true,
      bookings: formattedBookings
    })

  } catch (error) {
    console.error("Erreur lors de la récupération des réservations évaluables:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
