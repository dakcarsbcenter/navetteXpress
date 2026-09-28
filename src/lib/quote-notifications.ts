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

interface QuoteForEmail {
  id: number;
  customerName: string;
  service: string;
  message: string | null;
  estimatedPrice: string | null;
  preferredDate: Date | string | null;
}

/**
 * Accepter ou refuser un devis se fait dans l'espace client (le back n'expose
 * aucune route publique à jeton pour ça) : les deux boutons y renvoient.
 */
const quotesTabUrl = () => `${process.env.NEXT_PUBLIC_APP_URL || ''}/client/dashboard?tab=quotes`;

export function buildQuoteConfirmedEmailPayload(quote: QuoteForEmail) {
  const details = parseQuoteMessage(quote.message);
  const amount = quote.estimatedPrice
    ? `${Number(quote.estimatedPrice).toLocaleString('fr-FR')} FCFA`
    : 'À confirmer';

  return {
    quoteId: `QUOTE-${quote.id}`,
    customerName: quote.customerName,
    amount,
    pickupLocation: details.departure || getQuoteServiceLabel(quote.service),
    dropoffLocation: details.destination || 'À définir',
    pickupDate: quote.preferredDate
      ? new Date(quote.preferredDate).toLocaleDateString('fr-FR')
      : 'À convenir',
    acceptUrl: quotesTabUrl(),
    rejectUrl: quotesTabUrl(),
  };
}
