// Coordonnées publiques de réservation, partagées par les CTA d'appel et WhatsApp.
// Même numéro que le pied de page et la page contact.
export const CONTACT_PHONE_E164 = '+221784651302';
export const CONTACT_PHONE_DISPLAY = '+221 78 465 13 02';
const WHATSAPP_NUMBER = '221784651302';

/** Lien WhatsApp, avec un message pré-rempli quand le contexte est connu (trajet de la page). */
export function whatsappHref(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Fiche Google Business (racine, sans /review : ce suffixe ouvre le formulaire
 * de notation). Même valeur que le sameAs de schemaLocalBusiness.
 */
export const GOOGLE_BUSINESS_URL = 'https://g.page/r/CWZ1tVchWCgbEAI';
