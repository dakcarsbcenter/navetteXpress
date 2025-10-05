import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/schema';
import { eq } from 'drizzle-orm';
import { requireAdminRole } from '@/utils/admin-permissions';

// GET - Récupérer tous les chauffeurs
export async function GET() {
  try {
    console.log('Début de la récupération des chauffeurs...');
    
    await requireAdminRole(); // Vérification du rôle admin
    console.log('Permissions admin vérifiées');

    const drivers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'driver'));
    
    console.log(`Nombre de chauffeurs trouvés: ${drivers.length}`);
    
    return NextResponse.json({ 
      success: true, 
      data: drivers 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des chauffeurs:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Erreur interne du serveur';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}

// POST - Créer un nouveau chauffeur
export async function POST(request: NextRequest) {
  try {
    await requireAdminRole(); // Vérification du rôle admin

    const body = await request.json();
    const { id, name, email, phone, licenseNumber, image, isActive } = body;

    if (!id || !name || !email || !phone || !licenseNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tous les champs obligatoires doivent être renseignés' 
      }, { status: 400 });
    }

    const newDriver = await db
      .insert(users)
      .values({
        id,
        name,
        email,
        phone,
        licenseNumber,
        image,
        role: 'driver',
        isActive: isActive ?? true,
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      data: newDriver[0] 
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du chauffeur:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

