import { NextRequest, NextResponse } from 'next/server';
import { sendNotificationEmail, testBrevoConnection } from '@/lib/brevo-email';

export async function GET() {
  try {
    // Tester la connexion Brevo
    const connectionTest = await testBrevoConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: `Connexion Brevo échouée: ${connectionTest.error}`,
        help: [
          '1. Vérifiez que BREVO_API_KEY est définie dans .env.local',
          '2. Assurez-vous que votre clé API est correcte (commence par xkeysib-)',
          '3. Vérifiez que votre compte Brevo est actif'
        ]
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration Brevo opérationnelle !',
      account: connectionTest.data,
      endpoints: {
        test_email: '/api/test-brevo?action=send&email=votre-email@example.com',
        quote_api: '/api/quotes/[id]/send',
        vehicle_report_api: '/api/vehicle-reports'
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({
      success: false,
      error: errorMessage,
      help: 'Vérifiez la configuration de vos variables d\'environnement Brevo'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const email = searchParams.get('email');

    if (action === 'send' && email) {
      console.log(`📧 Test d'envoi vers ${email}...`);
      
      const result = await sendNotificationEmail(
        email,
        '🧪 Test Brevo - Navette Xpress',
        'Test de Configuration Réussi !',
        `Félicitations ! Votre intégration Brevo fonctionne parfaitement. Cet email de test confirme que votre configuration est correcte et que vous pouvez maintenant envoyer des emails depuis votre application Navette Xpress.
        
        ✅ Configuration API validée
        ✅ Templates email fonctionnels  
        ✅ Envoi transactionnel opérationnel
        
        Vous pouvez maintenant utiliser l'envoi automatique de devis et les notifications de rapports véhicules !`,
        'https://www.brevo.com',
        'Accéder à Brevo'
      );

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `Email de test envoyé avec succès à ${email}`,
          messageId: result.messageId,
          recipient: email
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `Échec de l'envoi: ${result.error}`,
          recipient: email
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Action non supportée. Utilisez ?action=send&email=votre-email@example.com'
    }, { status: 400 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
