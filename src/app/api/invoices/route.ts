export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { invoicesTable } from '@/schema';
import { eq, desc, and } from 'drizzle-orm';
import { sendInvoiceEmail } from '@/lib/resend-mailer';

// GET - Récupérer toutes les factures (avec filtres selon le rôle)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API Invoices] Début de la requête GET');
    
    const session = await getServerSession(authOptions) as { user?: { id?: string; email?: string; role?: string } } | null;
    console.log('👤 [API Invoices] Session:', session?.user?.email, 'Role:', session?.user?.role);

    if (!session?.user) {
      console.error('❌ [API Invoices] Non authentifié');
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userRole = session.user.role || 'customer';
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let invoices;

    // Admin et manager peuvent voir toutes les factures
    if (userRole === 'admin' || userRole === 'manager') {
      console.log('📋 Récupération de toutes les factures (admin/manager)');
      
      if (status) {
        invoices = await db.select()
          .from(invoicesTable)
          .where(eq(invoicesTable.status, status as any))
          .orderBy(desc(invoicesTable.createdAt));
      } else {
        invoices = await db.select()
          .from(invoicesTable)
          .orderBy(desc(invoicesTable.createdAt));
      }
    } else {
      // Les clients ne voient que leurs propres factures
      console.log(`📋 Récupération des factures pour le client: ${session.user.email}`);
      
      if (status) {
        invoices = await db.select()
          .from(invoicesTable)
          .where(
            and(
              eq(invoicesTable.customerEmail, session.user.email as string),
              eq(invoicesTable.status, status as any)
            )
          )
          .orderBy(desc(invoicesTable.createdAt));
      } else {
        invoices = await db.select()
          .from(invoicesTable)
          .where(eq(invoicesTable.customerEmail, session.user.email as string))
          .orderBy(desc(invoicesTable.createdAt));
      }
    }

    console.log(`✅ ${invoices.length} facture(s) récupérée(s)`);

    // Mapper les noms de colonnes pour correspondre aux attentes du frontend
    const mappedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      quoteId: invoice.quoteId,
      customerId: invoice.customerEmail,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone,
      service: invoice.service,
      amountHT: invoice.amount ? parseFloat(invoice.amount) : 0,
      vatAmount: invoice.taxAmount ? parseFloat(invoice.taxAmount) : 0,
      amountTTC: invoice.totalAmount ? parseFloat(invoice.totalAmount) : 0,
      taxRate: invoice.taxRate ? parseFloat(invoice.taxRate) : 20,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paidDate: invoice.paidDate || undefined,
      paymentMethod: invoice.paymentMethod || undefined,
      notes: invoice.notes || undefined,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    }));

    console.log('✅ [API Invoices] Retour de', mappedInvoices.length, 'factures');
    
    return NextResponse.json({
      success: true,
      invoices: mappedInvoices
    });

  } catch (error) {
    console.error('❌ [API Invoices] Erreur lors de la récupération des factures:', error);
    console.error('❌ [API Invoices] Stack:', (error as Error)?.stack);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur', details: (error as Error)?.message },
      { status: 500 }
    );
  }
}

// POST - Créer une facture manuellement (admin uniquement)
export async function POST(request: NextRequest) {
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
        { success: false, error: 'Accès non autorisé. Seuls les administrateurs peuvent créer des factures manuellement.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validation des champs requis
    const requiredFields = ['invoiceNumber', 'quoteId', 'customerName', 'customerEmail', 'service', 'amount', 'totalAmount', 'dueDate'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Le champ ${field} est requis` },
          { status: 400 }
        );
      }
    }

    console.log('📝 Création manuelle d\'une facture par l\'admin');

    const [newInvoice] = await db.insert(invoicesTable).values({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    console.log(`✅ Facture ${newInvoice.invoiceNumber} créée avec succès`);

    // Envoyer l'email de notification au client
    try {
      console.log('📧 Envoi de l\'email de facture à:', newInvoice.customerEmail);
      
      await sendInvoiceEmail(newInvoice.customerEmail, {
        invoiceNumber: newInvoice.invoiceNumber,
        customerName: newInvoice.customerName,
        service: newInvoice.service,
        amountHT: `${parseFloat(newInvoice.amount).toLocaleString('fr-FR')} FCFA`,
        vatAmount: `${parseFloat(newInvoice.taxAmount).toLocaleString('fr-FR')} FCFA`,
        amountTTC: `${parseFloat(newInvoice.totalAmount).toLocaleString('fr-FR')} FCFA`,
        issueDate: new Date(newInvoice.issueDate).toLocaleDateString('fr-FR'),
        dueDate: new Date(newInvoice.dueDate).toLocaleDateString('fr-FR'),
        invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/client/factures/${newInvoice.id}`
      });
      
      console.log('✅ Email de facture envoyé avec succès');
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de facture:', emailError);
      // Ne pas bloquer la création de la facture si l'email échoue
    }

    return NextResponse.json({
      success: true,
      invoice: newInvoice,
      message: 'Facture créée avec succès et email envoyé'
    });

  } catch (error) {
    console.error('Erreur lors de la création de la facture:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
