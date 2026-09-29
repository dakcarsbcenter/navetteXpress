export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { invoicesTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { renderInvoicePDFBuffer } from '@/lib/invoice-pdf';
import { formatDocumentDate } from '@/lib/pdf/brand';

/**
 * GET /api/invoices/[id]/pdf — facture officielle au format PDF.
 *
 * Mêmes règles d'accès que la liste des factures : admin et manager voient
 * tout, un client ne voit que les siennes.
 *
 * Les lignes servies sont celles figées à l'émission (`invoices.items`) : une
 * facture ne suit pas les modifications ultérieures du devis dont elle découle.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = (await getServerSession(authOptions)) as
      | { user?: { id?: string; email?: string; role?: string } }
      | null;

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const invoiceId = parseInt((await params).id, 10);
    if (Number.isNaN(invoiceId) || invoiceId <= 0) {
      return NextResponse.json({ success: false, error: 'Identifiant invalide' }, { status: 400 });
    }

    const [invoice] = await db
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoiceId))
      .limit(1);

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Facture non trouvée' }, { status: 404 });
    }

    const userRole = session.user.role || 'customer';
    const isStaff = userRole === 'admin' || userRole === 'manager';
    const isOwner = Boolean(session.user.email) && invoice.customerEmail === session.user.email;

    if (!isStaff && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Vous n'avez pas la permission de voir cette facture" },
        { status: 403 },
      );
    }

    const pdf = await renderInvoicePDFBuffer({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone ?? undefined,
      customerAddress: invoice.customerAddress,
      customerNinea: invoice.customerNinea,
      service: invoice.service,
      amountHT: parseFloat(invoice.amount),
      vatAmount: parseFloat(invoice.taxAmount),
      amountTTC: parseFloat(invoice.totalAmount),
      taxRate: parseFloat(invoice.taxRate),
      issueDate: formatDocumentDate(invoice.issueDate),
      dueDate: formatDocumentDate(invoice.dueDate),
      status: invoice.status,
      object: invoice.documentObject,
      quoteReference: invoice.quoteReference,
      items: invoice.items ?? undefined,
      notes: invoice.notes ?? undefined,
    });

    const disposition = request.nextUrl.searchParams.get('download') ? 'attachment' : 'inline';

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${invoice.invoiceNumber}.pdf"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Erreur lors de la génération du PDF de la facture:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
