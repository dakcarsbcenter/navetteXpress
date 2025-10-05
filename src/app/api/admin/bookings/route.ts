import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookingsTable, users, vehiclesTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { requireAdminRole } from '@/utils/admin-permissions';

// GET - Récupérer toutes les réservations avec leurs détails
export async function GET() {
  try {
    await requireAdminRole(); // Vérification du rôle admin

    const bookings = await db
      .select({
        booking: bookingsTable,
        driver: users,
        vehicle: vehiclesTable,
      })
      .from(bookingsTable)
      .leftJoin(users, eq(bookingsTable.driverId, users.id))
      .leftJoin(vehiclesTable, eq(bookingsTable.vehicleId, vehiclesTable.id));
    
    return NextResponse.json({ 
      success: true, 
      data: bookings 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// POST - Créer une nouvelle réservation
export async function POST(request: NextRequest) {
  try {
    await requireAdminRole(); // Vérification du rôle admin

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
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

