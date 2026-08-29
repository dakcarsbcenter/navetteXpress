/**
 * Hook de démarrage serveur (Next.js instrumentation).
 * Démarre le worker de retry des notifications (email) — voir
 * src/lib/notification-queue.ts. Ne s'exécute que côté Node (pas Edge).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startNotificationQueueWorker } = await import('./lib/notification-queue');
    startNotificationQueueWorker();
  }
}
