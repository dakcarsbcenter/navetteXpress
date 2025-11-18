export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { invoicesTable, quotesTable } from '@/schema';
import { eq, and } from 'drizzle-orm';
import { Resend } from 'resend';

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

    // Envoyer un email de confirmation si la facture est marquée comme payée
    if (body.status === 'paid') {
      try {
        console.log('📧 Envoi de l\'email de confirmation de paiement à:', updatedInvoice.customerEmail);
        
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'NavetteXpress <onboarding@resend.dev>';
        
        await resend.emails.send({
          from: fromEmail,
          to: [updatedInvoice.customerEmail],
          subject: `✅ Paiement confirmé - Facture ${updatedInvoice.invoiceNumber}`,
          html: `
            <!DOCTYPE html>
            <html lang="fr">
              <head>
                <meta charset="UTF-8">
              </head>
              <body style="font-family: Arial, sans-serif; background-color: #e8f0f8; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border: 2px solid #93374d; border-radius: 8px; overflow: hidden;">
                  <!-- Header -->
                  <div style="background-color: #93374d; padding: 32px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Navette Express</h1>
                  </div>
                  
                  <!-- Content -->
                  <div style="padding: 32px 24px;">
                    <h2 style="color: #2c3e50; text-align: center; margin-bottom: 24px;">✅ Paiement Confirmé</h2>
                    
                    <p style="color: #4a5568; font-size: 16px; line-height: 26px;">
                      Bonjour <strong>${updatedInvoice.customerName}</strong>,
                    </p>
                    
                    <p style="color: #4a5568; font-size: 16px; line-height: 26px;">
                      Nous avons bien reçu votre paiement pour la facture suivante :
                    </p>
                    
                    <!-- Invoice Info -->
                    <div style="background: #d1fae5; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 24px 12px;">
                      <h3 style="color: #166534; margin-top: 0;">📄 Facture ${updatedInvoice.invoiceNumber}</h3>
                      <p style="color: #166534; margin: 8px 0;"><strong>Service :</strong> ${updatedInvoice.service}</p>
                      <p style="color: #166534; margin: 8px 0;"><strong>Montant payé :</strong> <span style="font-size: 20px; font-weight: bold;">${parseFloat(updatedInvoice.totalAmount).toLocaleString('fr-FR')} FCFA</span></p>
                      <p style="color: #166534; margin: 8px 0;"><strong>Date de paiement :</strong> ${new Date(updatedInvoice.paidDate || new Date()).toLocaleDateString('fr-FR')}</p>
                      ${updatedInvoice.paymentMethod ? `<p style="color: #166534; margin: 8px 0;"><strong>Méthode de paiement :</strong> ${updatedInvoice.paymentMethod}</p>` : ''}
                    </div>
                    
                    <p style="color: #4a5568; font-size: 16px; line-height: 26px;">
                      Merci pour votre confiance. Votre reçu de paiement est disponible dans votre espace client.
                    </p>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/factures/${updatedInvoice.id}" 
                         style="background: #93374d; color: white; padding: 14px 40px; text-decoration: none; 
                                border-radius: 5px; font-weight: bold; display: inline-block;">
                        📄 Voir ma facture
                      </a>
                    </div>
                    
                    <!-- Footer -->
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                    <p style="color: #6b7280; font-size: 14px; text-align: center;">
                      Cordialement,<br>
                      <strong>L'équipe NavetteXpress</strong>
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                      Pour toute question, n'hésitez pas à nous contacter.
                    </p>
                  </div>
                  
                  <!-- Final Footer -->
                  <div style="background: #f3f4f6; padding: 24px; text-align: center;">
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">© 2025 NavetteXpress. Tous droits réservés.</p>
                    <p style="color: #9ca3af; font-size: 11px; margin: 0;">[NavetteXpress SAS, 123 Rue de la Mobilité, 75001 Paris, France]</p>
                  </div>
                </div>
              </body>
            </html>
          `
        });
        
        console.log('✅ Email de confirmation de paiement envoyé');
      } catch (emailError) {
        console.error('❌ Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
        // Ne pas bloquer la mise à jour si l'email échoue
      }
    }

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
