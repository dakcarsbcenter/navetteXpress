// Lecture serveur des tarifs publics gérés en admin (/admin/dashboard?tab=pricing).
// Partagé entre la route API publique /api/pricing-segments et les pages rendues
// côté serveur qui doivent afficher les mêmes prix (accueil : cartes de segments
// et FAQ/JSON-LD). Ne jamais importer depuis un composant client.
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { pricingSegmentsTable, type SelectPricingSegment } from '@/schema';
import { eq, asc } from 'drizzle-orm';
import type { RouteNodeKey } from '@/lib/route-nodes';

// Tag d'invalidation : les routes admin qui modifient un segment appellent
// revalidateTag(PRICING_SEGMENTS_TAG) pour que les pages publiques reprennent
// les nouveaux prix immediatement.
export const PRICING_SEGMENTS_TAG = 'pricing-segments';

// Segments actifs, dans l'ordre defini par l'admin (fleches de reordonnancement).
export async function getActivePricingSegments(): Promise<SelectPricingSegment[]> {
    return db
        .select()
        .from(pricingSegmentsTable)
        .where(eq(pricingSegmentsTable.isActive, true))
        .orderBy(asc(pricingSegmentsTable.sortOrder), asc(pricingSegmentsTable.id));
}

// Les pages publiques du dossier [locale] sont rendues a la demande : sans ce
// cache, chaque visite de l'accueil declencherait une requete sur la base. Le
// delai n'est qu'un filet de securite, l'invalidation reelle vient du tag.
const getCachedPricingSegments = unstable_cache(
    getActivePricingSegments,
    ['active-pricing-segments'],
    { revalidate: 300, tags: [PRICING_SEGMENTS_TAG] },
);

// Variante tolerante pour le rendu des pages publiques : une base injoignable ne
// doit pas faire tomber la page, l'appelant retombe sur ses valeurs de repli.
export async function getActivePricingSegmentsSafe(): Promise<SelectPricingSegment[]> {
    try {
        return await getCachedPricingSegments();
    } catch (error) {
        console.error('Erreur lecture pricing_segments (rendu public):', error);
        return [];
    }
}

/**
 * Prix d'appel entre deux points canoniques, dans un sens ou dans l'autre.
 * Plusieurs segments peuvent relier le meme couple (ex. Dakar Plateau -> AIBD et
 * Almadies / Ngor -> AIBD) : on retient le moins cher, qui est celui annonce
 * "a partir de" dans la FAQ.
 */
export function cheapestBetweenNodes(
    segments: SelectPricingSegment[],
    a: RouteNodeKey,
    b: RouteNodeKey,
): { berline: number; suv: number } | null {
    const matching = segments.filter(
        (s) =>
            (s.departNode === a && s.arriveeNode === b) ||
            (s.departNode === b && s.arriveeNode === a),
    );
    if (matching.length === 0) return null;

    return {
        berline: Math.min(...matching.map((s) => s.berline)),
        suv: Math.min(...matching.map((s) => s.suv)),
    };
}
