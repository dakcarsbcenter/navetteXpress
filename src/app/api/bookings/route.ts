import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookingsTable } from '@/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';
import { sendNewBookingNotificationToAdmin } from '@/lib/brevo-email';

// POST - Créer une nouvelle réservation (accessible aux utilisateurs connectés et non connectés)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      serviceType,
      vehicle,
      date,
      time,
      pickupAddress,
      destinationAddress,
      passengers,
      duration,
      additionalServices,
      specialRequests,
      contactPhone,
      clientName,
      clientEmail,
      // Champs pour utilisateurs connectés
      userId
    } = body;

    // Validation des champs obligatoires
    if (!pickupAddress || !destinationAddress || !date || !time || !contactPhone) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tous les champs obligatoires doivent être renseignés' 
      }, { status: 400 });
    }

    // Pour les utilisateurs non connectés, vérifier les champs client
    if (!userId && (!clientName || !clientEmail)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nom et email requis pour les utilisateurs non connectés' 
      }, { status: 400 });
    }

    // Récupérer la session pour les utilisateurs connectés
    const session = await getServerSession(authOptions);
    const finalUserId = userId || session?.user?.id || null;
    const finalClientName = clientName || session?.user?.name || '';
    const finalClientEmail = clientEmail || session?.user?.email || '';

    // Créer la date/heure combinée
    const scheduledDateTime = new Date(`${date}T${time}`);

    // Calculer le prix estimé (logique simplifiée)
    const basePrice = 100; // Prix de base
    const vehicleMultiplier = vehicle === 'limousine' ? 2.0 : 
                             vehicle === 'sprinter' ? 1.5 : 
                             vehicle === 'mercedes-s' ? 1.2 : 
                             vehicle === 'bmw-7' ? 1.1 : 
                             vehicle === 'audi-a8' ? 1.15 : 1.0;
    
    const serviceMultiplier = serviceType === 'event' ? 1.5 :
                             serviceType === 'airport' ? 1.2 :
                             serviceType === 'business' ? 1.1 : 1.0;

    const additionalServicesPrice = additionalServices?.reduce((total: number, serviceId: string) => {
      const servicePrices: { [key: string]: number } = {
        'wifi': 10,
        'refreshments': 25,
        'newspaper': 5,
        'child_seat': 15,
        'flowers': 35,
        'champagne': 50
      };
      return total + (servicePrices[serviceId] || 0);
    }, 0) || 0;

    const estimatedPrice = Math.round(
      (basePrice * vehicleMultiplier * serviceMultiplier * duration) + additionalServicesPrice
    );

    // Créer la réservation
    const newBooking = await db
      .insert(bookingsTable)
      .values({
        customerName: finalClientName,
        customerEmail: finalClientEmail,
        customerPhone: contactPhone,
        userId: finalUserId,
        pickupAddress,
        dropoffAddress: destinationAddress,
        scheduledDateTime,
        status: 'pending',
        driverId: null, // Sera assigné plus tard par l'admin
        vehicleId: null, // Sera assigné plus tard par l'admin
        price: estimatedPrice.toString(),
        notes: `Service: ${serviceType}\nPassagers: ${passengers}\nDurée: ${duration}h\nServices additionnels: ${additionalServices?.join(', ') || 'Aucun'}\nDemandes spéciales: ${specialRequests || 'Aucune'}`
      })
      .returning();

    const createdBooking = newBooking[0];
    console.log(`✅ Réservation #${createdBooking.id} créée pour ${finalClientName}`);

    // Envoyer notification à l'admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@navette-xpress.sn';
      
      console.log(`📧 Envoi notification admin pour nouvelle réservation #${createdBooking.id}...`);
      
      const emailResult = await sendNewBookingNotificationToAdmin(adminEmail, {
        id: createdBooking.id,
        customerName: createdBooking.customerName,
        customerEmail: createdBooking.customerEmail,
        customerPhone: createdBooking.customerPhone,
        pickupAddress: createdBooking.pickupAddress,
        dropoffAddress: createdBooking.dropoffAddress,
        scheduledDateTime: createdBooking.scheduledDateTime.toISOString(),
        price: createdBooking.price,
        notes: createdBooking.notes || undefined
      });

      if (emailResult.success) {
        console.log(`✅ Notification admin envoyée - Message ID: ${emailResult.messageId}`);
      } else {
        console.error(`❌ Erreur notification admin: ${emailResult.error}`);
        // On continue même si l'email échoue
      }
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de la notification admin:', emailError);
      // On continue même si l'email échoue
    }

    return NextResponse.json({ 
      success: true, 
      data: createdBooking,
      message: 'Réservation créée avec succès et notification admin envoyée'
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}

// GET - Récupérer les réservations de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;

    const userBookings = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.userId, userId))
      .orderBy(desc(bookingsTable.createdAt));

    return NextResponse.json({ 
      success: true, 
      data: userBookings 
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }, { status: 500 });
  }
}
