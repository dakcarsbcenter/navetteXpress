import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { bookingsTable } from "@/schema"
import { eq, desc } from "drizzle-orm"

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

    // Récupérer les réservations du client
    const bookings = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.userId, session.user.id))
      .orderBy(desc(bookingsTable.createdAt))

    return NextResponse.json({ 
      success: true,
      bookings: bookings.map(booking => ({
        id: booking.id,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        pickupAddress: booking.pickupAddress,
        dropoffAddress: booking.dropoffAddress,
        scheduledDateTime: booking.scheduledDateTime,
        status: booking.status,
        price: booking.price,
        notes: booking.notes,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      }))
    })

  } catch (error) {
    console.error("Erreur lors de la récupération des réservations client:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
