export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { db } from '@/db'
import { bookingsTable } from '@/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Récupérer toutes les réservations annulées
    const cancelledBookings = await db
      .select({
        id: bookingsTable.id,
        status: bookingsTable.status,
        cancellationReason: bookingsTable.cancellationReason,
        cancelledAt: bookingsTable.cancelledAt,
        cancelledBy: bookingsTable.cancelledBy,
        customerName: bookingsTable.customerName,
        pickupAddress: bookingsTable.pickupAddress,
        dropoffAddress: bookingsTable.dropoffAddress,
      })
      .from(bookingsTable)
      .where(eq(bookingsTable.status, 'cancelled'))
    
    const analysis = cancelledBookings.map(booking => ({
      id: booking.id,
      customer: booking.customerName,
      route: `${booking.pickupAddress} → ${booking.dropoffAddress}`,
      hasReason: !!booking.cancellationReason,
      reason: booking.cancellationReason || 'AUCUN MOTIF',
      cancelledAt: booking.cancelledAt || 'NON DÉFINIE',
      cancelledBy: booking.cancelledBy || 'NON DÉFINI'
    }))
    
    const withReason = analysis.filter(b => b.hasReason)
    const withoutReason = analysis.filter(b => !b.hasReason)
    
    return NextResponse.json({
      success: true,
      summary: {
        total: cancelledBookings.length,
        withReason: withReason.length,
        withoutReason: withoutReason.length
      },
      bookingsWithReason: withReason,
      bookingsWithoutReason: withoutReason,
      message: `${cancelledBookings.length} réservations annulées trouvées. ${withReason.length} avec motif, ${withoutReason.length} sans motif.`
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la vérification des annulations',
      details: String(error)
    })
  }
}