export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { findDriverIdByPhone, findPendingAssignedBooking, respondToAssignedBooking } from '@/lib/booking-driver-response';

/**
 * Webhook entrant Geskap. Deux événements gérés :
 *  - message.status  : accusé de livraison/lecture/échec d'un envoi.
 *  - message.inbound : réponse du destinataire — utilisé ici pour les quick
 *    replies "Accepter"/"Refuser" du template confirmation_chauffeur.
 *
 * ⚠️ Le nom exact de l'en-tête de signature et la forme exacte du payload
 * n'ont pas pu être vérifiés contre la doc Geskap (compte pas encore créé
 * au moment de l'écriture) — à confirmer dès que la console Geskap est
 * disponible. Le point d'ajustement est isolé dans verifySignature() et le
 * parsing ci-dessous.
 */

const SIGNATURE_HEADER = 'x-geskap-signature';

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.GESKAP_WEBHOOK_SECRET;
  if (!secret) {
    console.error('❌ [Webhook/Geskap] GESKAP_WEBHOOK_SECRET non configuré');
    return false;
  }
  if (!signatureHeader) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = signatureHeader.replace(/^sha256=/, '');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!verifySignature(rawBody, request.headers.get(SIGNATURE_HEADER))) {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
  }

  let payload: { event?: string; data?: Record<string, unknown> };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { event, data } = payload;

  if (event === 'message.status') {
    console.log(`ℹ️ [Webhook/Geskap] Statut message: ${JSON.stringify(data)}`);
    return NextResponse.json({ ok: true });
  }

  if (event === 'message.inbound') {
    const fromPhone = (data?.from as string) || (data?.phone as string);
    const buttonReply = ((data?.button_text as string) || (data?.text as string) || '').trim().toLowerCase();

    if (!fromPhone) {
      return NextResponse.json({ error: 'Numéro expéditeur manquant' }, { status: 400 });
    }

    const isAccept = buttonReply.includes('accept');
    const isReject = buttonReply.includes('refus');

    if (!isAccept && !isReject) {
      // Message entrant qui n'est pas une réponse au quick reply attendu (ex:
      // texte libre du chauffeur) — rien à traiter côté état de réservation.
      return NextResponse.json({ ok: true, ignored: true });
    }

    const driverId = await findDriverIdByPhone(fromPhone);
    if (!driverId) {
      console.warn(`⚠️ [Webhook/Geskap] Aucun chauffeur trouvé pour le numéro ${fromPhone}`);
      return NextResponse.json({ ok: true, ignored: true });
    }

    const pendingBooking = await findPendingAssignedBooking(driverId);
    if (!pendingBooking) {
      console.warn(`⚠️ [Webhook/Geskap] Aucune course en attente de confirmation pour le chauffeur ${driverId}`);
      return NextResponse.json({ ok: true, ignored: true });
    }

    const result = await respondToAssignedBooking(pendingBooking.id, driverId, isAccept ? 'approve' : 'reject');
    return NextResponse.json({ ok: result.success, bookingId: pendingBooking.id });
  }

  return NextResponse.json({ ok: true, ignored: true });
}
