import { NextRequest, NextResponse } from 'next/server';
import { 
  sendNewBookingNotificationToAdmin,
  sendDriverAssignmentNotification,
  sendBookingApprovalNotificationToCustomer 
} from '@/lib/brevo-email';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const email = searchParams.get('email');

    if (!type || !email) {
      return NextResponse.json({
        success: false,
        error: 'Paramètres requis: ?type=[admin|driver|customer]&email=test@example.com'
      }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'admin':
        console.log(`🧪 Test notification admin vers ${email}...`);
        result = await sendNewBookingNotificationToAdmin(email, {
          id: 123,
          customerName: 'Jean Dupont',
          customerEmail: 'client@example.com',
          customerPhone: '+33 6 12 34 56 78',
          pickupAddress: '123 Rue de la République, Dakar',
          dropoffAddress: 'Aéroport Charles de Gaulle, Terminal 2E',
          scheduledDateTime: new Date(Date.now() + 86400000).toISOString(), // Demain
          price: '185',
          notes: 'Service: Aéroport\nPassagers: 2\nDurée: 1h\nServices additionnels: WiFi, Journaux\nDemandes spéciales: Véhicule premium avec siège enfant'
        });
        break;

      case 'driver':
        console.log(`🧪 Test notification chauffeur vers ${email}...`);
        result = await sendDriverAssignmentNotification(
          email,
          'Marie Martin', // Nom du chauffeur
          {
            id: 456,
            customerName: 'Pierre Dubois',
            customerPhone: '+33 6 98 76 54 32',
            pickupAddress: 'Gare de Lyon, Place Louis Armand, Dakar',
            dropoffAddress: '15 Avenue des Champs-Élysées, Dakar',
            scheduledDateTime: new Date(Date.now() + 3600000).toISOString(), // Dans 1 heure
            price: '95',
            notes: 'Client VIP - Transport business\nRéunion importante à 14h30\nVéhicule propre requis'
          }
        );
        break;

      case 'customer':
        console.log(`🧪 Test notification client vers ${email}...`);
        result = await sendBookingApprovalNotificationToCustomer(
          email,
          'Sophie Martin', // Nom du client
          {
            id: 789,
            driverName: 'Ahmed Benali',
            driverPhone: '+33 6 55 77 88 99',
            pickupAddress: 'Hotel Le Meurice, 228 Rue de Rivoli, Dakar',
            dropoffAddress: 'Aéroport d\'Orly, Terminal Sud',
            scheduledDateTime: new Date(Date.now() + 7200000).toISOString(), // Dans 2 heures
            price: '145',
            vehicleInfo: 'Mercedes Classe S - Noir',
            notes: 'Transport vers l\'aéroport\nVol AF1234 - Terminal Sud\nBagages: 2 valises'
          }
        );
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Type invalide. Utilisez: admin, driver, ou customer'
        }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Email de test ${type} envoyé avec succès à ${email}`,
        messageId: result.messageId,
        type,
        recipient: email
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `Échec de l'envoi ${type}: ${result.error}`,
        type,
        recipient: email
      }, { status: 500 });
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('❌ Erreur test notifications:', error);
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API de test des notifications de réservation',
    endpoints: {
      test_admin: '/api/test-notifications?type=admin&email=admin@example.com',
      test_driver: '/api/test-notifications?type=driver&email=chauffeur@example.com', 
      test_customer: '/api/test-notifications?type=customer&email=client@example.com'
    },
    usage: 'POST /api/test-notifications?type=[admin|driver|customer]&email=your-email@example.com',
    notification_types: {
      admin: 'Notification envoyée à l\'admin quand un client soumet une nouvelle réservation',
      driver: 'Notification envoyée au chauffeur quand une réservation lui est assignée',
      customer: 'Notification envoyée au client quand le chauffeur approuve sa réservation'
    }
  });
}
