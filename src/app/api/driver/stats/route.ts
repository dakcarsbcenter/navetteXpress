import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { bookingsTable, vehiclesTable, users, reviewsTable } from '@/schema'
import { eq, and, ne, gte, count, sum, avg, sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un chauffeur
    if (!('role' in session.user) || session.user.role !== 'driver') {
      return NextResponse.json({ error: 'Accès refusé - chauffeur requis' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    
    console.log(`📊 Récupération des statistiques pour la période: ${period}`)

    // Calculer les dates selon la période
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    console.log(`📅 Période: ${startDate.toISOString()} à ${now.toISOString()}`)

    // Statistiques générales
    const generalStats = await db
      .select({
        totalRides: count(bookingsTable.id),
        totalEarnings: sum(sql`CAST(${bookingsTable.price} AS NUMERIC)`)
      })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.driverId, session.user.id),
          ne(bookingsTable.status, 'pending'),
          gte(bookingsTable.createdAt, startDate)
        )
      )

    // Ratings séparément depuis la table reviews
    const ratingsStats = await db
      .select({
        avgRating: avg(reviewsTable.rating),
        totalRatings: count(reviewsTable.id)
      })
      .from(reviewsTable)
      .innerJoin(bookingsTable, eq(reviewsTable.bookingId, bookingsTable.id))
      .where(
        and(
          eq(reviewsTable.driverId, session.user.id),
          gte(bookingsTable.createdAt, startDate)
        )
      )

    // Répartition par statut
    const statusStats = await db
      .select({
        status: bookingsTable.status,
        count: count(bookingsTable.id),
        earnings: sum(sql`CAST(${bookingsTable.price} AS NUMERIC)`)
      })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.driverId, session.user.id),
          ne(bookingsTable.status, 'pending'),
          gte(bookingsTable.createdAt, startDate)
        )
      )
      .groupBy(bookingsTable.status)

    // Trajets les plus fréquents
    const topRoutes = await db
      .select({
        pickupAddress: bookingsTable.pickupAddress,
        dropoffAddress: bookingsTable.dropoffAddress,
        count: count(bookingsTable.id),
        avgPrice: avg(sql`CAST(${bookingsTable.price} AS NUMERIC)`)
      })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.driverId, session.user.id),
          ne(bookingsTable.status, 'pending'),
          gte(bookingsTable.createdAt, startDate)
        )
      )
      .groupBy(bookingsTable.pickupAddress, bookingsTable.dropoffAddress)
      .orderBy(sql`count(${bookingsTable.id}) DESC`)
      .limit(5)

    // Données mensuelles (pour les 12 derniers mois)
    const monthlyData = await db
      .select({
        month: sql`TO_CHAR(${bookingsTable.createdAt}, 'MM')`.as('month'),
        year: sql`TO_CHAR(${bookingsTable.createdAt}, 'YYYY')`.as('year'),
        rides: count(bookingsTable.id),
        earnings: sum(sql`CAST(${bookingsTable.price} AS NUMERIC)`)
      })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.driverId, session.user.id),
          ne(bookingsTable.status, 'pending'),
          gte(bookingsTable.createdAt, new Date(now.getFullYear() - 1, now.getMonth(), 1))
        )
      )
      .groupBy(sql`TO_CHAR(${bookingsTable.createdAt}, 'MM')`, sql`TO_CHAR(${bookingsTable.createdAt}, 'YYYY')`)
      .orderBy(sql`TO_CHAR(${bookingsTable.createdAt}, 'YYYY')`, sql`TO_CHAR(${bookingsTable.createdAt}, 'MM')`)

    // Heures de pointe (répartition par heure)
    const peakHours = await db
      .select({
        hour: sql`EXTRACT(HOUR FROM ${bookingsTable.scheduledDateTime})`.as('hour'),
        rides: count(bookingsTable.id)
      })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.driverId, session.user.id),
          ne(bookingsTable.status, 'pending'),
          gte(bookingsTable.createdAt, startDate)
        )
      )
      .groupBy(sql`EXTRACT(HOUR FROM ${bookingsTable.scheduledDateTime})`)
      .orderBy(sql`EXTRACT(HOUR FROM ${bookingsTable.scheduledDateTime})`)

    // Répartition des notes
    const ratingDistribution = await db
      .select({
        rating: reviewsTable.rating,
        count: count(reviewsTable.id)
      })
      .from(reviewsTable)
      .innerJoin(bookingsTable, eq(reviewsTable.bookingId, bookingsTable.id))
      .where(
        and(
          eq(reviewsTable.driverId, session.user.id),
          gte(bookingsTable.createdAt, startDate)
        )
      )
      .groupBy(reviewsTable.rating)
      .orderBy(reviewsTable.rating)

    // Formatter les données
    const stats = {
      period,
      totalRides: generalStats[0]?.totalRides || 0,
      completedRides: statusStats.find(s => s.status === 'completed')?.count || 0,
      cancelledRides: statusStats.find(s => s.status === 'cancelled')?.count || 0,
      totalEarnings: Number(generalStats[0]?.totalEarnings || 0),
      averageRating: Number(ratingsStats[0]?.avgRating || 0),
      totalRatings: Number(ratingsStats[0]?.totalRatings || 0),
      
      statusBreakdown: statusStats.map(s => ({
        status: s.status,
        count: s.count || 0,
        earnings: Number(s.earnings || 0),
        percentage: Math.round(((s.count || 0) / (generalStats[0]?.totalRides || 1)) * 100)
      })),

      topRoutes: topRoutes.map(r => ({
        from: r.pickupAddress || '',
        to: r.dropoffAddress || '',
        count: r.count || 0,
        avgPrice: Math.round(Number(r.avgPrice || 0))
      })),

      monthlyData: monthlyData.map(m => ({
        month: getMonthName(parseInt(m.month as string)),
        year: m.year,
        rides: m.rides || 0,
        earnings: Number(m.earnings || 0)
      })),

      peakHours: peakHours.map(p => ({
        hour: Number(p.hour),
        rides: p.rides || 0
      })),

      ratingDistribution: ratingDistribution.map(r => ({
        stars: Number(r.rating),
        count: r.count || 0,
        percentage: Math.round(((r.count || 0) / (ratingDistribution.reduce((sum, rd) => sum + (rd.count || 0), 0) || 1)) * 100)
      }))
    }

    return NextResponse.json({ 
      success: true, 
      data: stats 
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur serveur lors de la récupération des statistiques' 
    }, { status: 500 })
  }
}

function getMonthName(monthNumber: number): string {
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
  ]
  return months[monthNumber - 1] || 'Jan'
}