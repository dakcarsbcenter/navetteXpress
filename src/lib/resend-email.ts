import { Resend } from 'resend'
import {
  biSubject,
  formatDateTimeBilingual,
  formatFCFA,
  headingBlock,
  paragraphBlock,
  dataTable,
  referenceBlock,
  ctaButton,
  emailShell,
  esc,
  TEXT_DARK,
  TEXT_MUTED,
} from './email-i18n'

// Init paresseuse : évite de lever une erreur au chargement du module quand
// RESEND_API_KEY est absent (ex: au build Next.js, où les env vars runtime
// ne sont pas encore injectées).
let _resend: Resend | null = null

function getResendClient(): Resend {
  if (_resend) return _resend
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not defined in environment variables')
  }
  _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const resend = new Proxy({} as Resend, {
  get(_target, prop, receiver) {
    const client = getResendClient()
    const value = Reflect.get(client, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

// Email de l'expéditeur (doit être vérifié dans Resend)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@navettexpress.com'

interface BookingData {
  id: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  pickupAddress: string
  dropoffAddress: string
  scheduledDateTime: string
  passengers: number
  notes?: string
  price?: string
}

interface DriverData {
  name: string
  email: string
  phone?: string | null
}

const reference = (booking: BookingData) => `NX-${booking.id}`

/** Encart d'astuces / d'avertissement, bilingue. */
function tipsBlock(title: { fr: string; en: string }, items: { fr: string; en: string }[]): string {
  const rows = items
    .map(
      (i) => `
      <li style="margin-bottom: 8px; color: ${TEXT_DARK}; font-size: 14px;">
        ${esc(i.fr)}<br>
        <span style="color: ${TEXT_MUTED};">${esc(i.en)}</span>
      </li>`
    )
    .join('')

  return `
    <div style="background: #FFF7ED; border: 1px solid #FDBA74; border-radius: 8px; padding: 18px; margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-weight: bold; color: ${TEXT_DARK}; font-size: 15px;">
        ${esc(title.fr)} <span style="color: ${TEXT_MUTED}; font-weight: normal;">/ ${esc(title.en)}</span>
      </p>
      <ul style="margin: 0; padding-left: 18px;">${rows}</ul>
    </div>`
}

/**
 * Envoie une notification à l'admin lors d'une nouvelle demande de réservation
 */
export async function sendBookingNotificationToAdmin(booking: BookingData) {
  try {
    const content = `
      ${headingBlock('🚖', 'Nouvelle demande de réservation', 'New booking request')}
      ${paragraphBlock(
        "Une nouvelle demande de réservation vient d'être soumise et attend un traitement.",
        'A new booking request has just been submitted and is awaiting processing.'
      )}
      ${referenceBlock(reference(booking))}
      ${dataTable(
        [
          { fr: 'Client', en: 'Customer', value: booking.customerName },
          { fr: 'Email', en: 'Email', value: booking.customerEmail },
          { fr: 'Téléphone', en: 'Phone', value: booking.customerPhone },
          { fr: 'Départ', en: 'Pick-up', value: booking.pickupAddress },
          { fr: 'Arrivée', en: 'Drop-off', value: booking.dropoffAddress },
          { fr: 'Date et heure', en: 'Date and time', value: formatDateTimeBilingual(booking.scheduledDateTime) },
          { fr: 'Passagers', en: 'Passengers', value: booking.passengers },
          { fr: 'Prix', en: 'Price', value: booking.price ? formatFCFA(booking.price) : undefined },
          { fr: 'Notes', en: 'Notes', value: booking.notes },
        ],
        { fr: 'Détails de la réservation', en: 'Booking details' }
      )}
      ${ctaButton(`${process.env.NEXTAUTH_URL}/admin/dashboard?tab=bookings`, 'Voir dans le dashboard', 'Open dashboard')}
    `

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: biSubject(
        `📅 Nouvelle demande de réservation ${reference(booking)}`,
        `New booking request ${reference(booking)}`
      ),
      html: emailShell(content, 'admin'),
    })

    if (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email à l\'admin:', error)
      return { success: false, error }
    }

    console.log('✅ Email envoyé à l\'admin:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email à l\'admin:', error)
    return { success: false, error }
  }
}

/**
 * Envoie une notification au chauffeur lors de l'assignation d'une réservation
 */
export async function sendBookingAssignedToDriver(booking: BookingData, driver: DriverData) {
  try {
    const content = `
      ${headingBlock('🚗', 'Nouvelle course assignée', 'New ride assigned')}
      ${paragraphBlock(
        `Bonjour ${driver.name}, une nouvelle course vous a été assignée. En voici le détail.`,
        `Hello ${driver.name}, a new ride has been assigned to you. Here are the details.`
      )}
      ${referenceBlock(reference(booking))}
      ${dataTable(
        [
          { fr: 'Départ', en: 'Pick-up', value: booking.pickupAddress },
          { fr: 'Arrivée', en: 'Drop-off', value: booking.dropoffAddress },
          { fr: 'Date et heure', en: 'Date and time', value: formatDateTimeBilingual(booking.scheduledDateTime) },
          { fr: 'Passagers', en: 'Passengers', value: booking.passengers },
          { fr: 'Prix', en: 'Price', value: booking.price ? formatFCFA(booking.price) : undefined },
        ],
        { fr: 'Détails de la course', en: 'Ride details' }
      )}
      ${dataTable(
        [
          { fr: 'Nom', en: 'Name', value: booking.customerName },
          { fr: 'Email', en: 'Email', value: booking.customerEmail },
          { fr: 'Téléphone', en: 'Phone', value: booking.customerPhone },
        ],
        { fr: 'Client', en: 'Customer' }
      )}
      ${
        booking.notes
          ? tipsBlock({ fr: 'Notes importantes', en: 'Important notes' }, [
              { fr: booking.notes, en: booking.notes },
            ])
          : ''
      }
      ${ctaButton(`${process.env.NEXTAUTH_URL}/driver/dashboard`, 'Voir dans mon espace', 'Open my dashboard')}
    `

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: driver.email,
      subject: biSubject(
        `🚗 Nouvelle course assignée ${reference(booking)}`,
        `New ride assigned ${reference(booking)}`
      ),
      html: emailShell(content, 'customer'),
    })

    if (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email au chauffeur:', error)
      return { success: false, error }
    }

    console.log('✅ Email envoyé au chauffeur:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email au chauffeur:', error)
    return { success: false, error }
  }
}

/**
 * Envoie une notification au client lors de la confirmation de sa réservation
 */
export async function sendBookingConfirmedToClient(booking: BookingData, driver?: DriverData) {
  try {
    const content = `
      ${headingBlock('✅', 'Réservation confirmée', 'Booking confirmed')}
      ${paragraphBlock(
        `Bonjour ${booking.customerName}, nous avons le plaisir de vous confirmer votre réservation. Voici le récapitulatif.`,
        `Hello ${booking.customerName}, we are pleased to confirm your booking. Here is the summary.`
      )}
      ${referenceBlock(reference(booking))}
      ${dataTable(
        [
          { fr: 'Départ', en: 'Pick-up', value: booking.pickupAddress },
          { fr: 'Arrivée', en: 'Drop-off', value: booking.dropoffAddress },
          { fr: 'Date et heure', en: 'Date and time', value: formatDateTimeBilingual(booking.scheduledDateTime) },
          { fr: 'Passagers', en: 'Passengers', value: booking.passengers },
          { fr: 'Prix', en: 'Price', value: booking.price ? formatFCFA(booking.price) : undefined },
          { fr: 'Chauffeur', en: 'Driver', value: driver?.name },
          { fr: 'Téléphone chauffeur', en: 'Driver phone', value: driver?.phone || undefined },
        ],
        { fr: 'Votre réservation', en: 'Your booking' }
      )}
      ${tipsBlock({ fr: '💡 Conseils', en: '💡 Tips' }, [
        {
          fr: "Soyez prêt 5 minutes avant l'heure prévue.",
          en: 'Be ready 5 minutes before the scheduled time.',
        },
        {
          fr: 'Gardez votre téléphone à portée de main.',
          en: 'Keep your phone within reach.',
        },
        {
          fr: "En cas d'imprévu, contactez-nous rapidement.",
          en: 'If anything changes, contact us as soon as possible.',
        },
      ])}
      ${ctaButton(`${process.env.NEXTAUTH_URL}/client/dashboard`, 'Voir ma réservation', 'View my booking')}
      ${paragraphBlock(
        `Besoin d'aide ? Écrivez-nous à ${ADMIN_EMAIL}.`,
        `Need help? Write to us at ${ADMIN_EMAIL}.`
      )}
    `

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.customerEmail,
      subject: biSubject(
        `✅ Réservation confirmée ${reference(booking)}`,
        `Booking confirmed ${reference(booking)}`
      ),
      html: emailShell(content, 'customer'),
    })

    if (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email au client:', error)
      return { success: false, error }
    }

    console.log('✅ Email de confirmation envoyé au client:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email au client:', error)
    return { success: false, error }
  }
}

/**
 * Envoie une notification au client lors de l'annulation définitive de sa réservation (déclenchée par l'admin)
 */
export async function sendBookingCancelledToClient(booking: BookingData, reason?: string) {
  try {
    const content = `
      ${headingBlock('❌', 'Réservation annulée', 'Booking cancelled')}
      ${paragraphBlock(
        `Bonjour ${booking.customerName}, nous vous informons que votre réservation a été annulée.`,
        `Hello ${booking.customerName}, we are writing to let you know that your booking has been cancelled.`
      )}
      ${referenceBlock(reference(booking))}
      ${dataTable(
        [
          { fr: 'Départ', en: 'Pick-up', value: booking.pickupAddress },
          { fr: 'Arrivée', en: 'Drop-off', value: booking.dropoffAddress },
          { fr: 'Date et heure', en: 'Date and time', value: formatDateTimeBilingual(booking.scheduledDateTime) },
          { fr: 'Passagers', en: 'Passengers', value: booking.passengers },
          { fr: "Motif de l'annulation", en: 'Cancellation reason', value: reason },
        ],
        { fr: 'Réservation annulée', en: 'Cancelled booking' }
      )}
      ${paragraphBlock(
        `Pour toute question, contactez-nous à ${ADMIN_EMAIL}. Nous restons à votre disposition pour organiser un nouveau trajet.`,
        `For any question, contact us at ${ADMIN_EMAIL}. We remain available to arrange another ride.`
      )}
    `

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.customerEmail,
      subject: biSubject(
        `❌ Réservation annulée ${reference(booking)}`,
        `Booking cancelled ${reference(booking)}`
      ),
      html: emailShell(content, 'customer'),
    })

    if (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email d\'annulation au client:', error)
      return { success: false, error }
    }

    console.log('✅ Email d\'annulation envoyé au client:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email d\'annulation au client:', error)
    return { success: false, error }
  }
}
