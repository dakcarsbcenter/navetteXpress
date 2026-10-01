export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { invoicesTable, quotesTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { DEFAULT_TAX_RATE } from '@/lib/pdf/brand';
import { calculateInvoiceAmounts } from '@/lib/invoice-utils';

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

    // Vérifier les permissions
    if (userRole !== 'admin' && userRole !== 'manager') {
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

// PATCH - Mettre à jour le statut d'une facture (admin uniquement)
export async function PATCH(
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

    const body = await request.json();
    console.log(`📝 Mise à jour de la facture #${invoiceId}`, body);

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

    // Whitelist : le corps de la requête ne doit pas pouvoir réécrire n'importe
    // quelle colonne (numéro de facture, devis d'origine, lignes figées...).
    const updateData: Partial<typeof invoicesTable.$inferInsert> = { updatedAt: new Date() };

    if (body.status !== undefined) updateData.status = body.status;
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);
    if (body.paidDate !== undefined) updateData.paidDate = body.paidDate ? new Date(body.paidDate) : null;
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.documentObject !== undefined) updateData.documentObject = body.documentObject || null;
    if (body.customerAddress !== undefined) updateData.customerAddress = body.customerAddress || null;
    if (body.customerNinea !== undefined) updateData.customerNinea = body.customerNinea || null;

    // Montants : HT et taux sont les seules entrées ; TVA et TTC sont toujours
    // recalculés ici, jamais repris du client.
    if (body.amount !== undefined || body.taxRate !== undefined) {
      const amount = body.amount !== undefined ? parseFloat(String(body.amount)) : parseFloat(current.amount);
      const rate = body.taxRate !== undefined ? parseFloat(String(body.taxRate)) : parseFloat(current.taxRate);

      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ success: false, error: 'Montant HT invalide' }, { status: 400 });
      }
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        return NextResponse.json({ success: false, error: 'Taux de TVA invalide' }, { status: 400 });
      }

      const amounts = calculateInvoiceAmounts(amount, rate);
      updateData.amount = amounts.amount;
      updateData.taxRate = amounts.taxRate;
      updateData.taxAmount = amounts.taxAmount;
      updateData.totalAmount = amounts.totalAmount;
    }

    // Si le statut passe à "paid", enregistrer la date de paiement
    if (body.status === 'paid' && !body.paidDate) {
      updateData.paidDate = new Date();
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

    console.log(`✅ Facture #${invoiceId} mise à jour`);

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      message: 'Facture mise à jour avec succès'
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
