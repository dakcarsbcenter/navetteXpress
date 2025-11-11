export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { invoicesTable, quotesTable } from '@/schema';
import { eq, and } from 'drizzle-orm';

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
      taxRate: invoiceData.taxRate ? parseFloat(invoiceData.taxRate) : 20,
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

    // Si le statut passe à "paid", enregistrer la date de paiement
    const updateData: any = { ...body, updatedAt: new Date() };
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
