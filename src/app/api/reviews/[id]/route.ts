import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { reviewsTable, rolePermissionsTable } from '@/schema'
import { eq, and } from 'drizzle-orm'

// Fonction pour vérifier les permissions dynamiques des reviews
async function hasReviewsPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
  try {
    // Les admins ont toujours accès
    if (userRole === 'admin') {
      return true;
    }

    // Vérifier les permissions dynamiques pour l'action spécifique
    const permissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, userRole),
        eq(rolePermissionsTable.resource, 'reviews'),
        eq(rolePermissionsTable.action, action),
        eq(rolePermissionsTable.allowed, true)
      ));

    // Retourner true si la permission existe
    return permissions.length > 0;
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions reviews:', error);
    return false;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userRole = (session.user as any).role || 'customer';
    const hasUpdatePermission = await hasReviewsPermission(userRole, 'update');

    if (!hasUpdatePermission) {
      return NextResponse.json({ 
        error: 'Vous n\'avez pas la permission de modifier cet avis' 
      }, { status: 403 });
    }

    const body = await request.json()
    const { id } = await params
    const reviewId = parseInt(id)
    
    // Mettre à jour les propriétés de l'avis
    await db.update(reviewsTable)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(reviewsTable.id, reviewId))
    
    return NextResponse.json({
      success: true,
      message: 'Avis mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'avis:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'avis' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userRole = (session.user as any).role || 'customer';
    const hasDeletePermission = await hasReviewsPermission(userRole, 'delete');

    if (!hasDeletePermission) {
      return NextResponse.json({ 
        error: 'Vous n\'avez pas la permission de supprimer cet avis' 
      }, { status: 403 });
    }

    const reviewId = parseInt(params.id)
    
    await db.delete(reviewsTable).where(eq(reviewsTable.id, reviewId))

    return NextResponse.json({
      success: true,
      message: 'Avis supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'avis:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'avis' },
      { status: 500 }
    )
  }
}