export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from "next-auth";
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users, bookingsTable, vehiclesTable, quotesTable, reviewsTable, vehicleReportsTable } from '@/schema'
import { eq, and, count, sum, sql, desc, gte, lt, ne, isNull, isNotNull } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

const PETITE_COTE_KEYWORDS = ['saly', 'mbour', 'somone', 'popenguine', 'ngaparou', 'nianing', 'joal', 'petite côte', 'petite cote']
const AIBD_KEYWORDS = ['aibd', 'aeroport', 'aéroport', 'diass']
const DAKAR_KEYWORDS = ['dakar', 'almadies', 'plateau', 'ngor', 'yoff', 'ouakam', 'mermoz', 'sacré-coeur', 'sacre-coeur', 'point e', 'liberté', 'liberte', 'parcelles', 'grand dakar', 'medina', 'fann', 'ouest foire', 'hann', 'pikine', 'guédiawaye', 'guediawaye', 'rufisque']

function matchesAny(value: string, keywords: string[]) {
  const lower = value.toLowerCase()
  return keywords.some((keyword) => lower.includes(keyword))
}

type CorridorSegment = 'dakarAibd' | 'aibdPetiteCote' | 'intraDakar' | 'other'

function classifyCorridorSegment(pickup: string, dropoff: string): CorridorSegment {
  const pickupAibd = matchesAny(pickup, AIBD_KEYWORDS)
  const dropoffAibd = matchesAny(dropoff, AIBD_KEYWORDS)
  const pickupDakar = matchesAny(pickup, DAKAR_KEYWORDS)
  const dropoffDakar = matchesAny(dropoff, DAKAR_KEYWORDS)
  const pickupPetiteCote = matchesAny(pickup, PETITE_COTE_KEYWORDS)
  const dropoffPetiteCote = matchesAny(dropoff, PETITE_COTE_KEYWORDS)

  if ((pickupAibd || dropoffAibd) && (pickupDakar || dropoffDakar)) return 'dakarAibd'
  if ((pickupAibd || dropoffAibd) && (pickupPetiteCote || dropoffPetiteCote)) return 'aibdPetiteCote'
  if (pickupDakar && dropoffDakar) return 'intraDakar'
  return 'other'
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [ADMIN] Récupération des données de vue d\'ensemble...')
    
    // Vérification de l'authentification
    const session = (await getServerSession(authOptions)) as Session | null;
    
    if (!session?.user?.email) {
      console.log('❌ [ADMIN] Utilisateur non authentifié')
      return NextResponse.json({
        success: false,
        message: 'Non authentifié'
      }, { status: 401 })
    }

    // Vérification du rôle admin
    const adminUser = await db.select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    if (!adminUser.length || (adminUser[0].role !== 'admin' && adminUser[0].role !== 'manager')) {
      console.log('❌ [ADMIN] Accès refusé - utilisateur non admin')
      return NextResponse.json({
        success: false,
        message: 'Accès non autorisé'
      }, { status: 403 })
    }

    console.log('✅ [ADMIN] Accès autorisé pour', session.user.email)

    // 1. Statistiques des utilisateurs
    const [totalUsersResult] = await db.select({
      totalUsers: count(),
    }).from(users)

    const [driversCountResult] = await db.select({
      totalDrivers: count(),
    }).from(users).where(eq(users.role, 'driver'))

    const [clientsCountResult] = await db.select({
      totalClients: count(),
    }).from(users).where(eq(users.role, 'customer'))

    // 2. Statistiques des réservations
    const [bookingsStatsResult] = await db.select({
      totalBookings: count(),
      totalRevenue: sum(sql`CASE WHEN ${bookingsTable.status} = 'completed' THEN CAST(${bookingsTable.price} AS NUMERIC) ELSE 0 END`),
    }).from(bookingsTable)

    const [pendingBookingsResult] = await db.select({
      pendingBookings: count(),
    }).from(bookingsTable).where(eq(bookingsTable.status, 'pending'))

    const [completedBookingsResult] = await db.select({
      completedBookings: count(),
    }).from(bookingsTable).where(eq(bookingsTable.status, 'completed'))

    const [inProgressBookingsResult] = await db.select({
      inProgressBookings: count(),
    }).from(bookingsTable).where(eq(bookingsTable.status, 'in_progress'))

    // 3. Statistiques des véhicules
    const [vehiclesCountResult] = await db.select({
      activeVehicles: count(),
    }).from(vehiclesTable).where(eq(vehiclesTable.isActive, true))

    const [totalVehiclesResult] = await db.select({
      totalVehicles: count(),
    }).from(vehiclesTable)

    const [activeDriversResult] = await db.select({
      activeDrivers: count(),
    }).from(users).where(and(eq(users.role, 'driver'), eq(users.isActive, true)))

    // Recettes du jour : courses clôturées dont la dernière mise à jour tombe aujourd'hui
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const [todayRevenueResult] = await db.select({
      todayRevenue: sum(sql`CASE WHEN ${bookingsTable.status} = 'completed' THEN CAST(${bookingsTable.price} AS NUMERIC) ELSE 0 END`),
    }).from(bookingsTable).where(and(
      eq(bookingsTable.status, 'completed'),
      gte(bookingsTable.updatedAt, todayStart),
      lt(bookingsTable.updatedAt, todayEnd),
    ))

    // Ce qui attend une décision
    const [unansweredPriceResult] = await db.select({ c: count() }).from(bookingsTable)
      .where(and(isNotNull(bookingsTable.priceProposedAt), isNull(bookingsTable.clientResponseAt)))

    const [quotesToSendResult] = await db.select({ c: count() }).from(quotesTable)
      .where(eq(quotesTable.status, 'pending'))

    const [reviewsToModerateResult] = await db.select({ c: count() }).from(reviewsTable)
      .where(eq(reviewsTable.isApproved, false))

    const [openReportsResult] = await db.select({ c: count() }).from(vehicleReportsTable)
      .where(eq(vehicleReportsTable.status, 'open'))

    // Charge du corridor : courses programmées aujourd'hui, classées par segment
    const todaysRoutes = await db.select({
      pickupAddress: bookingsTable.pickupAddress,
      dropoffAddress: bookingsTable.dropoffAddress,
    }).from(bookingsTable).where(and(
      gte(bookingsTable.scheduledDateTime, todayStart),
      lt(bookingsTable.scheduledDateTime, todayEnd),
      ne(bookingsTable.status, 'cancelled'),
    ))

    const segmentCounts: Record<CorridorSegment, number> = { dakarAibd: 0, aibdPetiteCote: 0, intraDakar: 0, other: 0 }
    for (const route of todaysRoutes) {
      segmentCounts[classifyCorridorSegment(route.pickupAddress, route.dropoffAddress)] += 1
    }
    const maxSegmentCount = Math.max(1, ...Object.values(segmentCounts))
    const corridorSegments = (Object.keys(segmentCounts) as CorridorSegment[])
      .map((segment) => ({
        segment,
        count: segmentCounts[segment],
        widthPercent: Math.round((segmentCounts[segment] / maxSegmentCount) * 100),
      }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)

    // 4. Réservations récentes (5 dernières)
    // Créer des alias pour les jointures multiples
    const clientUsers = alias(users, 'client_users')
    const driverUsers = alias(users, 'driver_users')
    
    const recentBookings = await db.select({
      id: bookingsTable.id,
      clientName: clientUsers.name,
      driverName: driverUsers.name,
      status: bookingsTable.status,
      amount: bookingsTable.price,
      date: bookingsTable.createdAt,
    })
    .from(bookingsTable)
    .leftJoin(clientUsers, eq(bookingsTable.userId, clientUsers.id))
    .leftJoin(driverUsers, eq(bookingsTable.driverId, driverUsers.id))
    .orderBy(desc(bookingsTable.createdAt))
    .limit(5)

    // 5. Utilisateurs récents (5 derniers)
    const recentUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(5)

    // Compilation des données
    const overviewData = {
      totalUsers: totalUsersResult?.totalUsers || 0,
      totalDrivers: driversCountResult?.totalDrivers || 0,
      totalClients: clientsCountResult?.totalClients || 0,
      totalBookings: bookingsStatsResult?.totalBookings || 0,
      pendingBookings: pendingBookingsResult?.pendingBookings || 0,
      completedBookings: completedBookingsResult?.completedBookings || 0,
      totalRevenue: Number(bookingsStatsResult?.totalRevenue || 0),
      activeVehicles: vehiclesCountResult?.activeVehicles || 0,
      totalVehicles: totalVehiclesResult?.totalVehicles || 0,
      inProgressBookings: inProgressBookingsResult?.inProgressBookings || 0,
      activeDrivers: activeDriversResult?.activeDrivers || 0,
      todayRevenue: Number(todayRevenueResult?.todayRevenue || 0),
      awaitingDecision: {
        unansweredPriceProposals: unansweredPriceResult?.c || 0,
        quotesToSend: quotesToSendResult?.c || 0,
        reviewsToModerate: reviewsToModerateResult?.c || 0,
        openVehicleReports: openReportsResult?.c || 0,
      },
      corridorSegments,
      recentBookings: recentBookings.map(booking => ({
        id: booking.id,
        clientName: booking.clientName || 'Client inconnu',
        driverName: booking.driverName || 'Chauffeur inconnu',
        status: booking.status,
        amount: Number(booking.amount || 0),
        date: booking.date?.toISOString() || new Date().toISOString(),
      })),
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        name: user.name || 'Nom inconnu',
        email: user.email || '',
        role: user.role,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      })),
    }

    console.log(`✅ [ADMIN] Vue d'ensemble générée: ${overviewData.totalUsers} utilisateurs, ${overviewData.totalBookings} réservations`)

    return NextResponse.json({
      success: true,
      data: overviewData
    })

  } catch (error) {
    console.error('❌ [ADMIN] Erreur lors de la récupération de la vue d\'ensemble:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la récupération des données de vue d\'ensemble'
    }, { status: 500 })
  }
}
