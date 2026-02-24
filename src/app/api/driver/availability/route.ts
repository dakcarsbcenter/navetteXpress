export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { driverAvailabilityTable, users } from '@/schema';
import { eq, and } from 'drizzle-orm';

// GET - Récupérer les disponibilités d'un chauffeur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;

    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');

    // Si l'utilisateur n'est pas admin, il ne peut voir que ses propres disponibilités
    let targetDriverId: string | null = driverId;
    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      targetDriverId = session.user.id || null;
    }

    if (!targetDriverId) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID du chauffeur requis' 
      }, { status: 400 });
    }

    // Vérifier que le chauffeur existe
    const driver = await db.select()
      .from(users)
      .where(eq(users.id, targetDriverId))
      .limit(1);

    if (!driver.length || driver[0].role !== 'driver') {
      return NextResponse.json({ 
        success: false, 
        error: 'Chauffeur non trouvé' 
      }, { status: 404 });
    }

    // Récupérer les disponibilités
    const availabilities = await db.select()
      .from(driverAvailabilityTable)
      .where(eq(driverAvailabilityTable.driverId, targetDriverId))
      .orderBy(driverAvailabilityTable.dayOfWeek, driverAvailabilityTable.startTime);

    return NextResponse.json({ 
      success: true, 
      data: availabilities 
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des disponibilités:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// POST - Créer une nouvelle disponibilité
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;

    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { 
      driverId,
      dayOfWeek,
      startTime,
      endTime,
      isAvailable,
      specificDate,
      notes
    } = body;

    // Si l'utilisateur n'est pas admin, il ne peut créer que ses propres disponibilités
    let targetDriverId = driverId;
    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      targetDriverId = session.user.id;
    }

    // Validation
    if (!targetDriverId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ 
        success: false, 
        error: 'Données manquantes' 
      }, { status: 400 });
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({ 
        success: false, 
        error: 'Jour invalide (doit être entre 0 et 6)' 
      }, { status: 400 });
    }

    // Créer la disponibilité
    const newAvailability = await db.insert(driverAvailabilityTable)
      .values({
        driverId: targetDriverId,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        specificDate: specificDate ? new Date(specificDate) : null,
        notes: notes || null,
        updatedAt: new Date()
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      data: newAvailability[0],
      message: 'Disponibilité créée avec succès'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Erreur lors de la création de la disponibilité:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// PUT - Mettre à jour une disponibilité
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;

    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { 
      id,
      dayOfWeek,
      startTime,
      endTime,
      isAvailable,
      specificDate,
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID de disponibilité requis' 
      }, { status: 400 });
    }

    // Vérifier que la disponibilité existe et appartient au chauffeur
    const existing = await db.select()
      .from(driverAvailabilityTable)
      .where(eq(driverAvailabilityTable.id, id))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ 
        success: false, 
        error: 'Disponibilité non trouvée' 
      }, { status: 404 });
    }

    // Si l'utilisateur n'est pas admin, il ne peut modifier que ses propres disponibilités
    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      if (existing[0].driverId !== session.user.id) {
        return NextResponse.json({ 
          success: false, 
          error: 'Non autorisé' 
        }, { status: 403 });
      }
    }

    // Mettre à jour
    const updated = await db.update(driverAvailabilityTable)
      .set({
        dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : existing[0].dayOfWeek,
        startTime: startTime || existing[0].startTime,
        endTime: endTime || existing[0].endTime,
        isAvailable: isAvailable !== undefined ? isAvailable : existing[0].isAvailable,
        specificDate: specificDate ? new Date(specificDate) : existing[0].specificDate,
        notes: notes !== undefined ? notes : existing[0].notes,
        updatedAt: new Date()
      })
      .where(eq(driverAvailabilityTable.id, id))
      .returning();

    return NextResponse.json({ 
      success: true, 
      data: updated[0],
      message: 'Disponibilité mise à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la disponibilité:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// DELETE - Supprimer une disponibilité
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;

    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID de disponibilité requis' 
      }, { status: 400 });
    }

    // Vérifier que la disponibilité existe et appartient au chauffeur
    const existing = await db.select()
      .from(driverAvailabilityTable)
      .where(eq(driverAvailabilityTable.id, parseInt(id)))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ 
        success: false, 
        error: 'Disponibilité non trouvée' 
      }, { status: 404 });
    }

    // Si l'utilisateur n'est pas admin, il ne peut supprimer que ses propres disponibilités
    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      if (existing[0].driverId !== session.user.id) {
        return NextResponse.json({ 
          success: false, 
          error: 'Non autorisé' 
        }, { status: 403 });
      }
    }

    // Supprimer
    await db.delete(driverAvailabilityTable)
      .where(eq(driverAvailabilityTable.id, parseInt(id)));

    return NextResponse.json({ 
      success: true, 
      message: 'Disponibilité supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la disponibilité:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}
