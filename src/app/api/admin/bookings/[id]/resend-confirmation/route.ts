export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { bookingsTable, users } from '@/schema';
import { requireBookingsUpdate } from '@/utils/admin-permissions';
import { sendWithRetry } from '@/lib/notification-queue';
import { toGeskapPhone, isValidE164 } from '@/lib/whatsapp/geskap';

/**
 * Renvoie au client la confirmation WhatsApp (2reservation_validee) d'une course
 * déjà confirmée par le chauffeur.
 *
 * Nécessaire parce que l'envoi automatique n'a lieu qu'une fois, au moment où le
 * chauffeur accepte (respondToAssignedBooking) : si le numéro du client était mal
 * formaté à cet instant, corriger la fiche ensuite ne rejoue rien — le job en file
 * porte un instantané figé de la réservation. Cas réel : réservation #7, dont le
 * customerPhone était stocké "0033680264157".
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await requireBookingsUpdate();
    } catch (permError) {
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
    }

    const { id } = await params;
    const bookingId = parseInt(id);
    if (isNaN(bookingId)) {
      return NextResponse.json({ success: false, error: 'ID invalide' }, { status: 400 });
    }

    // Relecture en base, et non depuis le corps de la requête : c'est justement le
    // numéro corrigé entre-temps qu'on veut utiliser.
    const rows = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Réservation non trouvée' }, { status: 404 });
    }
    const booking = rows[0];

    // Le gabarit annonce au client le chauffeur qui vient le chercher : sans course
    // confirmée ni chauffeur assigné, le message n'a pas de sens.
    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        {
          success: false,
          error: `La réservation doit être confirmée par le chauffeur (statut actuel : ${booking.status})`,
        },
        { status: 409 }
      );
    }
    if (!booking.driverId) {
      return NextResponse.json({ success: false, error: 'Aucun chauffeur assigné' }, { status: 409 });
    }

    // Contrôle préalable pour rendre la main à l'admin avec un message actionnable,
    // plutôt que de créer un job 'failed' de plus qu'il devra aller lire ailleurs.
    if (!booking.customerPhone || !isValidE164(toGeskapPhone(booking.customerPhone))) {
      return NextResponse.json(
        {
          success: false,
          error: `Numéro client inexploitable ("${booking.customerPhone || '—'}") : corrigez-le au format international (+221… ou +33…) avant de renvoyer.`,
        },
        { status: 400 }
      );
    }

    const driverRows = await db
      .select({
        name: users.name,
        phone: users.phone,
        vehicleBrand: users.vehicleBrand,
        vehicleModel: users.vehicleModel,
        vehiclePlateNumber: users.vehiclePlateNumber,
      })
      .from(users)
      .where(eq(users.id, booking.driverId))
      .limit(1);
    const driver = driverRows[0];

    // Même handler que l'envoi automatique — une seule implémentation du gabarit.
    // Le 3e argument horodaté distingue la clé d'idempotence côté Geskap, sans quoi
    // le renvoi serait dédupliqué et l'admin croirait le message reparti.
    const result = await sendWithRetry('whatsapp', 'whatsapp.sendReservationValidee', [
      booking,
      {
        name: driver?.name || 'Votre chauffeur',
        phone: driver?.phone ?? null,
        vehicleBrand: driver?.vehicleBrand ?? null,
        vehicleModel: driver?.vehicleModel ?? null,
        vehiclePlateNumber: driver?.vehiclePlateNumber ?? null,
      },
      Date.now(),
    ]);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "L'envoi a échoué",
          queued: result.queued === true,
        },
        { status: 502 }
      );
    }

    console.log(`📨 Confirmation WhatsApp renvoyée manuellement pour la réservation #${bookingId}`);
    return NextResponse.json({ success: true, message: 'Confirmation WhatsApp renvoyée au client.' });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur lors du renvoi de la confirmation WhatsApp:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
