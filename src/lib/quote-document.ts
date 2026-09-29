/**
 * Composition des donnees du devis officiel a partir de la base.
 *
 * Source de verite des lignes : la table `quote_trips`. Les devis anterieurs a
 * cette table n'ont aucune ligne enfant : on retombe alors sur la relecture du
 * message, exactement comme le fait deja l'acceptation d'un devis
 * (src/app/api/quotes/client/actions/route.ts).
 *
 * C'est aussi ce module qui attribue la reference et la date d'emission, une
 * seule fois : une fois la piece produite, son numero et sa date ne bougent
 * plus, y compris si l'email est rejoue par la file de notifications.
 */

import { db } from '@/db';
import { quotesTable, type InvoiceLineItem, type SelectQuote } from '@/schema';
import { eq } from 'drizzle-orm';
import { generateQuoteReference } from './document-numbering';
import { DEFAULT_TAX_RATE, ROUTE_ARROW, formatDocumentDateTime } from './pdf/brand';
import type { QuoteDocumentData } from './pdf/quote-pdf';
import { getQuoteTrips, sumTripPrices, type QuoteTrip } from './quote-trips';
import { getQuoteServiceLabel, parseQuoteMessage } from './quote-services';

/** Objet par defaut du document, modifiable par l'admin. */
export const DEFAULT_QUOTE_OBJECT = 'Transferts chauffeur privé';

/** Duree de validite par defaut d'un devis, en jours. */
export const QUOTE_VALIDITY_DAYS = 30;

export function computeValidUntil(from: Date = new Date(), days = QUOTE_VALIDITY_DAYS): Date {
  const validUntil = new Date(from);
  validUntil.setDate(validUntil.getDate() + days);
  return validUntil;
}

/** Libelle d'une ligne : "12/10/2026 · 14h30 — Dakar → AIBD". */
function tripDescription(trip: QuoteTrip): string {
  const when = formatDocumentDateTime(trip.scheduledDateTime);
  const route = `${trip.departure} ${ROUTE_ARROW} ${trip.destination}`;
  return when ? `${when} — ${route}` : route;
}

/** Sous-titre : "Transfert aéroport · 2 passagers · 3 bagages". */
function tripDetails(trip: QuoteTrip): string {
  const parts = [getQuoteServiceLabel(trip.service)];
  parts.push(`${trip.passengers} passager${trip.passengers > 1 ? 's' : ''}`);
  if (trip.luggage > 0) parts.push(`${trip.luggage} bagage${trip.luggage > 1 ? 's' : ''}`);
  if (trip.note) parts.push(trip.note);
  return parts.join(' · ');
}

/**
 * Lignes de prestation du devis. Le prix d'une ligne non chiffree vaut 0 : le
 * document reste lisible, et l'admin voit immediatement ce qui manque.
 */
export function buildQuoteItems(quote: SelectQuote, trips: QuoteTrip[]): InvoiceLineItem[] {
  if (trips.length > 0) {
    return trips.map((trip) => {
      const price = trip.estimatedPrice ? parseFloat(trip.estimatedPrice) : 0;
      return {
        description: tripDescription(trip),
        details: tripDetails(trip),
        quantity: 1,
        price,
        total: price,
      };
    });
  }

  // Devis legacy : une seule course, relue depuis le message.
  const parsed = parseQuoteMessage(quote.message);
  const price = quote.estimatedPrice ? parseFloat(quote.estimatedPrice) : 0;
  const route =
    parsed.departure && parsed.destination
      ? `${parsed.departure} ${ROUTE_ARROW} ${parsed.destination}`
      : getQuoteServiceLabel(quote.service);

  return [
    {
      description: route,
      details: getQuoteServiceLabel(quote.service),
      quantity: 1,
      price,
      total: price,
    },
  ];
}

/**
 * Repartit le montant global force par l'admin (remise, forfait sejour) sur les
 * lignes : l'ecart est absorbe par la derniere, pour que la somme de la colonne
 * TOTAL egale toujours le sous-total affiche.
 */
function reconcileItems(items: InvoiceLineItem[], target: number): InvoiceLineItem[] {
  const sum = items.reduce((acc, item) => acc + item.total, 0);
  const gap = target - sum;
  if (items.length === 0 || Math.abs(gap) < 0.5) return items;

  const adjusted = [...items];
  const last = adjusted[adjusted.length - 1];
  const total = last.total + gap;
  adjusted[adjusted.length - 1] = { ...last, price: total, total };
  return adjusted;
}

export function computeTotals(subtotal: number, taxRate = DEFAULT_TAX_RATE) {
  const taxAmount = (subtotal * taxRate) / 100;
  return { subtotal, taxRate, taxAmount, total: subtotal + taxAmount };
}

/**
 * Charge un devis et compose les donnees du PDF. Attribue la reference, la date
 * d'emission et la date de validite a la premiere generation, puis les reutilise.
 */
export async function buildQuoteDocumentData(quoteId: number): Promise<QuoteDocumentData | null> {
  const [quote] = await db.select().from(quotesTable).where(eq(quotesTable.id, quoteId)).limit(1);
  if (!quote) return null;

  const trips = await getQuoteTrips(quote.id);

  let reference = quote.reference;
  let issuedAt = quote.issuedAt;
  let validUntil = quote.validUntil;

  if (!reference || !issuedAt) {
    const now = new Date();
    reference = reference ?? (await generateQuoteReference());
    issuedAt = issuedAt ?? now;
    validUntil = validUntil ?? computeValidUntil(issuedAt);

    await db
      .update(quotesTable)
      .set({ reference, issuedAt, validUntil, updatedAt: new Date() })
      .where(eq(quotesTable.id, quote.id));
  }

  const items = buildQuoteItems(quote, trips);

  // Le montant global saisi par l'admin prime sur la somme des lignes : c'est
  // lui qui a ete annonce au client et qui sera facture.
  const tripsTotal = sumTripPrices(trips);
  const globalPrice = quote.estimatedPrice ? parseFloat(quote.estimatedPrice) : null;
  const subtotal = globalPrice ?? (tripsTotal ? parseFloat(tripsTotal) : 0);

  return {
    reference,
    status: quote.status,
    issueDate: issuedAt,
    validUntil: validUntil ?? computeValidUntil(issuedAt),
    object: quote.documentObject || DEFAULT_QUOTE_OBJECT,
    customer: {
      name: quote.customerName,
      address: quote.customerAddress,
      phone: quote.customerPhone,
      email: quote.customerEmail,
      ninea: quote.customerNinea,
    },
    items: reconcileItems(items, subtotal),
    ...computeTotals(subtotal),
  };
}
