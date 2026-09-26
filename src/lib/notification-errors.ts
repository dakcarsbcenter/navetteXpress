/**
 * Erreur d'envoi qu'aucun réessai ne corrigera : numéro invalide, destinataire
 * absent, donnée structurellement manquante.
 *
 * Le payload d'un job en file est un instantané JSON de la réservation (voir
 * sendWithRetry dans notification-queue.ts) : corriger la donnée en base ne change
 * rien au job déjà mis en file, le rejouer produit exactement le même échec. Un job
 * marqué ainsi part donc directement en 'failed' au lieu de consommer les 6
 * tentatives du backoff (1, 5, 15, 60, 180, 720 min ≈ 16 h) — il devient visible
 * immédiatement dans le panneau admin des notifications, qui ne liste que les
 * jobs 'failed'.
 *
 * Module volontairement sans aucune dépendance : il est importé aussi bien par
 * whatsapp/geskap.ts que par notification-queue.ts, lequel charge geskap.ts en
 * import dynamique. Le placer ailleurs créerait un cycle.
 */
export class NonRetryableNotificationError extends Error {
  /**
   * Marqueur structurel plutôt qu'un `instanceof` : les envoyeurs sont chargés par
   * import dynamique et certains relancent l'erreur brute du SDK (objet nu, pas une
   * instance d'Error) — cf. errorMessage() dans notification-queue.ts.
   */
  readonly nonRetryable = true;

  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableNotificationError';
  }
}

/** Vrai si l'erreur porte le marqueur, quelle que soit sa chaîne de prototypes. */
export function isNonRetryableNotificationError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      (error as { nonRetryable?: unknown }).nonRetryable === true
  );
}
