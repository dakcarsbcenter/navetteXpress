/**
 * File d'attente avec retry pour les notifications (email + WhatsApp).
 *
 * Le chemin normal reste synchrone : sendWithRetry() essaie l'envoi immédiat,
 * comme avant. Ce n'est qu'en cas d'échec que le job est persisté en base et
 * rejoué par le worker (processNotificationQueueOnce), avec un backoff
 * exponentiel, au lieu d'être silencieusement perdu.
 *
 * Les envoyeurs réels (Resend, OpenWA) sont importés dynamiquement dans le
 * registre pour ne pas faire planter le boot du serveur si une variable
 * d'environnement (ex: RESEND_API_KEY) manque — ces modules lèvent une
 * erreur dès leur import.
 */

import { and, eq, lte } from 'drizzle-orm';
import { db } from '@/db';
import { notificationQueueTable } from '@/schema';

type NotificationChannel = 'email' | 'whatsapp';
type Handler = (args: unknown[]) => Promise<unknown>;

// Backoff: 1min, 5min, 15min, 1h, 3h, 12h — puis échec définitif (maxAttempts = 6)
const BACKOFF_MINUTES = [1, 5, 15, 60, 180, 720];
const BATCH_SIZE = 20;

const registry: Record<string, Handler> = {
  'email.sendPasswordResetEmail': async (args) => {
    const { sendPasswordResetEmail } = await import('./email');
    return sendPasswordResetEmail(args[0] as string, args[1] as string, args[2] as string);
  },
  'email.sendAccountLockedEmail': async (args) => {
    const { sendAccountLockedEmail } = await import('./email');
    return sendAccountLockedEmail(args[0] as string, args[1] as string, new Date(args[2] as string));
  },
  'email.sendPasswordChangedEmail': async (args) => {
    const { sendPasswordChangedEmail } = await import('./email');
    return sendPasswordChangedEmail(args[0] as string, args[1] as string);
  },
  'resend-email.sendBookingNotificationToAdmin': async (args) => {
    const { sendBookingNotificationToAdmin } = await import('./resend-email');
    return sendBookingNotificationToAdmin(args[0] as Parameters<typeof sendBookingNotificationToAdmin>[0]);
  },
  'resend-email.sendBookingAssignedToDriver': async (args) => {
    const { sendBookingAssignedToDriver } = await import('./resend-email');
    return sendBookingAssignedToDriver(
      args[0] as Parameters<typeof sendBookingAssignedToDriver>[0],
      args[1] as Parameters<typeof sendBookingAssignedToDriver>[1]
    );
  },
  'resend-email.sendBookingConfirmedToClient': async (args) => {
    const { sendBookingConfirmedToClient } = await import('./resend-email');
    return sendBookingConfirmedToClient(
      args[0] as Parameters<typeof sendBookingConfirmedToClient>[0],
      args[1] as Parameters<typeof sendBookingConfirmedToClient>[1]
    );
  },
  'resend-mailer.sendInvoiceEmail': async (args) => {
    const { sendInvoiceEmail } = await import('./resend-mailer');
    return sendInvoiceEmail(args[0] as string, args[1] as Parameters<typeof sendInvoiceEmail>[1]);
  },
  'resend-mailer.sendQuoteConfirmedEmail': async (args) => {
    const { sendQuoteConfirmedEmail } = await import('./resend-mailer');
    return sendQuoteConfirmedEmail(args[0] as string, args[1] as Parameters<typeof sendQuoteConfirmedEmail>[1]);
  },
  'resend-mailer.sendBookingConfirmedByDriverEmail': async (args) => {
    const { sendBookingConfirmedByDriverEmail } = await import('./resend-mailer');
    return sendBookingConfirmedByDriverEmail(
      args[0] as string,
      args[1] as Parameters<typeof sendBookingConfirmedByDriverEmail>[1]
    );
  },
  'resend-mailer.sendNewBookingRequestEmail': async (args) => {
    const { sendNewBookingRequestEmail } = await import('./resend-mailer');
    return sendNewBookingRequestEmail(args[0] as string, args[1] as Parameters<typeof sendNewBookingRequestEmail>[1]);
  },
  'resend-mailer.sendNewQuoteRequestEmail': async (args) => {
    const { sendNewQuoteRequestEmail } = await import('./resend-mailer');
    return sendNewQuoteRequestEmail(
      args[0] as string,
      args[1] as Parameters<typeof sendNewQuoteRequestEmail>[1],
      args[2] as boolean
    );
  },
  'resend-mailer.sendQuoteRejectedEmail': async (args) => {
    const { sendQuoteRejectedEmail } = await import('./resend-mailer');
    return sendQuoteRejectedEmail(args[0] as Parameters<typeof sendQuoteRejectedEmail>[0]);
  },
  'resend-mailer.sendQuoteAcceptedEmail': async (args) => {
    const { sendQuoteAcceptedEmail } = await import('./resend-mailer');
    return sendQuoteAcceptedEmail(args[0] as Parameters<typeof sendQuoteAcceptedEmail>[0]);
  },
  'resend-mailer.sendBookingPriceAcceptedEmail': async (args) => {
    const { sendBookingPriceAcceptedEmail } = await import('./resend-mailer');
    return sendBookingPriceAcceptedEmail(args[0] as Parameters<typeof sendBookingPriceAcceptedEmail>[0]);
  },
  'resend-mailer.sendBookingPriceRejectedEmail': async (args) => {
    const { sendBookingPriceRejectedEmail } = await import('./resend-mailer');
    return sendBookingPriceRejectedEmail(args[0] as Parameters<typeof sendBookingPriceRejectedEmail>[0]);
  },
  'whatsapp.sendBookingWhatsAppToAdmin': async (args) => {
    const { sendBookingWhatsAppToAdmin } = await import('./whatsapp');
    return sendBookingWhatsAppToAdmin(args[0] as Parameters<typeof sendBookingWhatsAppToAdmin>[0]);
  },
  'whatsapp.sendBookingAssignedWhatsAppToDriver': async (args) => {
    const { sendBookingAssignedWhatsAppToDriver } = await import('./whatsapp');
    return sendBookingAssignedWhatsAppToDriver(
      args[0] as Parameters<typeof sendBookingAssignedWhatsAppToDriver>[0],
      args[1] as Parameters<typeof sendBookingAssignedWhatsAppToDriver>[1]
    );
  },
  'whatsapp.sendQuoteWhatsAppNotification': async (args) => {
    const { sendQuoteWhatsAppNotification } = await import('./whatsapp');
    return sendQuoteWhatsAppNotification(
      args[0] as string,
      args[1] as Parameters<typeof sendQuoteWhatsAppNotification>[1],
      args[2] as boolean
    );
  },
};

/** Les envoyeurs "resend-email"/"resend-mailer"/whatsapp renvoient {success:false, error} sans lever d'exception. */
function assertSuccess(result: unknown) {
  if (result && typeof result === 'object' && 'success' in result && (result as { success: unknown }).success === false) {
    throw new Error((result as { error?: string }).error || 'Envoi échoué');
  }
}

/**
 * Tente un envoi immédiat. En cas d'échec, met le job en file pour retry
 * au lieu de le perdre. Ne lève jamais d'exception.
 */
export async function sendWithRetry(
  channel: NotificationChannel,
  handler: keyof typeof registry,
  args: unknown[]
): Promise<{ success: boolean; error?: string; queued?: boolean }> {
  const fn = registry[handler];
  if (!fn) {
    console.error(`❌ [Queue] Handler de notification inconnu: ${handler}`);
    return { success: false, error: `Handler inconnu: ${handler}` };
  }

  try {
    const result = await fn(args);
    assertSuccess(result);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ [Queue] Échec envoi immédiat (${handler}), mise en file d'attente:`, message);

    try {
      await db.insert(notificationQueueTable).values({
        channel,
        handler,
        payload: JSON.stringify(args),
        lastError: message,
      });
    } catch (queueError) {
      console.error(`❌ [Queue] Impossible de mettre en file (${handler}):`, queueError);
    }

    return { success: false, error: message, queued: true };
  }
}

/** Traite un lot de jobs dus. Appelé en boucle par le worker, ou manuellement pour debug. */
export async function processNotificationQueueOnce(): Promise<{ processed: number; sent: number; failed: number }> {
  const now = new Date();
  const due = await db
    .select()
    .from(notificationQueueTable)
    .where(and(eq(notificationQueueTable.status, 'pending'), lte(notificationQueueTable.nextAttemptAt, now)))
    .limit(BATCH_SIZE);

  let sent = 0;
  let failed = 0;

  for (const job of due) {
    const fn = registry[job.handler];

    if (!fn) {
      await db
        .update(notificationQueueTable)
        .set({ status: 'failed', lastError: `Handler inconnu: ${job.handler}` })
        .where(eq(notificationQueueTable.id, job.id));
      failed++;
      continue;
    }

    try {
      const args = JSON.parse(job.payload);
      const result = await fn(args);
      assertSuccess(result);

      await db.update(notificationQueueTable).set({ status: 'sent' }).where(eq(notificationQueueTable.id, job.id));
      console.log(`✅ [Queue] Retry réussi: ${job.handler} (#${job.id})`);
      sent++;
    } catch (error) {
      const attempts = job.attempts + 1;
      const message = error instanceof Error ? error.message : String(error);

      if (attempts >= job.maxAttempts) {
        await db
          .update(notificationQueueTable)
          .set({ status: 'failed', attempts, lastError: message })
          .where(eq(notificationQueueTable.id, job.id));
        console.error(`❌ [Queue] Abandon après ${attempts} tentatives: ${job.handler} (#${job.id}) — ${message}`);
        failed++;
      } else {
        const delayMinutes = BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)];
        await db
          .update(notificationQueueTable)
          .set({ attempts, lastError: message, nextAttemptAt: new Date(Date.now() + delayMinutes * 60_000) })
          .where(eq(notificationQueueTable.id, job.id));
        console.warn(`⚠️ [Queue] Nouvel essai dans ${delayMinutes}min: ${job.handler} (#${job.id}) — ${message}`);
      }
    }
  }

  return { processed: due.length, sent, failed };
}

let workerStarted = false;

/**
 * Démarre le polling en tâche de fond. À appeler une seule fois, au boot du
 * serveur (voir src/instrumentation.ts) — le déploiement tourne en process
 * Node long-lived (Docker/Coolify, output: 'standalone'), pas en fonctions
 * serverless, donc un setInterval in-process est fiable ici.
 */
export function startNotificationQueueWorker(intervalMs = 60_000) {
  if (workerStarted) return;
  workerStarted = true;

  const tick = () => {
    processNotificationQueueOnce().catch((error) => {
      console.error('❌ [Queue] Erreur du worker de notifications:', error);
    });
  };

  tick();
  setInterval(tick, intervalMs);
  console.log(`🔄 [Queue] Worker de notifications démarré (intervalle: ${intervalMs / 1000}s)`);
}
