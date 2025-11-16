/**
 * Module d'envoi d'emails avec templates Resend
 * 
 * Ce module utilise les templates configurés dans le dashboard Resend
 * au lieu de générer le HTML dynamiquement avec React Email
 */

import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NavetteXpress <onboarding@resend.dev>';

/**
 * IDs des templates configurés dans Resend Dashboard
 * 
 * ⚠️ IMPORTANT : Remplacez ces IDs par ceux de vos templates Resend
 * 
 * Pour obtenir les IDs :
 * 1. Allez sur https://resend.com/emails/templates
 * 2. Cliquez sur un template
 * 3. L'ID est dans l'URL : /templates/[TEMPLATE_ID]
 */
const TEMPLATE_IDS = {
  PASSWORD_RESET: process.env.RESEND_TEMPLATE_PASSWORD_RESET || 'password-reset',
  ACCOUNT_LOCKED: process.env.RESEND_TEMPLATE_ACCOUNT_LOCKED || 'account-locked',
  PASSWORD_CHANGED: process.env.RESEND_TEMPLATE_PASSWORD_CHANGED || 'password-changed',
  WELCOME: process.env.RESEND_TEMPLATE_WELCOME || 'welcome',
} as const;

/**
 * Envoie un email de réinitialisation de mot de passe
 * 
 * @param to - Email du destinataire
 * @param resetToken - Token de réinitialisation
 * @param userName - Nom de l'utilisateur
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  userName: string = 'Utilisateur'
): Promise<void> {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/confirm?token=${resetToken}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'Réinitialisation de votre mot de passe - NavetteXpress',
      react: undefined, // Pas de React, on utilise un template
      html: undefined,  // Le HTML sera fourni par le template
      // @ts-ignore - Resend template API
      template: TEMPLATE_IDS.PASSWORD_RESET,
      // @ts-ignore - Variables pour le template
      variables: {
        userName,
        resetUrl,
      },
    });

    if (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }

    console.log('✅ Email de réinitialisation envoyé:', data?.id);
  } catch (error: any) {
    console.error('❌ Erreur fatale lors de l\'envoi de l\'email:', error);
    throw error;
  }
}

/**
 * Envoie un email de notification de compte bloqué
 * 
 * @param to - Email du destinataire
 * @param userName - Nom de l'utilisateur
 * @param unlockDate - Date de déblocage
 */
export async function sendAccountLockedEmail(
  to: string,
  userName: string,
  unlockDate: Date
): Promise<void> {
  try {
    const unlockTime = unlockDate.toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: '🔒 Alerte sécurité - Compte temporairement bloqué - NavetteXpress',
      // @ts-ignore - Resend template API
      template: TEMPLATE_IDS.ACCOUNT_LOCKED,
      // @ts-ignore - Variables pour le template
      variables: {
        userName,
        unlockTime,
        resetUrl,
      },
    });

    if (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de blocage:', error);
      throw new Error(`Failed to send account locked email: ${error.message}`);
    }

    console.log('✅ Email de blocage de compte envoyé:', data?.id);
  } catch (error: any) {
    console.error('❌ Erreur fatale lors de l\'envoi de l\'email:', error);
    throw error;
  }
}

/**
 * Envoie un email de confirmation de changement de mot de passe
 * 
 * @param to - Email du destinataire
 * @param userName - Nom de l'utilisateur
 */
export async function sendPasswordChangedEmail(
  to: string,
  userName: string = 'Utilisateur'
): Promise<void> {
  try {
    const supportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/support`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: '✅ Votre mot de passe a été modifié - NavetteXpress',
      // @ts-ignore - Resend template API
      template: TEMPLATE_IDS.PASSWORD_CHANGED,
      // @ts-ignore - Variables pour le template
      variables: {
        userName,
        supportUrl,
      },
    });

    if (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de confirmation:', error);
      throw new Error(`Failed to send password changed email: ${error.message}`);
    }

    console.log('✅ Email de confirmation de changement envoyé:', data?.id);
  } catch (error: any) {
    console.error('❌ Erreur fatale lors de l\'envoi de l\'email:', error);
    // On ne throw pas ici car c'est juste une notification
    console.warn('⚠️ L\'email de confirmation n\'a pas pu être envoyé, mais le mot de passe a été changé');
  }
}

/**
 * Envoie un email de bienvenue
 * 
 * @param to - Email du destinataire
 * @param userName - Nom de l'utilisateur
 */
export async function sendWelcomeEmail(
  to: string,
  userName: string = 'Utilisateur'
): Promise<void> {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: '🎉 Bienvenue chez NavetteXpress !',
      // @ts-ignore - Resend template API
      template: TEMPLATE_IDS.WELCOME,
      // @ts-ignore - Variables pour le template
      variables: {
        userName,
        dashboardUrl,
      },
    });

    if (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue:', error);
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }

    console.log('✅ Email de bienvenue envoyé:', data?.id);
  } catch (error: any) {
    console.error('❌ Erreur fatale lors de l\'envoi de l\'email:', error);
    // On ne throw pas ici car c'est juste une notification
    console.warn('⚠️ L\'email de bienvenue n\'a pas pu être envoyé');
  }
}

/**
 * Fonction de test pour vérifier la configuration Resend
 */
export async function testResendConfiguration(): Promise<boolean> {
  try {
    console.log('🧪 Test de la configuration Resend...');
    
    // Test simple d'envoi
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ['delivered@resend.dev'], // Email de test Resend
      subject: 'Test de configuration NavetteXpress',
      html: '<p>Si vous recevez cet email, la configuration Resend fonctionne ! ✅</p>',
    });

    if (error) {
      console.error('❌ Erreur de configuration:', error);
      return false;
    }

    console.log('✅ Configuration Resend OK. Email de test envoyé:', data?.id);
    return true;
  } catch (error: any) {
    console.error('❌ Erreur fatale:', error);
    return false;
  }
}
