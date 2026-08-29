export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { conversationsTable, users } from '@/schema';
import { eq, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  isSupportStaff,
  getOrCreateBookingConversation,
  getOrCreateSupportConversation,
  getUnreadCount,
} from '@/lib/chat';

const clientUsers = alias(users, 'conv_client_users');
const driverUsers = alias(users, 'conv_driver_users');

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { id?: string; role?: string } } | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const userId = session.user.id;
    const role = session.user.role || 'customer';

    const whereClause = isSupportStaff(role)
      ? eq(conversationsTable.type, 'support')
      : role === 'driver'
        ? eq(conversationsTable.driverId, userId)
        : eq(conversationsTable.clientId, userId);

    const rows = await db
      .select({ conversation: conversationsTable, client: clientUsers, driver: driverUsers })
      .from(conversationsTable)
      .leftJoin(clientUsers, eq(conversationsTable.clientId, clientUsers.id))
      .leftJoin(driverUsers, eq(conversationsTable.driverId, driverUsers.id))
      .where(whereClause)
      .orderBy(desc(conversationsTable.lastMessageAt), desc(conversationsTable.createdAt));

    const conversations = await Promise.all(
      rows.map(async ({ conversation, client, driver }) => ({
        id: conversation.id,
        type: conversation.type,
        bookingId: conversation.bookingId,
        lastMessageAt: conversation.lastMessageAt,
        client: client ? { id: client.id, name: client.name } : null,
        driver: driver ? { id: driver.id, name: driver.name } : null,
        unreadCount: await getUnreadCount(conversation, userId, role),
      }))
    );

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { id?: string; role?: string } } | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const userId = session.user.id;
    const role = session.user.role || 'customer';
    const body = await request.json().catch(() => ({}));
    const { type, bookingId } = body as { type?: string; bookingId?: number };

    if (type === 'booking') {
      if (!bookingId) {
        return NextResponse.json({ error: 'bookingId requis' }, { status: 400 });
      }
      try {
        const conversation = await getOrCreateBookingConversation(Number(bookingId), userId, role);
        return NextResponse.json({ success: true, conversation });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'ERROR';
        if (message === 'NOT_FOUND') return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
        if (message === 'NO_DRIVER_ASSIGNED')
          return NextResponse.json({ error: 'Aucun chauffeur assigné à cette réservation' }, { status: 409 });
        if (message === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        throw err;
      }
    }

    if (type === 'support') {
      if (isSupportStaff(role)) {
        return NextResponse.json(
          { error: "Le support n'a pas de conversation à créer, consultez la liste" },
          { status: 400 }
        );
      }
      const conversation = await getOrCreateSupportConversation(userId);
      return NextResponse.json({ success: true, conversation });
    }

    return NextResponse.json({ error: 'type invalide (attendu: booking | support)' }, { status: 400 });
  } catch (error) {
    console.error('Erreur lors de la création de conversation:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
