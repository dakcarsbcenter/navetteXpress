// Points de départ/arrivée canoniques partagés entre le formulaire de réservation
// (ReservationClient.tsx, validation des trajets autorisés) et l'admin des tarifs
// (PricingSegmentsManagement.tsx). Un segment de tarif dont departNode/arriveeNode
// correspond au couple choisi par le client permet l'auto-affichage du prix.

export const ROUTE_NODE_KEYS = [
    'DAKAR',
    'AIBD',
    'MBOUR',
    'SALY',
    'NGAPAROU',
    'THIES',
    'NIANING',
    'POINTE_SARRENE',
    'SOMONE',
] as const;

export type RouteNodeKey = typeof ROUTE_NODE_KEYS[number];

export const ROUTE_NODE_LABELS: Record<RouteNodeKey, string> = {
    DAKAR: 'Dakar',
    AIBD: 'AIBD (aéroport)',
    MBOUR: 'Mbour',
    SALY: 'Saly Portudal',
    NGAPAROU: 'Ngaparou',
    THIES: 'Thiès',
    NIANING: 'Nianing',
    POINTE_SARRENE: 'Pointe Sarrène',
    SOMONE: 'Somone',
};

export function isRouteNodeKey(value: unknown): value is RouteNodeKey {
    return typeof value === 'string' && (ROUTE_NODE_KEYS as readonly string[]).includes(value);
}
