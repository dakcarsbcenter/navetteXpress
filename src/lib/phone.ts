/**
 * Format de stockage des téléphones.
 *
 * Une seule règle de normalisation dans toute l'application : celle de
 * toGeskapPhone(), qui est aussi celle utilisée à l'envoi WhatsApp et à la
 * reconnaissance d'un chauffeur sur réponse entrante (findDriverIdByPhone).
 * Stocker déjà normalisé évite que l'écart entre la saisie et le format attendu ne
 * se découvre qu'au moment de l'envoi — c'est ce décalage qui a fait manquer la
 * confirmation de la réservation #7 ("0033680264157" en base).
 *
 * Module distinct de whatsapp/geskap : importer le canal WhatsApp depuis
 * l'inscription ou le profil client serait sémantiquement faux.
 */
import { toGeskapPhone, isValidE164 } from '@/lib/whatsapp/geskap';

export function normalizePhoneForStorage(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const e164 = toGeskapPhone(trimmed);
  // Numéro non convertible (ex: "0680264157", national étranger sans indicatif) : on
  // conserve la saisie brute plutôt que de bloquer une inscription ou une
  // réservation. L'envoi WhatsApp échouera explicitement (job 'failed' visible dans
  // le panneau admin) et la saisie d'origine reste lisible pour rappeler le client.
  return isValidE164(e164) ? e164 : trimmed;
}

export class InvalidPhoneError extends Error {
  constructor(public readonly field: string) {
    super(`Numéro de téléphone invalide pour "${field}" : indiquez l'indicatif pays (ex: +221 77 123 45 67).`);
    this.name = 'InvalidPhoneError';
  }
}

/**
 * Variante stricte pour les saisies publiques et clients : un numéro ambigu
 * ("0612345678", pays inconnu) est refusé tout de suite plutôt que stocké pour
 * n'échouer qu'à l'envoi WhatsApp. Les routes admin gardent normalizePhoneForStorage :
 * une réservation prise au téléphone ne doit pas être bloquée par un numéro dicté.
 *
 * Renvoie null pour une valeur vide (champ optionnel).
 */
export function requireValidPhone(raw: string | null | undefined, field = 'phone'): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const e164 = toGeskapPhone(trimmed);
  if (!isValidE164(e164)) throw new InvalidPhoneError(field);
  return e164;
}
