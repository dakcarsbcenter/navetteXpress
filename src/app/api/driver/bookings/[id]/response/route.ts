export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { respondToAssignedBooking } from '@/lib/booking-driver-response';

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

    // On aligne le vocabulaire sur celui du flux principal (PATCH /api/driver/bookings/[id])
    // au lieu des anciens statuts 'approved'/'rejected' : ceux-ci ne sont reconnus par
    // aucun des ACTIVE_STATUSES du tableau de bord chauffeur redessiné (voir
    // src/app/driver/dashboard/components/DriverDashboardHome.tsx), donc une réservation
    // approuvée ici disparaissait silencieusement du suivi de mission en cours.
    // Un refus ne doit pas non plus tuer la réservation : elle repart dans la file
    // d'assignation admin (statut 'pending', sans chauffeur) au lieu de rester bloquée
    // sur un statut terminal. Logique partagée avec le webhook Geskap (réponse via
    // boutons WhatsApp) — voir src/lib/booking-driver-response.ts.
    const userSession = session as unknown as { user: { id: string } }
    const result = await respondToAssignedBooking(id, userSession.user.id, action);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result.booking,
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
