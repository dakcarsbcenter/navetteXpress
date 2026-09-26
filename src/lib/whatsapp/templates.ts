/**
 * Un envoi par événement métier, mappé sur les templates WhatsApp
 * pré-approuvés Meta (voir docs/GESKAP_WHATSAPP.md pour le corps exact de
 * chaque template et l'ordre des variables — cet ordre doit rester identique
 * entre la console Geskap et les tableaux `variables` ci-dessous).
 *
 * Les noms de templates ne sont pas écrits ici : ils vivent dans
 * WHATSAPP_TEMPLATES (geskap.ts), seule source à modifier lors d'un renommage.
 */

import { sendWhatsAppTemplate, orDash, phoneForDisplay, WHATSAPP_TEMPLATES } from './geskap';
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
  /**
   * Champs véhicule de la fiche chauffeur (users.vehicle_*). Optionnels : ils
   * peuvent manquer sur un job déjà sérialisé dans la file de retry avant le
   * passage aux gabarits qui affichent le véhicule.
   */
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehiclePlateNumber?: string | null;
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

function firstNameOf(fullName: string | null | undefined): string {
  const name = fullName?.trim();
  if (!name) return '—';
  return name.split(' ')[0] || name;
}

/**
 * Les gabarits de 2e génération n'ont plus qu'une seule ligne `Vol / Flight`,
 * là où les précédents avaient trois variables distinctes (n°, compagnie,
 * statut). On les aplatit ici. Exception : 2reservation_creee a conservé les
 * trois variables séparées et n'utilise donc pas ce helper.
 */
function flightLabel(booking: SelectBooking): string {
  // Seules les valeurs renseignées sont jointes : avec orDash() sur chacune, un vol
  // sans compagnie sortait « AF718 — — (À l'heure) » dans le message du client.
  const parts = [booking.flightNumber, booking.airline]
    .map((v) => v?.trim())
    .filter(Boolean);
  if (parts.length === 0) return '—';
  return `${parts.join(' — ')} (${flightStatusLabel(booking.flightStatus)})`;
}

/** « Toyota Corolla — DK-1234-AB », en tolérant les champs non renseignés. */
function vehicleLabel(driver: DriverInfo | undefined): string {
  const model = [driver?.vehicleBrand, driver?.vehicleModel]
    .map((v) => v?.trim())
    .filter(Boolean)
    .join(' ');
  const plate = driver?.vehiclePlateNumber?.trim();
  if (model && plate) return `${model} — ${plate}`;
  return model || plate || '—';
}

/**
 * Échéance affichée au chauffeur dans 2chauffeur_assigne. Purement informative :
 * aucune réattribution automatique n'est déclenchée à son expiration. Calculée à
 * l'envoi (et non à l'assignation) pour rester cohérente si le message part en
 * différé via la file de retry.
 */
const DRIVER_CONFIRM_MINUTES = Number(process.env.WHATSAPP_DRIVER_CONFIRM_MINUTES) || 30;

function confirmDeadlineLabel(): string {
  return formatDateTime(new Date(Date.now() + DRIVER_CONFIRM_MINUTES * 60_000));
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
    template: WHATSAPP_TEMPLATES.reservationCreee,
    // Les clés d'idempotence gardent volontairement les anciens libellés : les
    // changer ferait repartir un envoi déjà effectué pour les réservations en cours.
    idempotencyKey: `${booking.id}-reservation_creee_client`,
    variables: [
      firstNameOf(booking.customerName),
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

/**
 * 2. Proposition de course envoyée au chauffeur lors de l'assignation. Depuis la
 * 2e génération de gabarits, ce message porte lui-même les boutons
 * Accepter/Refuser : c'est le seul message à boutons envoyé au chauffeur.
 */
export async function sendChauffeurAssigne(booking: SelectBooking, driver: DriverInfo) {
  if (!driver.phone) return;
  const { serviceTypeLabel, optionsLabel, driverNotesLabel } = parseBookingNotes(booking.notes);

  await sendWhatsAppTemplate({
    to: driver.phone,
    template: WHATSAPP_TEMPLATES.chauffeurAssigne,
    idempotencyKey: `${booking.id}-chauffeur_assigne`,
    variables: [
      firstNameOf(driver.name),
      reference(booking),
      confirmDeadlineLabel(),
      serviceTypeLabel,
      // Réservation pour un tiers : le chauffeur doit voir le passager qu'il va chercher,
      // et qui a commandé la course.
      booking.passengerName
        ? `${booking.passengerName} (réservé par ${booking.customerName})`
        : booking.customerName,
      booking.pickupAddress,
      booking.dropoffAddress,
      formatDateTime(booking.scheduledDateTime),
      String(booking.passengers),
      formatLuggage(booking.luggage),
      flightLabel(booking),
      optionsLabel,
      driverNotesLabel,
    ],
  });
}

/** 3. Confirmation finale envoyée au client une fois le chauffeur assigné. */
export async function sendReservationValidee(booking: SelectBooking, driver: DriverInfo) {
  if (!booking.customerPhone) return;
  const { serviceTypeLabel, optionsLabel, driverNotesLabel } = parseBookingNotes(booking.notes);

  await sendWhatsAppTemplate({
    to: booking.customerPhone,
    template: WHATSAPP_TEMPLATES.reservationValidee,
    idempotencyKey: `${booking.id}-reservation_validee`,
    variables: [
      firstNameOf(booking.customerName),
      reference(booking),
      serviceTypeLabel,
      booking.pickupAddress,
      booking.dropoffAddress,
      formatDateTime(booking.scheduledDateTime),
      String(booking.passengers),
      formatLuggage(booking.luggage),
      flightLabel(booking),
      optionsLabel,
      driverNotesLabel,
      driver.name,
      vehicleLabel(driver),
      phoneForDisplay(driver.phone),
    ],
  });
}

/**
 * 4. Rappel envoyé au client avant le départ (déclenché par le cron).
 *
 * `_leadTimeLabel` n'est plus affiché : le gabarit annonce désormais la date de
 * la course et non le délai restant. Le paramètre est conservé car des jobs
 * sérialisés avec trois arguments peuvent encore dormir dans la file de retry.
 */
export async function sendRappelDepart(
  booking: SelectBooking,
  driver: DriverInfo,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _leadTimeLabel?: string
) {
  if (!booking.customerPhone) return;
  const { driverNotesLabel } = parseBookingNotes(booking.notes);

  await sendWhatsAppTemplate({
    to: booking.customerPhone,
    template: WHATSAPP_TEMPLATES.rappelDepart,
    idempotencyKey: `${booking.id}-rappel_depart`,
    variables: [
      firstNameOf(booking.customerName),
      reference(booking),
      formatDateTime(booking.scheduledDateTime),
      booking.pickupAddress,
      booking.dropoffAddress,
      flightLabel(booking),
      driver.name,
      vehicleLabel(driver),
      phoneForDisplay(driver.phone),
      driverNotesLabel,
    ],
  });
}

/**
 * 5. Avis de modification envoyé après une correction en back-office (trajet, date,
 * passagers...). Destinataire : le client, et le chauffeur déjà assigné le cas échéant.
 *
 * `driver` est désormais attendu pour les deux destinataires : le gabarit affiche
 * le chauffeur, son véhicule et son téléphone même dans la version envoyée au client.
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
    recipient === 'driver' ? firstNameOf(driver?.name) : firstNameOf(booking.customerName);

  const changesSummary =
    changes
      .map((c) => `${c.labelFr}/${c.labelEn}: ${c.before} → ${c.after}`)
      .join(' · ') || '—';

  await sendWhatsAppTemplate({
    to,
    template: WHATSAPP_TEMPLATES.reservationModifiee,
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
      orDash(driver?.name),
      vehicleLabel(driver),
      phoneForDisplay(driver?.phone),
    ],
  });
}
