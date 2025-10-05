import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userRolesTable } from '@/schema';
import { eq } from 'drizzle-orm';

/**
 * Route spéciale pour initialiser le premier admin
 * ⚠️ ATTENTION: Cette route ne devrait être utilisée qu'en développement
 * ou pour initialiser le tout premier administrateur
 */
export async function POST(request: NextRequest) {
  try {
    // Vérification de sécurité - seulement en développement
    if (process.env.NODE_ENV === 'production') {
      // En production, on vérifie s'il y a déjà des admins
      const existingAdmins = await db
        .select()
        .from(userRolesTable)
        .where(eq(userRolesTable.role, 'admin'));

      if (existingAdmins.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Des administrateurs existent déjà. Utilisez /api/admin/users avec des privilèges admin.' 
        }, { status: 403 });
      }
    }

    const body = await request.json();
    const { clerkUserId } = body;

    if (!clerkUserId) {
      return NextResponse.json({ 
        success: false, 
        error: 'clerkUserId est obligatoire' 
      }, { status: 400 });
    }

    if (!clerkUserId.startsWith('user_')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Format d\'ID Clerk invalide (doit commencer par user_)' 
      }, { status: 400 });
    }

    // Vérifier si l'utilisateur a déjà un rôle
    const existingRole = await db
      .select()
      .from(userRolesTable)
      .where(eq(userRolesTable.clerkUserId, clerkUserId))
      .limit(1);

    if (existingRole.length > 0) {
      // Mettre à jour vers admin si ce n'est pas déjà le cas
      if (existingRole[0].role !== 'admin') {
        await db
          .update(userRolesTable)
          .set({ role: 'admin', updatedAt: new Date() })
          .where(eq(userRolesTable.clerkUserId, clerkUserId));
        
        return NextResponse.json({ 
          success: true, 
          message: `Rôle mis à jour de ${existingRole[0].role} vers admin pour l'utilisateur ${clerkUserId}`,
          action: 'updated'
        });
      } else {
        return NextResponse.json({ 
          success: true, 
          message: `L'utilisateur ${clerkUserId} est déjà administrateur`,
          action: 'already_admin'
        });
      }
    } else {
      // Créer un nouveau rôle admin
      const newRole = await db
        .insert(userRolesTable)
        .values({
          clerkUserId,
          role: 'admin',
        })
        .returning();

      return NextResponse.json({ 
        success: true, 
        message: `Rôle admin assigné avec succès à l'utilisateur ${clerkUserId}`,
        data: newRole[0],
        action: 'created'
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation admin:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// GET pour vérifier le statut des admins
export async function GET() {
  try {
    const admins = await db
      .select()
      .from(userRolesTable)
      .where(eq(userRolesTable.role, 'admin'));

    return NextResponse.json({ 
      success: true, 
      data: {
        adminCount: admins.length,
        hasAdmins: admins.length > 0,
        isProduction: process.env.NODE_ENV === 'production'
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification des admins:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}




