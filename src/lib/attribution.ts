// Provenance d'une réservation : page d'entrée, site référent, UTM, gclid.
//
// GA4 sait déjà d'où vient une visite, mais pas à quelle réservation EN BASE elle
// a abouti : sans ces colonnes on ne peut pas dire quelle page SEO amène de vraies
// courses (et pas seulement des vues). Le module est importé des deux côtés :
// capture côté navigateur, normalisation côté API.

export interface BookingAttribution {
  landingPage: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  gclid: string | null;
}

const STORAGE_KEY = 'nx_attribution';

const EMPTY: BookingAttribution = {
  landingPage: null,
  referrer: null,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  gclid: null,
};

/**
 * À appeler à chaque arrivée sur une page publique.
 *
 * Dernier contact non direct de la session : une nouvelle visite portant des UTM,
 * un gclid ou un référent externe remplace la précédente ; une navigation interne
 * ou une arrivée directe ne l'écrase pas. La page d'entrée est donc celle qui a
 * amené le visiteur, pas /reservation.
 *
 * Seuls le chemin (sans query string) et le nom d'hôte du référent sont gardés :
 * aucune donnée personnelle qui traînerait dans une URL n'arrive en base.
 * sessionStorage peut lever (navigation privée) : on avale l'erreur.
 */
export const captureAttribution = () => {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    let referrerHost: string | null = null;
    if (document.referrer) {
      const host = new URL(document.referrer).hostname;
      if (host && host !== window.location.hostname) referrerHost = host;
    }
    const campaign = {
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
      gclid: params.get('gclid'),
    };
    const isNewTouch = referrerHost !== null || Object.values(campaign).some(Boolean);
    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    if (existing && !isNewTouch) return;

    const attribution: BookingAttribution = {
      landingPage: window.location.pathname,
      referrer: referrerHost,
      ...campaign,
    };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeAttribution(attribution)));
  } catch {
    /* stockage ou URL indisponible : la réservation part sans provenance */
  }
};

export const getAttribution = (): BookingAttribution => {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? normalizeAttribution(JSON.parse(raw)) : EMPTY;
  } catch {
    return EMPTY;
  }
};

const clean = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Bornes appliquées par l'API : le corps de requête vient du navigateur, une
 * provenance absente ou malformée donne des null, jamais un refus de réservation.
 */
export const normalizeAttribution = (value: unknown): BookingAttribution => {
  if (!value || typeof value !== 'object') return EMPTY;
  const v = value as Record<string, unknown>;
  const landingPage = clean(v.landingPage, 300);
  return {
    landingPage: landingPage && landingPage.startsWith('/') ? landingPage : null,
    referrer: clean(v.referrer, 200),
    utmSource: clean(v.utmSource, 120),
    utmMedium: clean(v.utmMedium, 120),
    utmCampaign: clean(v.utmCampaign, 120),
    gclid: clean(v.gclid, 200),
  };
};
