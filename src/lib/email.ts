import { Resend } from 'resend';
import PasswordResetEmail from '@/emails/PasswordResetEmail';
import AccountLockedEmail from '@/emails/AccountLockedEmail';
import VerificationEmail from '@/emails/VerificationEmail';
import {
  biSubject,
  formatDateTimeBilingual,
  headingBlock,
  paragraphBlock,
  emailShell,
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

// Email par défaut de l'expéditeur
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NavetteXpress <onboarding@resend.dev>';

/**
 * Envoie un email de réinitialisation de mot de passe
 * @param email - Email du destinataire
 * @param resetToken - Token de réinitialisation
 * @param userName - Nom de l'utilisateur
 * @returns Promise avec le résultat de l'envoi
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password/confirm?token=${resetToken}`;

  try {
    console.log('📧 [EMAIL] Envoi email de réinitialisation à:', email);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: biSubject('🔐 Réinitialisation de votre mot de passe', 'Reset your password'),
      react: PasswordResetEmail({ 
        userName, 
        resetUrl,
        expiresIn: '1 heure / 1 hour'
      }),
    });

    if (error) {
      console.error('❌ [EMAIL] Erreur lors de l\'envoi:', error);
      return { success: false, error };
    }

    console.log('✅ [EMAIL] Email envoyé avec succès:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ [EMAIL] Erreur inattendue:', error);
    return { success: false, error };
  }
}

/**
 * Envoie un email d'activation de compte (vérification d'adresse à l'inscription)
 * @param email - Email du destinataire
 * @param verificationToken - Token d'activation
 * @param userName - Nom de l'utilisateur
 * @returns Promise avec le résultat de l'envoi
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  userName: string
) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;

  try {
    console.log('📧 [EMAIL] Envoi email d\'activation de compte à:', email);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: biSubject('✉️ Activez votre compte', 'Activate your account'),
      react: VerificationEmail({
        userName,
        verifyUrl,
        expiresIn: '24 heures / 24 hours'
      }),
    });

    if (error) {
      console.error('❌ [EMAIL] Erreur lors de l\'envoi:', error);
      return { success: false, error };
    }

    console.log('✅ [EMAIL] Email d\'activation envoyé avec succès:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ [EMAIL] Erreur inattendue:', error);
    return { success: false, error };
  }
}

/**
 * Envoie un email de notification de compte bloqué
 * @param email - Email du destinataire
 * @param userName - Nom de l'utilisateur
 * @param unlockTime - Date de déblocage du compte
 * @returns Promise avec le résultat de l'envoi
 */
export async function sendAccountLockedEmail(
  email: string,
  userName: string,
  unlockTime: Date
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`;
  
  // JJ/MM/AAAA HH:MM : lisible dans les deux langues, contrairement à un format localisé
  const unlockTimeFormatted = formatDateTimeBilingual(unlockTime);

  try {
    console.log('🔒 [EMAIL] Envoi notification de blocage à:', email);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: biSubject(
        '🔒 Alerte sécurité — compte temporairement bloqué',
        'Security alert — account temporarily locked'
      ),
      react: AccountLockedEmail({
        userName,
        unlockTime: unlockTimeFormatted,
        resetUrl,
      }),
    });

    if (error) {
      console.error('❌ [EMAIL] Erreur lors de l\'envoi:', error);
      return { success: false, error };
    }

    console.log('✅ [EMAIL] Email de blocage envoyé avec succès:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ [EMAIL] Erreur inattendue:', error);
    return { success: false, error };
  }
}

/**
 * Envoie un email de confirmation de changement de mot de passe
 * @param email - Email du destinataire
 * @param userName - Nom de l'utilisateur
 * @returns Promise avec le résultat de l'envoi
 */
export async function sendPasswordChangedEmail(
  email: string,
  userName: string
) {
  try {
    console.log('✅ [EMAIL] Envoi confirmation de changement de mot de passe à:', email);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: biSubject('✅ Votre mot de passe a été modifié', 'Your password has been changed'),
      html: emailShell(
        `
        ${headingBlock('✅', 'Mot de passe modifié', 'Password changed')}
        ${paragraphBlock(
          `Bonjour ${userName}, votre mot de passe NavetteXpress a été modifié avec succès. Vous pouvez dès maintenant vous connecter avec votre nouveau mot de passe.`,
          `Hello ${userName}, your NavetteXpress password has been changed successfully. You can now log in with your new password.`
        )}
        ${paragraphBlock(
          "Si vous n'êtes pas à l'origine de cette modification, contactez notre support immédiatement.",
          'If you did not make this change, please contact our support immediately.'
        )}
      `,
        'customer'
      ),
    });

    if (error) {
      console.error('❌ [EMAIL] Erreur lors de l\'envoi:', error);
      return { success: false, error };
    }

    console.log('✅ [EMAIL] Email de confirmation envoyé avec succès:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ [EMAIL] Erreur inattendue:', error);
    return { success: false, error };
  }
}
