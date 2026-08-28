export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from "next-auth";
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users, notificationQueueTable } from '@/schema'
import { eq, desc, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const adminUser = await db.select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    if (!adminUser.length || (adminUser[0].role !== 'admin' && adminUser[0].role !== 'manager')) {
      return NextResponse.json({ success: false, message: 'Accès non autorisé' }, { status: 403 })
    }

    const failed = await db.select({
      id: notificationQueueTable.id,
      channel: notificationQueueTable.channel,
      handler: notificationQueueTable.handler,
      lastError: notificationQueueTable.lastError,
      attempts: notificationQueueTable.attempts,
      updatedAt: notificationQueueTable.updatedAt,
    })
      .from(notificationQueueTable)
      .where(eq(notificationQueueTable.status, 'failed'))
      .orderBy(desc(notificationQueueTable.updatedAt))
      .limit(20)

    const [pendingResult] = await db.select({ c: count() })
      .from(notificationQueueTable)
      .where(eq(notificationQueueTable.status, 'pending'))

    return NextResponse.json({
      success: true,
      data: {
        failed: failed.map((job) => ({
          id: job.id,
          channel: job.channel,
          handler: job.handler,
          lastError: job.lastError,
          attempts: job.attempts,
          updatedAt: job.updatedAt.toISOString(),
        })),
        pendingRetryCount: pendingResult?.c || 0,
      }
    })
  } catch (error) {
    console.error('❌ [ADMIN] Erreur lors de la récupération de la file de notifications:', error)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
