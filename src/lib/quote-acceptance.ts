/**
 * Effets d'un devis accepte : facture officielle et reservations confirmees.
 *
 * Ces deux blocs vivaient dans POST /api/quotes/client/actions, donc seule
 * l'acceptation par le client depuis son espace les declenchait. Un accord
 * conclu au telephone ne produisait ni facture ni course pour les chauffeurs.
 * Ils sont ici pour etre appeles aussi bien par cette route que par le
 * back-office (POST /api/quotes/[id]/invoice, acceptation par l'admin).
 */

import { db } from '@/db';
import {
  bookingsTable,
  invoicesTable,
  quoteTripsTable,
  type SelectInvoice,
  type SelectQuote,
} from '@/schema';
import { eq } from 'drizzle-orm';
import { calculateDueDate, calculateInvoiceAmounts, generateInvoiceNumber } from './invoice-utils';
import { sendWithRetry } from './notification-queue';
import { buildQuoteDocumentData, quoteTaxRate } from './quote-document';
import { getQuoteTrips } from './quote-trips';
import { parseQuoteMessage } from './quote-services';

/** Delai de paiement par defaut, en jours. */
export const INVOICE_DUE_DAYS = 30;

export type BookingSummary = {
  id: number;
  status: string;
  scheduledDateTime: Date;
  pickupAddress: string;
  dropoffAddress: string;
};

/** Facture deja emise pour ce devis, s'il y en a une. */
export async function findInvoiceForQuote(quoteId: number): Promise<SelectInvoice | null> {
  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.quoteId, quoteId))
    .limit(1);
  return invoice ?? null;
}

/**
 * Emet la facture d'un devis accepte et notifie le client.
 *
 * Le taux de TVA vient du devis sauf si l'admin en impose un autre a
 * l'emission. Les lignes sont figees dans `invoices.items` : la facture ne doit
 * pas suivre les modifications ulterieures du devis dont elle decoule.
 */
export async function createInvoiceForQuote(
  quote: SelectQuote,
  options: { taxRate?: number; dueDate?: Date; notes?: string | null } = {},
): Promise<SelectInvoice> {
  if (!quote.estimatedPrice) {
    throw new Error('Le devis doit avoir un prix estimé pour générer une facture');
  }

  const invoiceNumber = await generateInvoiceNumber();
  const taxRate = options.taxRate ?? quoteTaxRate(quote);
  const amounts = calculateInvoiceAmounts(parseFloat(quote.estimatedPrice), taxRate);

  // Attribue au besoin la reference du devis : une facture doit pouvoir citer
  // la piece dont elle decoule, meme si le PDF du devis n'a jamais ete ouvert.
  const quoteDocument = await buildQuoteDocumentData(quote.id);

  const issueDate = new Date();
  const dueDate = options.dueDate ?? calculateDueDate(issueDate, INVOICE_DUE_DAYS);

  const [newInvoice] = await db
    .insert(invoicesTable)
    .values({
      invoiceNumber,
      quoteId: quote.id,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone,
      service: quote.service,
      amount: amounts.amount,
      taxRate: amounts.taxRate,
      taxAmount: amounts.taxAmount,
      totalAmount: amounts.totalAmount,
      status: 'pending',
      issueDate,
      dueDate,
      notes: options.notes ?? null,
      quoteReference: quoteDocument?.reference ?? null,
      documentObject: quoteDocument?.object ?? null,
      customerAddress: quote.customerAddress,
      customerNinea: quote.customerNinea,
      items: quoteDocument?.items ?? null,
    })
    .returning();

  console.log(`✅ Facture ${invoiceNumber} créée pour le devis #${quote.id} (TVA ${amounts.taxRate} %)`);

  // Sans adresse (devis saisi au telephone), il n'y a rien a envoyer : la
  // facture reste telechargeable depuis le back-office.
  if (newInvoice.customerEmail) {
    await sendWithRetry('email', 'resend-mailer.sendInvoiceEmail', [
      newInvoice.customerEmail,
      {
        invoiceNumber: newInvoice.invoiceNumber,
        customerName: newInvoice.customerName,
        service: newInvoice.service,
        amountHT: `${parseFloat(newInvoice.amount).toLocaleString('fr-FR')} FCFA`,
        vatAmount: `${parseFloat(newInvoice.taxAmount).toLocaleString('fr-FR')} FCFA`,
        amountTTC: `${parseFloat(newInvoice.totalAmount).toLocaleString('fr-FR')} FCFA`,
        issueDate: new Date(newInvoice.issueDate).toLocaleDateString('fr-FR'),
        dueDate: new Date(newInvoice.dueDate).toLocaleDateString('fr-FR'),
        invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/client/factures/${newInvoice.id}`,
        // Le PDF n'est jamais serialise dans la file : il est regenere a l'envoi.
        invoiceDbId: newInvoice.id,
      },
    ]);
  }

  return newInvoice;
}

/**
 * Cree une reservation confirmee par trajet du devis et rattache chaque course
 * a sa ligne (`quote_trips.bookingId`), ce qui rend le trajet non supprimable.
 */
export async function createBookingsForQuote(
  quote: SelectQuote,
  options: { clientMessage?: string | null } = {},
): Promise<BookingSummary[]> {
  const trips = await getQuoteTrips(quote.id);

  // Date de repli quand le client n'a pas fixe d'heure de prise en charge.
  const fallbackDateTime = quote.preferredDate
    ? new Date(quote.preferredDate)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Devis anterieurs a la table quote_trips : on relit le message comme avant,
  // ce qui donne une seule course.
  const legs = trips.length > 0
    ? trips.map((trip) => ({
        tripId: trip.id as number | null,
        position: trip.position,
        pickupAddress: trip.departure,
        dropoffAddress: trip.destination,
        scheduledDateTime: trip.scheduledDateTime ? new Date(trip.scheduledDateTime) : fallbackDateTime,
        passengers: trip.passengers,
        luggage: trip.luggage,
        price: trip.estimatedPrice,
        note: trip.note,
      }))
    : (() => {
        const parsed = parseQuoteMessage(quote.message || '');
        return [{
          tripId: null,
          position: 1,
          pickupAddress: parsed.departure || 'À définir',
          dropoffAddress: parsed.destination || 'À définir',
          scheduledDateTime: fallbackDateTime,
          passengers: parsed.numberOfPeople ? parseInt(parsed.numberOfPeople, 10) : 1,
          luggage: 1,
          price: quote.estimatedPrice,
          note: null as string | null,
        }];
      })();

  const created: BookingSummary[] = [];

  for (const leg of legs) {
    const legLabel = legs.length > 1 ? ` (trajet ${leg.position}/${legs.length})` : '';
    const notes = [
      `Réservation créée automatiquement suite à l'acceptation du devis #${quote.id}${legLabel}`,
      `Service: ${quote.service}`,
      leg.note ? `Note du trajet: ${leg.note}` : null,
      options.clientMessage ? `Message du client: ${options.clientMessage}` : null,
    ].filter(Boolean).join('\n\n');

    const [newBooking] = await db.insert(bookingsTable).values({
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone || '',
      pickupAddress: leg.pickupAddress,
      dropoffAddress: leg.dropoffAddress,
      scheduledDateTime: leg.scheduledDateTime,
      status: 'confirmed' as const,
      // Prix de la ligne quand l'admin a chiffre trajet par trajet ; sinon le
      // montant global, pour ne pas laisser la course sans tarif.
      price: leg.price || quote.estimatedPrice,
      notes,
      passengers: leg.passengers > 0 ? leg.passengers : 1,
      luggage: leg.luggage,
      // Devis passe pour un tiers : le chauffeur doit chercher le passager.
      passengerName: quote.passengerName,
      passengerPhone: quote.passengerPhone,
      updatedAt: new Date(),
    }).returning();

    if (leg.tripId) {
      await db.update(quoteTripsTable)
        .set({ bookingId: newBooking.id, updatedAt: new Date() })
        .where(eq(quoteTripsTable.id, leg.tripId));
    }

    created.push({
      id: newBooking.id,
      status: newBooking.status,
      scheduledDateTime: newBooking.scheduledDateTime,
      pickupAddress: newBooking.pickupAddress,
      dropoffAddress: newBooking.dropoffAddress,
    });
  }

  return created;
}
