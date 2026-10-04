// Constantes partagées de la candidature chauffeur (/devenir-partenaire).
//
// Campagne de recrutement 2026 : 12 places réparties sur 3 groupes de corridors.
// Un candidat peut viser plusieurs groupes à la fois, d'où un booléen par groupe
// sur la table `users` (corridor_a / corridor_b / corridor_c) plutôt qu'une chaîne
// concaténée : le comptage de quota côté admin doit rester un COUNT SQL.
//
// Ce module est volontairement pur (aucun accès base, aucun import React) pour être
// partagé entre le formulaire client, la route d'API et le back-office.

export const CORRIDOR_KEYS = ['a', 'b', 'c'] as const;
export type CorridorKey = typeof CORRIDOR_KEYS[number];

/** Nombre de places ouvertes par groupe de corridors (total = 12). */
export const CORRIDOR_QUOTAS: Record<CorridorKey, number> = {
    a: 4,
    b: 3,
    c: 5,
};

/** Colonne `users` correspondant à chaque groupe, pour l'affichage back-office. */
export const CORRIDOR_DB_FIELDS: Record<CorridorKey, 'corridorA' | 'corridorB' | 'corridorC'> = {
    a: 'corridorA',
    b: 'corridorB',
    c: 'corridorC',
};

/** Libellés courts non traduits, réservés au back-office et aux emails internes. */
export const CORRIDOR_SHORT_LABELS: Record<CorridorKey, string> = {
    a: 'A — Dakar ↔ AIBD / Petite Côte',
    b: 'B — Dakar ↔ Saint-Louis',
    c: 'C — AIBD ↔ Petite Côte',
};

/** Jours déclarés à la candidature. Stockés tels quels dans `declared_availability`. */
export const DECLARED_AVAILABILITY_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export type DeclaredAvailabilityDay = typeof DECLARED_AVAILABILITY_DAYS[number];

/** Âge maximum du véhicule (en années) au-delà duquel la candidature est signalée. */
export const MAX_VEHICLE_AGE_YEARS = 8;

/** Première année de mise en circulation acceptée par le formulaire. */
export const MIN_VEHICLE_YEAR = 1980;

export function isCorridorKey(value: unknown): value is CorridorKey {
    return typeof value === 'string' && (CORRIDOR_KEYS as readonly string[]).includes(value);
}

export function isDeclaredAvailabilityDay(value: unknown): value is DeclaredAvailabilityDay {
    return (
        typeof value === 'string' && (DECLARED_AVAILABILITY_DAYS as readonly string[]).includes(value)
    );
}

/**
 * Véhicule hors critère (plus de 8 ans). La candidature n'est pas refusée pour autant :
 * la page promet de recontacter ces candidats si leur situation change — elle est
 * seulement signalée à l'admin.
 */
export function isVehicleOutsideCriteria(vehicleYear: number, now: Date = new Date()): boolean {
    return now.getFullYear() - vehicleYear > MAX_VEHICLE_AGE_YEARS;
}

/** Année de véhicule plausible : un entier entre 1980 et l'année prochaine (modèles neufs). */
export function isPlausibleVehicleYear(value: unknown): value is number {
    return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= MIN_VEHICLE_YEAR &&
        value <= new Date().getFullYear() + 1
    );
}
