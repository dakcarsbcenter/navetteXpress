import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookingsTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { requireAdminRole } from '@/utils/admin-permissions';

// GET - Récupérer une réservation par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminRole(); // Vérification du rôle admin

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID invalide' 
      }, { status: 400 });
    }

    const booking = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .limit(1);

    if (booking.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Réservation non trouvée' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: booking[0] 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// PATCH - Mettre à jour partiellement une réservation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminRole(); // Vérification du rôle admin

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID invalide' 
      }, { status: 400 });
    }

    const body = await request.json();
    
    // Construction dynamique de l'objet de mise à jour
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Ajout conditionnel des champs à mettre à jour
    if (body.status !== undefined) updateData.status = body.status;
    if (body.driverId !== undefined) updateData.driverId = body.driverId;
    if (body.vehicleId !== undefined) updateData.vehicleId = body.vehicleId;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const updatedBooking = await db
      .update(bookingsTable)
      .set(updateData)
      .where(eq(bookingsTable.id, id))
      .returning();

    if (updatedBooking.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Réservation non trouvée' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedBooking[0] 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réservation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// PUT - Mettre à jour une réservation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminRole(); // Vérification du rôle admin

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID invalide' 
      }, { status: 400 });
    }

    const body = await request.json();
    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      pickupAddress, 
      dropoffAddress, 
      scheduledDateTime, 
      status,
      driverId,
      vehicleId,
      price,
      notes 
    } = body;

    const updatedBooking = await db
      .update(bookingsTable)
      .set({
        customerName,
        customerEmail,
        customerPhone,
        pickupAddress,
        dropoffAddress,
        scheduledDateTime: scheduledDateTime ? new Date(scheduledDateTime) : undefined,
        status,
        driverId,
        vehicleId,
        price,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(bookingsTable.id, id))
      .returning();

    if (updatedBooking.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Réservation non trouvée' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedBooking[0] 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réservation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// DELETE - Supprimer une réservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminRole(); // Vérification du rôle admin

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID invalide' 
      }, { status: 400 });
    }

    const deletedBooking = await db
      .delete(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .returning();

    if (deletedBooking.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Réservation non trouvée' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Réservation supprimée avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la réservation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

