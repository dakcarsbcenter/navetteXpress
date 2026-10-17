export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from "next-auth";
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { bookingsTable } from '@/schema'
import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { COMMISSION_RATE, computeCommission, getPeriodRange, type CommissionPeriod } from '@/lib/commission'

const PERIODS: CommissionPeriod[] = ['week', 'month', 'year']

// Une course compte quand elle est terminée ; la date retenue est celle de clôture
// (repli sur updatedAt pour les courses antérieures à la colonne completed_at).
const completionTs = sql`COALESCE(${bookingsTable.completedAt}, ${bookingsTable.updatedAt})`
const priceNum = sql`CAST(${bookingsTable.price} AS NUMERIC)`

// Les colonnes sont des timestamp sans fuseau stockés en UTC : on compare avec des chaînes ISO.
const ts = (d: Date) => sql`${d.toISOString()}::timestamp`

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as Session | null
    const userRole = (session?.user as { role?: string } | undefined)?.role

    if (!session?.user || !userRole) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }
    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, message: 'Accès non autorisé' }, { status: 403 })
    }

    const now = new Date()

    const entries = await Promise.all(PERIODS.map(async (period) => {
      const range = getPeriodRange(period, now)
      const inCurrent = sql`${completionTs} >= ${ts(range.start)} AND ${completionTs} <= ${ts(range.end)}`
      const inPrevious = sql`${completionTs} >= ${ts(range.prevStart)} AND ${completionTs} <= ${ts(range.prevEnd)}`

      const [row] = await db.select({
        rides: sql<number>`COUNT(*) FILTER (WHERE ${inCurrent})`,
        gross: sql<string>`COALESCE(SUM(${priceNum}) FILTER (WHERE ${inCurrent}), 0)`,
        previousGross: sql<string>`COALESCE(SUM(${priceNum}) FILTER (WHERE ${inPrevious}), 0)`,
      }).from(bookingsTable).where(and(
        eq(bookingsTable.status, 'completed'),
        isNotNull(bookingsTable.price),
        sql`${completionTs} >= ${ts(range.prevStart)}`,
      ))

      const gross = Number(row?.gross || 0)
      const previousGross = Number(row?.previousGross || 0)
      const commission = computeCommission(gross)
      const previousCommission = computeCommission(previousGross)

      return [period, {
        gross: Math.round(gross),
        commission,
        rides: Number(row?.rides || 0),
        previousCommission,
        // Pas de variation affichable quand la période précédente est vide (division par zéro).
        deltaPercent: previousCommission > 0
          ? Math.round(((commission - previousCommission) / previousCommission) * 1000) / 10
          : null,
      }] as const
    }))

    return NextResponse.json({
      success: true,
      data: { rate: COMMISSION_RATE, ...Object.fromEntries(entries) },
    })
  } catch (error) {
    console.error('❌ [ADMIN] Erreur lors du calcul des commissions:', error)
    return NextResponse.json({ success: false, message: 'Erreur lors du calcul des commissions' }, { status: 500 })
  }
}
