'use client';

import Script from 'next/script';
import { GA_MEASUREMENT_ID } from '@/lib/ga';

/**
 * Chargement de gtag.js (Google Analytics 4).
 *
 * `NEXT_PUBLIC_GA_ID` absente ⇒ aucun script n'est injecté. Le cas se produit
 * surtout en développement, et le silence y est préférable à des vues de page
 * de test mélangées aux données de production.
 *
 * Les vues de page sont laissées à la **mesure améliorée** de GA4 : le `config`
 * ci-dessous en envoie une au chargement, et l'option « Modifications de page
 * basées sur les événements de l'historique du navigateur » (GA4 > Admin > Flux
 * de données > Mesure améliorée, activée par défaut) couvre les navigations
 * internes du routeur Next.js. Ne pas réintroduire d'appel `gtag('config')` à
 * chaque changement de route : il s'ajouterait à celui-là et compterait chaque
 * vue deux fois — c'est précisément le bug qu'avait `PageViewTracker`.
 *
 * Aucun gestionnaire de consentement cookies n'existe sur le site : le script
 * est donc chargé inconditionnellement. Si une bannière est ajoutée (décision
 * produit, hors périmètre ici), c'est ici qu'il faut la brancher — soit en
 * conditionnant le rendu de ce composant, soit via le Consent Mode v2
 * (`gtag('consent', ...)` avant le `config`).
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
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
