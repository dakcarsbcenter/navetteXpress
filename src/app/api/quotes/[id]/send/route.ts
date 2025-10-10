import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendQuoteEmail } from '@/lib/brevo-email';
import { db } from '@/db';
import { quotesTable } from '@/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;

    // Vérifier l'authentification et le rôle admin
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

    // 1. Récupérer les détails du devis depuis la base de données
    console.log(`🔍 Recherche du devis ${quoteId}...`);
    
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

    // Vérifier si le devis a un prix estimé
    if (!quoteData.estimatedPrice) {
      return NextResponse.json(
        { success: false, error: 'Le devis doit avoir un prix estimé avant d\'être envoyé' },
        { status: 400 }
      );
    }

    // 2. Envoyer l'email avec Brevo
    console.log(`📧 Envoi du devis ${quoteId} par email à ${quoteData.customerEmail}`);
    
    const emailResult = await sendQuoteEmail(
      quoteData.customerEmail,
      quoteData.customerName,
      {
        id: quoteData.id,
        service: quoteData.service,
        estimatedPrice: quoteData.estimatedPrice,
        adminNotes: quoteData.adminNotes || undefined,
        preferredDate: quoteData.preferredDate?.toISOString()
      }
    );

    if (!emailResult.success) {
      console.error('❌ Erreur envoi email:', emailResult.error);
      return NextResponse.json(
        { success: false, error: `Erreur lors de l'envoi de l'email: ${emailResult.error}` },
        { status: 500 }
      );
    }

    // 3. Mettre à jour le statut du devis à 'sent'
    await db
      .update(quotesTable)
      .set({ 
        status: 'sent',
        updatedAt: new Date()
      })
      .where(eq(quotesTable.id, quoteId));

    console.log(`✅ Devis ${quoteId} envoyé avec succès - Message ID: ${emailResult.messageId}`);

    return NextResponse.json({
      success: true,
      message: `Le devis a été envoyé par email avec succès à ${quoteData.customerEmail}`,
      messageId: emailResult.messageId,
      recipient: quoteData.customerEmail
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi du devis:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
