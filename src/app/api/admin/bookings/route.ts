export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookingsTable, users, vehiclesTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { requireBookingsRead, requireBookingsCreate } from '@/utils/admin-permissions';

// Créer des alias pour les jointures multiples
const driverUsers = alias(users, 'driver_users');
const cancelledByUsers = alias(users, 'cancelled_by_users');

// GET - Récupérer toutes les réservations avec leurs détails
export async function GET() {
  try {
    console.log('📋 [API Bookings] Début de la requête GET')
    
    // Vérification de la permission de lecture
    try {
      await requireBookingsRead();
      console.log('✅ [API Bookings] Permission de lecture validée')
    } catch (permError) {
      console.error('❌ [API Bookings] Erreur de permission:', permError)
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({ 
        success: false, 
        error: errorMessage
      }, { status: statusCode });
    }

    console.log('🔍 [API Bookings] Requête à la base de données...')
    const bookings = await db
      .select({
        booking: bookingsTable,
        driver: driverUsers,
        vehicle: vehiclesTable,
        cancelledByUser: {
          name: cancelledByUsers.name,
          role: cancelledByUsers.role
        },
      })
      .from(bookingsTable)
      .leftJoin(driverUsers, eq(bookingsTable.driverId, driverUsers.id))
      .leftJoin(vehiclesTable, eq(bookingsTable.vehicleId, vehiclesTable.id))
      .leftJoin(cancelledByUsers, eq(bookingsTable.cancelledBy, cancelledByUsers.id));
    
    console.log(`✅ [API Bookings] ${bookings.length} réservations récupérées`)
    return NextResponse.json({ 
      success: true, 
      data: bookings 
    });
  } catch (error) {
    console.error('❌ [API Bookings] Erreur lors de la récupération:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// POST - Créer une nouvelle réservation
export async function POST(request: NextRequest) {
  try {
    try {
      await requireBookingsCreate(); // Vérification de la permission de création
    } catch (permError) {
      console.error('❌ [API Bookings] Erreur de permission:', permError)
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({ 
        success: false, 
        error: errorMessage
      }, { status: statusCode });
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

    if (!customerName || !customerEmail || !customerPhone || !pickupAddress || !dropoffAddress || !scheduledDateTime) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tous les champs obligatoires doivent être renseignés' 
      }, { status: 400 });
    }

    const newBooking = await db
      .insert(bookingsTable)
      .values({
        customerName,
        customerEmail,
        customerPhone,
        pickupAddress,
        dropoffAddress,
        scheduledDateTime: new Date(scheduledDateTime),
        status: status || 'pending',
        driverId,
        vehicleId,
        price,
        notes,
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      data: newBooking[0] 
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

