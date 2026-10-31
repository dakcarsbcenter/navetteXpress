import { COMPANY_INFO } from '@/lib/pdf/brand';

/**
 * Moyens de paiement proposés au client à la réservation (bookings.preferred_payment_method).
 * Le client indique une préférence ; l'encaissement réel se note sur la facture.
 */
export const BOOKING_PAYMENT_METHODS = ['wave', 'orange_money', 'bank_transfer', 'cash'] as const;

export type BookingPaymentMethod = (typeof BOOKING_PAYMENT_METHODS)[number];

export function isBookingPaymentMethod(value: unknown): value is BookingPaymentMethod {
  return typeof value === 'string' && (BOOKING_PAYMENT_METHODS as readonly string[]).includes(value);
}

/** Numéro qui reçoit les paiements Wave et Orange Money. */
export const MOBILE_MONEY_PHONE = COMPANY_INFO.phone;

/** Libellés pour l'équipe (fiche admin, e-mails internes). */
export const BOOKING_PAYMENT_METHOD_LABELS: Record<BookingPaymentMethod, { fr: string; en: string }> = {
  wave: { fr: 'Wave', en: 'Wave' },
  orange_money: { fr: 'Orange Money', en: 'Orange Money' },
  bank_transfer: { fr: 'Virement bancaire', en: 'Bank transfer' },
  cash: { fr: 'Espèces', en: 'Cash' },
};

export function bookingPaymentMethodLabel(value: string | null | undefined, lang: 'fr' | 'en' = 'fr'): string | undefined {
  return isBookingPaymentMethod(value) ? BOOKING_PAYMENT_METHOD_LABELS[value][lang] : undefined;
}
