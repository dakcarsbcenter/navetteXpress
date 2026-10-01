export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { quotesTable, quoteTripsTable, invoicesTable } from '@/schema';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { sendWithRetry } from '@/lib/notification-queue';
import { buildQuoteConfirmedEmailPayload } from '@/lib/quote-notifications';
import { getQuoteTrips, sumTripPrices } from '@/lib/quote-trips';
import { hasQuotesPermission } from '@/lib/quote-permissions';
import { MAX_QUOTE_TRIPS } from '@/lib/quote-services';
import { createBookingsForQuote } from '@/lib/quote-acceptance';
import {
  QUOTE_STATUS_LABELS,
  canTransition,
  transitionError,
  type QuoteStatus,
} from '@/lib/quote-workflow';

// GET - Récupérer une demande de devis spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;

    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    const userRole = session.user.role || 'customer';
    const hasReadPermission = await hasQuotesPermission(userRole, 'read');

    if (!hasReadPermission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Vous n\'avez pas la permission de voir ce devis' 
      }, { status: 403 });
    }

    const quote = await db
      .select()
      .from(quotesTable)
      .where(eq(quotesTable.id, parseInt((await params).id)))
      .limit(1);

    if (quote.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Demande de devis non trouvée' 
      }, { status: 404 });
    }

    const trips = await getQuoteTrips(quote[0].id);

    return NextResponse.json({ 
      success: true, 
      data: { ...quote[0], trips }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la demande de devis:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

/**
 * Une ligne de trajet envoyée par le back-office. `id` absent = nouvelle ligne.
 * Les champs omis sur une ligne existante sont laissés tels quels : l'ancien
 * contrat (seul `estimatedPrice` était envoyé) reste donc valide.
 */
type TripPayload = {
  id?: number | string | null;
  service?: string;
  departure?: string;
  destination?: string;
  scheduledDateTime?: string | null;
  passengers?: number | string | null;
  luggage?: number | string | null;
  note?: string | null;
  estimatedPrice?: number | string | null;
};

/** Montant décimal : '' et null effacent la valeur. */
function toDecimal(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  return String(raw);
}

function toCount(raw: unknown, fallback: number): number {
  const parsed = parseInt(String(raw), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Levée dans la transaction pour remonter un 409 plutôt qu'un 500. */
class QuoteConflictError extends Error {}

// PUT - Mettre à jour une demande de devis
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Non authentifié'
      }, { status: 401 });
    }

    const userRole = session.user.role || 'customer';
    const hasUpdatePermission = await hasQuotesPermission(userRole, 'update');

    if (!hasUpdatePermission) {
      return NextResponse.json({
        success: false,
        error: 'Vous n\'avez pas la permission de modifier ce devis'
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      service,
      preferredDate,
      message,
      status,
      adminNotes,
      estimatedPrice,
      assignedTo,
      trips,
      // Champs du document officiel, saisis par l'admin au moment de produire le devis
      documentObject,
      validUntil,
      customerAddress,
      customerNinea,
      taxRate
    } = body as Record<string, unknown> & { trips?: TripPayload[] };

    const quoteId = parseInt((await params).id);
    if (!Number.isFinite(quoteId)) {
      return NextResponse.json({ success: false, error: 'Identifiant de devis invalide' }, { status: 400 });
    }

    const [existingQuote] = await db
      .select()
      .from(quotesTable)
      .where(eq(quotesTable.id, quoteId))
      .limit(1);

    if (!existingQuote) {
      return NextResponse.json({
        success: false,
        error: 'Demande de devis non trouvée'
      }, { status: 404 });
    }

    // Une facture émise fige la prestation : ses lignes sont recopiées dans
    // `invoices.items` et des réservations en découlent déjà.
    const [linkedInvoice] = await db
      .select({ id: invoicesTable.id, invoiceNumber: invoicesTable.invoiceNumber })
      .from(invoicesTable)
      .where(eq(invoicesTable.quoteId, quoteId))
      .limit(1);

    // Préparer les champs à mettre à jour
    const updateData: Partial<typeof quotesTable.$inferInsert> = {
      updatedAt: new Date()
    };

    // Mise à jour des informations client si fournies
    if (customerName !== undefined) updateData.customerName = String(customerName);
    if (customerEmail !== undefined) updateData.customerEmail = String(customerEmail);
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone ? String(customerPhone) : null;
    if (service !== undefined) updateData.service = String(service);
    if (preferredDate !== undefined) updateData.preferredDate = preferredDate ? new Date(String(preferredDate)) : null;
    if (message !== undefined) updateData.message = String(message);

    // Étape du pipeline : seules les transitions de quote-workflow sont acceptées.
    if (status !== undefined && status !== existingQuote.status) {
      const from = existingQuote.status as QuoteStatus;
      const to = status as QuoteStatus;
      if (!QUOTE_STATUS_LABELS[to]) {
        return NextResponse.json({ success: false, error: 'Statut de devis inconnu' }, { status: 400 });
      }
      if (!canTransition(from, to)) {
        return NextResponse.json({ success: false, error: transitionError(from, to) }, { status: 409 });
      }
      updateData.status = to;
    }

    if (adminNotes !== undefined) updateData.adminNotes = adminNotes === null ? null : String(adminNotes);
    if (estimatedPrice !== undefined) updateData.estimatedPrice = toDecimal(estimatedPrice);
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo ? String(assignedTo) : null;

    // Taux de TVA du devis, repris par la facture qui en découlera.
    if (taxRate !== undefined) {
      const rate = parseFloat(String(taxRate));
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        return NextResponse.json({ success: false, error: 'Taux de TVA invalide' }, { status: 400 });
      }
      updateData.taxRate = rate.toFixed(2);
    }

    // Champs du document. `reference` et `issuedAt` ne sont volontairement pas
    // modifiables ici : ils sont figes par la generation du PDF.
    if (documentObject !== undefined) updateData.documentObject = documentObject ? String(documentObject) : null;
    if (customerAddress !== undefined) updateData.customerAddress = customerAddress ? String(customerAddress) : null;
    if (customerNinea !== undefined) updateData.customerNinea = customerNinea ? String(customerNinea) : null;
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(String(validUntil)) : null;

    // Trajets : la liste reçue est la liste complète du devis. Les lignes
    // absentes sont supprimées, les nouvelles insérées, les positions réécrites
    // dans l'ordre reçu. Les champs omis d'une ligne existante sont conservés,
    // ce qui laisse valide l'ancien appel « prix seulement ».
    if (Array.isArray(trips)) {
      if (linkedInvoice) {
        return NextResponse.json({
          success: false,
          error: `Les trajets ne sont plus modifiables : la facture ${linkedInvoice.invoiceNumber} a déjà été émise.`
        }, { status: 409 });
      }

      if (trips.length > MAX_QUOTE_TRIPS) {
        return NextResponse.json({
          success: false,
          error: `Un devis ne peut pas dépasser ${MAX_QUOTE_TRIPS} trajets`
        }, { status: 400 });
      }

      try {
        await db.transaction(async (tx) => {
          const existingTrips = await tx
            .select()
            .from(quoteTripsTable)
            .where(eq(quoteTripsTable.quoteId, quoteId));
          const byId = new Map(existingTrips.map((t) => [t.id, t]));

          const keptIds = new Set(
            trips
              .map((trip) => parseInt(String(trip?.id), 10))
              .filter((id) => byId.has(id))
          );

          for (const trip of existingTrips) {
            if (keptIds.has(trip.id)) continue;
            // La course est déjà partie chez un chauffeur : la retirer du devis
            // laisserait une réservation orpheline.
            if (trip.bookingId) {
              throw new QuoteConflictError(
                `Le trajet ${trip.position} (${trip.departure} → ${trip.destination}) a déjà été converti en réservation et ne peut plus être supprimé.`
              );
            }
            await tx.delete(quoteTripsTable).where(eq(quoteTripsTable.id, trip.id));
          }

          // Deux passes sur `position` : l'index unique (quoteId, position)
          // interdit un renumérotage direct. Les positions négatives servent de
          // zone de transit.
          const finalOrder: number[] = [];

          for (const [index, trip] of trips.entries()) {
            const temporaryPosition = -(index + 1);
            const tripId = parseInt(String(trip?.id), 10);
            const current = byId.get(tripId);

            if (current) {
              const changes: Partial<typeof quoteTripsTable.$inferInsert> = {
                position: temporaryPosition,
                updatedAt: new Date(),
              };
              if (trip.service !== undefined) changes.service = String(trip.service);
              if (trip.departure !== undefined) changes.departure = String(trip.departure).trim();
              if (trip.destination !== undefined) changes.destination = String(trip.destination).trim();
              if (trip.scheduledDateTime !== undefined) {
                changes.scheduledDateTime = trip.scheduledDateTime ? new Date(trip.scheduledDateTime) : null;
              }
              if (trip.passengers !== undefined) changes.passengers = Math.max(1, toCount(trip.passengers, current.passengers));
              if (trip.luggage !== undefined) changes.luggage = Math.max(0, toCount(trip.luggage, current.luggage));
              if (trip.note !== undefined) changes.note = trip.note ? String(trip.note) : null;
              if (trip.estimatedPrice !== undefined) changes.estimatedPrice = toDecimal(trip.estimatedPrice);

              await tx.update(quoteTripsTable).set(changes).where(eq(quoteTripsTable.id, tripId));
              finalOrder.push(tripId);
              continue;
            }

            const departure = String(trip.departure ?? '').trim();
            const destination = String(trip.destination ?? '').trim();
            if (!departure || !destination) {
              throw new QuoteConflictError('Chaque nouveau trajet doit avoir un départ et une destination.');
            }

            const [inserted] = await tx
              .insert(quoteTripsTable)
              .values({
                quoteId,
                position: temporaryPosition,
                service: String(trip.service || existingQuote.service),
                departure,
                destination,
                scheduledDateTime: trip.scheduledDateTime ? new Date(trip.scheduledDateTime) : null,
                passengers: Math.max(1, toCount(trip.passengers, 1)),
                luggage: Math.max(0, toCount(trip.luggage, 0)),
                note: trip.note ? String(trip.note) : null,
                estimatedPrice: toDecimal(trip.estimatedPrice),
                updatedAt: new Date(),
              })
              .returning({ id: quoteTripsTable.id });

            finalOrder.push(inserted.id);
          }

          for (const [index, id] of finalOrder.entries()) {
            await tx
              .update(quoteTripsTable)
              .set({ position: index + 1 })
              .where(eq(quoteTripsTable.id, id));
          }
        });
      } catch (tripError) {
        if (tripError instanceof QuoteConflictError) {
          return NextResponse.json({ success: false, error: tripError.message }, { status: 409 });
        }
        throw tripError;
      }

      // Le total du devis suit la somme des lignes, sauf si l'admin force un
      // montant global dans le même appel.
      if (estimatedPrice === undefined) {
        const refreshed = await getQuoteTrips(quoteId);
        const total = sumTripPrices(refreshed);
        if (total !== null) updateData.estimatedPrice = total;
      }
    }

    const updatedQuote = await db
      .update(quotesTable)
      .set(updateData)
      .where(eq(quotesTable.id, quoteId))
      .returning();

    if (updatedQuote.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Demande de devis non trouvée'
      }, { status: 404 });
    }

    console.log(`✅ Devis #${quoteId} modifié (statut: ${updatedQuote[0].status})`);

    // Envoyer email au client si le statut passe à 'sent' avec un prix.
    // Sans adresse (devis saisi au téléphone), il n'y a rien à envoyer : le devis
    // est communiqué de vive voix.
    if (updateData.status === 'sent' && updatedQuote[0].estimatedPrice && updatedQuote[0].customerEmail) {
      await sendWithRetry('email', 'resend-mailer.sendQuoteConfirmedEmail', [
        updatedQuote[0].customerEmail,
        await buildQuoteConfirmedEmailPayload(updatedQuote[0]),
      ]);
    }

    // Un accord conclu hors de l'espace client doit produire les mêmes courses
    // que l'acceptation en ligne, sinon rien n'arrive aux chauffeurs.
    let bookings: Awaited<ReturnType<typeof createBookingsForQuote>> = [];
    if (updateData.status === 'accepted') {
      try {
        bookings = await createBookingsForQuote(updatedQuote[0]);
      } catch (bookingError) {
        console.error('❌ Réservations non créées après acceptation admin:', bookingError);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedQuote[0],
      bookings,
      message: 'Demande de devis mise à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la demande de devis:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// DELETE - Supprimer une demande de devis
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;

    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    const userRole = session.user.role || 'customer';
    const hasDeletePermission = await hasQuotesPermission(userRole, 'delete');

    if (!hasDeletePermission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Vous n\'avez pas la permission de supprimer ce devis' 
      }, { status: 403 });
    }

    const quoteId = parseInt((await params).id);

    const linkedInvoice = await db
      .select({ id: invoicesTable.id })
      .from(invoicesTable)
      .where(eq(invoicesTable.quoteId, quoteId))
      .limit(1);

    if (linkedInvoice.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Ce devis ne peut pas être supprimé car il a une facture associée'
      }, { status: 409 });
    }

    const deletedQuote = await db
      .delete(quotesTable)
      .where(eq(quotesTable.id, quoteId))
      .returning();

    if (deletedQuote.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Demande de devis non trouvée' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Demande de devis supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la demande de devis:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}
