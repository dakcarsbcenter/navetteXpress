// Passerelle WhatsApp (OpenWA, self-hosted, non-officielle) — canal de notification secondaire.
// Ne jamais utiliser comme unique moyen d'authentification : voir docs/16-risk-management.md du projet OpenWA.
const OPENWA_BASE_URL = process.env.OPENWA_BASE_URL || 'http://localhost:2785'
const OPENWA_API_KEY = process.env.OPENWA_API_KEY
const OPENWA_SESSION_ID = process.env.OPENWA_SESSION_ID
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER

interface WhatsAppResult {
  success: boolean
  error?: string
}

/**
 * Convertit un numéro de téléphone libre (ex: "+221 77 123 45 67") en identifiant
 * de discussion OpenWA (ex: "221771234567@c.us"). Retourne null si le numéro est
 * trop court pour être valide.
 */
function toChatId(phone: string): string | null {
  let digits = phone.replace(/[^0-9]/g, '')
  if (digits.length < 8) return null

  // Les numéros sénégalais sont souvent saisis en base sans indicatif pays
  // (9 chiffres, ex: 771234567), alors que l'API WhatsApp exige le MSISDN
  // complet. On préfixe 221 dans ce cas précis pour éviter un envoi silencieux
  // vers un identifiant invalide.
  if (digits.length === 9) {
    digits = `221${digits}`
  }

  return `${digits}@c.us`
}

/**
 * Envoie un message texte WhatsApp via l'instance OpenWA configurée.
 * Ne lève jamais d'exception — retourne toujours { success, error? }.
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<WhatsAppResult> {
  try {
    if (!OPENWA_API_KEY || !OPENWA_SESSION_ID) {
      console.warn('⚠️ [WhatsApp] OPENWA_API_KEY ou OPENWA_SESSION_ID non configuré, envoi ignoré')
      return { success: false, error: 'OpenWA non configuré' }
    }

    const chatId = toChatId(to)
    if (!chatId) {
      console.warn(`⚠️ [WhatsApp] Numéro invalide, envoi ignoré: ${to}`)
      return { success: false, error: 'Numéro de téléphone invalide' }
    }

    const response = await fetch(
      `${OPENWA_BASE_URL}/api/sessions/${OPENWA_SESSION_ID}/messages/send-text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': OPENWA_API_KEY,
        },
        body: JSON.stringify({ chatId, text }),
      }
    )

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      console.error(`❌ [WhatsApp] Échec de l'envoi (${response.status}):`, errorBody)
      return { success: false, error: `HTTP ${response.status}: ${errorBody}` }
    }

    console.log(`✅ [WhatsApp] Message envoyé à ${chatId}`)
    return { success: true }
  } catch (error) {
    console.error('❌ [WhatsApp] Erreur lors de l\'envoi:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

interface WhatsAppBookingData {
  id: number
  customerName: string
  pickupAddress: string
  dropoffAddress: string
  scheduledDateTime: string
  passengers: number
}

/**
 * Notifie l'admin (ADMIN_WHATSAPP_NUMBER) d'une nouvelle demande de réservation.
 */
export async function sendBookingWhatsAppToAdmin(booking: WhatsAppBookingData): Promise<WhatsAppResult> {
  if (!ADMIN_WHATSAPP_NUMBER) {
    return { success: false, error: 'ADMIN_WHATSAPP_NUMBER non configuré' }
  }

  const scheduledDate = new Date(booking.scheduledDateTime).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  const text =
    `🚖 Nouvelle réservation #${booking.id}\n\n` +
    `Client: ${booking.customerName}\n` +
    `Départ: ${booking.pickupAddress}\n` +
    `Arrivée: ${booking.dropoffAddress}\n` +
    `Date: ${scheduledDate}\n` +
    `Passagers: ${booking.passengers}`

  return sendWhatsAppMessage(ADMIN_WHATSAPP_NUMBER, text)
}

/**
 * Notifie un chauffeur de l'assignation d'une course, si son numéro est renseigné.
 */
export async function sendBookingAssignedWhatsAppToDriver(
  booking: WhatsAppBookingData,
  driverPhone: string | null | undefined
): Promise<WhatsAppResult> {
  if (!driverPhone) {
    return { success: false, error: 'Numéro du chauffeur non renseigné' }
  }

  const scheduledDate = new Date(booking.scheduledDateTime).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  const text =
    `🚗 Nouvelle course assignée #${booking.id}\n\n` +
    `Client: ${booking.customerName}\n` +
    `Départ: ${booking.pickupAddress}\n` +
    `Arrivée: ${booking.dropoffAddress}\n` +
    `Date: ${scheduledDate}`

  return sendWhatsAppMessage(driverPhone, text)
}

/**
 * Notifie le client que le chauffeur a confirmé/approuvé sa course.
 */
export async function sendBookingConfirmedWhatsAppToClient(
  booking: WhatsAppBookingData,
  clientPhone: string | null | undefined,
  driverName: string
): Promise<WhatsAppResult> {
  if (!clientPhone) {
    return { success: false, error: 'Numéro du client non renseigné' }
  }

  const scheduledDate = new Date(booking.scheduledDateTime).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  const text =
    `✅ Votre course #${booking.id} est confirmée !\n\n` +
    `Chauffeur: ${driverName}\n` +
    `Départ: ${booking.pickupAddress}\n` +
    `Arrivée: ${booking.dropoffAddress}\n` +
    `Date: ${scheduledDate}`

  return sendWhatsAppMessage(clientPhone, text)
}

/**
 * Notifie l'admin (ADMIN_WHATSAPP_NUMBER) qu'un chauffeur a refusé une course qui lui était assignée.
 */
export async function sendBookingRejectedWhatsAppToAdmin(
  booking: WhatsAppBookingData,
  driverName: string,
  reason?: string
): Promise<WhatsAppResult> {
  if (!ADMIN_WHATSAPP_NUMBER) {
    return { success: false, error: 'ADMIN_WHATSAPP_NUMBER non configuré' }
  }

  const scheduledDate = new Date(booking.scheduledDateTime).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  const text =
    `⚠️ Course #${booking.id} refusée par le chauffeur\n\n` +
    `Chauffeur: ${driverName}\n` +
    `Client: ${booking.customerName}\n` +
    `Départ: ${booking.pickupAddress}\n` +
    `Arrivée: ${booking.dropoffAddress}\n` +
    `Date: ${scheduledDate}\n` +
    (reason ? `Motif: ${reason}` : 'À réassigner manuellement.')

  return sendWhatsAppMessage(ADMIN_WHATSAPP_NUMBER, text)
}

/**
 * Notifie l'admin (ADMIN_WHATSAPP_NUMBER) qu'un client a annulé sa propre réservation.
 */
export async function sendBookingCancelledByClientWhatsAppToAdmin(
  booking: WhatsAppBookingData,
  reason?: string,
  assignedDriverName?: string
): Promise<WhatsAppResult> {
  if (!ADMIN_WHATSAPP_NUMBER) {
    return { success: false, error: 'ADMIN_WHATSAPP_NUMBER non configuré' }
  }

  const scheduledDate = new Date(booking.scheduledDateTime).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  const text =
    `🚫 Course #${booking.id} annulée par le client\n\n` +
    `Client: ${booking.customerName}\n` +
    `Départ: ${booking.pickupAddress}\n` +
    `Arrivée: ${booking.dropoffAddress}\n` +
    `Date: ${scheduledDate}\n` +
    (reason ? `Motif: ${reason}\n` : '') +
    (assignedDriverName ? `Chauffeur actuellement assigné: ${assignedDriverName} — pensez à l'informer.` : '')

  return sendWhatsAppMessage(ADMIN_WHATSAPP_NUMBER, text)
}

/**
 * Notifie le client d'une annulation définitive de sa réservation, déclenchée par l'admin.
 */
export async function sendBookingCancelledWhatsAppToClient(
  booking: WhatsAppBookingData,
  clientPhone: string | null | undefined,
  reason?: string
): Promise<WhatsAppResult> {
  if (!clientPhone) {
    return { success: false, error: 'Numéro du client non renseigné' }
  }

  const scheduledDate = new Date(booking.scheduledDateTime).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  const text =
    `❌ Votre course #${booking.id} a été annulée\n\n` +
    `Départ: ${booking.pickupAddress}\n` +
    `Arrivée: ${booking.dropoffAddress}\n` +
    `Date: ${scheduledDate}\n` +
    (reason ? `Motif: ${reason}\n` : '') +
    `Contactez-nous pour toute question.`

  return sendWhatsAppMessage(clientPhone, text)
}

interface WhatsAppQuoteData {
  id: number
  customerName: string
  service: string
  preferredDate?: string
}

/**
 * Notifie un destinataire (client ou admin) d'une demande de devis.
 */
export async function sendQuoteWhatsAppNotification(
  to: string,
  quote: WhatsAppQuoteData,
  forAdmin: boolean
): Promise<WhatsAppResult> {
  const text = forAdmin
    ? `📋 Nouvelle demande de devis #${quote.id}\n\nClient: ${quote.customerName}\nService: ${quote.service}` +
      (quote.preferredDate ? `\nDate souhaitée: ${quote.preferredDate}` : '')
    : `✅ Votre demande de devis #${quote.id} a bien été reçue.\n\nService: ${quote.service}\nNous revenons vers vous rapidement.`

  return sendWhatsAppMessage(to, text)
}

interface WhatsAppCompanyRequestData {
  name: string
  email: string
  companyType?: string | null
  companyName?: string | null
}

const COMPANY_TYPE_LABELS: Record<string, string> = {
  hotel: 'Hôtel',
  entreprise: 'Entreprise',
  ong: 'ONG / mission',
}

/**
 * Notifie l'admin (ADMIN_WHATSAPP_NUMBER) d'une nouvelle demande de compte professionnel.
 */
export async function sendCompanyRequestWhatsAppToAdmin(request: WhatsAppCompanyRequestData): Promise<WhatsAppResult> {
  if (!ADMIN_WHATSAPP_NUMBER) {
    return { success: false, error: 'ADMIN_WHATSAPP_NUMBER non configuré' }
  }

  const typeLabel = request.companyType ? COMPANY_TYPE_LABELS[request.companyType] || request.companyType : 'professionnel'

  const text =
    `🏢 Nouvelle demande de compte ${typeLabel}\n\n` +
    `Client: ${request.name}\n` +
    `Email: ${request.email}` +
    (request.companyName ? `\nEntreprise: ${request.companyName}` : '') +
    `\n\nÀ valider dans Admin > Demandes compte pro`

  return sendWhatsAppMessage(ADMIN_WHATSAPP_NUMBER, text)
}
