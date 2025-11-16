import { Resend } from 'resend';
import PasswordResetEmail from '@/emails/PasswordResetEmail';
import AccountLockedEmail from '@/emails/AccountLockedEmail';

// Initialisation de Resend avec la clé API
const resend = new Resend(process.env.RESEND_API_KEY);

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
      subject: '🔐 Réinitialisation de votre mot de passe - NavetteXpress',
      react: PasswordResetEmail({ 
        userName, 
        resetUrl,
        expiresIn: '1 heure'
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
  
  // Formater la date en français
  const unlockTimeFormatted = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(unlockTime);

  try {
    console.log('🔒 [EMAIL] Envoi notification de blocage à:', email);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: '🔒 Alerte sécurité - Votre compte a été temporairement bloqué - NavetteXpress',
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
      subject: '✅ Votre mot de passe a été modifié - NavetteXpress',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px;">
              <h1 style="color: #333; font-size: 24px; text-align: center; margin-bottom: 30px;">
                ✅ Mot de passe modifié avec succès
              </h1>
              
              <p style="color: #333; font-size: 16px; line-height: 26px; margin: 16px 0;">
                Bonjour ${userName},
              </p>
              
              <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 16px; margin: 24px 0;">
                <p style="color: #155724; font-size: 16px; margin: 0; text-align: center;">
                  ✓ Votre mot de passe NavetteXpress a été modifié avec succès.
                </p>
              </div>

              <p style="color: #333; font-size: 16px; line-height: 26px; margin: 16px 0;">
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>

              <p style="color: #333; font-size: 16px; line-height: 26px; margin: 16px 0;">
                Si vous n'êtes pas à l'origine de cette modification, veuillez contacter notre support immédiatement.
              </p>

              <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 32px 0;">

              <p style="color: #525f7f; font-size: 16px; margin: 24px 0 8px;">
                Cordialement,<br>
                <strong>L'équipe NavetteXpress</strong>
              </p>

              <p style="color: #8898aa; font-size: 12px; margin: 0;">
                Cet email a été envoyé automatiquement. Merci de ne pas répondre à ce message.
              </p>
            </div>
          </body>
        </html>
      `,
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
