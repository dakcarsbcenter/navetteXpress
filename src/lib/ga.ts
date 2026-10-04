/**
 * Identifiant de mesure Google Analytics 4 — source unique.
 *
 * Il était écrit en dur à deux endroits (`app/google-analytics.tsx` pour le
 * chargement de gtag.js, `lib/analytics.ts` pour `trackPageView`), avec le
 * risque qu'un changement de propriété GA4 ne soit répercuté que sur l'un des
 * deux : le script aurait chargé la nouvelle propriété et les événements
 * auraient continué à partir vers l'ancienne.
 *
 * Le repli codé en dur (`G-X1NDJE79VS`) a été retiré : la variable est définie
 * en production et `docker-compose.yml` la passe désormais en build-arg, ce qui
 * est obligatoire pour une variable `NEXT_PUBLIC_*` (figée dans le bundle
 * client au moment du build, pas lue au runtime via `env_file`).
 *
 * Valeur vide = aucune mesure. C'est volontaire : mieux vaut ne rien mesurer
 * que d'envoyer les données vers une propriété devinée.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';
