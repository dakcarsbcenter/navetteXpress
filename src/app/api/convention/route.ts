export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { quotesTable } from '@/schema';
import { sendWithRetry } from '@/lib/notification-queue';
import { normalizePhoneForStorage } from '@/lib/phone';
import { CONVENTION_SERVICE_ID } from '@/lib/quote-services';
import { guardPublicFormSubmission } from '@/lib/security/publicFormGuard';

/**
 * Demande de convention entreprise (/entreprises).
 *
 * La demande est enregistrée dans `quotes` avec service = 'convention' : elle
 * arrive donc directement dans le pipeline commercial existant (admin →
 * Gestion des devis) sans nouvelle table ni nouvel écran. Les informations
 * propres au B2B (raison sociale, type d'établissement, volume mensuel) sont
 * consignées dans le message, comme le fait déjà le formulaire de devis pour
 * l'itinéraire et la durée.
 */

const COMPANY_TYPES = ['hotel', 'entreprise', 'ong', 'mission-diplomatique', 'autre'] as const;
const MONTHLY_VOLUMES = ['moins-10', '10-30', '30-100', 'plus-100'] as const;

const COMPANY_TYPE_LABELS: Record<string, string> = {
  hotel: 'Hôtel',
  entreprise: 'Entreprise',
  ong: 'ONG',
  'mission-diplomatique': 'Mission diplomatique',
  autre: 'Autre',
};

const MONTHLY_VOLUME_LABELS: Record<string, string> = {
  'moins-10': 'Moins de 10 courses par mois',
  '10-30': '10 à 30 courses par mois',
  '30-100': '30 à 100 courses par mois',
  'plus-100': 'Plus de 100 courses par mois',
};

const ConventionRequestSchema = z.object({
  companyName: z.string().trim().min(2).max(160),
  companyType: z.enum(COMPANY_TYPES),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().max(180),
  contactPhone: z.string().trim().min(6).max(30),
  monthlyVolume: z.enum(MONTHLY_VOLUMES).optional(),
  message: z.string().trim().max(2000).optional(),
  // Champs anti-bot (voir src/lib/security/publicFormGuard.ts)
  companyWebsite: z.string().max(200).optional(),
  formStartedAt: z.number().optional(),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = ConventionRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Tous les champs obligatoires doivent être renseignés'
      }, { status: 400 });
    }

    const data = validation.data;

    const guard = await guardPublicFormSubmission(request, {
      scope: 'convention',
      email: data.contactEmail,
      body,
      decoyResponse: () => NextResponse.json({
        success: true,
        message: 'Demande de convention envoyée'
      }, { status: 201 }),
    });
    if (!guard.ok) return guard.response;

    const contactEmail = guard.normalizedEmail;
    const companyTypeLabel = COMPANY_TYPE_LABELS[data.companyType];
    const monthlyVolumeLabel = data.monthlyVolume ? MONTHLY_VOLUME_LABELS[data.monthlyVolume] : undefined;

    const message = [
      `Demande de convention entreprise.`,
      `Société: ${data.companyName}`,
      `Type d'établissement: ${companyTypeLabel}`,
      `Contact: ${data.contactName}`,
      `Téléphone: ${data.contactPhone}`,
      `Volume mensuel estimé: ${monthlyVolumeLabel || 'Non précisé'}`,
      '',
      `Message: ${data.message || 'Aucun message complémentaire.'}`,
    ].join('\n');

    const newQuote = await db
      .insert(quotesTable)
      .values({
        // Le nom affiché dans le pipeline est celui de la société : c'est
        // l'entité avec laquelle la convention est signée.
        customerName: `${data.companyName} — ${data.contactName}`,
        customerEmail: contactEmail,
        customerPhone: normalizePhoneForStorage(data.contactPhone),
        service: CONVENTION_SERVICE_ID,
        message,
        status: 'pending',
        updatedAt: new Date()
      })
      .returning();

    const emailPayload = {
      quoteId: `CONV-${newQuote[0].id}`,
      companyName: data.companyName,
      companyType: companyTypeLabel,
      contactName: data.contactName,
      contactEmail,
      contactPhone: data.contactPhone,
      monthlyVolume: monthlyVolumeLabel,
      message: data.message,
    };

    // Accusé de réception au contact de la société
    await sendWithRetry('email', 'resend-mailer.sendNewConventionRequestEmail', [
      contactEmail,
      emailPayload,
      false
    ]);

    // Notification à l'adresse commerciale (distincte de ADMIN_EMAIL)
    const contactMailbox = process.env.CONTACT_EMAIL || 'contact@navettexpress.com';
    await sendWithRetry('email', 'resend-mailer.sendNewConventionRequestEmail', [
      contactMailbox,
      emailPayload,
      true
    ]);

    return NextResponse.json({
      success: true,
      message: 'Demande de convention envoyée'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Erreur lors de la création de la demande de convention:', error);
    const cause = error instanceof Error ? (error as Error & { cause?: unknown }).cause : undefined;
    if (cause) console.error('❌ Cause DB:', cause);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}
