export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

/**
 * Envoi (ou renvoi) par email d'un devis déjà enregistré.
 *
 * L'ancienne version renvoyait un 503 permanent : l'envoi d'email avait été
 * commenté lors du changement de prestataire et jamais réimplémenté. On
 * réutilise maintenant exactement le chemin de PUT /api/quotes/[id] et de la
 * création admin — buildQuoteConfirmedEmailPayload + sendWithRetry — pour que
 * les trois points d'envoi produisent le même email, avec le PDF joint et la
 * mise en file d'attente en cas d'échec.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { buildQuoteConfirmedEmailPayload } from '@/lib/quote-notifications';
import { sendWithRetry } from '@/lib/notification-queue';
import { db } from '@/db';
import { quotesTable } from '@/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé. Seuls les administrateurs peuvent envoyer des devis.' },
        { status: 403 }
      );
    }

    const quoteId = parseInt((await params).id);
    if (isNaN(quoteId)) {
      return NextResponse.json(
        { success: false, error: 'ID de devis invalide' },
        { status: 400 }
      );
    }

    const quote = await db
      .select()
      .from(quotesTable)
      .where(eq(quotesTable.id, quoteId))
      .limit(1);

    if (quote.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Devis non trouvé' },
        { status: 404 }
      );
    }

    const quoteData = quote[0];

    if (!quoteData.estimatedPrice) {
      return NextResponse.json(
        { success: false, error: 'Le devis doit avoir un prix estimé avant d\'être envoyé' },
        { status: 400 }
      );
    }

    // Devis saisi au téléphone : il n'y a rien à envoyer, le refuser plutôt que
    // de faire croire à un envoi (cohérent avec le `sendWarning` de la création
    // admin, qui n'envoie pas non plus sans adresse).
    if (!quoteData.customerEmail) {
      return NextResponse.json(
        { success: false, error: "Le client n'a pas d'adresse email : le devis doit lui être communiqué autrement." },
        { status: 400 }
      );
    }

    const result = await sendWithRetry('email', 'resend-mailer.sendQuoteConfirmedEmail', [
      quoteData.customerEmail,
      await buildQuoteConfirmedEmailPayload(quoteData),
    ]);

    // Échec définitif et non rejouable (adresse invalide, destinataire refusé) :
    // le statut ne doit pas passer à 'sent', sinon l'admin croit le client servi.
    if (!result.success && !result.queued) {
      return NextResponse.json(
        { success: false, error: `Envoi impossible : ${result.error || 'erreur inconnue'}` },
        { status: 502 }
      );
    }

    await db
      .update(quotesTable)
      .set({ status: 'sent', updatedAt: new Date() })
      .where(eq(quotesTable.id, quoteId));

    console.log(`✅ Devis ${quoteId} envoyé à ${quoteData.customerEmail}${result.queued ? ' (mis en file d\'attente)' : ''}`);

    return NextResponse.json({
      success: true,
      queued: result.queued ?? false,
      recipient: quoteData.customerEmail,
      message: result.queued
        ? `L'envoi à ${quoteData.customerEmail} est mis en file d'attente et sera réessayé automatiquement.`
        : `Le devis a été envoyé par email à ${quoteData.customerEmail}.`,
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi du devis:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
