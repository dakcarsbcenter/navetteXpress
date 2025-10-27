export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/schema';
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
        .from(users)
        .where(eq(users.role, 'admin'));

      if (existingAdmins.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Des administrateurs existent déjà. Utilisez /api/admin/users avec des privilèges admin.' 
        }, { status: 403 });
      }
    }

    const body = await request.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json({ 
        success: false, 
        error: 'email et name sont obligatoires' 
      }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      // Mettre à jour vers admin si ce n'est pas déjà le cas
      if (existingUser[0].role !== 'admin') {
        await db
          .update(users)
          .set({ role: 'admin', updatedAt: new Date() })
          .where(eq(users.email, email));
        
        return NextResponse.json({ 
          success: true, 
          message: `Rôle mis à jour de ${existingUser[0].role} vers admin pour l'utilisateur ${email}`,
          action: 'updated'
        });
      } else {
        return NextResponse.json({ 
          success: true, 
          message: `L'utilisateur ${email} est déjà administrateur`,
          action: 'already_admin'
        });
      }
    } else {
      // Créer un nouvel utilisateur admin
      const newUser = await db
        .insert(users)
        .values({
          id: `admin_${Date.now()}`,
          email,
          name,
          role: 'admin',
        })
        .returning();

      return NextResponse.json({ 
        success: true, 
        message: `Utilisateur admin créé avec succès pour ${email}`,
        data: newUser[0],
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
      .from(users)
      .where(eq(users.role, 'admin'));

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