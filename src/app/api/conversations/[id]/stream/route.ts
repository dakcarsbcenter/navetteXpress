export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getConversationById, canAccessConversation } from '@/lib/chat';
import { subscribeToConversation } from '@/lib/chat-events';

const HEARTBEAT_MS = 20_000;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions)) as { user?: { id?: string; role?: string } } | null;
  if (!session?.user?.id) {
    return new Response('Non autorisé', { status: 401 });
  }

  const { id } = await params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) {
    return new Response('Identifiant invalide', { status: 400 });
  }

  const conversation = await getConversationById(conversationId);
  if (!conversation) return new Response('Conversation introuvable', { status: 404 });
  if (!canAccessConversation(conversation, session.user.id, session.user.role || 'customer')) {
    return new Response('Accès refusé', { status: 403 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`: connected\n\n`));

      unsubscribe = subscribeToConversation(conversationId, (message) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
      });

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          // le controller est déjà fermé (client déconnecté) — le cancel() ci-dessous nettoiera
        }
      }, HEARTBEAT_MS);
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  request.signal.addEventListener('abort', () => {
    if (unsubscribe) unsubscribe();
    if (heartbeat) clearInterval(heartbeat);
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
