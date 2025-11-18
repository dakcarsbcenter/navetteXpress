/**
 * Module d'envoi d'emails avec templates Resend
 * Utilise les templates configurés dans le dashboard Resend
 */

import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NavetteXpress <onboarding@resend.dev>';

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(
  to: string,
  userName: string,
  resetToken: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/confirm?token=${resetToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: '🔐 Réinitialisation de votre mot de passe - NavetteXpress',
      html: `
        <!DOCTYPE html>
        <html>
          <body>
            <p>Bonjour ${userName},</p>
            <p>Cliquez sur le lien pour réinitialiser votre mot de passe :</p>
            <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Erreur envoi email:', error);
      throw error;
    }

    console.log('✅ Email envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Envoie un email de nouvelle facture
 */
export async function sendInvoiceEmail(
  to: string,
  invoiceData: {
    invoiceNumber: string;
    customerName: string;
    service: string;
    amountHT: string;
    vatAmount: string;
    amountTTC: string;
    issueDate: string;
    dueDate: string;
    invoiceUrl: string;
  }
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `🧾 Nouvelle facture ${invoiceData.invoiceNumber} - NavetteXpress`,
      html: `
        <!DOCTYPE html>
        <html>
          <body>
            <h2>🧾 Nouvelle Facture</h2>
            <p>Bonjour ${invoiceData.customerName},</p>
            
            <p>Nous vous remercions pour votre confiance. Voici les détails de votre facture :</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📄 Facture ${invoiceData.invoiceNumber}</h3>
              <p><strong>Service :</strong> ${invoiceData.service}</p>
              <p><strong>Date d'émission :</strong> ${invoiceData.issueDate}</p>
              <p><strong>Date d'échéance :</strong> ${invoiceData.dueDate}</p>
            </div>
            
            <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>💰 Détails des montants</h3>
              <p><strong>Montant HT :</strong> ${invoiceData.amountHT}</p>
              <p><strong>TVA (20%) :</strong> ${invoiceData.vatAmount}</p>
              <p><strong>Montant TTC :</strong> <span style="font-size: 18px; color: #93374d;">${invoiceData.amountTTC}</span></p>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${invoiceData.invoiceUrl}" 
                 style="background: #93374d; color: white; padding: 14px 40px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold;">
                📥 Télécharger la facture
              </a>
            </p>
            
            <p style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
              ⚠️ Cette facture est à régler avant le <strong>${invoiceData.dueDate}</strong>
            </p>
            
            <p>Cordialement,<br><strong>L'équipe NavetteXpress</strong></p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Erreur envoi facture:', error);
      throw error;
    }

    console.log('✅ Facture envoyée:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Envoie un email de nouvelle réservation
 */
export async function sendNewBookingEmail(
  to: string,
  bookingData: {
    customerName: string;
    bookingId: string;
    pickupLocation: string;
    dropoffLocation: string;
    pickupDate: string;
    pickupTime: string;
  }
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `🚗 Nouvelle demande de réservation ${bookingData.bookingId}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body>
            <h2>🚗 Nouvelle Demande de Réservation</h2>
            <p>Bonjour ${bookingData.customerName},</p>
            
            <p>Votre demande de réservation a bien été reçue :</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Réservation :</strong> ${bookingData.bookingId}</p>
              <p><strong>Départ :</strong> ${bookingData.pickupLocation}</p>
              <p><strong>Arrivée :</strong> ${bookingData.dropoffLocation}</p>
              <p><strong>Date :</strong> ${bookingData.pickupDate} à ${bookingData.pickupTime}</p>
            </div>
            
            <p>Nous traitons votre demande et vous contacterons rapidement.</p>
            
            <p>Cordialement,<br><strong>L'équipe NavetteXpress</strong></p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Erreur envoi réservation:', error);
      throw error;
    }

    console.log('✅ Email réservation envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Envoie un email de devis confirmé
 */
export async function sendQuoteConfirmedEmail(
  to: string,
  quoteData: {
    customerName: string;
    quoteId: string;
    amount: string;
    pickupLocation: string;
    dropoffLocation: string;
    pickupDate: string;
    acceptUrl: string;
    rejectUrl: string;
  }
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `💰 Votre devis ${quoteData.quoteId} est prêt`,
      html: `
        <!DOCTYPE html>
        <html>
          <body>
            <h2>💰 Votre Devis est Prêt</h2>
            <p>Bonjour ${quoteData.customerName},</p>
            
            <p>Nous avons le plaisir de vous proposer le devis suivant :</p>
            
            <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #93374d; font-size: 32px; margin: 0;">${quoteData.amount}</h3>
              <p style="margin: 5px 0;">Devis ${quoteData.quoteId}</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Départ :</strong> ${quoteData.pickupLocation}</p>
              <p><strong>Arrivée :</strong> ${quoteData.dropoffLocation}</p>
              <p><strong>Date :</strong> ${quoteData.pickupDate}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${quoteData.acceptUrl}" 
                 style="background: #22c55e; color: white; padding: 14px 40px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">
                ✅ Accepter le devis
              </a>
              <a href="${quoteData.rejectUrl}" 
                 style="background: #ef4444; color: white; padding: 14px 40px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold;">
                ❌ Refuser
              </a>
            </div>
            
            <p>Cordialement,<br><strong>L'équipe NavetteXpress</strong></p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Erreur envoi devis:', error);
      throw error;
    }

    console.log('✅ Email devis envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Envoie un email au chauffeur quand une réservation lui est assignée
 */
export async function sendBookingAssignedEmailToDriver(
  to: string,
  bookingData: {
    bookingId: string;
    customerName: string;
    pickupLocation: string;
    dropoffLocation: string;
    pickupDate: string;
    pickupTime: string;
    passengers?: number;
  },
  driverData: {
    driverName: string;
  }
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `🚗 Nouvelle réservation assignée - ${bookingData.bookingId}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #e8f0f8; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border: 2px solid #93374d; border-radius: 8px; overflow: hidden;">
              <div style="background: #93374d; padding: 32px 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Navette Express</h1>
              </div>
              <div style="padding: 32px 24px;">
                <h2 style="color: #2c3e50; text-align: center;">🚗 Nouvelle Réservation Assignée</h2>
                <p>Bonjour <strong>${driverData.driverName}</strong>,</p>
                <p>Une nouvelle réservation vous a été assignée :</p>
                <div style="background: #f8f9fa; border: 2px solid #93374d; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #93374d; margin-top: 0;">📋 Réservation ${bookingData.bookingId}</h3>
                  <p><strong>Client :</strong> ${bookingData.customerName}</p>
                  <p><strong>📍 Départ :</strong> ${bookingData.pickupLocation}</p>
                  <p><strong>📍 Arrivée :</strong> ${bookingData.dropoffLocation}</p>
                  <p><strong>📅 Date :</strong> ${bookingData.pickupDate}</p>
                  <p><strong>🕐 Heure :</strong> ${bookingData.pickupTime}</p>
                  ${bookingData.passengers ? `<p><strong>👥 Passagers :</strong> ${bookingData.passengers}</p>` : ''}
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/driver/dashboard" 
                     style="background: #93374d; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    📱 Voir dans mon dashboard
                  </a>
                </div>
                <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="color: #92400e; margin: 0;">⚠️ Pensez à confirmer ou refuser cette réservation depuis votre dashboard</p>
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                <p style="text-align: center; color: #6b7280;">Cordialement,<br><strong>L'équipe NavetteXpress</strong></p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Erreur envoi email assignation chauffeur:', error);
      throw error;
    }

    console.log('✅ Email assignation chauffeur envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Envoie un email au client quand sa réservation est confirmée par le chauffeur
 */
export async function sendBookingConfirmedByDriverEmail(
  to: string,
  bookingData: {
    bookingId: string;
    customerName: string;
    pickupLocation: string;
    dropoffLocation: string;
    pickupDate: string;
    pickupTime: string;
    driverName: string;
    vehicleInfo?: string;
  }
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `✅ Réservation confirmée - ${bookingData.bookingId}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #e8f0f8; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border: 2px solid #93374d; border-radius: 8px; overflow: hidden;">
              <div style="background: #93374d; padding: 32px 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Navette Express</h1>
              </div>
              <div style="padding: 32px 24px;">
                <h2 style="color: #2c3e50; text-align: center;">✅ Réservation Confirmée</h2>
                <p>Bonjour <strong>${bookingData.customerName}</strong>,</p>
                <p>Excellente nouvelle ! Votre réservation a été confirmée par votre chauffeur.</p>
                <div style="background: #d1fae5; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #166534; margin-top: 0;">✅ Réservation ${bookingData.bookingId}</h3>
                  <p style="color: #166534;"><strong>Chauffeur :</strong> ${bookingData.driverName}</p>
                  ${bookingData.vehicleInfo ? `<p style="color: #166534;"><strong>Véhicule :</strong> ${bookingData.vehicleInfo}</p>` : ''}
                  <p style="color: #166534;"><strong>📍 Départ :</strong> ${bookingData.pickupLocation}</p>
                  <p style="color: #166534;"><strong>📍 Arrivée :</strong> ${bookingData.dropoffLocation}</p>
                  <p style="color: #166534;"><strong>📅 Date :</strong> ${bookingData.pickupDate}</p>
                  <p style="color: #166534;"><strong>🕐 Heure :</strong> ${bookingData.pickupTime}</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/reservations" 
                     style="background: #93374d; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    📱 Voir ma réservation
                  </a>
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                <p style="text-align: center; color: #6b7280;">Cordialement,<br><strong>L'équipe NavetteXpress</strong></p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Erreur envoi email confirmation client:', error);
      throw error;
    }

    console.log('✅ Email confirmation client envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Envoie un email au client quand une nouvelle demande de réservation est créée
 */
export async function sendNewBookingRequestEmail(
  to: string,
  bookingData: {
    bookingId: string;
    customerName: string;
    pickupLocation: string;
    dropoffLocation: string;
    pickupDate: string;
    pickupTime: string;
    passengers?: number;
  }
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `🚗 Nouvelle demande de réservation - ${bookingData.bookingId}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #e8f0f8; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border: 2px solid #93374d; border-radius: 8px; overflow: hidden;">
              <div style="background: #93374d; padding: 32px 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Navette Express</h1>
              </div>
              <div style="padding: 32px 24px;">
                <h2 style="color: #2c3e50; text-align: center;">🚗 Nouvelle Demande de Réservation</h2>
                <p>Bonjour <strong>${bookingData.customerName}</strong>,</p>
                <p>Nous avons bien reçu votre demande de réservation :</p>
                <div style="background: #f8f9fa; border: 2px solid #93374d; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #93374d; margin-top: 0;">📋 Réservation ${bookingData.bookingId}</h3>
                  <p><strong>📍 Départ :</strong> ${bookingData.pickupLocation}</p>
                  <p><strong>📍 Arrivée :</strong> ${bookingData.dropoffLocation}</p>
                  <p><strong>📅 Date :</strong> ${bookingData.pickupDate}</p>
                  <p><strong>🕐 Heure :</strong> ${bookingData.pickupTime}</p>
                  ${bookingData.passengers ? `<p><strong>👥 Passagers :</strong> ${bookingData.passengers}</p>` : ''}
                </div>
                <div style="background: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="color: #1e3a8a; margin: 0;">ℹ️ Nous traçons votre demande et vous contacterons rapidement.</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/reservations" 
                     style="background: #93374d; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    📱 Suivre ma demande
                  </a>
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                <p style="text-align: center; color: #6b7280;">Cordialement,<br><strong>L'équipe NavetteXpress</strong></p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Erreur envoi email nouvelle réservation:', error);
      throw error;
    }

    console.log('✅ Email nouvelle réservation envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Envoie un email au client et à l'admin quand une nouvelle demande de devis est créée
 */
export async function sendNewQuoteRequestEmail(
  to: string,
  quoteData: {
    quoteId: string;
    customerName: string;
    service: string;
    preferredDate?: string;
    message: string;
  },
  isAdmin: boolean = false
) {
  try {
    const subject = isAdmin 
      ? `🎯 Nouvelle demande de devis - ${quoteData.quoteId}`
      : `✅ Demande de devis reçue - ${quoteData.quoteId}`;
    
    const title = isAdmin 
      ? '🎯 Nouvelle Demande de Devis' 
      : '✅ Demande de Devis Reçue';

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #e8f0f8; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border: 2px solid #93374d; border-radius: 8px; overflow: hidden;">
              <div style="background: #93374d; padding: 32px 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Navette Express</h1>
              </div>
              <div style="padding: 32px 24px;">
                <h2 style="color: #2c3e50; text-align: center;">${title}</h2>
                <p>Bonjour ${isAdmin ? 'Admin' : `<strong>${quoteData.customerName}</strong>`},</p>
                <p>${isAdmin 
                  ? 'Une nouvelle demande de devis a été soumise :' 
                  : 'Nous avons bien reçu votre demande de devis :'}</p>
                <div style="background: #f8f9fa; border: 2px solid #93374d; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #93374d; margin-top: 0;">📋 Devis ${quoteData.quoteId}</h3>
                  <p><strong>🚗 Service :</strong> ${quoteData.service}</p>
                  ${quoteData.preferredDate ? `<p><strong>📅 Date souhaitée :</strong> ${quoteData.preferredDate}</p>` : ''}
                  <p><strong>💬 Message :</strong></p>
                  <div style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #e5e7eb;">
                    ${quoteData.message}
                  </div>
                </div>
                ${!isAdmin ? `
                  <div style="background: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="color: #1e3a8a; margin: 0;">ℹ️ Notre équipe étudiera votre demande et vous enverra un devis personnalisé dans les plus brefs délais.</p>
                  </div>
                ` : ''}
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/${isAdmin ? 'admin' : 'client'}/devis" 
                     style="background: #93374d; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    ${isAdmin ? '📊 Gérer les devis' : '📱 Suivre ma demande'}
                  </a>
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                <p style="text-align: center; color: #6b7280;">Cordialement,<br><strong>L'équipe NavetteXpress</strong></p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Erreur envoi email nouvelle demande devis:', error);
      throw error;
    }

    console.log('✅ Email nouvelle demande devis envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Envoie un email à l'admin quand un client rejette un devis
 */
export async function sendQuoteRejectedEmail(
  quoteData: {
    quoteId: string;
    customerName: string;
    customerEmail: string;
    service: string;
    rejectionReason?: string;
  }
) {
  try {
    // Envoyer à l'admin (utiliser une variable d'environnement)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@navettexpress.com';
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [adminEmail],
      subject: `❌ Devis rejeté - ${quoteData.quoteId}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #e8f0f8; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border: 2px solid #ef4444; border-radius: 8px; overflow: hidden;">
              <div style="background: #ef4444; padding: 32px 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Navette Express</h1>
              </div>
              <div style="padding: 32px 24px;">
                <h2 style="color: #2c3e50; text-align: center;">❌ Devis Rejeté</h2>
                <p>Le client a rejeté le devis suivant :</p>
                <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #ef4444; margin-top: 0;">📋 Devis ${quoteData.quoteId}</h3>
                  <p><strong>👤 Client :</strong> ${quoteData.customerName}</p>
                  <p><strong>📧 Email :</strong> ${quoteData.customerEmail}</p>
                  <p><strong>🚗 Service :</strong> ${quoteData.service}</p>
                  ${quoteData.rejectionReason ? `
                    <p><strong>💬 Raison du rejet :</strong></p>
                    <div style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #ef4444;">
                      ${quoteData.rejectionReason}
                    </div>
                  ` : ''}
                </div>
                <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="color: #92400e; margin: 0;">⚠️ Pensez à contacter le client pour comprendre les raisons du rejet et proposer une alternative.</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/devis" 
                     style="background: #93374d; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    📊 Voir les devis
                  </a>
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                <p style="text-align: center; color: #6b7280;">Système de notification automatique<br><strong>NavetteXpress</strong></p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Erreur envoi email devis rejeté:', error);
      throw error;
    }

    console.log('✅ Email devis rejeté envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Envoie un email à l'admin quand un client accepte un devis
 */
export async function sendQuoteAcceptedEmail(
  quoteData: {
    quoteId: string;
    customerName: string;
    customerEmail: string;
    service: string;
    price: number;
  }
) {
  try {
    // Envoyer à l'admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@navettexpress.com';
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [adminEmail],
      subject: `✅ Devis accepté - ${quoteData.quoteId}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #e8f0f8; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border: 2px solid #10b981; border-radius: 8px; overflow: hidden;">
              <div style="background: #10b981; padding: 32px 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Navette Express</h1>
              </div>
              <div style="padding: 32px 24px;">
                <h2 style="color: #2c3e50; text-align: center;">✅ Devis Accepté</h2>
                <p>Excellente nouvelle ! Le client a accepté le devis suivant :</p>
                <div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #10b981; margin-top: 0;">📋 Devis ${quoteData.quoteId}</h3>
                  <p><strong>👤 Client :</strong> ${quoteData.customerName}</p>
                  <p><strong>📧 Email :</strong> ${quoteData.customerEmail}</p>
                  <p><strong>🚗 Service :</strong> ${quoteData.service}</p>
                  <p><strong>💰 Montant :</strong> ${quoteData.price}€</p>
                </div>
                <div style="background: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="color: #1e3a8a; margin: 0;">ℹ️ Une facture a été automatiquement générée et envoyée au client.</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/devis" 
                     style="background: #93374d; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    📊 Gérer les devis
                  </a>
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                <p style="text-align: center; color: #6b7280;">Système de notification automatique<br><strong>NavetteXpress</strong></p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Erreur envoi email devis accepté:', error);
      throw error;
    }

    console.log('✅ Email devis accepté envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}
