import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { bookingsTable, users } from '@/schema';
import { eq, and } from 'drizzle-orm';
import { sendBookingApprovalNotificationToCustomer } from '@/lib/brevo-email';

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

    // Mettre à jour le statut de la réservation
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    const updatedBooking = await db
      .update(bookingsTable)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(bookingsTable.id, id))
      .returning();

    const responseBooking = updatedBooking[0];
    const originalBooking = existingBooking[0];
    
    console.log(`✅ Réservation #${responseBooking.id} ${action === 'approve' ? 'approuvée' : 'rejetée'} par le chauffeur`);

    // Si approuvée, envoyer notification de confirmation au client
    if (action === 'approve') {
      try {
        // Récupérer les infos du chauffeur pour l'email
        const driverInfo = await db
          .select()
          .from(users)
          .where(eq(users.id, userSession.user.id))
          .limit(1);

        const driver = driverInfo[0];
        
        console.log(`📧 Envoi notification client pour approbation #${responseBooking.id}...`);
        
        const emailResult = await sendBookingApprovalNotificationToCustomer(
          originalBooking.customerEmail,
          originalBooking.customerName,
          {
            id: responseBooking.id,
            driverName: driver.name || 'Votre chauffeur',
            driverPhone: driver.phone || undefined,
            pickupAddress: originalBooking.pickupAddress,
            dropoffAddress: originalBooking.dropoffAddress,
            scheduledDateTime: originalBooking.scheduledDateTime.toISOString(),
            price: originalBooking.price || "0",
            vehicleInfo: undefined, // TODO: À récupérer de la DB des véhicules
            notes: originalBooking.notes || undefined
          }
        );

        if (emailResult.success) {
          console.log(`✅ Notification client envoyée - Message ID: ${emailResult.messageId}`);
        } else {
          console.error(`❌ Erreur notification client: ${emailResult.error}`);
          // On continue même si l'email échoue
        }
      } catch (emailError) {
        console.error('❌ Erreur lors de l\'envoi de la notification client:', emailError);
        // On continue même si l'email échoue
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: responseBooking,
      message: `Réservation ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès${action === 'approve' ? '. Notification envoyée au client.' : ''}`
    });
  } catch (error) {
    console.error('Erreur lors de la réponse à la réservation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}
