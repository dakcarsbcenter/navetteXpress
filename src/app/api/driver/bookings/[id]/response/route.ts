export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { bookingsTable, users } from '@/schema';
import { eq, and } from 'drizzle-orm';
import { sendWithRetry } from '@/lib/notification-queue';

// PUT - Approuver ou rejeter une réservation (chauffeur uniquement)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification et le rôle chauffeur
    const session = await getServerSession(authOptions) as { user?: { id?: string; role?: string } } | null;
    if (!session?.user || (session.user as { role?: string }).role !== 'driver') {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les chauffeurs peuvent accéder à cette ressource." },
        { status: 403 }
      );
    }

    const id = parseInt((await params).id);
    if (isNaN(id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID invalide' 
      }, { status: 400 });
    }

    const { action } = await request.json(); // 'approve' ou 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Action invalide. Utilisez "approve" ou "reject"' 
      }, { status: 400 });
    }

    // Vérifier que la réservation existe et est assignée au chauffeur connecté
    const userSession = session as unknown as { user: { id: string } }
    const existingBooking = await db
      .select()
      .from(bookingsTable)
      .where(and(
        eq(bookingsTable.id, id),
        eq(bookingsTable.driverId, userSession.user.id),
        eq(bookingsTable.status, 'assigned')
      ))
      .limit(1);

    if (existingBooking.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Réservation non trouvée ou non assignée à ce chauffeur' 
      }, { status: 404 });
    }

    // Mettre à jour le statut de la réservation.
    // On aligne le vocabulaire sur celui du flux principal (PATCH /api/driver/bookings/[id])
    // au lieu des anciens statuts 'approved'/'rejected' : ceux-ci ne sont reconnus par
    // aucun des ACTIVE_STATUSES du tableau de bord chauffeur redessiné (voir
    // src/app/driver/dashboard/components/DriverDashboardHome.tsx), donc une réservation
    // approuvée ici disparaissait silencieusement du suivi de mission en cours.
    // Un refus ne doit pas non plus tuer la réservation : elle repart dans la file
    // d'assignation admin (statut 'pending', sans chauffeur) au lieu de rester bloquée
    // sur un statut terminal.
    const newStatus = action === 'approve' ? 'confirmed' : 'pending';

    const updateData: Partial<typeof bookingsTable.$inferInsert> = {
      status: newStatus,
      updatedAt: new Date(),
    };
    if (action === 'reject') {
      updateData.driverId = null;
    }

    const updatedBooking = await db
      .update(bookingsTable)
      .set(updateData)
      .where(eq(bookingsTable.id, id))
      .returning();

    const responseBooking = updatedBooking[0];
    const originalBooking = existingBooking[0];

    console.log(`✅ Réservation #${responseBooking.id} ${action === 'approve' ? 'approuvée' : 'rejetée'} par le chauffeur`);

    const driverInfo = await db
      .select({ name: users.name, phone: users.phone })
      .from(users)
      .where(eq(users.id, userSession.user.id))
      .limit(1);
    const driver = driverInfo[0];

    if (action === 'approve') {
      await sendWithRetry('email', 'resend-mailer.sendBookingConfirmedByDriverEmail', [
        originalBooking.customerEmail,
        {
          bookingId: `BOOK-${responseBooking.id}`,
          customerName: originalBooking.customerName,
          driverName: driver?.name || 'Votre chauffeur',
          driverPhone: driver?.phone || undefined,
          pickupLocation: originalBooking.pickupAddress,
          dropoffLocation: originalBooking.dropoffAddress,
          pickupDate: new Date(originalBooking.scheduledDateTime).toLocaleDateString('fr-FR'),
          pickupTime: new Date(originalBooking.scheduledDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      await sendWithRetry('email', 'resend-mailer.sendBookingRejectedByDriverEmail', [
        {
          bookingId: responseBooking.id,
          customerName: originalBooking.customerName,
          driverName: driver?.name || 'Un chauffeur',
          pickupAddress: originalBooking.pickupAddress,
          dropoffAddress: originalBooking.dropoffAddress,
          scheduledDateTime: originalBooking.scheduledDateTime.toISOString(),
        }
      ]);
    }

    return NextResponse.json({
      success: true,
      data: responseBooking,
      message: `Réservation ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`
    });
  } catch (error) {
    console.error('Erreur lors de la réponse à la réservation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}
