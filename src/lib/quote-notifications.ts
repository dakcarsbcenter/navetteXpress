/**
 * Composition de l'email « votre devis est prêt ».
 *
 * Extrait de PUT /api/quotes/[id] pour être partagé avec la création d'un devis
 * par l'admin, qui peut l'envoyer dans le même geste. Au passage, la charge
 * utile est remise en accord avec sendQuoteConfirmedEmail() : elle était
 * composée de `price` / `validUntil` / `adminNotes`, alors que le gabarit
 * attend `amount` / `pickupLocation` / `dropoffLocation` / `pickupDate` et deux
 * liens — le client recevait donc un tableau rempli de « undefined » et deux
 * boutons sans URL.
 */

import { getQuoteServiceLabel, parseQuoteMessage } from './quote-services';
import { getQuoteTrips } from './quote-trips';

interface QuoteForEmail {
  id: number;
  customerName: string;
  service: string;
  message: string | null;
  estimatedPrice: string | null;
  preferredDate: Date | string | null;
  /** Référence officielle, présente dès que le PDF a été produit une fois. */
  reference?: string | null;
}

/**
 * Accepter ou refuser un devis se fait dans l'espace client (le back n'expose
 * aucune route publique à jeton pour ça) : les deux boutons y renvoient.
 */
const quotesTabUrl = () => `${process.env.NEXT_PUBLIC_APP_URL || ''}/client/dashboard?tab=quotes`;

/**
 * Le gabarit n'affiche qu'un couple départ/destination : sur un devis
 * multi-trajets on montre le premier départ et la dernière destination, qui
 * décrivent bien la boucle (aéroport → ... → aéroport). Le détail complet reste
 * dans le corps du message et dans l'espace client.
 */
export async function buildQuoteConfirmedEmailPayload(quote: QuoteForEmail) {
  const trips = await getQuoteTrips(quote.id);
  // Devis créés avant la table quote_trips : on relit le message comme avant.
  const details = trips.length > 0
    ? {
        departure: trips[0].departure,
        destination: trips[trips.length - 1].destination,
        date: trips[0].scheduledDateTime,
      }
    : { ...parseQuoteMessage(quote.message), date: null as Date | null };

  const amount = quote.estimatedPrice
    ? `${Number(quote.estimatedPrice).toLocaleString('fr-FR')} FCFA`
    : 'À confirmer';

  const pickupDate = details.date || quote.preferredDate;

  return {
    quoteId: quote.reference || `QUOTE-${quote.id}`,
    // Permet au mailer de générer le PDF et de le joindre à l'envoi.
    quoteDbId: quote.id,
    customerName: quote.customerName,
    amount,
    pickupLocation: details.departure || getQuoteServiceLabel(quote.service),
    dropoffLocation: details.destination || 'À définir',
    pickupDate: pickupDate
      ? new Date(pickupDate).toLocaleDateString('fr-FR')
      : 'À convenir',
    tripCount: trips.length,
    acceptUrl: quotesTabUrl(),
    rejectUrl: quotesTabUrl(),
  };
}
