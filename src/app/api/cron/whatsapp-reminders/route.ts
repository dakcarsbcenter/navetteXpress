export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookingsTable, users } from '@/schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';
import { sendWithRetry } from '@/lib/notification-queue';

/**
 * Rappel WhatsApp avant départ (template rappel_depart), à déclencher par un
 * cron externe (crontab VPS, même modèle que POST /api/ads/expire) :
 *
 *   curl -X POST https://<domaine>/api/cron/whatsapp-reminders \
 *     -H "x-cron-secret: $CRON_SECRET"
 *
 * Tourner ce cron toutes les 10-15min suffit : la fenêtre ci-dessous est
 * volontairement plus large que l'intervalle d'exécution pour ne rater aucun
 * départ, et whatsapp_reminder_sent_at empêche un double envoi.
 */

const REMINDER_LEAD_MINUTES = Number(process.env.WHATSAPP_REMINDER_LEAD_MINUTES) || 60;
const WINDOW_MINUTES = 15;

function leadTimeLabel(minutes: number): string {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} heure${hours > 1 ? 's' : ''}`;
  }
  return `${minutes} minutes`;
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + REMINDER_LEAD_MINUTES * 60_000);
  const windowEnd = new Date(windowStart.getTime() + WINDOW_MINUTES * 60_000);

  try {
    const dueBookings = await db
      .select()
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.status, 'confirmed'),
          isNull(bookingsTable.whatsappReminderSentAt),
          gte(bookingsTable.scheduledDateTime, windowStart),
          lte(bookingsTable.scheduledDateTime, windowEnd)
        )
      );

    let sent = 0;
    for (const booking of dueBookings) {
      let driver = { name: 'Votre chauffeur', phone: null as string | null };
      if (booking.driverId) {
        const driverData = await db.select({ name: users.name, phone: users.phone }).from(users).where(eq(users.id, booking.driverId)).limit(1);
        if (driverData.length > 0) driver = { name: driverData[0].name, phone: driverData[0].phone };
      }

      await sendWithRetry('whatsapp', 'whatsapp.sendRappelDepart', [booking, driver, leadTimeLabel(REMINDER_LEAD_MINUTES)]);
      await db.update(bookingsTable).set({ whatsappReminderSentAt: now }).where(eq(bookingsTable.id, booking.id));
      sent++;
    }

    return NextResponse.json({ checked: dueBookings.length, sent });
  } catch (error) {
    console.error('Erreur lors de l\'envoi des rappels WhatsApp:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
