import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { quotesTable } from '@/schema';
import { eq, desc } from 'drizzle-orm';

// GET - Récupérer les devis d'un client spécifique
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email du client requis' 
      }, { status: 400 });
    }

    console.log('🔍 Recherche des devis pour le client:', email);

    // Récupérer tous les devis du client
    const quotes = await db
      .select()
      .from(quotesTable)
      .where(eq(quotesTable.customerEmail, email))
      .orderBy(desc(quotesTable.createdAt));

    console.log('✅ Devis trouvés pour le client:', quotes.length);

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