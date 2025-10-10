import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendVehicleReportEmail } from '@/lib/brevo-email';

interface VehicleReportRequest {
  title: string;
  description: string;
  category: 'mechanical' | 'electrical' | 'bodywork' | 'interior' | 'other';
  severity: 'low' | 'medium' | 'high' | 'urgent';
  vehicleId: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string; name?: string; email?: string; role?: string } } | null;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que c'est un chauffeur
    if ((session.user as { role?: string }).role !== 'driver' && (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Seuls les chauffeurs peuvent créer des rapports véhicule' },
        { status: 403 }
      );
    }

    const body: VehicleReportRequest = await request.json();
    const { title, description, category, severity, vehicleId } = body;

    // Validation
    if (!title || !description || !category || !severity) {
      return NextResponse.json(
        { success: false, error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Validation des valeurs
    const validCategories = ['mechanical', 'electrical', 'bodywork', 'interior', 'other'];
    const validSeverities = ['low', 'medium', 'high', 'urgent'];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Catégorie invalide' },
        { status: 400 }
      );
    }

    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { success: false, error: 'Niveau de gravité invalide' },
        { status: 400 }
      );
    }

    // Générer un ID unique pour le rapport
    const reportId = Date.now();
    
    // Mapping des véhicules (à remplacer par votre DB)
    const vehicles: Record<string, { make: string; model: string; plateNumber: string }> = {
      'mercedes-classe-s': { make: 'Mercedes', model: 'Classe S', plateNumber: 'AB-123-CD' },
      'bmw-serie-7': { make: 'BMW', model: 'Série 7', plateNumber: 'EF-456-GH' },
      'audi-a8': { make: 'Audi', model: 'A8', plateNumber: 'IJ-789-KL' }
    };

    const vehicleInfo = vehicles[vehicleId] || vehicles['mercedes-classe-s'];
    
    // Mapping des catégories pour l'affichage
    const categoryLabels = {
      mechanical: 'Mécanique',
      electrical: 'Électrique', 
      bodywork: 'Carrosserie',
      interior: 'Intérieur',
      other: 'Autre'
    };

    // Données du rapport pour l'email
    const reportData = {
      id: reportId,
      title,
      description,
      category: categoryLabels[category],
      severity,
      driverName: session.user.name || 'Chauffeur',
      vehicleInfo,
      reportedAt: new Date().toISOString()
    };

    console.log(`🚗 Nouveau rapport véhicule #${reportId} de ${reportData.driverName}`);
    console.log(`   Véhicule: ${vehicleInfo.make} ${vehicleInfo.model}`);
    console.log(`   Gravité: ${severity.toUpperCase()}`);

    // Envoyer l'email aux admins
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@navette-xpress.sn';
    
    console.log(`📧 Envoi notification admin vers ${adminEmail}...`);
    const emailResult = await sendVehicleReportEmail(adminEmail, reportData);

    let emailStatus = 'not_sent';
    let emailError = null;

    if (emailResult.success) {
      console.log(`✅ Notification admin envoyée - Message ID: ${emailResult.messageId}`);
      emailStatus = 'sent';
    } else {
      console.error('❌ Erreur envoi notification admin:', emailResult.error);
      emailError = emailResult.error;
      // On continue même si l'email échoue, le rapport est créé
    }

    // Ici vous pourriez sauvegarder en DB
    // await db.insert(vehicleReportsTable).values({
    //   title,
    //   description,
    //   category,
    //   severity,
    //   driverId: session.user.id,
    //   vehicleId,
    //   status: 'open',
    //   createdAt: new Date()
    // });

    return NextResponse.json({
      success: true,
      data: {
        ...reportData,
        status: 'open',
        createdAt: reportData.reportedAt
      },
      message: 'Rapport véhicule créé avec succès',
      emailStatus,
      emailError: emailError || undefined
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
    console.error('❌ Erreur création rapport véhicule:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
