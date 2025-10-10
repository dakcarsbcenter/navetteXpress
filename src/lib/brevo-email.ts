import * as brevo from '@getbrevo/brevo';

// Configuration Brevo
const apiInstance = new brevo.TransactionalEmailsApi();
if (process.env.BREVO_API_KEY) {
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
}

interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: string;
  attachments?: Array<{
    content: string;
    name: string;
    type: string;
  }>;
}

// Service d'envoi email générique
export async function sendEmail(options: EmailOptions) {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY non configurée dans les variables d\'environnement');
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || "Navette Xpress",
      email: process.env.BREVO_SENDER_EMAIL || "noreply@navette-xpress.sn"
    };
    
    sendSmtpEmail.to = [{ 
      email: options.to,
      name: options.to.split('@')[0] 
    }];
    
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.htmlContent;
    
    if (options.textContent) {
      sendSmtpEmail.textContent = options.textContent;
    }
    
    if (options.replyTo) {
      sendSmtpEmail.replyTo = {
        email: options.replyTo,
        name: "Support Navette Xpress"
      };
    }

    console.log('📧 Envoi email vers:', options.to);
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log('✅ Email envoyé avec succès - Status:', result.response?.statusCode);
    return { 
      success: true, 
      messageId: result.body.messageId,
      data: result.body 
    };
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('❌ Erreur envoi email:', error);
    return { 
      success: false, 
      error: errorMessage || 'Erreur lors de l\'envoi de l\'email'
    };
  }
}

// Template pour envoi de devis
export async function sendQuoteEmail(
  customerEmail: string,
  customerName: string,
  quoteData: {
    id: number;
    service: string;
    estimatedPrice: string;
    adminNotes?: string;
    preferredDate?: string;
  }
) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Votre Devis Navette Xpress</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
            🚗 Navette Xpress
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            Votre devis personnalisé est prêt !
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">
            Bonjour ${customerName} 👋
          </h2>
          
          <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
            Nous avons le plaisir de vous présenter votre devis personnalisé pour le service 
            <strong style="color: #667eea;">${quoteData.service}</strong>.
          </p>

          <!-- Quote Card -->
          <div style="background: #f8f9fe; border: 2px solid #667eea; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">
                📋 Devis #${quoteData.id}
              </h3>
              <div style="background: #667eea; color: white; padding: 15px 25px; border-radius: 50px; display: inline-block; margin: 10px 0;">
                <span style="font-size: 32px; font-weight: bold;">
                  ${quoteData.estimatedPrice} FCFA
                </span>
              </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0 0 10px 0; color: #666;">
                <strong>🚖 Service:</strong> ${quoteData.service}
              </p>
              ${quoteData.preferredDate ? `
                <p style="margin: 0 0 10px 0; color: #666;">
                  <strong>📅 Date souhaitée:</strong> ${new Date(quoteData.preferredDate).toLocaleDateString('fr-FR')}
                </p>
              ` : ''}
              ${quoteData.adminNotes ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                  <p style="margin: 0 0 5px 0; color: #666; font-weight: bold;">📝 Notes:</p>
                  <p style="margin: 0; color: #666; line-height: 1.5;">
                    ${quoteData.adminNotes}
                  </p>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="mailto:contact@navette-xpress.sn?subject=Acceptation%20Devis%20%23${quoteData.id}" 
               style="background: #28a745; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px; display: inline-block; font-size: 16px;">
              ✅ Accepter le devis
            </a>
            <a href="mailto:contact@navette-xpress.sn?subject=Questions%20Devis%20%23${quoteData.id}" 
               style="background: #007bff; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px; display: inline-block; font-size: 16px;">
              ❓ Poser une question
            </a>
          </div>

          <!-- Contact Info -->
          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-top: 30px; text-align: center;">
            <h4 style="margin: 0 0 15px 0; color: #333;">📞 Besoin d'aide ?</h4>
            <p style="margin: 5px 0; color: #666;">
              <strong>Téléphone:</strong> +33 1 23 45 67 89
            </p>
            <p style="margin: 5px 0; color: #666;">
              <strong>Email:</strong> contact@navette-xpress.sn
            </p>
            <p style="margin: 15px 0 0 0; color: #666; font-size: 14px; font-style: italic;">
              Ou répondez directement à cet email
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #333; padding: 25px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 14px;">
            © 2024 Navette Xpress - Service de transport premium
          </p>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 12px;">
            Ce devis est valable 30 jours à compter de sa réception
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    NAVETTE HUB - Votre Devis #${quoteData.id}
    
    Bonjour ${customerName},
    
    Voici votre devis personnalisé :
    
    Service: ${quoteData.service}
    Prix: ${quoteData.estimatedPrice} FCFA
    ${quoteData.preferredDate ? `Date: ${new Date(quoteData.preferredDate).toLocaleDateString('fr-FR')}` : ''}
    ${quoteData.adminNotes ? `\nNotes: ${quoteData.adminNotes}` : ''}
    
    Pour accepter ce devis, répondez à cet email ou contactez-nous au +33 1 23 45 67 89.
    
    Cordialement,
    L'équipe Navette Xpress
  `;

  return await sendEmail({
    to: customerEmail,
    subject: `✨ Votre devis #${quoteData.id} - Navette Xpress`,
    htmlContent,
    textContent,
    replyTo: "contact@navette-xpress.sn"
  });
}

// Template pour rapport véhicule (admin)
export async function sendVehicleReportEmail(
  adminEmail: string,
  reportData: {
    id: number;
    title: string;
    description: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'urgent';
    driverName: string;
    vehicleInfo: {
      make: string;
      model: string;
      plateNumber: string;
    };
    reportedAt: string;
  }
) {
  const severityConfig = {
    low: { label: '🟢 Faible', color: '#28a745', bgColor: '#d4edda' },
    medium: { label: '🟡 Modéré', color: '#ffc107', bgColor: '#fff3cd' },
    high: { label: '🟠 Élevé', color: '#fd7e14', bgColor: '#f8d7da' },
    urgent: { label: '🔴 URGENT', color: '#dc3545', bgColor: '#f8d7da' }
  };

  const config = severityConfig[reportData.severity];

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rapport Véhicule - Navette Xpress</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        
        <!-- Header -->
        <div style="background: ${config.color}; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            🚨 RAPPORT VÉHICULE
          </h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">
            Signalement de ${reportData.driverName}
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <!-- Alert Banner -->
          <div style="background: ${config.bgColor}; border: 2px solid ${config.color}; border-radius: 8px; padding: 20px; margin-bottom: 25px; text-align: center;">
            <h2 style="margin: 0; color: ${config.color}; font-size: 18px;">
              ${config.label}
            </h2>
          </div>

          <!-- Report Details -->
          <div style="background: #f8f9fa; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 20px 0; color: #333; font-size: 20px;">
              ${reportData.title}
            </h3>
            
            <div style="margin-bottom: 20px;">
              <p style="margin: 5px 0; color: #666;">
                <strong>🆔 Rapport #:</strong> ${reportData.id}
              </p>
              <p style="margin: 5px 0; color: #666;">
                <strong>👤 Chauffeur:</strong> ${reportData.driverName}
              </p>
              <p style="margin: 5px 0; color: #666;">
                <strong>🚗 Véhicule:</strong> ${reportData.vehicleInfo.make} ${reportData.vehicleInfo.model} (${reportData.vehicleInfo.plateNumber})
              </p>
              <p style="margin: 5px 0; color: #666;">
                <strong>📂 Catégorie:</strong> ${reportData.category}
              </p>
              <p style="margin: 5px 0; color: #666;">
                <strong>📅 Signalé le:</strong> ${new Date(reportData.reportedAt).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>

          <!-- Description -->
          <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h4 style="margin: 0 0 15px 0; color: #333;">📝 Description détaillée:</h4>
            <p style="color: #666; line-height: 1.6; margin: 0; white-space: pre-wrap;">
              ${reportData.description}
            </p>
          </div>

          <!-- Action Button -->
          <div style="text-align: center;">
            <a href="mailto:admin@navette-xpress.sn?subject=Traitement%20Rapport%20%23${reportData.id}" 
               style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              📝 Traiter ce rapport
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            Dashboard Admin - Navette Xpress © 2024
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: adminEmail,
    subject: `🚨 Rapport Véhicule #${reportData.id} - ${config.label}`,
    htmlContent,
    replyTo: "admin@navette-xpress.sn"
  });
}

// Notification générique
export async function sendNotificationEmail(
  to: string,
  subject: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔔 ${title}</h1>
        </div>
        
        <div style="padding: 30px;">
          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
            <p style="color: #666; line-height: 1.6; margin: 0; font-size: 16px;">
              ${message}
            </p>
          </div>
          
          ${actionUrl && actionText ? `
            <div style="text-align: center;">
              <a href="${actionUrl}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                ${actionText}
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to,
    subject,
    htmlContent
  });
}

// Template pour notification admin - nouvelle réservation
export async function sendNewBookingNotificationToAdmin(
  adminEmail: string,
  bookingData: {
    id: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    pickupAddress: string;
    dropoffAddress: string;
    scheduledDateTime: string;
    price: string;
    notes?: string;
  }
) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouvelle Réservation - Navette Xpress</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            🚗 NOUVELLE RÉSERVATION
          </h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">
            Réservation #${bookingData.id} - Action requise
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <!-- Alert Banner -->
          <div style="background: #e3f2fd; border: 2px solid #2196f3; border-radius: 8px; padding: 20px; margin-bottom: 25px; text-align: center;">
            <h2 style="margin: 0; color: #1976d2; font-size: 18px;">
              🔔 Nouvelle demande de transport
            </h2>
            <p style="margin: 5px 0 0 0; color: #1565c0; font-size: 14px;">
              Assignation d'un chauffeur nécessaire
            </p>
          </div>

          <!-- Customer Info -->
          <div style="background: #f8f9fa; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 20px 0; color: #333; font-size: 20px;">
              👤 Informations Client
            </h3>
            
            <div style="margin-bottom: 20px;">
              <p style="margin: 5px 0; color: #666;">
                <strong>👤 Nom:</strong> ${bookingData.customerName}
              </p>
              <p style="margin: 5px 0; color: #666;">
                <strong>📧 Email:</strong> ${bookingData.customerEmail}
              </p>
              <p style="margin: 5px 0; color: #666;">
                <strong>📞 Téléphone:</strong> ${bookingData.customerPhone}
              </p>
            </div>
          </div>

          <!-- Trip Details -->
          <div style="background: #f8f9fa; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 20px 0; color: #333; font-size: 20px;">
              🚖 Détails du trajet
            </h3>
            
            <div style="margin-bottom: 20px;">
              <p style="margin: 5px 0; color: #666;">
                <strong>📍 Départ:</strong> ${bookingData.pickupAddress}
              </p>
              <p style="margin: 5px 0; color: #666;">
                <strong>🎯 Arrivée:</strong> ${bookingData.dropoffAddress}
              </p>
              <p style="margin: 5px 0; color: #666;">
                <strong>📅 Date/Heure:</strong> ${new Date(bookingData.scheduledDateTime).toLocaleString('fr-FR')}
              </p>
              <p style="margin: 5px 0; color: #666;">
                <strong>💰 Prix estimé:</strong> <span style="color: #28a745; font-size: 18px; font-weight: bold;">${bookingData.price} FCFA</span>
              </p>
              ${bookingData.notes ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
                  <p style="margin: 0 0 5px 0; color: #666; font-weight: bold;">📝 Notes:</p>
                  <p style="margin: 0; color: #666; line-height: 1.5; white-space: pre-wrap;">
                    ${bookingData.notes}
                  </p>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:admin@navette-xpress.sn?subject=Gestion%20Réservation%20%23${bookingData.id}" 
               style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; margin: 0 10px;">
              🚗 Assigner un chauffeur
            </a>
            <a href="mailto:${bookingData.customerEmail}?subject=Confirmation%20Réservation%20%23${bookingData.id}" 
               style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; margin: 0 10px;">
              📞 Contacter le client
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            Dashboard Admin - Navette Xpress © 2024
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: adminEmail,
    subject: `🚗 Nouvelle réservation #${bookingData.id} - ${bookingData.customerName}`,
    htmlContent,
    replyTo: bookingData.customerEmail
  });
}

// Template pour notification chauffeur - assignation
export async function sendDriverAssignmentNotification(
  driverEmail: string,
  driverName: string,
  bookingData: {
    id: number;
    customerName: string;
    customerPhone: string;
    pickupAddress: string;
    dropoffAddress: string;
    scheduledDateTime: string;
    price: string;
    notes?: string;
  }
) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouvelle Course Assignée - Navette Xpress</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            🚖 NOUVELLE COURSE ASSIGNÉE
          </h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">
            Course #${bookingData.id} vous a été attribuée
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">
            Bonjour ${driverName} 👋
          </h2>
          
          <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
            Une nouvelle course vient de vous être assignée. Veuillez consulter les détails ci-dessous et confirmer votre disponibilité.
          </p>

          <!-- Trip Card -->
          <div style="background: #fff5f0; border: 2px solid #ff6b35; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">
                🚗 Course #${bookingData.id}
              </h3>
              <div style="background: #ff6b35; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 10px 0;">
                <span style="font-size: 18px; font-weight: bold;">
                  ${new Date(bookingData.scheduledDateTime).toLocaleDateString('fr-FR')} à ${new Date(bookingData.scheduledDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0 0 10px 0; color: #666;">
                <strong>👤 Client:</strong> ${bookingData.customerName}
              </p>
              <p style="margin: 0 0 10px 0; color: #666;">
                <strong>📞 Téléphone:</strong> ${bookingData.customerPhone}
              </p>
              <p style="margin: 0 0 10px 0; color: #666;">
                <strong>📍 Départ:</strong> ${bookingData.pickupAddress}
              </p>
              <p style="margin: 0 0 10px 0; color: #666;">
                <strong>🎯 Destination:</strong> ${bookingData.dropoffAddress}
              </p>
              <p style="margin: 0 0 10px 0; color: #666;">
                <strong>💰 Tarif:</strong> <span style="color: #28a745; font-size: 20px; font-weight: bold;">${bookingData.price} FCFA</span>
              </p>
              ${bookingData.notes ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                  <p style="margin: 0 0 5px 0; color: #666; font-weight: bold;">📝 Instructions spéciales:</p>
                  <p style="margin: 0; color: #666; line-height: 1.5; white-space: pre-wrap;">
                    ${bookingData.notes}
                  </p>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="text-align: center; margin: 40px 0;">
            <p style="color: #666; margin: 0 0 20px 0; font-size: 16px; font-weight: bold;">
              ⚠️ Réponse requise dans les 2 heures
            </p>
            <a href="mailto:admin@navette-xpress.sn?subject=ACCEPTATION%20Course%20%23${bookingData.id}&body=Je%20confirme%20accepter%20la%20course%20%23${bookingData.id}%20du%20${new Date(bookingData.scheduledDateTime).toLocaleDateString('fr-FR')}." 
               style="background: #28a745; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px; display: inline-block; font-size: 16px;">
              ✅ Accepter la course
            </a>
            <a href="mailto:admin@navette-xpress.sn?subject=REFUS%20Course%20%23${bookingData.id}&body=Je%20ne%20peux%20pas%20effectuer%20la%20course%20%23${bookingData.id}%20du%20${new Date(bookingData.scheduledDateTime).toLocaleDateString('fr-FR')}." 
               style="background: #dc3545; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px; display: inline-block; font-size: 16px;">
              ❌ Refuser
            </a>
          </div>

          <!-- Contact Info -->
          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-top: 30px; text-align: center;">
            <h4 style="margin: 0 0 15px 0; color: #333;">📞 Support Chauffeurs</h4>
            <p style="margin: 5px 0; color: #666;">
              <strong>Urgence:</strong> +33 6 00 00 00 00
            </p>
            <p style="margin: 5px 0; color: #666;">
              <strong>Email:</strong> support@navette-xpress.sn
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #333; padding: 25px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 14px;">
            © 2024 Navette Xpress - Application Chauffeur
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: driverEmail,
    subject: `🚖 Nouvelle course assignée #${bookingData.id} - ${new Date(bookingData.scheduledDateTime).toLocaleDateString('fr-FR')}`,
    htmlContent,
    replyTo: "support@navette-xpress.sn"
  });
}

// Template pour notification client - approbation chauffeur
export async function sendBookingApprovalNotificationToCustomer(
  customerEmail: string,
  customerName: string,
  bookingData: {
    id: number;
    driverName: string;
    driverPhone?: string;
    pickupAddress: string;
    dropoffAddress: string;
    scheduledDateTime: string;
    price: string;
    vehicleInfo?: string;
    notes?: string;
  }
) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réservation Confirmée - Navette Xpress</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
            ✅ RÉSERVATION CONFIRMÉE
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            Votre chauffeur a accepté votre course !
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">
            Excellente nouvelle ${customerName} ! 🎉
          </h2>
          
          <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
            Votre réservation #${bookingData.id} a été <strong style="color: #28a745;">confirmée</strong> par votre chauffeur. 
            Tout est prêt pour votre transport !
          </p>

          <!-- Success Banner -->
          <div style="background: #d4f8db; border: 2px solid #28a745; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #1e7e34; font-size: 20px;">
              🚗 Votre course est confirmée !
            </h3>
            <p style="margin: 0; color: #155724; font-size: 16px;">
              Réservation #${bookingData.id}
            </p>
          </div>

          <!-- Trip Details -->
          <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <h3 style="margin: 0 0 20px 0; color: #333; font-size: 20px;">
              📋 Détails de votre transport
            </h3>
            
            <div style="background: white; padding: 25px; border-radius: 8px;">
              <div style="margin-bottom: 20px; text-align: center;">
                <div style="background: #28a745; color: white; padding: 15px 25px; border-radius: 50px; display: inline-block; margin: 10px 0;">
                  <span style="font-size: 24px; font-weight: bold;">
                    ${new Date(bookingData.scheduledDateTime).toLocaleDateString('fr-FR')}
                  </span>
                  <br>
                  <span style="font-size: 18px;">
                    à ${new Date(bookingData.scheduledDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              
              <p style="margin: 10px 0; color: #666; font-size: 16px;">
                <strong>📍 Départ:</strong> ${bookingData.pickupAddress}
              </p>
              <p style="margin: 10px 0; color: #666; font-size: 16px;">
                <strong>🎯 Destination:</strong> ${bookingData.dropoffAddress}
              </p>
              <p style="margin: 10px 0; color: #666; font-size: 16px;">
                <strong>💰 Tarif:</strong> <span style="color: #28a745; font-size: 22px; font-weight: bold;">${bookingData.price} FCFA</span>
              </p>
              ${bookingData.vehicleInfo ? `
                <p style="margin: 10px 0; color: #666; font-size: 16px;">
                  <strong>🚗 Véhicule:</strong> ${bookingData.vehicleInfo}
                </p>
              ` : ''}
            </div>
          </div>

          <!-- Driver Info -->
          <div style="background: #e3f2fd; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <h3 style="margin: 0 0 20px 0; color: #1565c0; font-size: 20px;">
              👤 Votre chauffeur
            </h3>
            
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <p style="margin: 10px 0; color: #666; font-size: 16px;">
                <strong>👨‍✈️ Nom:</strong> ${bookingData.driverName}
              </p>
              ${bookingData.driverPhone ? `
                <p style="margin: 10px 0; color: #666; font-size: 16px;">
                  <strong>📞 Téléphone:</strong> ${bookingData.driverPhone}
                </p>
              ` : ''}
              <p style="margin: 15px 0 0 0; color: #28a745; font-size: 14px; font-style: italic;">
                ✅ Chauffeur professionnel certifié
              </p>
            </div>
          </div>

          <!-- Important Instructions -->
          <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 12px; padding: 25px; margin: 30px 0;">
            <h4 style="margin: 0 0 15px 0; color: #856404; font-size: 18px;">
              ⚠️ Instructions importantes
            </h4>
            <ul style="margin: 0; padding-left: 20px; color: #6c5700; line-height: 1.6;">
              <li>Soyez prêt 5 minutes avant l'heure de départ</li>
              <li>Votre chauffeur vous contactera 15 minutes avant l'arrivée</li>
              <li>En cas d'imprévu, contactez-nous immédiatement</li>
            </ul>
          </div>

          <!-- Action Buttons -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="mailto:support@navette-xpress.sn?subject=Modification%20Réservation%20%23${bookingData.id}" 
               style="background: #007bff; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px; display: inline-block; font-size: 16px;">
              📝 Modifier la réservation
            </a>
            ${bookingData.driverPhone ? `
              <a href="tel:${bookingData.driverPhone}" 
                 style="background: #28a745; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px; display: inline-block; font-size: 16px;">
                📞 Appeler le chauffeur
              </a>
            ` : ''}
          </div>

          <!-- Support Info -->
          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-top: 30px; text-align: center;">
            <h4 style="margin: 0 0 15px 0; color: #333;">💬 Service Client</h4>
            <p style="margin: 5px 0; color: #666;">
              <strong>Téléphone:</strong> +33 1 23 45 67 89
            </p>
            <p style="margin: 5px 0; color: #666;">
              <strong>Email:</strong> support@navette-xpress.sn
            </p>
            <p style="margin: 15px 0 0 0; color: #666; font-size: 14px; font-style: italic;">
              Support disponible 24h/24 - 7j/7
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #333; padding: 25px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 14px;">
            © 2024 Navette Xpress - Service de transport premium
          </p>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 12px;">
            Merci de votre confiance !
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    NAVETTE HUB - Réservation Confirmée #${bookingData.id}
    
    Excellente nouvelle ${customerName} !
    
    Votre réservation a été confirmée par votre chauffeur.
    
    DÉTAILS DU TRANSPORT:
    Date: ${new Date(bookingData.scheduledDateTime).toLocaleDateString('fr-FR')}
    Heure: ${new Date(bookingData.scheduledDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
    Départ: ${bookingData.pickupAddress}
    Destination: ${bookingData.dropoffAddress}
    Tarif: ${bookingData.price} FCFA
    
    VOTRE CHAUFFEUR:
    ${bookingData.driverName}
    ${bookingData.driverPhone ? `Téléphone: ${bookingData.driverPhone}` : ''}
    
    INSTRUCTIONS:
    - Soyez prêt 5 minutes avant l'heure
    - Le chauffeur vous contactera 15 minutes avant
    
    Support: +33 1 23 45 67 89
    
    Merci de votre confiance,
    L'équipe Navette Xpress
  `;

  return await sendEmail({
    to: customerEmail,
    subject: `✅ Réservation confirmée #${bookingData.id} - ${new Date(bookingData.scheduledDateTime).toLocaleDateString('fr-FR')}`,
    htmlContent,
    textContent,
    replyTo: "support@navette-xpress.sn"
  });
}

// Test de connexion Brevo
export async function testBrevoConnection() {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY non configurée');
    }

    const accountApi = new brevo.AccountApi();
    accountApi.setApiKey(brevo.AccountApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    
    const account = await accountApi.getAccount();
    
    return {
      success: true,
      data: {
        email: account.body.email,
        firstName: account.body.firstName,
        lastName: account.body.lastName,
        credits: account.body.plan?.map(p => ({ type: p.type, credits: p.credits }))
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      error: errorMessage
    };
  }
}
