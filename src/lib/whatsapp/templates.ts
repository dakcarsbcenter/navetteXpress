/**
 * Un envoi par événement métier, mappé sur les 6 templates WhatsApp
 * pré-approuvés Meta (voir docs/GESKAP_WHATSAPP.md pour le corps exact de
 * chaque template et l'ordre des variables — cet ordre doit rester identique
 * entre la console Geskap et les tableaux `variables` ci-dessous).
 */

import { sendWhatsAppTemplate, orDash } from './geskap';
import { getServiceById, additionalServices } from '@/lib/services';
import type { SelectBooking } from '@/schema';

const FLIGHT_STATUS_LABELS_FR: Record<string, string> = {
  scheduled: 'Prévu',
  active: 'En vol',
  landed: 'Atterri',
  cancelled: 'Annulé',
  incident: 'Incident',
  diverted: 'Dérouté',
  unknown: 'Inconnu',
};

interface DriverInfo {
  name: string;
  phone: string | null;
}

function formatDateTime(date: Date): string {
  return `${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

function formatLuggage(count: number): string {
  return `${count} valise${count > 1 ? 's' : ''}`;
}

function reference(booking: SelectBooking): string {
  return `NX-${booking.id}`;
}

function flightStatusLabel(status: string | null): string {
  if (!status) return 'Non renseigné';
  return FLIGHT_STATUS_LABELS_FR[status] || status;
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
  const serviceTypeLabel = serviceId ? getServiceById(serviceId)?.translations.fr.name || serviceId : '—';

  const optionsRaw = notes.match(/Services additionnels:\s*(.+)/)?.[1]?.trim();
  const optionsLabel =
    !optionsRaw || optionsRaw === 'Aucun'
      ? '—'
      : optionsRaw
          .split(',')
          .map((id) => additionalServices.find((s) => s.id === id.trim())?.translations.fr.name || id.trim())
          .join(', ');

  const specialRaw = notes.match(/Demandes spéciales:\s*(.+)/)?.[1]?.trim();
  const driverNotesLabel = !specialRaw || specialRaw === 'Aucune' ? '—' : specialRaw;

  return { serviceTypeLabel, optionsLabel, driverNotesLabel };
}

/** 1a. Accusé de réception envoyé au client à la création de la réservation. */
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

/** 1b. Alerte dispatch envoyée à l'admin (même événement que 1a, destinataire fixe). */
export async function sendNouvelleReservationAdmin(booking: SelectBooking) {
  const adminPhone = process.env.GESKAP_ADMIN_PHONE;
  if (!adminPhone) {
    console.warn('⚠️ [WhatsApp/Geskap] GESKAP_ADMIN_PHONE non configuré — alerte dispatch non envoyée');
    return;
  }
  const { serviceTypeLabel, optionsLabel, driverNotesLabel } = parseBookingNotes(booking.notes);

  await sendWhatsAppTemplate({
    to: adminPhone,
    template: 'nouvelle_reservation_admin',
    idempotencyKey: `${booking.id}-nouvelle_reservation_admin`,
    variables: [
      reference(booking),
      booking.customerName,
      booking.customerPhone,
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
