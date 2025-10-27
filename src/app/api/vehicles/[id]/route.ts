export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehiclesTable } from '@/schema';
import { eq } from 'drizzle-orm';

/**
 * API pour gérer un véhicule spécifique
 * GET: Récupérer un véhicule par ID
 * PUT: Mettre à jour un véhicule
 * DELETE: Supprimer un véhicule
 */

// Récupérer un véhicule par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicleId = parseInt(params.id);
    
    if (isNaN(vehicleId)) {
      return NextResponse.json(
        { success: false, error: 'ID de véhicule invalide' },
        { status: 400 }
      );
    }

    const vehicle = await db
      .select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.id, vehicleId))
      .limit(1);

    if (vehicle.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Véhicule non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vehicle[0],
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du véhicule:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Mettre à jour un véhicule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicleId = parseInt(params.id);
    
    if (isNaN(vehicleId)) {
      return NextResponse.json(
        { success: false, error: 'ID de véhicule invalide' },
        { status: 400 }
      );
    }

    const updateData = await request.json();
    
    // Valider les données de base
    if (!updateData.make || !updateData.model) {
      return NextResponse.json(
        { success: false, error: 'Marque et modèle requis' },
        { status: 400 }
      );
    }

    // Préparer les données pour la mise à jour
    const vehicleData = {
      make: updateData.make,
      model: updateData.model,
      year: updateData.year || new Date().getFullYear(),
      color: updateData.color || '',
      capacity: updateData.capacity || 4,
      pricePerKm: parseFloat(updateData.pricePerKm) || 0,
      photo: updateData.photo || '',
      features: typeof updateData.features === 'string' 
        ? updateData.features 
        : JSON.stringify(updateData.features || []),
      isActive: updateData.isActive !== undefined ? updateData.isActive : true,
    };

    // Vérifier que le véhicule existe
    const existingVehicle = await db
      .select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.id, vehicleId))
      .limit(1);

    if (existingVehicle.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Véhicule non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le véhicule
    const updatedVehicle = await db
      .update(vehiclesTable)
      .set(vehicleData)
      .where(eq(vehiclesTable.id, vehicleId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Véhicule mis à jour avec succès',
      data: updatedVehicle[0],
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du véhicule:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// Supprimer un véhicule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicleId = parseInt(params.id);
    
    if (isNaN(vehicleId)) {
      return NextResponse.json(
        { success: false, error: 'ID de véhicule invalide' },
        { status: 400 }
      );
    }

    // Vérifier que le véhicule existe
    const existingVehicle = await db
      .select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.id, vehicleId))
      .limit(1);

    if (existingVehicle.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Véhicule non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le véhicule
    await db
      .delete(vehiclesTable)
      .where(eq(vehiclesTable.id, vehicleId));

    return NextResponse.json({
      success: true,
      message: 'Véhicule supprimé avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du véhicule:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}