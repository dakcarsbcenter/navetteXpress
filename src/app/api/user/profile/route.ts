import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/schema';
import { eq } from 'drizzle-orm';

// PATCH - Mettre à jour le profil utilisateur
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, name } = body;

    // Validation
    if (!phone && !name) {
      return NextResponse.json(
        { success: false, error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      );
    }

    // Préparer les données à mettre à jour
    const updateData: any = {
      updatedAt: new Date()
    };

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    if (name !== undefined) {
      updateData.name = name;
    }

    // Mettre à jour l'utilisateur
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.email, session.user.email))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    console.log(`✅ Profil mis à jour pour ${session.user.email}:`, updateData);

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du profil:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la mise à jour du profil' 
      },
      { status: 500 }
    );
  }
}

// GET - Récupérer le profil utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        image: users.image
      })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du profil:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération du profil' 
      },
      { status: 500 }
    );
  }
}
