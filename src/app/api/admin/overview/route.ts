import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users, bookingsTable, vehiclesTable } from '@/schema'
import { eq, count, sum, sql, desc, gte, ne } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [ADMIN] Récupération des données de vue d\'ensemble...')
    
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    
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

    if (!adminUser.length || adminUser[0].role !== 'admin') {
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

    // 3. Statistiques des véhicules
    const [vehiclesCountResult] = await db.select({
      activeVehicles: count(),
    }).from(vehiclesTable).where(eq(vehiclesTable.isActive, true))

    // 4. Réservations récentes (5 dernières)
    const recentBookings = await db.select({
      id: bookingsTable.id,
      clientName: sql`client.name`,
      driverName: sql`driver.name`,
      status: bookingsTable.status,
      amount: bookingsTable.price,
      date: bookingsTable.createdAt,
    })
    .from(bookingsTable)
    .leftJoin(sql`${users} as client`, sql`client.id = ${bookingsTable.userId}`)
    .leftJoin(sql`${users} as driver`, sql`driver.id = ${bookingsTable.driverId}`)
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