// Lien de réservation pré-rempli et tarifs affichés sur chaque money page.
//
// Les prix viennent de la grille admin (pricing_segments), jamais d'un texte en
// dur : les anciens « À partir de … » de seo-money-pages.ts avaient divergé de
// la grille (AIBD → Saly affiché 35 000 pour un tarif réel de 25 000). Une page
// sans segment correspondant affiche « sur devis ». Créer le segment en admin
// suffit à y faire apparaître le prix.
import type { SelectPricingSegment } from '@/schema';
import type { RouteNodeKey } from '@/lib/route-nodes';

type PriceScope =
  | { kind: 'pair'; a: RouteNodeKey; b: RouteNodeKey }
  | { kind: 'touches'; node: RouteNodeKey }
  | { kind: 'routeLabel'; includes: string };

export interface MoneyPageBooking {
  /** Identifiant de src/lib/services.ts, lu par /reservation?service= */
  service: string;
  /** Noms reconnus par getRouteNodeFromName ; le formulaire les ramène au libellé de sa liste. */
  pickup?: string;
  destination?: string;
  prices: PriceScope | null;
}

const NODE_PARAM: Record<RouteNodeKey, string> = {
  DAKAR: 'DAKAR',
  AIBD: 'AIBD',
  MBOUR: 'MBOUR',
  SALY: 'SALY',
  NGAPAROU: 'NGAPAROU',
  THIES: 'THIES',
  NIANING: 'NIANING',
  POINTE_SARRENE: 'POINTE SARRENE',
  SOMONE: 'SOMONE',
  SAINT_LOUIS: 'SAINT LOUIS',
};

const fromAibd = (node: RouteNodeKey): MoneyPageBooking => ({
  service: 'transfert-aibd-dakar',
  pickup: NODE_PARAM.AIBD,
  destination: NODE_PARAM[node],
  prices: { kind: 'pair', a: 'AIBD', b: node },
});

const toAibd = (node: RouteNodeKey): MoneyPageBooking => ({
  service: 'transfert-aibd-dakar',
  pickup: NODE_PARAM[node],
  destination: NODE_PARAM.AIBD,
  prices: { kind: 'pair', a: node, b: 'AIBD' },
});

export const MONEY_PAGE_BOOKING: Record<string, MoneyPageBooking> = {
  // Services
  'transfert-aeroport-aibd': { service: 'transfert-aibd-dakar', pickup: 'AIBD', destination: 'DAKAR', prices: { kind: 'touches', node: 'AIBD' } },
  'transfert-hotel-aibd': { service: 'transfert-aibd-dakar', pickup: 'AIBD', prices: { kind: 'touches', node: 'AIBD' } },
  'transfert-famille-dakar': { service: 'transfert-aibd-dakar', pickup: 'AIBD', destination: 'DAKAR', prices: { kind: 'touches', node: 'AIBD' } },
  'chauffeur-prive-dakar': { service: 'chauffeur-prive-dakar', pickup: 'DAKAR', prices: null },
  'chauffeur-affaires-dakar': { service: 'chauffeur-prive-dakar', pickup: 'DAKAR', prices: null },
  'mise-a-disposition-chauffeur': { service: 'mise-a-disposition', pickup: 'DAKAR', prices: { kind: 'routeLabel', includes: 'disposition' } },
  'navette-evenementielle': { service: 'autres', prices: null },
  // Trajets
  'aibd-dakar': fromAibd('DAKAR'),
  'dakar-aibd': { service: 'transfert-aibd-dakar', pickup: 'DAKAR', destination: 'AIBD', prices: { kind: 'pair', a: 'DAKAR', b: 'AIBD' } },
  'aibd-saly': fromAibd('SALY'),
  'aibd-somone': fromAibd('SOMONE'),
  'aibd-mbour': fromAibd('MBOUR'),
  'aibd-thies': fromAibd('THIES'),
  'aibd-saint-louis': fromAibd('SAINT_LOUIS'),
  'aibd-ngaparou': fromAibd('NGAPAROU'),
  'aibd-nianing': fromAibd('NIANING'),
  // Départs vers l'aéroport
  'saly-aibd': toAibd('SALY'),
  'mbour-aibd': toAibd('MBOUR'),
  'somone-aibd': toAibd('SOMONE'),
};

/** URL de réservation pré-remplie pour une money page (sans préfixe de langue). */
export function moneyPageBookingHref(slug: string): string {
  const booking = MONEY_PAGE_BOOKING[slug];
  if (!booking) return '/reservation';
  const params = new URLSearchParams({ service: booking.service });
  if (booking.pickup) params.set('pickup', booking.pickup);
  if (booking.destination) params.set('destination', booking.destination);
  return `/reservation?${params.toString()}`;
}

export interface MoneyPagePriceRow {
  id: number;
  route: string;
  berline: number;
  suv: number;
}

/** Lignes de la grille qui s'appliquent à la page, de la moins chère à la plus chère. */
export function moneyPagePriceRows(slug: string, segments: SelectPricingSegment[]): MoneyPagePriceRow[] {
  const scope = MONEY_PAGE_BOOKING[slug]?.prices;
  if (!scope) return [];
  return segments
    .filter((s) => {
      if (!s.isActive) return false;
      if (scope.kind === 'routeLabel') return s.route.toLowerCase().includes(scope.includes);
      if (scope.kind === 'touches') return s.departNode === scope.node || s.arriveeNode === scope.node;
      return (
        (s.departNode === scope.a && s.arriveeNode === scope.b) ||
        (s.departNode === scope.b && s.arriveeNode === scope.a)
      );
    })
    .map((s) => {
      // Les tarifs valent dans les deux sens : sur une page départ (Saly -> AIBD),
      // le libellé « AIBD → Saly Portudal » de la grille est affiché à l'endroit.
      const reversed = scope.kind === 'pair' && s.departNode === scope.b && s.arriveeNode === scope.a;
      const route = reversed && s.route.includes('→')
        ? s.route.split('→').map((part) => part.trim()).reverse().join(' → ')
        : s.route;
      return { id: s.id, route, berline: s.berline, suv: s.suv };
    })
    .sort((x, y) => x.berline - y.berline);
}
