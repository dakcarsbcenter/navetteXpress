export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { bookingsTable, users } from '@/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { requireBookingsRead } from '@/utils/admin-permissions';

// GET - File d'assignation : réservations en attente, sans chauffeur, la plus ancienne en premier
export async function GET() {
  try {
    try {
      await requireBookingsRead();
    } catch (permError) {
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
    }

    const clientUsers = alias(users, 'client_users');

    const rows = await db.select({
      id: bookingsTable.id,
      customerName: bookingsTable.customerName,
      clientAccountName: clientUsers.name,
      pickupAddress: bookingsTable.pickupAddress,
      dropoffAddress: bookingsTable.dropoffAddress,
      scheduledDateTime: bookingsTable.scheduledDateTime,
      passengers: bookingsTable.passengers,
      luggage: bookingsTable.luggage,
      duration: bookingsTable.duration,
      price: bookingsTable.price,
      createdAt: bookingsTable.createdAt,
    })
      .from(bookingsTable)
      .leftJoin(clientUsers, eq(bookingsTable.userId, clientUsers.id))
      .where(and(eq(bookingsTable.status, 'pending'), isNull(bookingsTable.driverId)))
      .orderBy(asc(bookingsTable.createdAt));

    return NextResponse.json({
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        ref: `NX-${row.id}`,
        clientName: row.clientAccountName || row.customerName,
        pickupAddress: row.pickupAddress,
        dropoffAddress: row.dropoffAddress,
        scheduledDateTime: row.scheduledDateTime.toISOString(),
        passengers: row.passengers,
        luggage: row.luggage,
        duration: Number(row.duration ?? 2),
        price: row.price ? Number(row.price) : null,
        createdAt: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la file d\'assignation:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
