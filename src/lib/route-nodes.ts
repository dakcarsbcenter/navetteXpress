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

// Alias de noms de lieux (tels que saisis en admin ou choisis par le client) reconnus
// pour chaque noeud canonique. Utilisé pour faire correspondre un lieu choisi dans un
// formulaire (réservation, demande de devis) à un segment de tarif admin.
export const ROUTE_NODE_ALIASES: Record<RouteNodeKey, readonly string[]> = {
    DAKAR: ['DAKAR'],
    AIBD: ['AIBD', 'AEROPORT AIBD', 'AEROPORT INTERNATIONAL BLAISE DIAGNE'],
    MBOUR: ['MBOUR'],
    SALY: ['SALY', 'SALLY', 'SALY PORTUDAL', 'SALLY PORTUDAL'],
    NGAPAROU: ['NGAPAROU'],
    THIES: ['THIES', 'THIÈS'],
    NIANING: ['NIANING'],
    POINTE_SARRENE: ['POINTE SARRENE', 'POINTE SARENE', 'POINTE SARENNE'],
    SOMONE: ['SOMONE'],
};

export const normalizeLocationName = (value: string): string =>
    value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Za-z0-9 ]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

// Fait correspondre un nom de lieu libre (ex: "AEROPORT AIBD") à son noeud canonique
// (ex: "AIBD"), en s'appuyant sur ROUTE_NODE_ALIASES. Retourne null si aucun noeud ne
// couvre ce lieu (auquel cas aucun tarif fixe ne peut s'appliquer).
export function getRouteNodeFromName(name: string): RouteNodeKey | null {
    const normalized = normalizeLocationName(name);
    const entries = Object.entries(ROUTE_NODE_ALIASES) as [RouteNodeKey, readonly string[]][];
    for (const [node, aliases] of entries) {
        if (aliases.some((alias) => normalizeLocationName(alias) === normalized)) {
            return node;
        }
    }
    return null;
}
