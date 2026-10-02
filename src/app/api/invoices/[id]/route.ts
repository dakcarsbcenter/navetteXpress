export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { invoicesTable, quotesTable, type SelectInvoice } from '@/schema';
import { eq } from 'drizzle-orm';
import { DEFAULT_TAX_RATE } from '@/lib/pdf/brand';
import { calculateInvoiceAmounts } from '@/lib/invoice-utils';
import { InvoicePatchSchema, normalizeInvoiceItems, round2 } from '@/lib/invoice-validation';
import { appendInvoiceAuditEntry, buildInvoiceChanges, type EmailOutcome } from '@/lib/invoice-audit';
import { sendWithRetry } from '@/lib/notification-queue';

// GET - Récupérer une facture par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; email?: string; role?: string } } | null;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const invoiceId = parseInt((await params).id);
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { success: false, error: 'ID de facture invalide' },
        { status: 400 }
      );
    }

    console.log(`🔍 Recherche de la facture #${invoiceId}`);

    // Récupérer la facture avec les détails du devis
    const invoice = await db.select({
      // Facture
      id: invoicesTable.id,
      invoiceNumber: invoicesTable.invoiceNumber,
      quoteId: invoicesTable.quoteId,
      customerName: invoicesTable.customerName,
      customerEmail: invoicesTable.customerEmail,
      customerPhone: invoicesTable.customerPhone,
      service: invoicesTable.service,
      amount: invoicesTable.amount,
      taxRate: invoicesTable.taxRate,
      taxAmount: invoicesTable.taxAmount,
      totalAmount: invoicesTable.totalAmount,
      status: invoicesTable.status,
      issueDate: invoicesTable.issueDate,
      dueDate: invoicesTable.dueDate,
      paidDate: invoicesTable.paidDate,
      paymentMethod: invoicesTable.paymentMethod,
      notes: invoicesTable.notes,
      internalNotes: invoicesTable.internalNotes,
      // Champs du document officiel : la modale d'edition s'alimente de ce GET,
      // et les omettre ici les ferait effacer au premier enregistrement.
      quoteReference: invoicesTable.quoteReference,
      documentObject: invoicesTable.documentObject,
      customerAddress: invoicesTable.customerAddress,
      customerNinea: invoicesTable.customerNinea,
      items: invoicesTable.items,
      createdAt: invoicesTable.createdAt,
      updatedAt: invoicesTable.updatedAt,
      // Quote details
      quoteService: quotesTable.service,
      quoteMessage: quotesTable.message,
      quoteEstimatedPrice: quotesTable.estimatedPrice,
      quoteAdminNotes: quotesTable.adminNotes,
      quoteClientNotes: quotesTable.clientNotes,
      quotePreferredDate: quotesTable.preferredDate,
    })
      .from(invoicesTable)
      .leftJoin(quotesTable, eq(invoicesTable.quoteId, quotesTable.id))
      .where(eq(invoicesTable.id, invoiceId))
      .limit(1);

    if (invoice.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    const invoiceData = invoice[0];
    const userRole = session.user.role || 'customer';
    const isStaff = userRole === 'admin' || userRole === 'manager';

    // Vérifier les permissions
    if (!isStaff) {
      // Les clients ne peuvent voir que leurs propres factures
      if (invoiceData.customerEmail !== session.user.email) {
        return NextResponse.json(
          { success: false, error: 'Accès non autorisé à cette facture' },
          { status: 403 }
        );
      }
    }

    console.log(`✅ Facture #${invoiceId} récupérée avec détails du devis`);

    // Mapper les données pour le frontend
    const response = {
      ...invoiceData,
      // Le journal interne des corrections ne sort jamais vers un client.
      internalNotes: isStaff ? invoiceData.internalNotes : undefined,
      amountHT: invoiceData.amount ? parseFloat(invoiceData.amount) : 0,
      vatAmount: invoiceData.taxAmount ? parseFloat(invoiceData.taxAmount) : 0,
      amountTTC: invoiceData.totalAmount ? parseFloat(invoiceData.totalAmount) : 0,
      taxRate: invoiceData.taxRate ? parseFloat(invoiceData.taxRate) : DEFAULT_TAX_RATE,
      quote: invoiceData.quoteId ? {
        id: invoiceData.quoteId,
        service: invoiceData.quoteService,
        message: invoiceData.quoteMessage,
        estimatedPrice: invoiceData.quoteEstimatedPrice ? parseFloat(invoiceData.quoteEstimatedPrice) : null,
        adminNotes: invoiceData.quoteAdminNotes,
        clientNotes: invoiceData.quoteClientNotes,
        preferredDate: invoiceData.quotePreferredDate?.toISOString() || null,
      } : null,
    };

    return NextResponse.json({
      success: true,
      invoice: response
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la facture:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Corriger une facture (admin et manager).
 *
 * Une facture emise est une piece comptable : ses lignes sont figees a
 * l'emission (cf. invoices.items dans src/schema.ts) et ne suivent pas le devis
 * dont elle decoule. Corriger une erreur passe donc par ici, sur la facture
 * elle-meme, et non par une modification du devis.
 *
 * Le corps est valide par InvoicePatchSchema, qui est `.strict()` : le numero de
 * facture et le devis d'origine sont figes structurellement, et un champ inconnu
 * remonte en 400 au lieu de passer inapercu comme avec l'ancienne whitelist.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; email?: string; role?: string } } | null;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé. Seuls les administrateurs peuvent modifier les factures.' },
        { status: 403 }
      );
    }

    const invoiceId = parseInt((await params).id);
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { success: false, error: 'ID de facture invalide' },
        { status: 400 }
      );
    }

    const validation = InvoicePatchSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données invalides',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const body = validation.data;

    const [current] = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoiceId))
      .limit(1);

    if (!current) {
      return NextResponse.json(
        { success: false, error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    // Verrou optimiste. Le PATCH reecrit desormais le document entier : sans
    // cela, un admin qui enregistre un instantane vieux de quelques minutes
    // annulerait en silence la correction d'un collegue. Accessoirement, cela
    // neutralise le second envoi d'email d'un double-clic.
    if (
      body.expectedUpdatedAt &&
      new Date(body.expectedUpdatedAt).getTime() !== current.updatedAt.getTime()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Cette facture a été modifiée entre-temps. Rechargez-la avant d'enregistrer.",
        },
        { status: 409 }
      );
    }

    const updateData: Partial<typeof invoicesTable.$inferInsert> = { updatedAt: new Date() };

    // Identité client
    if (body.customerName !== undefined) updateData.customerName = body.customerName;
    if (body.customerEmail !== undefined) updateData.customerEmail = body.customerEmail;
    if (body.customerPhone !== undefined) updateData.customerPhone = body.customerPhone || null;
    if (body.customerAddress !== undefined) updateData.customerAddress = body.customerAddress || null;
    if (body.customerNinea !== undefined) updateData.customerNinea = body.customerNinea || null;

    // Document officiel
    if (body.service !== undefined) updateData.service = body.service;
    if (body.documentObject !== undefined) updateData.documentObject = body.documentObject || null;
    if (body.quoteReference !== undefined) updateData.quoteReference = body.quoteReference || null;
    if (body.issueDate !== undefined) updateData.issueDate = new Date(body.issueDate);
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);

    // Cycle de vie
    if (body.status !== undefined) updateData.status = body.status;
    if (body.paidDate !== undefined) updateData.paidDate = body.paidDate ? new Date(body.paidDate) : null;
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;

    // Montants. Des que des lignes sont fournies, elles font autorite sur le
    // sous-total HT et `body.amount` est ignore : le PDF imprime deux fois la
    // meme information (colonne TOTAL du tableau, puis sous-total HT du bloc
    // totaux), la divergence doit etre impossible par construction.
    // On ne repartit PAS un montant global sur les lignes comme le fait
    // reconcileItems pour le devis : ici les lignes sont la verite editable, et
    // les reecrire effacerait le prix que l'admin vient de taper. Une remise se
    // dit en ligne explicite a prix negatif.
    let subtotal: number | null = null;

    if (body.items !== undefined) {
      const normalized = normalizeInvoiceItems(body.items);
      updateData.items = normalized.items;
      subtotal = normalized.subtotal;
    } else if (body.amount !== undefined) {
      // Factures historiques, emises avant les lignes figees (items null).
      subtotal = round2(parseFloat(String(body.amount)));
    }

    if (subtotal !== null || body.taxRate !== undefined) {
      const effectiveSubtotal = subtotal ?? round2(parseFloat(current.amount));
      const rate = body.taxRate !== undefined ? body.taxRate : parseFloat(current.taxRate);

      if (!Number.isFinite(effectiveSubtotal) || effectiveSubtotal <= 0) {
        return NextResponse.json(
          { success: false, error: 'Le montant HT doit être strictement positif' },
          { status: 400 }
        );
      }
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        return NextResponse.json({ success: false, error: 'Taux de TVA invalide' }, { status: 400 });
      }

      const amounts = calculateInvoiceAmounts(effectiveSubtotal, rate);
      updateData.amount = amounts.amount;
      updateData.taxRate = amounts.taxRate;
      updateData.taxAmount = amounts.taxAmount;
      updateData.totalAmount = amounts.totalAmount;

      // Ceinture et bretelles : si cet invariant casse un jour, c'est le PDF du
      // client qui devient incoherent, pas seulement une valeur en base.
      if (updateData.items) {
        const linesTotal = round2(updateData.items.reduce((sum, item) => sum + item.total, 0));
        if (Math.abs(linesTotal - parseFloat(updateData.amount)) >= 0.01) {
          console.error(
            `❌ Incohérence lignes/sous-total sur la facture #${invoiceId}:`,
            linesTotal,
            updateData.amount
          );
          return NextResponse.json(
            { success: false, error: 'Incohérence entre les lignes et le sous-total' },
            { status: 500 }
          );
        }
      }
    }

    // Une échéance antérieure à l'émission sort un PDF absurde : on refuse ici,
    // en comparant les valeurs effectives et non seulement celles envoyées.
    const effectiveIssueDate = updateData.issueDate ?? current.issueDate;
    const effectiveDueDate = updateData.dueDate ?? current.dueDate;
    if (new Date(effectiveDueDate).getTime() < new Date(effectiveIssueDate).getTime()) {
      return NextResponse.json(
        { success: false, error: "L'échéance ne peut pas précéder la date d'émission" },
        { status: 400 }
      );
    }

    // Si le statut passe à "paid", enregistrer la date de paiement. On ne
    // l'efface pas en sortant de "paid" : la modale expose le champ, et un
    // retour en "pending" pour corriger ne veut pas dire que l'encaissement
    // n'a jamais eu lieu.
    if (body.status === 'paid' && body.paidDate === undefined && !current.paidDate) {
      updateData.paidDate = new Date();
    }

    // Différentiel calculé AVANT l'écriture, sur la ligne réellement en base :
    // il sert à la fois la trace, la garde de notification et le message de
    // retour. Un diff calculé côté client serait falsifiable.
    const changes = buildInvoiceChanges(current, updateData as Partial<SelectInvoice>);

    const willNotify =
      body.notifyCustomer === true &&
      changes.length > 0 &&
      Boolean(updateData.customerEmail ?? current.customerEmail) &&
      (updateData.status ?? current.status) !== 'cancelled';

    let emailOutcome: EmailOutcome = 'none';
    if (body.notifyCustomer === true && changes.length > 0) {
      if (!(updateData.customerEmail ?? current.customerEmail)) {
        emailOutcome = 'skipped-no-email';
      } else if ((updateData.status ?? current.status) === 'cancelled') {
        emailOutcome = 'skipped-cancelled';
      } else {
        // Provisoire : corrigé juste après l'envoi, qui n'a lieu qu'une fois la
        // facture écrite (le PDF est régénéré depuis la base).
        emailOutcome = 'sent';
      }
    }

    if (changes.length > 0) {
      updateData.internalNotes = appendInvoiceAuditEntry(current.internalNotes, {
        actor: session.user.email || session.user.id || 'admin',
        changes,
        emailOutcome,
      });
    }

    const [updatedInvoice] = await db.update(invoicesTable)
      .set(updateData)
      .where(eq(invoicesTable.id, invoiceId))
      .returning();

    if (!updatedInvoice) {
      return NextResponse.json(
        { success: false, error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    console.log(`✅ Facture #${invoiceId} mise à jour (${changes.length} champ(s))`);

    // Renvoi au client, strictement APRÈS l'écriture : sendInvoiceEmail
    // régénère le PDF depuis la base à partir de invoiceDbId, donc appelé avant
    // l'UPDATE il enverrait l'ancienne facture.
    //
    // Défaut volontairement inverse de `notifyOnUpdate` des réservations (qui
    // notifie sauf refus explicite) : ici rien ne part sans coche, parce qu'on
    // corrige le plus souvent une coquille. Ne pas "aligner" les deux.
    const notification = { attempted: willNotify, sent: false, queued: false };

    if (willNotify) {
      const outcome = await sendWithRetry('email', 'resend-mailer.sendInvoiceEmail', [
        updatedInvoice.customerEmail,
        {
          invoiceNumber: updatedInvoice.invoiceNumber,
          customerName: updatedInvoice.customerName,
          service: updatedInvoice.service,
          amountHT: `${parseFloat(updatedInvoice.amount).toLocaleString('fr-FR')} FCFA`,
          vatAmount: `${parseFloat(updatedInvoice.taxAmount).toLocaleString('fr-FR')} FCFA`,
          amountTTC: `${parseFloat(updatedInvoice.totalAmount).toLocaleString('fr-FR')} FCFA`,
          issueDate: new Date(updatedInvoice.issueDate).toLocaleDateString('fr-FR'),
          dueDate: new Date(updatedInvoice.dueDate).toLocaleDateString('fr-FR'),
          invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/client/factures/${updatedInvoice.id}`,
          invoiceDbId: updatedInvoice.id,
          isCorrection: true,
        },
      ]);

      notification.sent = outcome.success;
      notification.queued = Boolean(outcome.queued);

      // sendWithRetry ne lève jamais : la facture est déjà enregistrée, seul le
      // libellé de la trace change. On la rectifie plutôt que de laisser
      // "email client renvoyé" sur un envoi qui a échoué.
      if (!outcome.success) {
        const corrected = appendInvoiceAuditEntry(current.internalNotes, {
          actor: session.user.email || session.user.id || 'admin',
          changes,
          emailOutcome: outcome.queued ? 'queued' : 'none',
        });
        await db.update(invoicesTable)
          .set({ internalNotes: corrected })
          .where(eq(invoicesTable.id, invoiceId));
      }
    }

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      changes: changes.length,
      notification,
      message: changes.length > 0
        ? `Facture mise à jour (${changes.length} modification${changes.length > 1 ? 's' : ''})`
        : 'Aucune modification à enregistrer'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la facture:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Annuler une facture (admin uniquement)
export async function DELETE(
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
        { success: false, error: 'Accès non autorisé. Seuls les administrateurs peuvent annuler des factures.' },
        { status: 403 }
      );
    }

    const invoiceId = parseInt((await params).id);
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { success: false, error: 'ID de facture invalide' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Annulation de la facture #${invoiceId}`);

    // On ne supprime pas la facture, on change son statut à "cancelled"
    const [cancelledInvoice] = await db.update(invoicesTable)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(invoicesTable.id, invoiceId))
      .returning();

    if (!cancelledInvoice) {
      return NextResponse.json(
        { success: false, error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    console.log(`✅ Facture #${invoiceId} annulée`);

    return NextResponse.json({
      success: true,
      message: 'Facture annulée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation de la facture:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
