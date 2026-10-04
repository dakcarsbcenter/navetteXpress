export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookingsTable } from '@/schema';
import { eq, and, lte, isNull, isNotNull } from 'drizzle-orm';
import { sendWithRetry } from '@/lib/notification-queue';

/**
 * Demande d'avis Google envoyée au client après une course terminée (template
 * WhatsApp `senddemandeavis`), à déclencher par un cron externe — même modèle que
 * /api/cron/whatsapp-reminders :
 *
 *   curl -X POST https://<domaine>/api/cron/review-requests \
 *     -H "x-cron-secret: $CRON_SECRET"
 *
 * Un passage par heure suffit : il n'y a pas de fenêtre à rater ici,
 * contrairement au rappel avant départ. La condition est « terminée depuis au
 * moins X heures », donc une course manquée à un tick part au suivant.
 *
 * Un seul envoi par réservation, garanti par `bookings.review_request_sent_at` :
 * une course qui repasserait par 'completed' ne redéclenche rien.
 */

/** Délai entre la fin de course et la demande d'avis. 2h par défaut : assez pour
 * que le client soit arrivé, assez tôt pour que la course soit fraîche. */
const DELAY_HOURS = Number(process.env.REVIEW_REQUEST_DELAY_HOURS) || 2;

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const reviewUrl = process.env.GOOGLE_REVIEW_URL?.trim();
  if (!reviewUrl) {
    // Rien n'est marqué comme envoyé : dès que le lien est renseigné, les
    // courses terminées entre-temps partent au tick suivant. On répond 200 pour
    // ne pas faire alerter le cron sur une configuration simplement incomplète.
    return NextResponse.json({
      checked: 0,
      sent: 0,
      skipped: 'GOOGLE_REVIEW_URL non renseignée (à générer depuis Google Business Profile)',
    });
  }

  const now = new Date();
  const dueBefore = new Date(now.getTime() - DELAY_HOURS * 3_600_000);

  try {
    const dueBookings = await db
      .select()
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.status, 'completed'),
          isNull(bookingsTable.reviewRequestSentAt),
          // Les courses terminées avant la migration 0038 ont completed_at
          // renseigné par backfill ; ce garde-fou couvre une éventuelle course
          // passée à 'completed' par un chemin qui ne daterait pas la fin.
          isNotNull(bookingsTable.completedAt),
          lte(bookingsTable.completedAt, dueBefore),
          // Réservation saisie par l'admin sans téléphone : rien à envoyer, et
          // inutile d'empiler un job voué à l'échec non rejouable.
          isNotNull(bookingsTable.customerPhone)
        )
      );

    let sent = 0;
    for (const booking of dueBookings) {
      await sendWithRetry('whatsapp', 'whatsapp.sendDemandeAvis', [booking, reviewUrl]);
      // Marqué même si l'envoi a échoué : sendWithRetry a alors persisté le job
      // en file de retry, qui le rejouera. Re-marquer ici évite qu'un numéro
      // définitivement invalide fasse repartir un job à chaque tick du cron.
      await db
        .update(bookingsTable)
        .set({ reviewRequestSentAt: now })
        .where(eq(bookingsTable.id, booking.id));
      sent++;
    }

    return NextResponse.json({ checked: dueBookings.length, sent, delayHours: DELAY_HOURS });
  } catch (error) {
    console.error("Erreur lors de l'envoi des demandes d'avis:", error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
