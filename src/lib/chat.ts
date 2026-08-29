import { db } from '@/db';
import { and, eq, gt, ne, or, isNull, sql } from 'drizzle-orm';
import {
  bookingsTable,
  conversationsTable,
  messagesTable,
  users,
  type SelectConversation,
} from '@/schema';
import { sendWithRetry } from './notification-queue';

export function isSupportStaff(role: string): boolean {
  return role === 'admin' || role === 'manager';
}

export async function getConversationById(id: number): Promise<SelectConversation | null> {
  const rows = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Admin/manager voient tout (support et supervision des chats de réservation). */
export function canAccessConversation(conversation: SelectConversation, userId: string, role: string): boolean {
  if (isSupportStaff(role)) return true;
  if (conversation.clientId === userId) return true;
  if (conversation.driverId === userId) return true;
  return false;
}

export async function getOrCreateBookingConversation(
  bookingId: number,
  requesterId: string,
  requesterRole: string
): Promise<SelectConversation> {
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!booking) throw new Error('NOT_FOUND');
  if (!booking.userId || !booking.driverId) throw new Error('NO_DRIVER_ASSIGNED');

  const isParticipant =
    requesterId === booking.userId || requesterId === booking.driverId || isSupportStaff(requesterRole);
  if (!isParticipant) throw new Error('FORBIDDEN');

  const [existing] = await db
    .select()
    .from(conversationsTable)
    .where(and(eq(conversationsTable.type, 'booking'), eq(conversationsTable.bookingId, bookingId)))
    .limit(1);

  if (existing) {
    if (existing.driverId !== booking.driverId) {
      const [updated] = await db
        .update(conversationsTable)
        .set({ driverId: booking.driverId, updatedAt: new Date() })
        .where(eq(conversationsTable.id, existing.id))
        .returning();
      return updated;
    }
    return existing;
  }

  try {
    const [created] = await db
      .insert(conversationsTable)
      .values({ type: 'booking', bookingId: booking.id, clientId: booking.userId, driverId: booking.driverId })
      .returning();
    return created;
  } catch (err) {
    // Deux requêtes concurrentes (double-clic, deux onglets) peuvent passer le SELECT
    // en même temps ; la contrainte unique sur booking_id rejette la 2e INSERT (23505)
    // — on relit alors la ligne créée par l'autre requête au lieu d'échouer.
    if (isUniqueViolation(err)) {
      const [row] = await db
        .select()
        .from(conversationsTable)
        .where(and(eq(conversationsTable.type, 'booking'), eq(conversationsTable.bookingId, bookingId)))
        .limit(1);
      if (row) return row;
    }
    throw err;
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === '23505';
}

export async function getOrCreateSupportConversation(clientId: string): Promise<SelectConversation> {
  const [existing] = await db
    .select()
    .from(conversationsTable)
    .where(and(eq(conversationsTable.type, 'support'), eq(conversationsTable.clientId, clientId)))
    .limit(1);
  if (existing) return existing;

  try {
    const [created] = await db.insert(conversationsTable).values({ type: 'support', clientId }).returning();
    return created;
  } catch (err) {
    if (isUniqueViolation(err)) {
      const [row] = await db
        .select()
        .from(conversationsTable)
        .where(and(eq(conversationsTable.type, 'support'), eq(conversationsTable.clientId, clientId)))
        .limit(1);
      if (row) return row;
    }
    throw err;
  }
}

export async function markConversationRead(conversation: SelectConversation, userId: string, role: string) {
  const now = new Date();
  if (isSupportStaff(role)) {
    await db.update(conversationsTable).set({ adminLastReadAt: now }).where(eq(conversationsTable.id, conversation.id));
  } else if (conversation.clientId === userId) {
    await db.update(conversationsTable).set({ clientLastReadAt: now }).where(eq(conversationsTable.id, conversation.id));
  } else if (conversation.driverId === userId) {
    await db.update(conversationsTable).set({ driverLastReadAt: now }).where(eq(conversationsTable.id, conversation.id));
  }
}

/** Nombre de messages non lus par `userId` dans cette conversation (messages des autres, postérieurs à son dernier "lu"). */
export async function getUnreadCount(conversation: SelectConversation, userId: string, role: string): Promise<number> {
  const lastReadAt = isSupportStaff(role)
    ? conversation.adminLastReadAt
    : conversation.clientId === userId
      ? conversation.clientLastReadAt
      : conversation.driverLastReadAt;

  const conditions = [
    eq(messagesTable.conversationId, conversation.id),
    or(isNull(messagesTable.senderId), ne(messagesTable.senderId, userId))!,
  ];
  if (lastReadAt) conditions.push(gt(messagesTable.createdAt, lastReadAt));

  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(messagesTable)
    .where(and(...conditions));
  return Number(row?.count ?? 0);
}

/** Notifie par email le(s) destinataire(s) d'un nouveau message (best-effort, via la queue de retry). */
export async function notifyNewMessage(
  conversation: SelectConversation,
  senderId: string,
  senderRole: string,
  content: string
) {
  const [sender] = await db.select().from(users).where(eq(users.id, senderId)).limit(1);
  const senderName = sender?.name || 'NavetteXpress';

  if (conversation.type === 'support') {
    if (isSupportStaff(senderRole)) {
      const [client] = await db.select().from(users).where(eq(users.id, conversation.clientId)).limit(1);
      if (client?.email) {
        await sendWithRetry('email', 'resend-mailer.sendNewChatMessageToRecipientEmail', [
          client.email,
          { toName: client.name, senderName: 'Support NavetteXpress', content, conversationId: conversation.id },
        ]);
      }
    } else {
      await sendWithRetry('email', 'resend-mailer.sendNewChatMessageToAdminEmail', [
        { senderName, content, conversationId: conversation.id },
      ]);
    }
    return;
  }

  // conversation de type "booking" : notifie l'autre participant (client <-> chauffeur)
  const recipientId = senderId === conversation.clientId ? conversation.driverId : conversation.clientId;
  if (!recipientId) return;
  const [recipient] = await db.select().from(users).where(eq(users.id, recipientId)).limit(1);
  if (recipient?.email) {
    await sendWithRetry('email', 'resend-mailer.sendNewChatMessageToRecipientEmail', [
      recipient.email,
      { toName: recipient.name, senderName, content, conversationId: conversation.id },
    ]);
  }
}
