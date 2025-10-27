export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { quotesTable, rolePermissionsTable } from '@/schema';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

// Fonction pour vérifier les permissions dynamiques des quotes
async function hasQuotesPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
  try {
    // Les admins ont toujours accès
    if (userRole === 'admin') {
      return true;
    }

    // Vérifier les permissions dynamiques
    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource, 'quotes'),
        eq(rolePermissionsTable.action, action),
        eq(rolePermissionsTable.allowed, true)
      ));

    // Vérifier si l'utilisateur a 'manage' ou l'action spécifique
    return permissions.some(p => p.action === 'manage' || p.action === action);
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions quotes:', error);
    return false;
  }
}

// GET - Récupérer une demande de devis spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;

    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    const userRole = session.user.role || 'customer';
    const hasReadPermission = await hasQuotesPermission(userRole, 'read');

    if (!hasReadPermission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Vous n\'avez pas la permission de voir ce devis' 
      }, { status: 403 });
    }

    const quote = await db
      .select()
      .from(quotesTable)
      .where(eq(quotesTable.id, parseInt((await params).id)))
      .limit(1);

    if (quote.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Demande de devis non trouvée' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: quote[0] 
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la demande de devis:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// PUT - Mettre à jour une demande de devis
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;

    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    const userRole = session.user.role || 'customer';
    const hasUpdatePermission = await hasQuotesPermission(userRole, 'update');

    if (!hasUpdatePermission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Vous n\'avez pas la permission de modifier ce devis' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { 
      customerName,
      customerEmail,
      customerPhone,
      service,
      preferredDate,
      message,
      status,
      adminNotes,
      estimatedPrice,
      assignedTo
    } = body;

    console.log('📝 Modification du devis ID:', (await params).id, body);

    // Préparer les champs à mettre à jour
    const updateData: any = {
      updatedAt: new Date()
    };

    // Mise à jour des informations client si fournies
    if (customerName !== undefined) updateData.customerName = customerName;
    if (customerEmail !== undefined) updateData.customerEmail = customerEmail;
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone || null;
    if (service !== undefined) updateData.service = service;
    if (preferredDate !== undefined) updateData.preferredDate = preferredDate ? new Date(preferredDate) : null;
    if (message !== undefined) updateData.message = message;

    // Mise à jour des champs admin
    if (status !== undefined) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (estimatedPrice !== undefined) updateData.estimatedPrice = estimatedPrice;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

    const updatedQuote = await db
      .update(quotesTable)
      .set(updateData)
      .where(eq(quotesTable.id, parseInt((await params).id)))
      .returning();

    if (updatedQuote.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Demande de devis non trouvée' 
      }, { status: 404 });
    }

    console.log('✅ Devis modifié avec succès:', updatedQuote[0]);

    return NextResponse.json({ 
      success: true, 
      data: updatedQuote[0],
      message: 'Demande de devis mise à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la demande de devis:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// DELETE - Supprimer une demande de devis
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;

    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    const userRole = session.user.role || 'customer';
    const hasDeletePermission = await hasQuotesPermission(userRole, 'delete');

    if (!hasDeletePermission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Vous n\'avez pas la permission de supprimer ce devis' 
      }, { status: 403 });
    }

    const deletedQuote = await db
      .delete(quotesTable)
      .where(eq(quotesTable.id, parseInt((await params).id)))
      .returning();

    if (deletedQuote.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Demande de devis non trouvée' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Demande de devis supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la demande de devis:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}
