export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { invoicesTable, quotesTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { hasQuotesPermission } from '@/lib/quote-permissions';
import { createInvoiceForQuote, findInvoiceForQuote } from '@/lib/quote-acceptance';
import { calculateDueDate } from '@/lib/invoice-utils';

// GET - Récupérer la facture associée à un devis
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

    const quoteId = parseInt((await params).id);
    if (isNaN(quoteId)) {
      return NextResponse.json(
        { success: false, error: 'ID de devis invalide' },
        { status: 400 }
      );
    }

    console.log(`🔍 Recherche de la facture pour le devis #${quoteId}`);

    // Vérifier que le devis existe et appartient au client (sauf admin)
    const quote = await db.select()
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
    const userRole = session.user.role || 'customer';

    // Vérifier les permissions
    if (userRole !== 'admin' && userRole !== 'manager') {
      if (quoteData.customerEmail !== session.user.email) {
        return NextResponse.json(
          { success: false, error: 'Accès non autorisé à ce devis' },
          { status: 403 }
        );
      }
    }

    // Récupérer la facture liée au devis
    const invoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.quoteId, quoteId))
      .limit(1);

    if (invoice.length === 0) {
      console.log(`ℹ️ Aucune facture trouvée pour le devis #${quoteId}`);
      return NextResponse.json({
        success: true,
        invoice: null,
        message: 'Aucune facture générée pour ce devis'
      });
    }

    console.log(`✅ Facture #${invoice[0].id} trouvée pour le devis #${quoteId}`);

    return NextResponse.json({
      success: true,
      invoice: invoice[0]
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la facture du devis:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Émettre la facture d'un devis accepté.
 *
 * L'accord se conclut souvent au téléphone : jusqu'ici seule l'acceptation du
 * client depuis son espace créait la facture, et un devis accepté par l'admin
 * n'en produisait aucune. Même logique que cette acceptation (lignes figées,
 * numéro FAC-, email avec PDF) via createInvoiceForQuote.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const userRole = session.user.role || 'customer';
    const isStaff = userRole === 'admin' || userRole === 'manager';
    if (!isStaff || !(await hasQuotesPermission(userRole, 'update'))) {
      return NextResponse.json(
        { success: false, error: 'Seuls les administrateurs peuvent émettre une facture' },
        { status: 403 }
      );
    }

    const quoteId = parseInt((await params).id);
    if (isNaN(quoteId)) {
      return NextResponse.json({ success: false, error: 'ID de devis invalide' }, { status: 400 });
    }

    const [quote] = await db.select().from(quotesTable).where(eq(quotesTable.id, quoteId)).limit(1);
    if (!quote) {
      return NextResponse.json({ success: false, error: 'Devis non trouvé' }, { status: 404 });
    }

    if (quote.status !== 'accepted') {
      return NextResponse.json({
        success: false,
        error: "La facture ne peut être émise qu'une fois le devis accepté."
      }, { status: 400 });
    }

    if (!quote.estimatedPrice) {
      return NextResponse.json({
        success: false,
        error: 'Le devis doit avoir un prix avant de produire la facture.'
      }, { status: 400 });
    }

    // Une seule facture par devis : relancer le bouton ne doit pas créer de doublon.
    const existing = await findInvoiceForQuote(quoteId);
    if (existing) {
      return NextResponse.json({
        success: false,
        error: `La facture ${existing.invoiceNumber} existe déjà pour ce devis.`,
        invoice: existing
      }, { status: 409 });
    }

    const body = await request.json().catch(() => ({}));
    const { taxRate, dueDate, dueDays, notes } = body as Record<string, unknown>;

    let rate: number | undefined;
    if (taxRate !== undefined && taxRate !== null && taxRate !== '') {
      rate = parseFloat(String(taxRate));
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        return NextResponse.json({ success: false, error: 'Taux de TVA invalide' }, { status: 400 });
      }
    }

    let due: Date | undefined;
    if (dueDate) {
      const parsed = new Date(String(dueDate));
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ success: false, error: "Date d'échéance invalide" }, { status: 400 });
      }
      due = parsed;
    } else if (dueDays !== undefined && dueDays !== null && dueDays !== '') {
      const days = parseInt(String(dueDays), 10);
      if (!Number.isFinite(days) || days < 0 || days > 365) {
        return NextResponse.json({ success: false, error: 'Délai de paiement invalide' }, { status: 400 });
      }
      due = calculateDueDate(new Date(), days);
    }

    const invoice = await createInvoiceForQuote(quote, {
      taxRate: rate,
      dueDate: due,
      notes: notes ? String(notes).trim().slice(0, 1000) : null,
    });

    return NextResponse.json({
      success: true,
      invoice,
      message: `Facture ${invoice.invoiceNumber} émise.`
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Erreur lors de l\'émission de la facture:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur interne du serveur'
    }, { status: 500 });
  }
}
