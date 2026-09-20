'use client';

// Déclaration globale pour gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

// Types pour les événements Google Analytics
export interface GAEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
}

// Fonction pour envoyer des événements à Google Analytics
export const trackEvent = (event: GAEvent) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
    });
  }
};

// Événements prédéfinis pour Navette Xpress
export const trackReservation = (serviceType: string, price: number) => {
  trackEvent({
    action: 'reservation',
    category: 'engagement',
    label: serviceType,
    value: price,
  });
};

export const trackPhoneCall = (source: string) => {
  trackEvent({
    action: 'phone_call',
    category: 'contact',
    label: source,
  });
};

export const trackEmailClick = (source: string) => {
  trackEvent({
    action: 'email_click',
    category: 'contact',
    label: source,
  });
};

export const trackQuoteRequest = (service: string) => {
  trackEvent({
    action: 'quote_request',
    category: 'lead',
    label: service,
  });
};

export const trackPageView = (pageName: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-X1NDJE79VS', {
      page_title: pageName,
      page_location: window.location.href,
    });
  }
};

export const trackFormSubmission = (formName: string) => {
  trackEvent({
    action: 'form_submission',
    category: 'engagement',
    label: formName,
  });
};

export const trackServiceView = (serviceName: string) => {
  trackEvent({
    action: 'service_view',
    category: 'engagement',
    label: serviceName,
  });
};

// ── Conversions ──
// Ces trois evenements sont les seuls qui comptent vraiment : ils marquent le
// moment ou une visite devient un lead. A marquer comme "evenements cles"
// (conversions) dans GA4 > Admin > Evenements, sinon ils restent de simples
// evenements et n'alimentent ni les rapports d'acquisition ni Google Ads.

const REFERRAL_STORAGE_KEY = 'nx_driver_ref';

/**
 * Parrainage chauffeur, sans passer par la base.
 *
 * Un partenaire existant partage `/devenir-partenaire?ref=<son-code>` ; on
 * memorise le code pour la duree de la session, afin qu'il survive a une
 * navigation interne (le candidat va lire /tarifs puis revient au formulaire).
 * Le code repart ensuite en `event_label` de la conversion, ce qui suffit a
 * savoir qui amene des candidats dans GA4.
 *
 * sessionStorage peut lever (navigation privee, cookies bloques) : on avale
 * l'erreur, le suivi de parrainage n'a jamais a casser le formulaire.
 */
export const captureDriverReferral = () => {
  if (typeof window === 'undefined') return;
  try {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) window.sessionStorage.setItem(REFERRAL_STORAGE_KEY, ref.slice(0, 64));
  } catch {
    /* stockage indisponible : on continue sans parrainage */
  }
};

export const getDriverReferral = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(REFERRAL_STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Candidature chauffeur partenaire envoyee avec succes.
 * `label` porte le code de parrainage quand il y en a un, sinon 'direct'.
 * La source de trafic elle-meme (SERP, reseaux, Google for Jobs) est deja
 * suivie nativement par GA4, inutile de la dupliquer ici.
 */
export const trackDriverApplication = (referral?: string | null) => {
  trackEvent({
    action: 'driver_application_submitted',
    category: 'lead',
    label: referral || 'direct',
  });
};

/** Reservation client creee avec succes. */
export const trackBookingSubmitted = (params: {
  serviceType?: string;
  vehicleType?: string;
  price?: number;
}) => {
  trackEvent({
    action: 'booking_submitted',
    category: 'conversion',
    label: [params.serviceType, params.vehicleType].filter(Boolean).join(' / ') || 'reservation',
    value: params.price,
  });
};

/** Demande de devis envoyee avec succes. */
export const trackQuoteSubmitted = (service?: string) => {
  trackEvent({
    action: 'quote_submitted',
    category: 'lead',
    label: service || 'quote-request',
  });
};
