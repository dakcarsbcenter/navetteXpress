/**
 * Un envoi par événement métier, mappé sur les templates WhatsApp
 * pré-approuvés Meta (voir docs/GESKAP_WHATSAPP.md pour le corps exact de
 * chaque template et l'ordre des variables — cet ordre doit rester identique
 * entre la console Geskap et les tableaux `variables` ci-dessous).
 */

import { sendWhatsAppTemplate, orDash } from './geskap';
import { getServiceById, additionalServices } from '@/lib/services';
import {
  bi,
  flightStatusBilingual,
  formatDateTimeBilingual,
} from '@/lib/email-i18n';
import type { SelectBooking } from '@/schema';

interface DriverInfo {
  name: string;
  phone: string | null;
}

/**
 * `date` peut arriver en string ISO (et non en Date) quand le job a transité
 * par la file de retry : le payload est sérialisé en JSON pour le stockage
 * (voir sendWithRetry dans notification-queue.ts), ce qui ne préserve pas
 * le type Date au round-trip JSON.parse.
 */
function formatDateTime(date: Date | string): string {
  // JJ/MM/AAAA HH:MM — non ambigu entre lecteurs francophones et anglophones,
  // contrairement aux formats localisés.
  return formatDateTimeBilingual(date);
}

function formatLuggage(count: number): string {
  return `${count} valise${count > 1 ? 's' : ''} / ${count} bag${count > 1 ? 's' : ''}`;
}

function reference(booking: SelectBooking): string {
  return `NX-${booking.id}`;
}

function flightStatusLabel(status: string | null): string {
  return flightStatusBilingual(status);
}

/**
 * serviceType/options/précisions ne sont pas des colonnes de bookingsTable :
 * ils sont stockés en texte libre dans `notes` au format fixe posé par
 * POST /api/bookings (voir src/app/api/bookings/route.ts). On les extrait
 * plutôt que d'ajouter une migration pour ce seul besoin d'affichage.
 */
function parseBookingNotes(notes: string | null): {
  serviceTypeLabel: string;
  optionsLabel: string;
  driverNotesLabel: string;
} {
  if (!notes) return { serviceTypeLabel: '—', optionsLabel: '—', driverNotesLabel: '—' };

  const serviceId = notes.match(/Service:\s*(.+)/)?.[1]?.trim();
  const service = serviceId ? getServiceById(serviceId) : undefined;
  const serviceTypeLabel = serviceId
    ? service
      ? bi(service.translations.fr.name, service.translations.en.name)
      : serviceId
    : '—';

  const optionsRaw = notes.match(/Services additionnels:\s*(.+)/)?.[1]?.trim();
  const optionsLabel =
    !optionsRaw || optionsRaw === 'Aucun'
      ? '—'
      : optionsRaw
          .split(',')
          .map((id) => {
            const extra = additionalServices.find((s) => s.id === id.trim());
            return extra ? bi(extra.translations.fr.name, extra.translations.en.name) : id.trim();
          })
          .join(', ');

  const specialRaw = notes.match(/Demandes spéciales:\s*(.+)/)?.[1]?.trim();
  const driverNotesLabel = !specialRaw || specialRaw === 'Aucune' ? '—' : specialRaw;

  return { serviceTypeLabel, optionsLabel, driverNotesLabel };
}

/** 1. Accusé de réception envoyé au client à la création de la réservation. */
export async function sendReservationCreeeClient(booking: SelectBooking) {
  if (!booking.customerPhone) return;
  const { serviceTypeLabel, optionsLabel, driverNotesLabel } = parseBookingNotes(booking.notes);

  await sendWhatsAppTemplate({
    to: booking.customerPhone,
    template: 'reservation_creee',
    idempotencyKey: `${booking.id}-reservation_creee_client`,
    variables: [
      booking.customerName.split(' ')[0] || booking.customerName,
      serviceTypeLabel,
      booking.pickupAddress,
      booking.dropoffAddress,
      formatDateTime(booking.scheduledDateTime),
      String(booking.passengers),
      formatLuggage(booking.luggage),
      orDash(booking.flightNumber),
      orDash(booking.airline),
      flightStatusLabel(booking.flightStatus),
      optionsLabel,
      driverNotesLabel,
      reference(booking),
    ],
  });
}

/** 2. Proposition de course détaillée envoyée au chauffeur lors de l'assignation. */
export async function sendChauffeurAssigne(booking: SelectBooking, driver: DriverInfo) {
  if (!driver.phone) return;
  const { serviceTypeLabel, optionsLabel, driverNotesLabel } = parseBookingNotes(booking.notes);

  await sendWhatsAppTemplate({
    to: driver.phone,
    template: 'chauffeur_assigne',
    idempotencyKey: `${booking.id}-chauffeur_assigne`,
    variables: [
      driver.name.split(' ')[0] || driver.name,
      reference(booking),
      booking.customerName,
      serviceTypeLabel,
      booking.pickupAddress,
      booking.dropoffAddress,
      formatDateTime(booking.scheduledDateTime),
      String(booking.passengers),
      formatLuggage(booking.luggage),
      orDash(booking.flightNumber),
      orDash(booking.airline),
      flightStatusLabel(booking.flightStatus),
      optionsLabel,
      driverNotesLabel,
    ],
  });
}

/** 3. Demande d'approbation avec boutons Accepter/Refuser (suit immédiatement le n°2). */
export async function sendConfirmationChauffeur(booking: SelectBooking, driver: DriverInfo) {
  if (!driver.phone) return;

  await sendWhatsAppTemplate({
    to: driver.phone,
    template: 'confirmation_chauffeur',
    idempotencyKey: `${booking.id}-confirmation_chauffeur`,
    variables: [
      driver.name.split(' ')[0] || driver.name,
      `${booking.pickupAddress} → ${booking.dropoffAddress}`,
      formatDateTime(booking.scheduledDateTime),
      reference(booking),
    ],
  });
}

/** 4. Confirmation finale envoyée au client une fois le chauffeur assigné. */
export async function sendReservationValidee(booking: SelectBooking, driver: DriverInfo) {
  if (!booking.customerPhone) return;
  const { serviceTypeLabel, optionsLabel, driverNotesLabel } = parseBookingNotes(booking.notes);

  await sendWhatsAppTemplate({
    to: booking.customerPhone,
    template: 'reservation_validee',
    idempotencyKey: `${booking.id}-reservation_validee`,
    variables: [
      reference(booking),
      serviceTypeLabel,
      booking.pickupAddress,
      booking.dropoffAddress,
      formatDateTime(booking.scheduledDateTime),
      String(booking.passengers),
      formatLuggage(booking.luggage),
      orDash(booking.flightNumber),
      orDash(booking.airline),
      flightStatusLabel(booking.flightStatus),
      optionsLabel,
      driverNotesLabel,
      driver.name,
      orDash(driver.phone),
    ],
  });
}

/** 5. Rappel envoyé au client un délai fixe avant le départ (déclenché par le cron). */
export async function sendRappelDepart(booking: SelectBooking, driver: DriverInfo, leadTimeLabel: string) {
  if (!booking.customerPhone) return;
  const { serviceTypeLabel, driverNotesLabel } = parseBookingNotes(booking.notes);

  await sendWhatsAppTemplate({
    to: booking.customerPhone,
    template: 'rappel_depart',
    idempotencyKey: `${booking.id}-rappel_depart`,
    variables: [
      leadTimeLabel,
      reference(booking),
      serviceTypeLabel,
      booking.pickupAddress,
      booking.dropoffAddress,
      String(booking.passengers),
      formatLuggage(booking.luggage),
      orDash(booking.flightNumber),
      orDash(booking.airline),
      flightStatusLabel(booking.flightStatus),
      driverNotesLabel,
      driver.name,
      orDash(driver.phone),
    ],
  });
}

/**
 * 6. Avis de modification envoyé après une correction en back-office (trajet, date,
 * passagers...). Destinataire : le client, et le chauffeur déjà assigné le cas échéant.
 *
 * Contrainte Meta : une variable de template ne peut pas contenir de saut de ligne, la
 * liste des changements est donc aplatie sur une seule ligne séparée par " · ".
 */
export async function sendReservationModifiee(
  booking: SelectBooking,
  changes: { labelFr: string; labelEn: string; before: string; after: string }[],
  recipient: 'client' | 'driver',
  driver?: DriverInfo
) {
  const to = recipient === 'driver' ? driver?.phone : booking.customerPhone;
  if (!to) return;

  const firstName =
    recipient === 'driver'
      ? (driver?.name?.split(' ')[0] || driver?.name || '—')
      : (booking.customerName.split(' ')[0] || booking.customerName);

  const changesSummary =
    changes
      .map((c) => `${c.labelFr}/${c.labelEn}: ${c.before} → ${c.after}`)
      .join(' · ') || '—';

  await sendWhatsAppTemplate({
    to,
    template: 'reservation_modifiee',
    // L'idempotency key inclut updatedAt : une réservation peut être corrigée plusieurs
    // fois, chaque correction doit donner lieu à un envoi distinct.
    idempotencyKey: `${booking.id}-reservation_modifiee-${recipient}-${new Date(booking.updatedAt).getTime()}`,
    variables: [
      firstName,
      reference(booking),
      changesSummary,
      booking.pickupAddress,
      booking.dropoffAddress,
      formatDateTime(booking.scheduledDateTime),
    ],
  });
}
