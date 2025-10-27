export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { quotesTable, rolePermissionsTable } from '@/schema';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { desc, and, eq } from 'drizzle-orm';

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

// POST - Créer une nouvelle demande de devis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customerName,
      customerEmail,
      customerPhone,
      service,
      preferredDate,
      message
    } = body;

    // Validation des champs obligatoires
    if (!customerName || !customerEmail || !service || !message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tous les champs obligatoires doivent être renseignés' 
      }, { status: 400 });
    }

    // Créer la demande de devis
    const newQuote = await db
      .insert(quotesTable)
      .values({
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        service,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        message,
        status: 'pending'
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      data: newQuote[0],
      message: 'Demande de devis créée avec succès'
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de la demande de devis:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// GET - Récupérer les demandes de devis
export async function GET() {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string; email?: string } } | null;

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
        error: 'Vous n\'avez pas la permission de voir les devis' 
      }, { status: 403 });
    }

    // Si l'utilisateur a la permission 'manage', il peut voir tous les devis
    const hasManagePermission = await hasQuotesPermission(userRole, 'update') || 
                                await hasQuotesPermission(userRole, 'delete');

    let quotes;

    if (hasManagePermission) {
      // Permission manage: voir tous les devis
      quotes = await db
        .select()
        .from(quotesTable)
        .orderBy(desc(quotesTable.createdAt));
    } else {
      // Permission read only: voir uniquement ses propres devis
      const userEmail = session.user.email;
      if (!userEmail) {
        return NextResponse.json({ 
          success: false, 
          error: 'Email utilisateur non trouvé' 
        }, { status: 400 });
      }
      quotes = await db
        .select()
        .from(quotesTable)
        .where(eq(quotesTable.customerEmail, userEmail))
        .orderBy(desc(quotesTable.createdAt));
    }

    return NextResponse.json({ 
      success: true, 
      data: quotes 
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des demandes de devis:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}
