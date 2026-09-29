/**
 * Lecture et écriture des lignes de trajet d'un devis (`quote_trips`).
 *
 * Un devis peut décrire plusieurs trajets (un séjour complet : aéroport →
 * ville → excursion → aéroport). La table est la source de vérité ;
 * `quotes.message` n'en est que la trace lisible, composée par
 * buildMultiTripQuoteMessage. Les devis créés avant cette évolution n'ont
 * aucune ligne : tous les appelants doivent tolérer un tableau vide.
 */

import { db } from '@/db';
import { quoteTripsTable, type SelectQuoteTrip } from '@/schema';
import { inArray, asc } from 'drizzle-orm';

export type QuoteTrip = SelectQuoteTrip;

/** Trajets d'un seul devis, ordonnés. */
export async function getQuoteTrips(quoteId: number): Promise<QuoteTrip[]> {
  return db
    .select()
    .from(quoteTripsTable)
    .where(inArray(quoteTripsTable.quoteId, [quoteId]))
    .orderBy(asc(quoteTripsTable.position));
}

/**
 * Attache `trips` à une liste de devis en une seule requête.
 * Évite le N+1 sur les vues admin et client, qui affichent des dizaines de devis.
 */
export async function attachTripsToQuotes<T extends { id: number }>(
  quotes: T[],
): Promise<(T & { trips: QuoteTrip[] })[]> {
  if (quotes.length === 0) return [];

  const rows = await db
    .select()
    .from(quoteTripsTable)
    .where(inArray(quoteTripsTable.quoteId, quotes.map((q) => q.id)))
    .orderBy(asc(quoteTripsTable.quoteId), asc(quoteTripsTable.position));

  const byQuote = new Map<number, QuoteTrip[]>();
  for (const row of rows) {
    const list = byQuote.get(row.quoteId);
    if (list) list.push(row);
    else byQuote.set(row.quoteId, [row]);
  }

  return quotes.map((quote) => ({ ...quote, trips: byQuote.get(quote.id) ?? [] }));
}

/** Somme des prix saisis par l'admin ligne par ligne. `null` si aucune ligne n'est chiffrée. */
export function sumTripPrices(trips: Pick<QuoteTrip, 'estimatedPrice'>[]): string | null {
  const priced = trips.filter((t) => t.estimatedPrice !== null && t.estimatedPrice !== '');
  if (priced.length === 0) return null;
  const total = priced.reduce((sum, t) => sum + parseFloat(t.estimatedPrice as string), 0);
  if (Number.isNaN(total)) return null;
  return total.toFixed(2);
}
