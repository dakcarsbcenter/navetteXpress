export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { tripPlansTable, bookingsTable } from '@/schema'
import { eq, and } from 'drizzle-orm'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    const planId = Number.parseInt((await params).id, 10)
    if (Number.isNaN(planId)) {
      return NextResponse.json({ success: false, error: 'ID invalide' }, { status: 400 })
    }

    const plan = await db
      .select()
      .from(tripPlansTable)
      .where(and(eq(tripPlansTable.id, planId), eq(tripPlansTable.userId, session.user.id)))
      .limit(1)

    if (plan.length === 0) {
      return NextResponse.json({ success: false, error: 'Planification non trouvée' }, { status: 404 })
    }

    await db
      .update(tripPlansTable)
      .set({ status: 'cancelled' })
      .where(eq(tripPlansTable.id, planId))

    await db
      .update(bookingsTable)
      .set({
        status: 'cancelled',
        cancellationReason: 'Planification annulée par l\'entreprise',
        cancelledBy: session.user.id,
        cancelledAt: new Date(),
      })
      .where(and(eq(bookingsTable.tripPlanId, planId), eq(bookingsTable.status, 'pending')))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la planification:', error)
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
