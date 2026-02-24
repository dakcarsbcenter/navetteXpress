export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/schema';
import { eq } from 'drizzle-orm';
import { requireUsersRead, requireUsersUpdate, requireUsersDelete } from '@/utils/admin-permissions';

// GET - Récupérer un chauffeur par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await requireUsersRead(); // Vérification de la permission de lecture
    } catch (permError) {
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID invalide' 
      }, { status: 400 });
    }

    const driver = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (driver.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chauffeur non trouvé' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: driver[0] 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du chauffeur:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// PUT - Mettre à jour un chauffeur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await requireUsersUpdate(); // Vérification de la permission de mise à jour
    } catch (permError) {
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID invalide' 
      }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, phone, licenseNumber, image, isActive } = body;

    const updatedDriver = await db
      .update(users)
      .set({
        name,
        email,
        phone,
        licenseNumber,
        image,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (updatedDriver.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chauffeur non trouvé' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedDriver[0] 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du chauffeur:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// DELETE - Supprimer un chauffeur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await requireUsersDelete(); // Vérification de la permission de suppression
    } catch (permError) {
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID invalide' 
      }, { status: 400 });
    }

    const deletedDriver = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (deletedDriver.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chauffeur non trouvé' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Chauffeur supprimé avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du chauffeur:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

