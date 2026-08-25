export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { tripPlansTable, bookingsTable, users } from '@/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { generateTripPlanOccurrences, TripPlanValidationError } from '@/lib/trip-plan-occurrences'

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    const plans = await db
      .select()
      .from(tripPlansTable)
      .where(eq(tripPlansTable.userId, session.user.id))
      .orderBy(desc(tripPlansTable.createdAt))

    const planIds = plans.map((p) => p.id)
    const counts = planIds.length
      ? await db
          .select({
            tripPlanId: bookingsTable.tripPlanId,
            status: bookingsTable.status,
          })
          .from(bookingsTable)
          .where(inArray(bookingsTable.tripPlanId, planIds))
      : []

    const plansWithCounts = plans.map((plan) => {
      const planCounts = counts.filter((c) => c.tripPlanId === plan.id)
      return {
        ...plan,
        totalOccurrences: planCounts.length,
        pendingCount: planCounts.filter((c) => c.status === 'pending').length,
        cancelledCount: planCounts.filter((c) => c.status === 'cancelled').length,
      }
    })

    return NextResponse.json({ success: true, plans: plansWithCounts })
  } catch (error) {
    console.error('Erreur lors de la récupération des planifications:', error)
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const {
      pickupAddress,
      dropoffAddress,
      time,
      passengers,
      luggage,
      notes,
      recurrence,
      daysOfWeek,
      dayOfMonth,
      customDates,
      startDate,
      endDate,
    } = body

    if (!pickupAddress?.trim() || !dropoffAddress?.trim() || !time || !recurrence || !startDate) {
      return NextResponse.json({ success: false, error: 'Champs requis manquants' }, { status: 400 })
    }

    if (!['weekly', 'monthly', 'custom'].includes(recurrence)) {
      return NextResponse.json({ success: false, error: 'Type de récurrence invalide' }, { status: 400 })
    }

    let occurrences
    try {
      occurrences = generateTripPlanOccurrences({
        recurrence,
        time,
        startDate,
        endDate,
        daysOfWeek,
        dayOfMonth,
        customDates,
      })
    } catch (err) {
      if (err instanceof TripPlanValidationError) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 })
      }
      throw err
    }

    if (occurrences.length === 0) {
      return NextResponse.json({ success: false, error: 'noDates' }, { status: 400 })
    }

    const userRows = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
    const user = userRows[0]
    if (!user) {
      return NextResponse.json({ success: false, error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const [plan] = await db
      .insert(tripPlansTable)
      .values({
        userId: session.user.id,
        pickupAddress: pickupAddress.trim(),
        dropoffAddress: dropoffAddress.trim(),
        time,
        passengers: passengers && passengers > 0 ? passengers : 1,
        luggage: luggage && luggage > 0 ? luggage : 0,
        recurrence,
        daysOfWeek: recurrence === 'weekly' ? daysOfWeek : null,
        dayOfMonth: recurrence === 'monthly' ? dayOfMonth : null,
        customDates: recurrence === 'custom' ? customDates : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        notes: notes?.trim() || null,
        status: 'active',
      })
      .returning()

    await db.insert(bookingsTable).values(
      occurrences.map((date) => ({
        customerName: user.companyName || user.name,
        customerEmail: user.email,
        customerPhone: user.companyPhone || user.phone || '',
        userId: user.id,
        pickupAddress: pickupAddress.trim(),
        dropoffAddress: dropoffAddress.trim(),
        scheduledDateTime: date,
        status: 'pending' as const,
        passengers: passengers && passengers > 0 ? passengers : 1,
        luggage: luggage && luggage > 0 ? luggage : 0,
        notes: `Course planifiée (planification #${plan.id})${notes ? `\n${notes}` : ''}`,
        tripPlanId: plan.id,
      }))
    )

    return NextResponse.json({ success: true, plan, occurrencesCount: occurrences.length })
  } catch (error) {
    console.error('Erreur lors de la création de la planification:', error)
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
