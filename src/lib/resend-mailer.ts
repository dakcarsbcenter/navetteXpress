/**
 * Module d'envoi d'emails transactionnels (Resend).
 *
 * Tous les messages sont bilingues FR/EN : bloc français, puis bloc anglais. Les fragments
 * HTML partagés (en-tête, tableaux à libellés bilingues, boutons, pied de page) vivent dans
 * src/lib/email-i18n.ts — voir ce fichier pour les règles de rédaction.
 */

import { Resend } from 'resend';
import {
  biSubject,
  esc,
  formatFCFA,
  headingBlock,
  paragraphBlock,
  dataTable,
  referenceBlock,
  ctaButton,
  emailShell,
  TEXT_DARK,
  TEXT_MUTED,
} from './email-i18n';

// Init paresseuse : évite de lever une erreur au chargement du module quand
// RESEND_API_KEY est absent (ex: au build Next.js, où les env vars runtime
// ne sont pas encore injectées).
let _resend: Resend | null = null;

function getResendClient(): Resend {
  if (_resend) return _resend;
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not defined in environment variables');
  }
  _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const resend = new Proxy({} as Resend, {
  get(_target, prop, receiver) {
    const client = getResendClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NavetteXpress <onboarding@resend.dev>';
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || '';
const adminEmail = () => process.env.ADMIN_EMAIL || 'admin@navettexpress.com';

/** Encart d'information ou d'avertissement, bilingue. */
function noticeBlock(fr: string, en: string, tone: 'info' | 'warning' = 'info'): string {
  const palette =
    tone === 'warning'
      ? { bg: '#FFF7ED', border: '#FDBA74' }
      : { bg: 'rgba(31,82,69,.06)', border: 'rgba(31,82,69,.3)' };
  return `
    <div style="background: ${palette.bg}; border: 1px solid ${palette.border}; border-radius: 8px; padding: 16px; margin: 22px 0;">
      <p style="margin: 0 0 4px 0; color: ${TEXT_DARK}; font-size: 14px; line-height: 1.6;">${esc(fr)}</p>
      <p style="margin: 0; color: ${TEXT_MUTED}; font-size: 14px; line-height: 1.6;">${esc(en)}</p>
    </div>`;
}

/** Deux boutons côte à côte (accepter / refuser), libellés bilingues. */
function dualCta(
  primary: { url: string; fr: string; en: string },
  secondary: { url: string; fr: string; en: string }
): string {
  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${primary.url}" style="background: #1F5245; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px; margin: 0 6px 10px 6px;">
        ${esc(primary.fr)} / ${esc(primary.en)}
      </a>
      <a href="${secondary.url}" style="background: #B8493C; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px; margin: 0 6px 10px 6px;">
        ${esc(secondary.fr)} / ${esc(secondary.en)}
      </a>
    </div>`;
}

/** Bloc de citation pour un message libre (chat, demande de devis). */
function quoteBlock(text: string): string {
  return `
    <div style="background: #f3f4f6; border-left: 3px solid #1F5245; padding: 14px 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
      <p style="margin: 0; color: ${TEXT_DARK}; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${esc(text)}</p>
    </div>`;
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
    const content = `
      ${headingBlock('🧾', 'Nouvelle facture', 'New invoice')}
      ${paragraphBlock(
        `Bonjour ${invoiceData.customerName}, nous vous remercions pour votre confiance. Voici le détail de votre facture.`,
        `Hello ${invoiceData.customerName}, thank you for your trust. Here are your invoice details.`
      )}
      ${referenceBlock(invoiceData.invoiceNumber)}
      ${dataTable(
        [
          { fr: 'Service', en: 'Service', value: invoiceData.service },
          { fr: "Date d'émission", en: 'Issue date', value: invoiceData.issueDate },
          { fr: "Date d'échéance", en: 'Due date', value: invoiceData.dueDate },
          { fr: 'Montant HT', en: 'Amount excl. tax', value: invoiceData.amountHT },
          { fr: 'TVA', en: 'VAT', value: invoiceData.vatAmount },
          { fr: 'Montant TTC', en: 'Total incl. tax', value: invoiceData.amountTTC },
        ],
        { fr: 'Détails de la facture', en: 'Invoice details' }
      )}
      ${ctaButton(invoiceData.invoiceUrl, 'Voir ma facture', 'View my invoice')}
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: biSubject(
        `🧾 Nouvelle facture ${invoiceData.invoiceNumber}`,
        `New invoice ${invoiceData.invoiceNumber}`
      ),
      html: emailShell(content, 'customer'),
    });

    if (error) {
      console.error('❌ Erreur envoi facture:', error);
      throw error;
    }

    console.log('✅ Email facture envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Envoie le devis au client, avec les liens d'acceptation et de refus
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
    const content = `
      ${headingBlock('💰', 'Votre devis est prêt', 'Your quote is ready')}
      ${paragraphBlock(
        `Bonjour ${quoteData.customerName}, nous avons le plaisir de vous proposer le devis suivant.`,
        `Hello ${quoteData.customerName}, we are pleased to send you the following quote.`
      )}
      ${referenceBlock(quoteData.quoteId)}
      ${dataTable(
        [
          { fr: 'Montant', en: 'Amount', value: quoteData.amount },
          { fr: 'Départ', en: 'Pick-up', value: quoteData.pickupLocation },
          { fr: 'Arrivée', en: 'Drop-off', value: quoteData.dropoffLocation },
          { fr: 'Date', en: 'Date', value: quoteData.pickupDate },
        ],
        { fr: 'Détails du devis', en: 'Quote details' }
      )}
      ${dualCta(
        { url: quoteData.acceptUrl, fr: '✅ Accepter', en: 'Accept' },
        { url: quoteData.rejectUrl, fr: '❌ Refuser', en: 'Decline' }
      )}
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: biSubject(
        `💰 Votre devis ${quoteData.quoteId} est prêt`,
        `Your quote ${quoteData.quoteId} is ready`
      ),
      html: emailShell(content, 'customer'),
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
    const content = `
      ${headingBlock('✅', 'Réservation confirmée', 'Booking confirmed')}
      ${paragraphBlock(
        `Bonjour ${bookingData.customerName}, excellente nouvelle : votre réservation a été confirmée par votre chauffeur.`,
        `Hello ${bookingData.customerName}, good news: your booking has been confirmed by your driver.`
      )}
      ${referenceBlock(bookingData.bookingId)}
      ${dataTable(
        [
          { fr: 'Chauffeur', en: 'Driver', value: bookingData.driverName },
          { fr: 'Véhicule', en: 'Vehicle', value: bookingData.vehicleInfo },
          { fr: 'Départ', en: 'Pick-up', value: bookingData.pickupLocation },
          { fr: 'Arrivée', en: 'Drop-off', value: bookingData.dropoffLocation },
          { fr: 'Date', en: 'Date', value: bookingData.pickupDate },
          { fr: 'Heure', en: 'Time', value: bookingData.pickupTime },
        ],
        { fr: 'Votre réservation', en: 'Your booking' }
      )}
      ${ctaButton(`${APP_URL()}/client/reservations`, '📱 Voir ma réservation', 'View my booking')}
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: biSubject(
        `✅ Réservation confirmée ${bookingData.bookingId}`,
        `Booking confirmed ${bookingData.bookingId}`
      ),
      html: emailShell(content, 'customer'),
    });

    if (error) {
      console.error('❌ Erreur envoi confirmation réservation:', error);
      throw error;
    }

    console.log('✅ Email confirmation réservation envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Alerte l'admin d'une nouvelle demande de réservation
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
    luggage?: number;
    /** Réservation passée pour un tiers : personne réellement transportée. */
    passengerName?: string | null;
    passengerPhone?: string | null;
  }
) {
  try {
    const content = `
      ${headingBlock('📋', 'Nouvelle demande de réservation', 'New booking request')}
      ${paragraphBlock(
        "Une nouvelle demande de réservation vient d'être créée et nécessite votre attention.",
        'A new booking request has just been created and needs your attention.'
      )}
      ${referenceBlock(bookingData.bookingId)}
      ${dataTable(
        [
          { fr: 'Client', en: 'Customer', value: bookingData.customerName },
          { fr: 'Passager', en: 'Passenger', value: bookingData.passengerName || undefined },
          { fr: 'Tél. passager', en: 'Passenger phone', value: bookingData.passengerPhone || undefined },
          { fr: 'Départ', en: 'Pick-up', value: bookingData.pickupLocation },
          { fr: 'Arrivée', en: 'Drop-off', value: bookingData.dropoffLocation },
          { fr: 'Date', en: 'Date', value: bookingData.pickupDate },
          { fr: 'Heure', en: 'Time', value: bookingData.pickupTime },
          { fr: 'Passagers', en: 'Passengers', value: bookingData.passengers || 1 },
          { fr: 'Bagages', en: 'Luggage', value: bookingData.luggage },
        ],
        { fr: 'Détails de la réservation', en: 'Booking details' }
      )}
      ${ctaButton(`${APP_URL()}/admin/reservations`, 'Voir la demande', 'View request')}
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: biSubject('📋 Nouvelle demande de réservation', 'New booking request'),
      html: emailShell(content, 'admin'),
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
 * Notifie l'admin de la création d'un nouveau compte client
 */
export async function sendNewAccountNotificationToAdmin(
  to: string,
  accountData: {
    userName: string;
    userEmail: string;
    userPhone?: string;
    createdAt: string;
  }
) {
  try {
    const content = `
      ${headingBlock('👤', 'Nouveau compte client créé', 'New customer account created')}
      ${paragraphBlock(
        "Un nouveau compte vient d'être créé sur la plateforme.",
        'A new account has just been created on the platform.'
      )}
      ${dataTable(
        [
          { fr: 'Nom', en: 'Name', value: accountData.userName },
          { fr: 'Email', en: 'Email', value: accountData.userEmail },
          { fr: 'Téléphone', en: 'Phone', value: accountData.userPhone },
          { fr: 'Créé le', en: 'Created on', value: accountData.createdAt },
        ],
        { fr: 'Détails du compte', en: 'Account details' }
      )}
      ${ctaButton(`${APP_URL()}/admin/clients`, 'Voir les clients', 'View customers')}
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: biSubject('👤 Nouveau compte client créé', 'New customer account created'),
      html: emailShell(content, 'admin'),
    });

    if (error) {
      console.error('❌ Erreur envoi email nouveau compte:', error);
      throw error;
    }

    console.log('✅ Email nouveau compte envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Accusé de réception d'une demande de devis — au client, ou à l'admin selon `isAdmin`
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
    const content = `
      ${
        isAdmin
          ? headingBlock('🎯', 'Nouvelle demande de devis', 'New quote request')
          : headingBlock('✅', 'Demande de devis reçue', 'Quote request received')
      }
      ${
        isAdmin
          ? paragraphBlock(
              `Une nouvelle demande de devis vient d'être soumise par ${quoteData.customerName}.`,
              `A new quote request has just been submitted by ${quoteData.customerName}.`
            )
          : paragraphBlock(
              `Bonjour ${quoteData.customerName}, nous avons bien reçu votre demande de devis.`,
              `Hello ${quoteData.customerName}, we have received your quote request.`
            )
      }
      ${referenceBlock(quoteData.quoteId)}
      ${dataTable(
        [
          { fr: 'Service', en: 'Service', value: quoteData.service },
          { fr: 'Date souhaitée', en: 'Preferred date', value: quoteData.preferredDate },
        ],
        { fr: 'Détails de la demande', en: 'Request details' }
      )}
      ${quoteBlock(quoteData.message)}
      ${
        isAdmin
          ? ''
          : noticeBlock(
              'Notre équipe étudie votre demande et vous enverra un devis personnalisé dans les plus brefs délais.',
              'Our team is reviewing your request and will send you a tailored quote shortly.'
            )
      }
      ${ctaButton(
        `${APP_URL()}/${isAdmin ? 'admin' : 'client'}/devis`,
        isAdmin ? '📊 Gérer les devis' : '📱 Suivre ma demande',
        isAdmin ? 'Manage quotes' : 'Track my request'
      )}
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: isAdmin
        ? biSubject(`🎯 Nouvelle demande de devis ${quoteData.quoteId}`, `New quote request ${quoteData.quoteId}`)
        : biSubject(`✅ Demande de devis reçue ${quoteData.quoteId}`, `Quote request received ${quoteData.quoteId}`),
      html: emailShell(content, isAdmin ? 'admin' : 'customer'),
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
 * Accusé de réception d'une candidature chauffeur — au candidat, ou à l'admin selon `isAdmin`
 */
export async function sendNewDriverApplicationEmail(
  to: string,
  data: {
    name: string;
    phone: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehiclePlateNumber: string;
  },
  isAdmin: boolean = false
) {
  try {
    const content = `
      ${
        isAdmin
          ? headingBlock('🚗', 'Nouvelle candidature chauffeur', 'New driver application')
          : headingBlock('✅', 'Candidature reçue', 'Application received')
      }
      ${
        isAdmin
          ? paragraphBlock(
              `${data.name} vient de candidater pour devenir chauffeur partenaire.`,
              `${data.name} has just applied to become a partner driver.`
            )
          : paragraphBlock(
              `Bonjour ${data.name}, nous avons bien reçu votre candidature pour devenir chauffeur partenaire.`,
              `Hello ${data.name}, we have received your application to become a partner driver.`
            )
      }
      ${dataTable(
        [
          { fr: 'Nom', en: 'Name', value: data.name },
          { fr: 'Téléphone / WhatsApp', en: 'Phone / WhatsApp', value: data.phone },
          { fr: 'Véhicule', en: 'Vehicle', value: `${data.vehicleBrand} ${data.vehicleModel}` },
          { fr: 'Immatriculation', en: 'Plate number', value: data.vehiclePlateNumber },
        ],
        { fr: 'Candidature', en: 'Application' }
      )}
      ${
        isAdmin
          ? ''
          : noticeBlock(
              'Notre équipe va étudier votre dossier et vous recontacter (permis, assurance, etc.) sous 48 heures ouvrées.',
              'Our team will review your file and get back to you (licence, insurance, etc.) within 48 working hours.'
            )
      }
      ${ctaButton(
        `${APP_URL()}/${isAdmin ? 'admin/utilisateurs' : ''}`,
        isAdmin ? '📊 Voir les candidatures' : '🌐 Retour au site',
        isAdmin ? 'View applications' : 'Back to the website'
      )}
    `;

    const { data: sent, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: isAdmin
        ? biSubject(`🚗 Nouvelle candidature chauffeur — ${data.name}`, `New driver application — ${data.name}`)
        : biSubject('✅ Candidature reçue', 'Application received'),
      html: emailShell(content, isAdmin ? 'admin' : 'customer'),
    });

    if (error) {
      console.error('❌ Erreur envoi email candidature chauffeur:', error);
      throw error;
    }

    console.log('✅ Email candidature chauffeur envoyé:', sent?.id);
    return sent;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Envoie un email au candidat chauffeur une fois sa candidature traitée (approuvée ou rejetée).
 */
export async function sendDriverApplicationStatusEmail(
  to: string,
  data: {
    name: string;
    status: 'approved' | 'rejected';
    rejectionReason?: string;
  }
) {
  try {
    const isApproved = data.status === 'approved';

    const content = `
      ${
        isApproved
          ? headingBlock('🎉', 'Profil chauffeur validé', 'Driver profile approved')
          : headingBlock('📄', 'Réponse à votre candidature', 'Response to your application')
      }
      ${
        isApproved
          ? paragraphBlock(
              `Bonjour ${data.name}, bonne nouvelle : votre profil de chauffeur partenaire vient d'être validé par notre équipe. Vous allez recevoir séparément vos identifiants de connexion à l'espace chauffeur.`,
              `Hello ${data.name}, good news: your partner driver profile has just been approved by our team. You will receive your driver portal credentials in a separate email.`
            )
          : paragraphBlock(
              `Bonjour ${data.name}, après étude de votre dossier, nous ne pouvons pas donner suite à votre candidature pour le moment.`,
              `Hello ${data.name}, after reviewing your file, we are unable to move forward with your application at this time.`
            )
      }
      ${
        !isApproved && data.rejectionReason
          ? dataTable([{ fr: 'Motif', en: 'Reason', value: data.rejectionReason }])
          : ''
      }
    `;

    const { data: sent, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: isApproved
        ? biSubject('🎉 Votre profil chauffeur est validé !', 'Your driver profile is approved!')
        : biSubject('Votre candidature chauffeur', 'Your driver application'),
      html: emailShell(content, 'customer'),
    });

    if (error) {
      console.error('❌ Erreur envoi email statut candidature chauffeur:', error);
      throw error;
    }

    console.log('✅ Email statut candidature chauffeur envoyé:', sent?.id);
    return sent;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Notifie l'admin qu'un client a rejeté un devis
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
    const content = `
      ${headingBlock('❌', 'Devis rejeté', 'Quote declined')}
      ${paragraphBlock(
        `${quoteData.customerName} vient de rejeter le devis ${quoteData.quoteId}.`,
        `${quoteData.customerName} has just declined quote ${quoteData.quoteId}.`
      )}
      ${referenceBlock(quoteData.quoteId)}
      ${dataTable(
        [
          { fr: 'Client', en: 'Customer', value: quoteData.customerName },
          { fr: 'Email', en: 'Email', value: quoteData.customerEmail },
          { fr: 'Service', en: 'Service', value: quoteData.service },
          { fr: 'Motif', en: 'Reason', value: quoteData.rejectionReason },
        ],
        { fr: 'Détails', en: 'Details' }
      )}
      ${ctaButton(`${APP_URL()}/admin/devis`, 'Gérer les devis', 'Manage quotes')}
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [adminEmail()],
      subject: biSubject(`❌ Devis rejeté ${quoteData.quoteId}`, `Quote declined ${quoteData.quoteId}`),
      html: emailShell(content, 'admin'),
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
 * Notifie l'admin qu'un client a accepté un devis
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
    const content = `
      ${headingBlock('✅', 'Devis accepté', 'Quote accepted')}
      ${paragraphBlock(
        `${quoteData.customerName} vient d'accepter le devis ${quoteData.quoteId}. La course peut être planifiée.`,
        `${quoteData.customerName} has just accepted quote ${quoteData.quoteId}. The ride can now be scheduled.`
      )}
      ${referenceBlock(quoteData.quoteId)}
      ${dataTable(
        [
          { fr: 'Client', en: 'Customer', value: quoteData.customerName },
          { fr: 'Email', en: 'Email', value: quoteData.customerEmail },
          { fr: 'Service', en: 'Service', value: quoteData.service },
          // La tarification est en francs CFA : l'ancien template affichait des euros ici.
          { fr: 'Montant', en: 'Amount', value: formatFCFA(quoteData.price) },
        ],
        { fr: 'Détails', en: 'Details' }
      )}
      ${ctaButton(`${APP_URL()}/admin/devis`, 'Gérer les devis', 'Manage quotes')}
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [adminEmail()],
      subject: biSubject(`✅ Devis accepté ${quoteData.quoteId}`, `Quote accepted ${quoteData.quoteId}`),
      html: emailShell(content, 'admin'),
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

/**
 * Notifie l'admin qu'un client a accepté le prix proposé pour sa réservation
 */
export async function sendBookingPriceAcceptedEmail(
  bookingData: {
    bookingId: number;
    customerName: string;
    customerEmail: string;
    pickupAddress: string;
    dropoffAddress: string;
    scheduledDateTime: string;
    price: string;
  }
) {
  try {
    const content = `
      ${headingBlock('✅', 'Prix accepté', 'Price accepted')}
      ${paragraphBlock(
        `${bookingData.customerName} vient d'accepter le prix proposé pour la réservation NX-${bookingData.bookingId}. Un chauffeur peut être assigné.`,
        `${bookingData.customerName} has just accepted the price offered for booking NX-${bookingData.bookingId}. A driver can now be assigned.`
      )}
      ${referenceBlock(`NX-${bookingData.bookingId}`)}
      ${dataTable(
        [
          { fr: 'Client', en: 'Customer', value: bookingData.customerName },
          { fr: 'Email', en: 'Email', value: bookingData.customerEmail },
          { fr: 'Départ', en: 'Pick-up', value: bookingData.pickupAddress },
          { fr: 'Arrivée', en: 'Drop-off', value: bookingData.dropoffAddress },
          { fr: 'Date et heure', en: 'Date and time', value: bookingData.scheduledDateTime },
          { fr: 'Prix', en: 'Price', value: formatFCFA(bookingData.price) },
        ],
        { fr: 'Détails', en: 'Details' }
      )}
      ${ctaButton(`${APP_URL()}/dashboard?tab=bookings`, 'Voir la réservation', 'View booking')}
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [adminEmail()],
      subject: biSubject(
        `✅ Prix accepté — Réservation NX-${bookingData.bookingId}`,
        `Price accepted — Booking NX-${bookingData.bookingId}`
      ),
      html: emailShell(content, 'admin'),
    });

    if (error) {
      console.error('❌ Erreur envoi email prix accepté:', error);
      throw error;
    }

    console.log('✅ Email prix accepté envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Notifie l'admin qu'un client a refusé le prix proposé pour sa réservation
 */
export async function sendBookingPriceRejectedEmail(
  bookingData: {
    bookingId: number;
    customerName: string;
    customerEmail: string;
    pickupAddress: string;
    dropoffAddress: string;
    scheduledDateTime: string;
    price: string;
    rejectionMessage?: string;
  }
) {
  try {
    const content = `
      ${headingBlock('❌', 'Prix refusé', 'Price declined')}
      ${paragraphBlock(
        `${bookingData.customerName} a refusé le prix proposé pour la réservation NX-${bookingData.bookingId}. Une nouvelle proposition est attendue.`,
        `${bookingData.customerName} has declined the price offered for booking NX-${bookingData.bookingId}. A new offer is expected.`
      )}
      ${referenceBlock(`NX-${bookingData.bookingId}`)}
      ${dataTable(
        [
          { fr: 'Client', en: 'Customer', value: bookingData.customerName },
          { fr: 'Email', en: 'Email', value: bookingData.customerEmail },
          { fr: 'Départ', en: 'Pick-up', value: bookingData.pickupAddress },
          { fr: 'Arrivée', en: 'Drop-off', value: bookingData.dropoffAddress },
          { fr: 'Date et heure', en: 'Date and time', value: bookingData.scheduledDateTime },
          { fr: 'Prix refusé', en: 'Declined price', value: formatFCFA(bookingData.price) },
        ],
        { fr: 'Détails', en: 'Details' }
      )}
      ${bookingData.rejectionMessage ? quoteBlock(bookingData.rejectionMessage) : ''}
      ${ctaButton(`${APP_URL()}/dashboard?tab=bookings`, 'Proposer un nouveau prix', 'Offer a new price')}
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [adminEmail()],
      subject: biSubject(
        `❌ Prix refusé — Réservation NX-${bookingData.bookingId}`,
        `Price declined — Booking NX-${bookingData.bookingId}`
      ),
      html: emailShell(content, 'admin'),
    });

    if (error) {
      console.error('❌ Erreur envoi email prix refusé:', error);
      throw error;
    }

    console.log('✅ Email prix refusé envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Notifie l'admin qu'un chauffeur a refusé une course qui lui était assignée
 */
export async function sendBookingRejectedByDriverEmail(
  bookingData: {
    bookingId: number;
    customerName: string;
    driverName: string;
    pickupAddress: string;
    dropoffAddress: string;
    scheduledDateTime: string;
    reason?: string;
  }
) {
  try {
    const content = `
      ${headingBlock('⚠️', 'Course refusée par le chauffeur', 'Ride declined by the driver')}
      ${paragraphBlock(
        `${bookingData.driverName} a refusé la course NX-${bookingData.bookingId}. Elle est de nouveau disponible pour assignation.`,
        `${bookingData.driverName} has declined ride NX-${bookingData.bookingId}. It is available for reassignment.`
      )}
      ${referenceBlock(`NX-${bookingData.bookingId}`)}
      ${dataTable(
        [
          { fr: 'Chauffeur', en: 'Driver', value: bookingData.driverName },
          { fr: 'Client', en: 'Customer', value: bookingData.customerName },
          { fr: 'Départ', en: 'Pick-up', value: bookingData.pickupAddress },
          { fr: 'Arrivée', en: 'Drop-off', value: bookingData.dropoffAddress },
          { fr: 'Date et heure', en: 'Date and time', value: bookingData.scheduledDateTime },
          { fr: 'Motif', en: 'Reason', value: bookingData.reason },
        ],
        { fr: 'Détails', en: 'Details' }
      )}
      ${ctaButton(`${APP_URL()}/admin/dashboard?tab=bookings`, 'Réassigner la course', 'Reassign the ride')}
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [adminEmail()],
      subject: biSubject(
        `⚠️ Course refusée — Réservation NX-${bookingData.bookingId}`,
        `Ride declined — Booking NX-${bookingData.bookingId}`
      ),
      html: emailShell(content, 'admin'),
    });

    if (error) {
      console.error('❌ Erreur envoi email course refusée:', error);
      throw error;
    }

    console.log('✅ Email course refusée envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Notifie l'admin qu'un client a annulé sa réservation
 */
export async function sendBookingCancelledByClientEmail(
  bookingData: {
    bookingId: number;
    customerName: string;
    pickupAddress: string;
    dropoffAddress: string;
    scheduledDateTime: string;
    reason?: string;
    assignedDriverName?: string;
  }
) {
  try {
    const content = `
      ${headingBlock('🚫', 'Réservation annulée par le client', 'Booking cancelled by the customer')}
      ${paragraphBlock(
        `${bookingData.customerName} vient d'annuler la réservation NX-${bookingData.bookingId}.`,
        `${bookingData.customerName} has just cancelled booking NX-${bookingData.bookingId}.`
      )}
      ${referenceBlock(`NX-${bookingData.bookingId}`)}
      ${dataTable(
        [
          { fr: 'Client', en: 'Customer', value: bookingData.customerName },
          { fr: 'Chauffeur assigné', en: 'Assigned driver', value: bookingData.assignedDriverName },
          { fr: 'Départ', en: 'Pick-up', value: bookingData.pickupAddress },
          { fr: 'Arrivée', en: 'Drop-off', value: bookingData.dropoffAddress },
          { fr: 'Date et heure', en: 'Date and time', value: bookingData.scheduledDateTime },
          { fr: 'Motif', en: 'Reason', value: bookingData.reason },
        ],
        { fr: 'Détails', en: 'Details' }
      )}
      ${ctaButton(`${APP_URL()}/admin/dashboard?tab=bookings`, 'Voir les réservations', 'View bookings')}
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [adminEmail()],
      subject: biSubject(
        `🚫 Réservation annulée par le client — NX-${bookingData.bookingId}`,
        `Booking cancelled by the customer — NX-${bookingData.bookingId}`
      ),
      html: emailShell(content, 'admin'),
    });

    if (error) {
      console.error('❌ Erreur envoi email annulation client:', error);
      throw error;
    }

    console.log('✅ Email annulation client envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Notifie l'admin d'une demande de passage en compte professionnel
 */
export async function sendCompanyRequestNotificationToAdmin(
  to: string,
  request: {
    userId: string;
    name: string;
    email: string;
    companyType?: string | null;
    companyName?: string | null;
  }
) {
  try {
    const typeLabel: Record<string, string> = {
      hotel: 'Hôtel / Hotel',
      entreprise: 'Entreprise / Company',
      ong: 'ONG / NGO',
    };
    const resolvedType = request.companyType
      ? typeLabel[request.companyType] || request.companyType
      : 'Professionnel / Business';

    const content = `
      ${headingBlock('🏢', 'Demande de compte professionnel', 'Business account request')}
      ${paragraphBlock(
        `Un client a demandé le passage en compte ${resolvedType} et attend votre validation.`,
        `A customer has requested a ${resolvedType} account and is waiting for your approval.`
      )}
      ${dataTable(
        [
          { fr: 'Client', en: 'Customer', value: request.name },
          { fr: 'Email', en: 'Email', value: request.email },
          { fr: 'Type de compte', en: 'Account type', value: resolvedType },
          { fr: 'Raison sociale', en: 'Company name', value: request.companyName },
        ],
        { fr: 'Demande', en: 'Request' }
      )}
      ${ctaButton(`${APP_URL()}/admin/dashboard?tab=company-requests`, 'Traiter la demande', 'Review request')}
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: biSubject('🏢 Nouvelle demande de compte professionnel', 'New business account request'),
      html: emailShell(content, 'admin'),
    });

    if (error) {
      console.error('❌ Erreur envoi email demande compte pro:', error);
      throw error;
    }

    console.log('✅ Email demande compte pro envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Prévient un client ou un chauffeur qu'il a reçu un nouveau message dans le chat
 */
export async function sendNewChatMessageToRecipientEmail(
  to: string,
  params: { toName?: string | null; senderName: string; content: string; conversationId: number }
) {
  try {
    const content = `
      ${headingBlock('💬', 'Nouveau message', 'New message')}
      ${paragraphBlock(
        `Bonjour${params.toName ? ` ${params.toName}` : ''}, vous avez reçu un nouveau message de ${params.senderName}.`,
        `Hello${params.toName ? ` ${params.toName}` : ''}, you have received a new message from ${params.senderName}.`
      )}
      ${quoteBlock(params.content)}
      ${ctaButton(APP_URL(), 'Répondre sur NavetteXpress', 'Reply on NavetteXpress')}
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: biSubject(
        `💬 Nouveau message de ${params.senderName}`,
        `New message from ${params.senderName}`
      ),
      html: emailShell(content, 'customer'),
    });

    if (error) {
      console.error('❌ Erreur envoi email nouveau message:', error);
      throw error;
    }

    console.log('✅ Email nouveau message envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Notifie l'équipe support (ADMIN_EMAIL) qu'un client a envoyé un message dans le chat support.
 */
export async function sendNewChatMessageToAdminEmail(
  params: { senderName: string; content: string; conversationId: number }
) {
  try {
    const content = `
      ${headingBlock('💬', 'Nouveau message support', 'New support message')}
      ${paragraphBlock(
        `${params.senderName} vient d'envoyer un message dans le chat support.`,
        `${params.senderName} has just sent a message in the support chat.`
      )}
      ${quoteBlock(params.content)}
      ${ctaButton(`${APP_URL()}/admin/dashboard?tab=support`, 'Ouvrir le support', 'Open support')}
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [adminEmail()],
      subject: biSubject(
        `💬 Nouveau message support de ${params.senderName}`,
        `New support message from ${params.senderName}`
      ),
      html: emailShell(content, 'admin'),
    });

    if (error) {
      console.error('❌ Erreur envoi email support:', error);
      throw error;
    }

    console.log('✅ Email support envoyé:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Notifie le client (ou le chauffeur assigné) qu'une réservation a été modifiée par
 * l'administration, en listant chaque champ touché sous la forme "avant → après".
 *
 * Utile surtout pour les réservations créées par des visiteurs non connectés : ils ne
 * peuvent pas corriger leur saisie eux-mêmes, c'est l'admin qui le fait à leur place.
 */
export async function sendBookingUpdatedEmail(
  to: string,
  data: {
    id: number;
    reference: string;
    customerName: string;
    pickupAddress: string;
    dropoffAddress: string;
    scheduledDateTime: string;
    passengers: number;
    luggage: number;
    price?: string | null;
    changes: { labelFr: string; labelEn: string; before: string; after: string }[];
    recipient: 'client' | 'driver';
  }
) {
  const isDriver = data.recipient === 'driver';
  const detailUrl = isDriver ? `${APP_URL()}/driver/courses` : `${APP_URL()}/client/reservations`;

  const changesRows = data.changes
    .map(
      (c) => `
      <tr>
        <td style="padding: 10px 0; color: ${TEXT_DARK}; font-weight: bold; width: 38%; vertical-align: top;">
          ${esc(c.labelFr)} <span style="color: ${TEXT_MUTED}; font-weight: normal;">/ ${esc(c.labelEn)}</span>
        </td>
        <td style="padding: 10px 0; color: ${TEXT_MUTED}; text-decoration: line-through;">${esc(c.before)}</td>
        <td style="padding: 10px 6px; color: #9ca3af;">&rarr;</td>
        <td style="padding: 10px 0; color: #1F5245; font-weight: bold;">${esc(c.after)}</td>
      </tr>`
    )
    .join('');

  const content = `
    ${headingBlock('🔄', 'Réservation modifiée', 'Booking updated')}
    ${paragraphBlock(
      isDriver
        ? `Bonjour, les informations de la course ${data.reference} (client : ${data.customerName}) viennent d'être mises à jour par notre équipe. Merci d'en tenir compte.`
        : `Bonjour ${data.customerName}, votre réservation ${data.reference} vient d'être mise à jour par notre équipe.`,
      isDriver
        ? `Hello, the details of ride ${data.reference} (customer: ${data.customerName}) have just been updated by our team. Please take them into account.`
        : `Hello ${data.customerName}, your booking ${data.reference} has just been updated by our team.`
    )}
    ${referenceBlock(data.reference)}

    <div style="background: #FFF7ED; border: 1px solid #FDBA74; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: ${TEXT_DARK}; margin: 0 0 14px 0; font-size: 16px;">
        Ce qui a changé <span style="color: ${TEXT_MUTED}; font-weight: normal;">/ What changed</span>
      </h3>
      <table style="width: 100%; border-collapse: collapse;">${changesRows}</table>
    </div>

    ${dataTable(
      [
        { fr: 'Départ', en: 'Pick-up', value: data.pickupAddress },
        { fr: 'Arrivée', en: 'Drop-off', value: data.dropoffAddress },
        { fr: 'Date et heure', en: 'Date and time', value: data.scheduledDateTime },
        { fr: 'Passagers', en: 'Passengers', value: data.passengers },
        { fr: 'Bagages', en: 'Luggage', value: data.luggage },
        { fr: 'Prix', en: 'Price', value: data.price ? formatFCFA(data.price) : undefined },
      ],
      { fr: 'Réservation à jour', en: 'Updated booking' }
    )}

    ${paragraphBlock(
      "Si l'une de ces informations vous semble incorrecte, répondez à cet email ou contactez-nous.",
      'If any of this looks wrong, reply to this email or get in touch with us.'
    )}

    ${ctaButton(detailUrl, isDriver ? 'Voir la course' : 'Voir ma réservation', 'View booking')}
  `;

  try {
    const { data: sent, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: biSubject(
        `🔄 Réservation modifiée ${data.reference}`,
        `Booking updated ${data.reference}`
      ),
      html: emailShell(content, 'customer'),
    });

    if (error) {
      console.error('❌ Erreur envoi email réservation modifiée:', error);
      throw error;
    }

    console.log('✅ Email réservation modifiée envoyé:', sent?.id);
    return sent;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}
