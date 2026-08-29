export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getConversationById, canAccessConversation, markConversationRead } from '@/lib/chat';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const userId = session.user.id;
    const role = session.user.role || 'customer';
    if (!canAccessConversation(conversation, userId, role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await markConversationRead(conversation, userId, role);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors du marquage de lecture:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
