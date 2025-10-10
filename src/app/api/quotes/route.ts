import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { quotesTable } from '@/schema';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { desc } from 'drizzle-orm';

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

// GET - Récupérer les demandes de devis (admin seulement)
export async function GET() {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null;

    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    // Vérifier si l'utilisateur est admin
    // Note: Vous pouvez ajouter une vérification de rôle ici si nécessaire

    const quotes = await db
      .select()
      .from(quotesTable)
      .orderBy(desc(quotesTable.createdAt));

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
