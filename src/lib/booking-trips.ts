import { z } from 'zod';

/**
 * Une demande de réservation peut porter plusieurs trajets (aller-retour, séjour
 * enchaînant plusieurs courses). Chaque trajet devient une réservation à part
 * entière en base — le modèle impose de toute façon un chauffeur et un prix par
 * course — et les réservations issues d'une même demande partagent un
 * `bookings.booking_group_id`.
 *
 * Ce qui est propre au trajet : l'itinéraire, la date, les passagers/bagages, le
 * véhicule et le vol. Ce qui reste commun à la demande (contact, passager tiers,
 * options, demandes spéciales) vit au niveau de l'enveloppe.
 */
export interface BookingTripInput {
  serviceType: string;
  customServiceType?: string | null;
  pickupAddress: string;
  destinationAddress: string;
  /** Format `YYYY-MM-DD`, tel que produit par le champ datetime-local. */
  date: string;
  /** Format `HH:MM`. */
  time: string;
  passengers: number;
  luggage: number;
  duration?: number;
  vehicleType: 'berline' | 'suv';
  /**
   * Secteur tarifaire retenu quand plusieurs tarifs couvrent le même couple de
   * lieux (un par quartier). Le montant, lui, n'est jamais transmis : il est
   * recalculé côté serveur.
   */
  pricingSegmentId?: number | null;
  flightNumber?: string | null;
  airline?: string | null;
}

/** Nombre maximum de trajets acceptés dans une même demande de réservation. */
export const MAX_BOOKING_TRIPS = 10;

/**
 * Validation d'un trajet, alignée sur QuoteTripSchema (src/app/api/quotes/route.ts).
 * Les bornes existent surtout pour qu'un POST direct ne puisse pas écrire
 * n'importe quoi : le formulaire, lui, propose des listes fermées.
 */
export const BookingTripSchema = z.object({
  serviceType: z.string().trim().max(120).optional().default(''),
  customServiceType: z.string().trim().max(200).nullish(),
  pickupAddress: z.string().trim().min(2).max(255),
  destinationAddress: z.string().trim().min(2).max(255),
  date: z.string().trim().min(1).max(20),
  time: z.string().trim().min(1).max(20),
  passengers: z.coerce.number().int().min(1).max(200).default(1),
  luggage: z.coerce.number().int().min(0).max(100).default(1),
  duration: z.coerce.number().min(0).max(240).optional(),
  vehicleType: z.enum(['berline', 'suv']).default('berline'),
  pricingSegmentId: z.number().int().nullish(),
  flightNumber: z.string().trim().max(20).nullish(),
  airline: z.string().trim().max(120).nullish(),
});

export type BookingTripParsed = z.infer<typeof BookingTripSchema>;

/**
 * Libellé lisible d'un trajet, utilisé dans l'e-mail admin récapitulatif et dans
 * la ligne `Trajet:` ajoutée aux notes des demandes multi-trajets.
 */
export function formatTripSummary(trip: { pickupAddress: string; destinationAddress: string }): string {
  return `${trip.pickupAddress} → ${trip.destinationAddress}`;
}
