'use client';

// Déclaration globale pour gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
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