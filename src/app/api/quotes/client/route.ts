import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { quotesTable, rolePermissionsTable } from '@/schema';
import { eq, desc, and } from 'drizzle-orm';

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
        eq(rolePermissionsTable.allowed, true)
      ));

    // Vérifier si l'utilisateur a 'manage' ou l'action spécifique
    return permissions.some(p => p.action === 'manage' || p.action === action);
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions quotes:', error);
    return false;
  }
}

// GET - Récupérer les devis d'un client spécifique
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    const userRole = (session.user as any).role || 'customer';

    // Vérifier les permissions
    const hasPermission = await hasQuotesPermission(userRole, 'read');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas les permissions nécessaires pour accéder aux devis' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // Si l'utilisateur a la permission 'manage', il peut voir les devis de tous les clients
    const hasManagePermission = await hasQuotesPermission(userRole, 'update') || 
                                await hasQuotesPermission(userRole, 'delete');

    let quotes;

    if (hasManagePermission && email) {
      // Permission manage: peut voir les devis d'autres clients
      console.log('🔍 Recherche des devis pour le client:', email);
      quotes = await db
        .select()
        .from(quotesTable)
        .where(eq(quotesTable.customerEmail, email))
        .orderBy(desc(quotesTable.createdAt));
    } else if (hasManagePermission && !email) {
      // Permission manage sans email: voir tous les devis
      console.log('🔍 Récupération de tous les devis');
      quotes = await db
        .select()
        .from(quotesTable)
        .orderBy(desc(quotesTable.createdAt));
    } else {
      // Permission read only: voir uniquement ses propres devis
      const userEmail = (session.user as any).email;
      if (!userEmail) {
        return NextResponse.json({ 
          success: false, 
          error: 'Email utilisateur non trouvé' 
        }, { status: 400 });
      }
      console.log('🔍 Recherche des devis pour l\'utilisateur connecté:', userEmail);
      quotes = await db
        .select()
        .from(quotesTable)
        .where(eq(quotesTable.customerEmail, userEmail))
        .orderBy(desc(quotesTable.createdAt));
    }

    console.log('✅ Devis trouvés:', quotes.length);

    return NextResponse.json({ 
      success: true, 
      data: quotes 
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des devis client:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}