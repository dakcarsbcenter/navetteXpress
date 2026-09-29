export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { quotesTable, quoteTripsTable, users } from '@/schema';
import { eq } from 'drizzle-orm';
import { requireQuotesCreate } from '@/utils/admin-permissions';
import { sendWithRetry } from '@/lib/notification-queue';
import { normalizePhoneForStorage } from '@/lib/phone';
import { emptyToUndefined, optionalCustomerEmail } from '@/lib/validation';
import { buildQuoteMessage, buildMultiTripQuoteMessage, CONVENTION_SERVICE_ID, QUOTE_SERVICE_IDS, MAX_QUOTE_TRIPS } from '@/lib/quote-services';
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
  // Devis mono-trajet (saisie historique) : requis tant que `trips` est absent,
  // la vérification croisée se fait dans le superRefine ci-dessous.
  departure: z.string().trim().max(255).optional(),
  destination: z.string().trim().max(255).optional(),
  /** Devis multi-trajets : une ligne par course, comme le formulaire public. */
  trips: z.array(z.object({
    service: z.enum([...QUOTE_SERVICE_IDS, CONVENTION_SERVICE_ID] as [string, ...string[]]),
    departure: z.string().trim().min(2).max(255),
    destination: z.string().trim().min(2).max(255),
    scheduledDateTime: z.preprocess(
      emptyToUndefined,
      z.string().refine((v) => !isNaN(new Date(v).getTime()), 'Date de prise en charge invalide').optional()
    ),
    passengers: z.number().int().min(1).max(200),
    luggage: z.number().int().min(0).max(100),
    note: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
  })).min(1).max(MAX_QUOTE_TRIPS).optional(),
  /** Devis pour un tiers : personne réellement transportée. */
  passengerName: z.preprocess(emptyToUndefined, z.string().trim().min(2).max(120).optional()),
  passengerPhone: z.preprocess(emptyToUndefined, z.string().trim().max(30).optional()),
  paymentMode: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),

  estimatedPrice: z.union([z.number().min(0), z.null()]).optional(),
  adminNotes: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),

  /** Compte client existant à rattacher, pour que le devis apparaisse dans son espace. */
  userId: z.preprocess(emptyToUndefined, z.string().trim().max(64).optional()),
  /** « Enregistrer » (pending) ou « Enregistrer et envoyer au client » (sent). */
  status: z.enum(['pending', 'sent']).optional(),
}).superRefine((data, ctx) => {
  if (data.trips && data.trips.length > 0) return;
  if (!data.departure || data.departure.length < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['departure'], message: 'Lieu de départ requis' });
  }
  if (!data.destination || data.destination.length < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['destination'], message: 'Destination requise' });
  }
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

    const enteredBy = admin?.name || 'un administrateur';

    const message = body.trips && body.trips.length > 0
      ? buildMultiTripQuoteMessage({
          trips: body.trips.map((trip) => ({
            service: trip.service,
            departure: trip.departure,
            destination: trip.destination,
            scheduledDateTime: trip.scheduledDateTime ?? null,
            passengers: trip.passengers,
            luggage: trip.luggage,
            note: trip.note ?? null,
          })),
          paymentMode: body.paymentMode,
          description: body.description,
          passengerName: body.passengerName ?? null,
          passengerPhone: body.passengerPhone ?? null,
          enteredBy,
        })
      : buildQuoteMessage({
          service: body.service,
          numberOfPeople: body.numberOfPeople ?? 1,
          duration: body.duration ?? 1,
          departure: body.departure ?? '',
          destination: body.destination ?? '',
          paymentMode: body.paymentMode,
          description: body.description,
          enteredBy,
        });

    const [newQuote] = await db.transaction(async (tx) => {
      const inserted = await tx
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
        passengerName: body.passengerName ?? null,
        passengerPhone: normalizePhoneForStorage(body.passengerPhone) ?? null,
        assignedTo: adminId,
        updatedAt: new Date(),
      })
      .returning();

      if (body.trips && body.trips.length > 0) {
        await tx.insert(quoteTripsTable).values(body.trips.map((trip, index) => ({
          quoteId: inserted[0].id,
          position: index + 1,
          service: trip.service,
          departure: trip.departure,
          destination: trip.destination,
          scheduledDateTime: trip.scheduledDateTime ? new Date(trip.scheduledDateTime) : null,
          passengers: trip.passengers,
          luggage: trip.luggage,
          note: trip.note ?? null,
          updatedAt: new Date(),
        })));
      }

      return inserted;
    });

    console.log(`✅ Devis #${newQuote.id} créé par l'admin pour ${newQuote.customerName} (statut: ${status})`);

    if (canSend) {
      await sendWithRetry('email', 'resend-mailer.sendQuoteConfirmedEmail', [
        customerEmail,
        await buildQuoteConfirmedEmailPayload(newQuote),
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
