import { Resend } from 'resend'

// Initialiser Resend avec la clé API
const resend = new Resend(process.env.RESEND_API_KEY)

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
}

/**
 * Envoie une notification à l'admin lors d'une nouvelle demande de réservation
 */
export async function sendBookingNotificationToAdmin(booking: BookingData) {
  try {
    const scheduledDate = new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `📅 Nouvelle demande de réservation #${booking.id}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
              .info-row { margin: 10px 0; }
              .label { font-weight: bold; color: #667eea; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚖 Nouvelle Réservation</h1>
                <p>Une nouvelle demande de réservation a été soumise</p>
              </div>
              <div class="content">
                <div class="info-box">
                  <h2>📋 Détails de la réservation #${booking.id}</h2>
                  <div class="info-row">
                    <span class="label">Client:</span> ${booking.customerName}
                  </div>
                  <div class="info-row">
                    <span class="label">Email:</span> ${booking.customerEmail}
                  </div>
                  ${booking.customerPhone ? `
                  <div class="info-row">
                    <span class="label">Téléphone:</span> ${booking.customerPhone}
                  </div>
                  ` : ''}
                  <div class="info-row">
                    <span class="label">Date:</span> ${scheduledDate}
                  </div>
                  <div class="info-row">
                    <span class="label">Passagers:</span> ${booking.passengers}
                  </div>
                </div>
                
                <div class="info-box">
                  <h3>📍 Itinéraire</h3>
                  <div class="info-row">
                    <span class="label">Départ:</span> ${booking.pickupAddress}
                  </div>
                  <div class="info-row">
                    <span class="label">Arrivée:</span> ${booking.dropoffAddress}
                  </div>
                  ${booking.price ? `
                  <div class="info-row">
                    <span class="label">Prix:</span> ${booking.price} €
                  </div>
                  ` : ''}
                </div>

                ${booking.notes ? `
                <div class="info-box">
                  <h3>📝 Notes</h3>
                  <p>${booking.notes}</p>
                </div>
                ` : ''}

                <div style="text-align: center;">
                  <a href="${process.env.NEXTAUTH_URL}/admin/dashboard?tab=bookings" class="button">
                    Voir dans le dashboard
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>Navette Xpress - Système de gestion des réservations</p>
              </div>
            </div>
          </body>
        </html>
      `,
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
    const scheduledDate = new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: driver.email,
      subject: `🚗 Nouvelle course assignée #${booking.id}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981; }
              .info-row { margin: 10px 0; }
              .label { font-weight: bold; color: #10b981; }
              .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .alert { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚗 Nouvelle Course</h1>
                <p>Une course vous a été assignée</p>
              </div>
              <div class="content">
                <p>Bonjour <strong>${driver.name}</strong>,</p>
                <p>Une nouvelle course vous a été assignée. Voici les détails :</p>

                <div class="info-box">
                  <h2>📋 Détails de la course #${booking.id}</h2>
                  <div class="info-row">
                    <span class="label">Date:</span> ${scheduledDate}
                  </div>
                  <div class="info-row">
                    <span class="label">Passagers:</span> ${booking.passengers}
                  </div>
                </div>
                
                <div class="info-box">
                  <h3>📍 Itinéraire</h3>
                  <div class="info-row">
                    <span class="label">Départ:</span> ${booking.pickupAddress}
                  </div>
                  <div class="info-row">
                    <span class="label">Arrivée:</span> ${booking.dropoffAddress}
                  </div>
                </div>

                <div class="info-box">
                  <h3>👤 Client</h3>
                  <div class="info-row">
                    <span class="label">Nom:</span> ${booking.customerName}
                  </div>
                  <div class="info-row">
                    <span class="label">Email:</span> ${booking.customerEmail}
                  </div>
                  ${booking.customerPhone ? `
                  <div class="info-row">
                    <span class="label">Téléphone:</span> ${booking.customerPhone}
                  </div>
                  ` : ''}
                </div>

                ${booking.notes ? `
                <div class="alert">
                  <strong>📝 Notes importantes:</strong><br>
                  ${booking.notes}
                </div>
                ` : ''}

                <div style="text-align: center;">
                  <a href="${process.env.NEXTAUTH_URL}/driver/dashboard" class="button">
                    Voir dans mon dashboard
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>Navette Xpress - Bon voyage !</p>
              </div>
            </div>
          </body>
        </html>
      `,
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
    const scheduledDate = new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.customerEmail,
      subject: `✅ Réservation confirmée #${booking.id} - Navette Xpress`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .success-badge { background: #d1fae5; color: #065f46; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 10px 0; font-weight: bold; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981; }
              .info-row { margin: 10px 0; }
              .label { font-weight: bold; color: #10b981; }
              .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Réservation Confirmée</h1>
                <div class="success-badge">
                  Votre réservation est confirmée !
                </div>
              </div>
              <div class="content">
                <p>Bonjour <strong>${booking.customerName}</strong>,</p>
                <p>Nous avons le plaisir de vous confirmer votre réservation. Voici un récapitulatif :</p>

                <div class="info-box">
                  <h2>📋 Votre réservation #${booking.id}</h2>
                  <div class="info-row">
                    <span class="label">Date:</span> ${scheduledDate}
                  </div>
                  <div class="info-row">
                    <span class="label">Passagers:</span> ${booking.passengers}
                  </div>
                  ${booking.price ? `
                  <div class="info-row">
                    <span class="label">Prix:</span> ${booking.price} €
                  </div>
                  ` : ''}
                </div>
                
                <div class="info-box">
                  <h3>📍 Itinéraire</h3>
                  <div class="info-row">
                    <span class="label">Départ:</span> ${booking.pickupAddress}
                  </div>
                  <div class="info-row">
                    <span class="label">Arrivée:</span> ${booking.dropoffAddress}
                  </div>
                </div>

                ${driver ? `
                <div class="info-box">
                  <h3>🚗 Votre chauffeur</h3>
                  <div class="info-row">
                    <span class="label">Nom:</span> ${driver.name}
                  </div>
                </div>
                ` : ''}

                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <strong>💡 Conseils :</strong>
                  <ul>
                    <li>Soyez prêt 5 minutes avant l'heure prévue</li>
                    <li>Gardez votre téléphone à portée de main</li>
                    <li>En cas d'imprévu, contactez-nous rapidement</li>
                  </ul>
                </div>

                <div style="text-align: center;">
                  <a href="${process.env.NEXTAUTH_URL}/client/dashboard" class="button">
                    Voir ma réservation
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>Navette Xpress - Merci de votre confiance !</p>
                <p>Besoin d'aide ? Contactez-nous à ${ADMIN_EMAIL}</p>
              </div>
            </div>
          </body>
        </html>
      `,
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
