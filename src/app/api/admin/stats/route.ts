export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from "next-auth";
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { bookingsTable, users, reviewsTable } from '@/schema'
import { eq, and, ne, gte, count, sum, avg, sql, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    const userRole = (session?.user as { role?: string })?.role

    // Les admins ont toujours accès
    if (!session?.user || !userRole) {
      return NextResponse.json({
        success: false,
        message: 'Non authentifié'
      }, { status: 401 })
    }

    // Les managers doivent avoir la permission, seuls les admins ont accès direct
    if (userRole !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Accès non autorisé. Seuls les administrateurs peuvent accéder aux statistiques globales.'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    console.log(`📊 [ADMIN] Récupération des statistiques globales pour la période: ${period}`)

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

    console.log(`📅 [ADMIN] Période analysée: ${startDate.toISOString()} à ${now.toISOString()}`)

    // 1. Statistiques globales de la plateforme
    const globalStats = await db
      .select({
        totalRides: count(bookingsTable.id),
        totalEarnings: sum(sql`CAST(${bookingsTable.price} AS NUMERIC)`),
        totalDrivers: count(sql`DISTINCT ${bookingsTable.driverId}`)
      })
      .from(bookingsTable)
      .where(
        and(
          ne(bookingsTable.status, 'pending'),
          gte(bookingsTable.createdAt, startDate),
          sql`${bookingsTable.driverId} IS NOT NULL`
        )
      )

    // 1b. Total des chauffeurs enregistrés
    const totalDriversCount = await db
      .select({ count: count(users.id) })
      .from(users)
      .where(eq(users.role, 'driver'))

    // 2. Répartition globale par statut
    const globalStatusStats = await db
      .select({
        status: bookingsTable.status,
        count: count(bookingsTable.id),
        earnings: sum(sql`CAST(${bookingsTable.price} AS NUMERIC)`)
      })
      .from(bookingsTable)
      .where(
        and(
          ne(bookingsTable.status, 'pending'),
          gte(bookingsTable.createdAt, startDate),
          sql`${bookingsTable.driverId} IS NOT NULL`
        )
      )
      .groupBy(bookingsTable.status)

    // 3. Statistiques détaillées par chauffeur
    const driverStats = await db
      .select({
        driverId: bookingsTable.driverId,
        driverName: users.name,
        driverEmail: users.email,
        totalRides: count(bookingsTable.id),
        completedRides: sum(sql`CASE WHEN ${bookingsTable.status} = 'completed' THEN 1 ELSE 0 END`),
        cancelledRides: sum(sql`CASE WHEN ${bookingsTable.status} = 'cancelled' THEN 1 ELSE 0 END`),
        totalEarnings: sum(sql`CASE WHEN ${bookingsTable.status} = 'completed' THEN CAST(${bookingsTable.price} AS NUMERIC) ELSE 0 END`),
      })
      .from(bookingsTable)
      .innerJoin(users, eq(bookingsTable.driverId, users.id))
      .where(
        and(
          ne(bookingsTable.status, 'pending'),
          gte(bookingsTable.createdAt, startDate),
          eq(users.role, 'driver')
        )
      )
      .groupBy(bookingsTable.driverId, users.name, users.email)
      .orderBy(desc(sql`count(${bookingsTable.id})`))

    // 4. Ratings moyens par chauffeur
    const driverRatings = await db
      .select({
        driverId: reviewsTable.driverId,
        averageRating: avg(reviewsTable.rating),
        totalRatings: count(reviewsTable.id)
      })
      .from(reviewsTable)
      .innerJoin(bookingsTable, eq(reviewsTable.bookingId, bookingsTable.id))
      .where(gte(bookingsTable.createdAt, startDate))
      .groupBy(reviewsTable.driverId)

    // 5. Performance mensuelle globale (pour les graphiques)
    const monthlyPerformance = await db
      .select({
        month: sql`TO_CHAR(${bookingsTable.createdAt}, 'YYYY-MM')`.as('month'),
        totalRides: count(bookingsTable.id),
        totalEarnings: sum(sql`CAST(${bookingsTable.price} AS NUMERIC)`),
        uniqueDrivers: count(sql`DISTINCT ${bookingsTable.driverId}`)
      })
      .from(bookingsTable)
      .where(
        and(
          ne(bookingsTable.status, 'pending'),
          gte(bookingsTable.createdAt, startDate),
          sql`${bookingsTable.driverId} IS NOT NULL`
        )
      )
      .groupBy(sql`TO_CHAR(${bookingsTable.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${bookingsTable.createdAt}, 'YYYY-MM')`)

    // 6. Série de revenus pour le graphique (bucketée selon la période)
    type SeriesPoint = { label: string; date: string; revenue: number; rides: number }
    let revenueSeries: SeriesPoint[] = []

    if (period === 'year') {
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
      const monthlyMap = new Map(monthlyPerformance.map(m => [m.month as string, m]))
      for (let m = 0; m <= now.getMonth(); m++) {
        const key = `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`
        const row = monthlyMap.get(key)
        revenueSeries.push({
          label: monthNames[m],
          date: key,
          revenue: Number(row?.totalEarnings || 0),
          rides: Number(row?.totalRides || 0)
        })
      }
    } else {
      const dailyRaw = await db
        .select({
          day: sql<string>`TO_CHAR(${bookingsTable.createdAt}, 'YYYY-MM-DD')`.as('day'),
          revenue: sum(sql`CASE WHEN ${bookingsTable.status} = 'completed' THEN CAST(${bookingsTable.price} AS NUMERIC) ELSE 0 END`),
          rides: count(bookingsTable.id)
        })
        .from(bookingsTable)
        .where(
          and(
            ne(bookingsTable.status, 'pending'),
            gte(bookingsTable.createdAt, startDate),
            sql`${bookingsTable.driverId} IS NOT NULL`
          )
        )
        .groupBy(sql`TO_CHAR(${bookingsTable.createdAt}, 'YYYY-MM-DD')`)

      const dailyMap = new Map(dailyRaw.map(d => [d.day as string, d]))
      const dayNamesShort = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
      const cursor = new Date(startDate)
      cursor.setHours(0, 0, 0, 0)
      const endCursor = new Date(now)
      endCursor.setHours(0, 0, 0, 0)

      while (cursor <= endCursor) {
        const key = cursor.toISOString().slice(0, 10)
        const row = dailyMap.get(key)
        const label = period === 'week' ? dayNamesShort[cursor.getDay()] : String(cursor.getDate())
        revenueSeries.push({
          label,
          date: key,
          revenue: Number(row?.revenue || 0),
          rides: Number(row?.rides || 0)
        })
        cursor.setDate(cursor.getDate() + 1)
      }
    }

    // 7. Répartition des courses par statut (pour le donut)
    const statusLabels: Record<string, string> = {
      completed: 'Terminées',
      cancelled: 'Annulées',
      in_progress: 'En cours',
      confirmed: 'Confirmées',
      assigned: 'Assignées',
      approved: 'Approuvées',
      rejected: 'Rejetées'
    }
    const courseDistribution = globalStatusStats
      .map(s => ({
        status: s.status,
        label: statusLabels[s.status as string] || s.status,
        count: s.count || 0,
        percentage: globalStats[0]?.totalRides > 0 ?
          Math.round(((s.count || 0) / globalStats[0].totalRides) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)

    // 8. Top routes globales
    const topRoutes = await db
      .select({
        pickupAddress: bookingsTable.pickupAddress,
        dropoffAddress: bookingsTable.dropoffAddress,
        count: count(bookingsTable.id),
        averagePrice: avg(sql`CAST(${bookingsTable.price} AS NUMERIC)`),
        totalEarnings: sum(sql`CAST(${bookingsTable.price} AS NUMERIC)`)
      })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.status, 'completed'),
          gte(bookingsTable.createdAt, startDate)
        )
      )
      .groupBy(bookingsTable.pickupAddress, bookingsTable.dropoffAddress)
      .orderBy(desc(count(bookingsTable.id)))
      .limit(10)

    // Enrichir les stats des chauffeurs avec leurs ratings
    const enrichedDriverStats = driverStats.map(driver => {
      const ratingData = driverRatings.find(r => r.driverId === driver.driverId)
      return {
        ...driver,
        name: driver.driverName, // Normaliser le nom pour le frontend
        email: driver.driverEmail, // Normaliser l'email pour le frontend
        averageRating: Number(ratingData?.averageRating || 0),
        totalRatings: Number(ratingData?.totalRatings || 0),
        completionRate: driver.totalRides > 0 ?
          Math.round((Number(driver.completedRides) / driver.totalRides) * 100) : 0,
        earningsPerRide: driver.totalRides > 0 ?
          Math.round(Number(driver.totalEarnings) / Number(driver.completedRides || 1)) : 0
      }
    })

    // Formatter les données finales
    const stats = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },

      // Métriques globales
      globalMetrics: {
        totalRides: globalStats[0]?.totalRides || 0,
        totalEarnings: Number(globalStats[0]?.totalEarnings || 0),
        activeDrivers: globalStats[0]?.totalDrivers || 0,
        totalDrivers: totalDriversCount[0]?.count || 0,
        completedRides: globalStatusStats.find(s => s.status === 'completed')?.count || 0,
        cancelledRides: globalStatusStats.find(s => s.status === 'cancelled')?.count || 0,
        averageEarningsPerRide: globalStats[0]?.totalRides > 0 ?
          Math.round(Number(globalStats[0]?.totalEarnings || 0) / globalStats[0].totalRides) : 0,
        completionRate: globalStats[0]?.totalRides > 0 ?
          Math.round(((globalStatusStats.find(s => s.status === 'completed')?.count || 0) / globalStats[0].totalRides) * 100) : 0
      },

      // Répartition par statut
      statusBreakdown: globalStatusStats.map(s => ({
        status: s.status,
        count: s.count || 0,
        earnings: Number(s.earnings || 0),
        percentage: globalStats[0]?.totalRides > 0 ?
          Math.round(((s.count || 0) / globalStats[0].totalRides) * 100) : 0
      })),

      // Statistiques détaillées par chauffeur
      driverStats: enrichedDriverStats,

      // Série de revenus pour le graphique d'évolution
      revenueSeries,

      // Répartition des courses par statut (donut)
      courseDistribution,

      // Performance mensuelle
      monthlyData: monthlyPerformance.map(m => ({
        month: m.month,
        rides: m.totalRides || 0,
        earnings: Number(m.totalEarnings || 0),
        drivers: m.uniqueDrivers || 0
      })),

      // Routes populaires
      topRoutes: topRoutes.map(r => ({
        from: r.pickupAddress || '',
        to: r.dropoffAddress || '',
        count: r.count || 0,
        avgPrice: Math.round(Number(r.averagePrice || 0)),
        totalEarnings: Number(r.totalEarnings || 0)
      }))
    }

    console.log(`✅ [ADMIN] Statistiques globales calculées: ${stats.globalMetrics.totalRides} courses, ${stats.driverStats.length} chauffeurs`)

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('❌ [ADMIN] Erreur lors de la récupération des statistiques:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques globales'
    }, { status: 500 })
  }
}
