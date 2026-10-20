'use client';

import Script from 'next/script';
import { GA_MEASUREMENT_ID } from '@/lib/ga';
import { CONSENT_STORAGE_KEY } from '@/lib/consent';

/**
 * Chargement de gtag.js (Google Analytics 4) avec Consent Mode v2.
 *
 * `NEXT_PUBLIC_GA_ID` absente ⇒ aucun script n'est injecté. Le cas se produit
 * surtout en développement, et le silence y est préférable à des vues de page
 * de test mélangées aux données de production.
 *
 * Consentement : tout est refusé par défaut (`gtag('consent', 'default')`), puis
 * le choix mémorisé par le bandeau (`CookieBanner`, clé `nx-cookie-consent`) est
 * rejoué avant le `config`. Les signaux publicitaires restent toujours refusés ;
 * seul `analytics_storage` peut être accordé, par l'utilisateur.
 *
 * Les vues de page sont laissées à la **mesure améliorée** de GA4 : le `config`
 * ci-dessous en envoie une au chargement, et l'option « Modifications de page
 * basées sur les événements de l'historique du navigateur » (GA4 > Admin > Flux
 * de données > Mesure améliorée, activée par défaut) couvre les navigations
 * internes du routeur Next.js. Ne pas réintroduire d'appel `gtag('config')` à
 * chaque changement de route : il s'ajouterait à celui-là et compterait chaque
 * vue deux fois — c'est précisément le bug qu'avait `PageViewTracker`.
 */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            wait_for_update: 500
          });
          try {
            if (localStorage.getItem('${CONSENT_STORAGE_KEY}') === 'granted') {
              gtag('consent', 'update', { analytics_storage: 'granted' });
            }
          } catch (e) {}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
