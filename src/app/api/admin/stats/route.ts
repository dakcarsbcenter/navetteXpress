import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { users, vehiclesTable, bookingsTable, reviewsTable, sessions, quotesTable } from "@/schema"
import { count, desc, sql } from "drizzle-orm"

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

    // Récupérer les statistiques
    const [
      totalUsers,
      totalVehicles,
      totalBookings,
      totalQuotes,
      totalReviews,
      activeSessions,
      recentBookings,
      recentQuotes,
      topVehicles
    ] = await Promise.all([
      // Total utilisateurs
      db.select({ count: count() }).from(users),
      
      // Total véhicules
      db.select({ count: count() }).from(vehiclesTable),
      
      // Total réservations
      db.select({ count: count() }).from(bookingsTable),
      
      // Total demandes de devis
      db.select({ count: count() }).from(quotesTable),
      
      // Total avis
      db.select({ count: count() }).from(reviewsTable),
      
      // Sessions actives (sessions non expirées)
      db.select({ count: count() }).from(sessions).where(
        sql`${sessions.expires} > NOW()`
      ),
      
      // Réservations récentes (5 dernières)
      db.select({
        id: bookingsTable.id,
        customerName: bookingsTable.customerName,
        pickupAddress: bookingsTable.pickupAddress,
        dropoffAddress: bookingsTable.dropoffAddress,
        status: bookingsTable.status,
        scheduledDateTime: bookingsTable.scheduledDateTime
      })
      .from(bookingsTable)
      .orderBy(desc(bookingsTable.createdAt))
      .limit(5),
      
      // Demandes de devis récentes (5 dernières)
      db.select({
        id: quotesTable.id,
        customerName: quotesTable.customerName,
        service: quotesTable.service,
        status: quotesTable.status,
        createdAt: quotesTable.createdAt
      })
      .from(quotesTable)
      .orderBy(desc(quotesTable.createdAt))
      .limit(5),
      
      // Véhicules populaires (avec nombre de réservations)
      db.select({
        id: vehiclesTable.id,
        make: vehiclesTable.make,
        model: vehiclesTable.model,
        year: vehiclesTable.year,
        capacity: vehiclesTable.capacity,
        bookingCount: sql<number>`COUNT(${bookingsTable.id})`.as('bookingCount')
      })
      .from(vehiclesTable)
      .leftJoin(bookingsTable, sql`${vehiclesTable.id} = ${bookingsTable.vehicleId}`)
      .groupBy(vehiclesTable.id, vehiclesTable.make, vehiclesTable.model, vehiclesTable.year, vehiclesTable.capacity)
      .orderBy(desc(sql`COUNT(${bookingsTable.id})`))
      .limit(5)
    ])

    const stats = {
      totalUsers: totalUsers[0]?.count || 0,
      totalVehicles: totalVehicles[0]?.count || 0,
      totalBookings: totalBookings[0]?.count || 0,
      totalQuotes: totalQuotes[0]?.count || 0,
      totalReviews: totalReviews[0]?.count || 0,
      activeSessions: activeSessions[0]?.count || 0,
      recentBookings,
      recentQuotes,
      topVehicles
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
