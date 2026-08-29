export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { messagesTable, conversationsTable } from '@/schema';
import { eq, and, lt, desc } from 'drizzle-orm';
import { getConversationById, canAccessConversation, notifyNewMessage } from '@/lib/chat';
import { publishMessage } from '@/lib/chat-events';

const MAX_CONTENT_LENGTH = 4000;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { id?: string; role?: string } } | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const conversationId = Number(id);
    if (!Number.isInteger(conversationId)) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const conversation = await getConversationById(conversationId);
    if (!conversation) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
    if (!canAccessConversation(conversation, session.user.id, session.user.role || 'customer')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const url = new URL(request.url);
    const before = url.searchParams.get('before');
    const conditions = [eq(messagesTable.conversationId, conversationId)];
    if (before && Number.isInteger(Number(before))) {
      conditions.push(lt(messagesTable.id, Number(before)));
    }

    const rows = await db
      .select()
      .from(messagesTable)
      .where(and(...conditions))
      .orderBy(desc(messagesTable.id))
      .limit(50);

    return NextResponse.json({ success: true, messages: rows.reverse() });
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { id?: string; role?: string } } | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const userId = session.user.id;
    const role = session.user.role || 'customer';

    const { id } = await params;
    const conversationId = Number(id);
    if (!Number.isInteger(conversationId)) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const conversation = await getConversationById(conversationId);
    if (!conversation) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
    if (!canAccessConversation(conversation, userId, role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const content = (body?.content ?? '').toString().trim();
    if (!content) return NextResponse.json({ error: 'Message vide' }, { status: 400 });
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: 'Message trop long' }, { status: 400 });
    }

    const now = new Date();
    const [message] = await db
      .insert(messagesTable)
      .values({ conversationId, senderId: userId, content, createdAt: now })
      .returning();

    await db
      .update(conversationsTable)
      .set({ lastMessageAt: now, updatedAt: now })
      .where(eq(conversationsTable.id, conversationId));

    publishMessage(conversationId, message);

    notifyNewMessage(conversation, userId, role, content).catch((error) => {
      console.error('Erreur notification nouveau message (non bloquant):', error);
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
