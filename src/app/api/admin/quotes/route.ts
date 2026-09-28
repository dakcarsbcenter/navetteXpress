export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { quotesTable, users } from '@/schema';
import { eq } from 'drizzle-orm';
import { requireQuotesCreate } from '@/utils/admin-permissions';
import { sendWithRetry } from '@/lib/notification-queue';
import { normalizePhoneForStorage } from '@/lib/phone';
import { emptyToUndefined, optionalCustomerEmail } from '@/lib/validation';
import { buildQuoteMessage, CONVENTION_SERVICE_ID, QUOTE_SERVICE_IDS } from '@/lib/quote-services';
import { buildQuoteConfirmedEmailPayload } from '@/lib/quote-notifications';

/**
 * Création d'un devis par l'admin, pour un client joint par téléphone.
 *
 * Le seul chemin de création existant était POST /api/quotes, réservé aux
 * formulaires publics : il est protégé par guardPublicFormSubmission (honeypot,
 * délai de remplissage minimum, token applicatif, rate limit par IP et par
 * email) et force le statut « en attente ». Inutilisable depuis le back-office,
 * d'où cette route dédiée, calquée sur POST /api/admin/bookings.
 *
 * Deux écarts assumés par rapport au formulaire public, pour les mêmes raisons
 * que les réservations :
 *  - l'email du client est optionnel ; la colonne étant NOT NULL, on stocke une
 *    chaîne vide et l'envoi au client est alors sauté ;
 *  - l'admin peut fixer le prix et envoyer le devis dans le même geste.
 */
const AdminQuoteCreateSchema = z.object({
  customerName: z.string().trim().min(2, 'Nom du client trop court').max(120),
  customerEmail: optionalCustomerEmail,
  customerPhone: z.string().trim().min(6, 'Téléphone trop court').max(30),

  service: z.enum([...QUOTE_SERVICE_IDS, CONVENTION_SERVICE_ID] as [string, ...string[]]),
  preferredDate: z.preprocess(
    emptyToUndefined,
    z.string().refine((v) => !isNaN(new Date(v).getTime()), 'Date souhaitée invalide').optional()
  ),

  numberOfPeople: z.number().int().min(1, 'Au moins 1 personne').max(200).optional(),
  duration: z.number().min(0.5, 'Durée invalide').max(365).optional(),
  departure: z.string().trim().min(2, 'Lieu de départ requis').max(255),
  destination: z.string().trim().min(2, 'Destination requise').max(255),
  paymentMode: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),

  estimatedPrice: z.union([z.number().min(0), z.null()]).optional(),
  adminNotes: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),

  /** Compte client existant à rattacher, pour que le devis apparaisse dans son espace. */
  userId: z.preprocess(emptyToUndefined, z.string().trim().max(64).optional()),
  /** « Enregistrer » (pending) ou « Enregistrer et envoyer au client » (sent). */
  status: z.enum(['pending', 'sent']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    let adminId: string;
    try {
      adminId = await requireQuotesCreate();
    } catch (permError) {
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
    }

    const parsed = AdminQuoteCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: 'Données du devis invalides',
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const body = parsed.data;

    // Le compte client rattaché doit exister : sinon la FK remonterait en 500.
    // Son email sert de repli : l'espace client liste les devis par
    // `customerEmail` (GET /api/quotes), un devis sans adresse resterait
    // invisible et impossible à accepter pour un client pourtant rattaché.
    let linkedAccountEmail: string | null = null;
    if (body.userId) {
      const clientRows = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, body.userId))
        .limit(1);
      if (clientRows.length === 0) {
        return NextResponse.json({ success: false, error: 'Compte client introuvable' }, { status: 400 });
      }
      linkedAccountEmail = clientRows[0].email ?? null;
    }

    const customerEmail = body.customerEmail ?? linkedAccountEmail ?? '';
    const [admin] = await db.select({ name: users.name }).from(users).where(eq(users.id, adminId)).limit(1);

    // Sans adresse, aucun envoi possible : le devis reste « en attente » et
    // l'admin le communique par téléphone ou WhatsApp.
    const wantsSend = body.status === 'sent';
    const canSend = wantsSend && Boolean(customerEmail);
    const status = canSend ? 'sent' : 'pending';

    const message = buildQuoteMessage({
      service: body.service,
      numberOfPeople: body.numberOfPeople ?? 1,
      duration: body.duration ?? 1,
      departure: body.departure,
      destination: body.destination,
      paymentMode: body.paymentMode,
      description: body.description,
      enteredBy: admin?.name || 'un administrateur',
    });

    const [newQuote] = await db
      .insert(quotesTable)
      .values({
        customerName: body.customerName,
        customerEmail,
        customerPhone: normalizePhoneForStorage(body.customerPhone) ?? body.customerPhone,
        service: body.service,
        preferredDate: body.preferredDate ? new Date(body.preferredDate) : null,
        message,
        status,
        adminNotes: body.adminNotes ?? null,
        estimatedPrice: body.estimatedPrice === null || body.estimatedPrice === undefined
          ? null
          : String(body.estimatedPrice),
        assignedTo: adminId,
        updatedAt: new Date(),
      })
      .returning();

    console.log(`✅ Devis #${newQuote.id} créé par l'admin pour ${newQuote.customerName} (statut: ${status})`);

    if (canSend) {
      await sendWithRetry('email', 'resend-mailer.sendQuoteConfirmedEmail', [
        customerEmail,
        buildQuoteConfirmedEmailPayload(newQuote),
      ]);
    }

    const sendWarning = wantsSend && !canSend
      ? "Devis enregistré mais non envoyé : le client n'a pas d'adresse email."
      : undefined;

    return NextResponse.json({
      success: true,
      data: newQuote,
      ...(sendWarning ? { sendWarning } : {}),
      message: canSend
        ? `Devis #${newQuote.id} créé et envoyé au client.`
        : `Devis #${newQuote.id} créé.`,
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Erreur lors de la création du devis par l\'admin:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur interne du serveur',
    }, { status: 500 });
  }
}
