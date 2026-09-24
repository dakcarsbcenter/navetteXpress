// Résolution du tarif d'un trajet à partir des segments de tarifs paramétrés en admin
// (pricingSegmentsTable / page /tarifs).
//
// Cette logique vivait uniquement dans le navigateur (ReservationClient.tsx), ce qui
// empêchait le back-office de reproposer un prix quand l'admin corrige le trajet d'une
// réservation. Elle est ici volontairement *pure* (aucun accès base, aucun import React)
// pour être partagée entre le formulaire client et les routes serveur.

import { type RouteNodeKey, getRouteNodeFromName } from '@/lib/route-nodes';

export type VehicleTypeKey = 'berline' | 'suv';

/**
 * Forme minimale d'un segment de tarif exploitée par ce module. Volontairement plus
 * étroite que SelectPricingSegment pour accepter aussi bien une ligne de base qu'un
 * segment sérialisé par /api/pricing-segments.
 */
export interface PricingSegmentLike {
  id: number;
  route: string;
  berline: number;
  suv: number;
  departNode: RouteNodeKey | string | null;
  arriveeNode: RouteNodeKey | string | null;
  isActive: boolean;
}

/** Valeur sentinelle du select "Autre lieu" des formulaires : aucun tarif fixe ne s'applique. */
export const OTHER_LOCATION_VALUE = 'AUTRE';

/**
 * Couples de noeuds pour lesquels un trajet est commercialisé. Sert à filtrer les
 * combinaisons proposées dans les formulaires — un couple absent d'ici n'a pas de
 * tarif publié sur /tarifs.
 */
export const ROUTES_ALLOWED_PAIRS = new Set<string>([
  'DAKAR|AIBD',
  'AIBD|DAKAR',
  'DAKAR|MBOUR',
  'MBOUR|DAKAR',
  'DAKAR|SALY',
  'SALY|DAKAR',
  'DAKAR|NGAPAROU',
  'NGAPAROU|DAKAR',
  'DAKAR|THIES',
  'THIES|DAKAR',
  'DAKAR|NIANING',
  'NIANING|DAKAR',
  'DAKAR|POINTE_SARRENE',
  'POINTE_SARRENE|DAKAR',
  'DAKAR|SOMONE',
  'SOMONE|DAKAR',
  // Trajets Petite Côte depuis/vers AIBD (tarifs publiés sur /tarifs)
  'AIBD|MBOUR',
  'MBOUR|AIBD',
  'AIBD|SALY',
  'SALY|AIBD',
  'AIBD|SOMONE',
  'SOMONE|AIBD',
]);

export function isRouteCombinationAllowed(pickup: string, destination: string): boolean {
  if (pickup === OTHER_LOCATION_VALUE || destination === OTHER_LOCATION_VALUE) {
    return true;
  }
  const pickupNode = getRouteNodeFromName(pickup);
  const destinationNode = getRouteNodeFromName(destination);
  if (!pickupNode || !destinationNode) {
    return false;
  }
  if (pickupNode === destinationNode) {
    return true;
  }
  return ROUTES_ALLOWED_PAIRS.has(`${pickupNode}|${destinationNode}`);
}

/**
 * Segments actifs dont le couple depart/arrivée correspond au trajet demandé, dans un
 * sens ou dans l'autre (les tarifs sont bidirectionnels). "Autre" (adresse libre) ou une
 * combinaison sans tarif paramétré ne matche rien : l'admin renseignera le prix à la main.
 */
export function matchPricingSegments<T extends PricingSegmentLike>(
  segments: readonly T[],
  pickupAddress: string | null | undefined,
  dropoffAddress: string | null | undefined,
): T[] {
  if (
    !pickupAddress ||
    !dropoffAddress ||
    pickupAddress === OTHER_LOCATION_VALUE ||
    dropoffAddress === OTHER_LOCATION_VALUE
  ) {
    return [];
  }

  const pickupNode = getRouteNodeFromName(pickupAddress);
  const dropoffNode = getRouteNodeFromName(dropoffAddress);
  if (!pickupNode || !dropoffNode) {
    return [];
  }

  return segments.filter((seg) => {
    if (!seg.isActive || !seg.departNode || !seg.arriveeNode) return false;
    return (
      (seg.departNode === pickupNode && seg.arriveeNode === dropoffNode) ||
      (seg.departNode === dropoffNode && seg.arriveeNode === pickupNode)
    );
  });
}

export interface ZoneOption<T extends PricingSegmentLike = PricingSegmentLike> {
  segment: T;
  label: string;
}

/**
 * Certains couples départ/arrivée (ex: DAKAR<->AIBD) ont plusieurs tarifs actifs, un par
 * secteur ("Dakar Plateau", "Almadies / Ngor"...). On dérive le nom du secteur depuis le
 * libellé `route` de chaque segment (format "A → B") en retenant l'extrémité qui varie
 * d'un segment à l'autre, pour proposer un choix précis plutôt qu'une fourchette de prix.
 */
export function deriveZoneOptions<T extends PricingSegmentLike>(
  matchedSegments: readonly T[],
  pickupAddress: string | null | undefined,
  dropoffAddress: string | null | undefined,
): ZoneOption<T>[] {
  if (matchedSegments.length <= 1) return [];

  const pickupNode = pickupAddress ? getRouteNodeFromName(pickupAddress) : null;
  const dropoffNode = dropoffAddress ? getRouteNodeFromName(dropoffAddress) : null;

  const legs = matchedSegments.map((seg) => {
    const [legA, legB] = seg.route.split('→').map((s) => s.trim());
    const forward = seg.departNode === pickupNode && seg.arriveeNode === dropoffNode;
    return { segment: seg, pickupLeg: forward ? legA : legB, dropoffLeg: forward ? legB : legA };
  });

  const pickupLegsDiffer = new Set(legs.map((l) => l.pickupLeg)).size > 1;
  return legs.map((l) => ({ segment: l.segment, label: pickupLegsDiffer ? l.pickupLeg : l.dropoffLeg }));
}

/** Prix d'un segment pour le type de véhicule demandé. */
export function segmentPrice(segment: PricingSegmentLike, vehicleType: VehicleTypeKey): number {
  return vehicleType === 'suv' ? segment.suv : segment.berline;
}

export interface ResolvedPrice<T extends PricingSegmentLike = PricingSegmentLike> {
  /** Tarif retenu, ou null si aucun segment ne couvre ce trajet (prix "sur devis"). */
  price: number | null;
  /** Segment retenu pour ce tarif. */
  segment: T | null;
  /** Secteurs alternatifs quand plusieurs segments couvrent le même couple de noeuds. */
  alternatives: (ZoneOption<T> & { price: number })[];
}

/**
 * Tarif à proposer pour un trajet. Quand plusieurs secteurs matchent, `segmentId` permet
 * d'en désigner un ; à défaut le premier est retenu et les autres sont listés dans
 * `alternatives` pour laisser le choix à l'appelant.
 */
export function resolvePrice<T extends PricingSegmentLike>(
  segments: readonly T[],
  pickupAddress: string | null | undefined,
  dropoffAddress: string | null | undefined,
  vehicleType: VehicleTypeKey,
  segmentId?: number | null,
): ResolvedPrice<T> {
  const matched = matchPricingSegments(segments, pickupAddress, dropoffAddress);
  if (matched.length === 0) {
    return { price: null, segment: null, alternatives: [] };
  }

  const zones = deriveZoneOptions(matched, pickupAddress, dropoffAddress);
  const segment =
    matched.length === 1
      ? matched[0]
      : (zones.find((z) => z.segment.id === segmentId)?.segment ?? matched[0]);

  return {
    price: segmentPrice(segment, vehicleType),
    segment,
    alternatives: zones.map((z) => ({ ...z, price: segmentPrice(z.segment, vehicleType) })),
  };
}
