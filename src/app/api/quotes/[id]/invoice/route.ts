export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { invoicesTable, quotesTable } from '@/schema';
import { eq, and } from 'drizzle-orm';

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
