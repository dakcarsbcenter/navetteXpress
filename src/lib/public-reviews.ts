// Avis clients publiés sur les pages publiques : uniquement les avis laissés
// par de vrais clients après une course (table reviews, liée à une réservation),
// rendus publics ET approuvés en admin. Aucun avis n'est saisi à la main ni
// recopié : les faux témoignages ont été retirés du site (voir mémoire projet).
// Ne jamais importer depuis un composant client.
import { unstable_cache, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { reviewsTable, users } from '@/schema';
import { and, desc, eq, isNotNull } from 'drizzle-orm';

export const PUBLIC_REVIEWS_TAG = 'public-reviews';

export type PublicReview = {
    id: number;
    rating: number;
    comment: string;
    /** Prénom + initiale du nom (« Aminata D. ») : jamais le nom complet ni l'email. */
    author: string;
    createdAt: string;
};

const shortName = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    const first = parts[0];
    const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1].charAt(0).toUpperCase()}.` : '';
    return `${first}${lastInitial}`;
};

async function getPublishedReviews(): Promise<PublicReview[]> {
    const rows = await db
        .select({
            id: reviewsTable.id,
            rating: reviewsTable.rating,
            comment: reviewsTable.comment,
            createdAt: reviewsTable.createdAt,
            customerName: users.name,
        })
        .from(reviewsTable)
        .innerJoin(users, eq(reviewsTable.customerId, users.id))
        .where(and(eq(reviewsTable.isPublic, true), eq(reviewsTable.isApproved, true), isNotNull(reviewsTable.comment)))
        .orderBy(desc(reviewsTable.createdAt))
        .limit(6);

    return rows
        .filter((row) => row.comment && row.comment.trim().length > 0)
        .map((row) => ({
            id: row.id,
            rating: row.rating,
            comment: row.comment!.trim(),
            author: shortName(row.customerName),
            createdAt: row.createdAt.toISOString(),
        }));
}

const getCachedReviews = unstable_cache(getPublishedReviews, ['public-published-reviews'], {
    revalidate: 300,
    tags: [PUBLIC_REVIEWS_TAG],
});

export async function getPublishedReviewsSafe(): Promise<PublicReview[]> {
    try {
        return await getCachedReviews();
    } catch (error) {
        console.error('Erreur lecture reviews (rendu public):', error);
        return [];
    }
}

/** À appeler par toute route qui crée, modère, publie ou supprime un avis. */
export function revalidatePublicReviews() {
    revalidateTag(PUBLIC_REVIEWS_TAG, 'max');
}
