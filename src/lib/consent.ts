'use client';

/**
 * Choix de consentement aux cookies d'analyse (Google Analytics 4, Consent Mode v2).
 * Stocké dans le navigateur uniquement : `localStorage` peut lever une
 * exception (navigation privée, stockage bloqué), donc tout est protégé et
 * l'absence de stockage équivaut à « pas de choix » (analytics refusé).
 */
export const CONSENT_STORAGE_KEY = 'nx-cookie-consent';
export const CONSENT_OPEN_EVENT = 'nx-consent-open';

export type ConsentChoice = 'granted' | 'denied';

export function readConsent(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export function writeConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Stockage indisponible : le choix vaut pour la page courante seulement.
  }
  window.gtag?.('consent', 'update', { analytics_storage: choice });
}

/** Rouvre le bandeau (lien « Gérer mes cookies » du pied de page). */
export function openConsentSettings() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
