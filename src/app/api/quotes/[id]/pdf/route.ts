export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { quotesTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { hasQuotesPermission } from '@/lib/quote-permissions';
import { buildQuoteDocumentData } from '@/lib/quote-document';
import { renderQuotePDFBuffer } from '@/lib/pdf/quote-pdf';

/**
 * GET /api/quotes/[id]/pdf — devis officiel au format PDF.
 *
 * Accessible a l'equipe (permission quotes:read) et au client proprietaire du
 * devis, qui doit pouvoir recuperer sa piece depuis son espace.
 *
 * `?download=1` force le telechargement ; sans ce parametre le PDF s'ouvre dans
 * l'onglet, ce qui sert l'apercu admin.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = (await getServerSession(authOptions)) as
      | { user?: { id?: string; email?: string; role?: string } }
      | null;

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const quoteId = parseInt((await params).id, 10);
    if (Number.isNaN(quoteId) || quoteId <= 0) {
      return NextResponse.json({ success: false, error: 'Identifiant invalide' }, { status: 400 });
    }

    const [quote] = await db
      .select({ id: quotesTable.id, customerEmail: quotesTable.customerEmail })
      .from(quotesTable)
      .where(eq(quotesTable.id, quoteId))
      .limit(1);

    if (!quote) {
      return NextResponse.json({ success: false, error: 'Devis non trouvé' }, { status: 404 });
    }

    const isOwner = Boolean(session.user.email) && quote.customerEmail === session.user.email;
    const canRead = await hasQuotesPermission(session.user.role || 'customer', 'read');

    if (!isOwner && !canRead) {
      return NextResponse.json(
        { success: false, error: "Vous n'avez pas la permission de voir ce devis" },
        { status: 403 },
      );
    }

    const data = await buildQuoteDocumentData(quoteId);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Devis non trouvé' }, { status: 404 });
    }

    const pdf = await renderQuotePDFBuffer(data);
    const disposition = request.nextUrl.searchParams.get('download') ? 'attachment' : 'inline';

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${data.reference}.pdf"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Erreur lors de la génération du PDF du devis:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
