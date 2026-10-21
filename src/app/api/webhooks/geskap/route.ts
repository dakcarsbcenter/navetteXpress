export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { and, eq, like } from 'drizzle-orm';
import { db } from '@/db';
import { notificationQueueTable } from '@/schema';
import { findDriverIdByPhone, findPendingAssignedBooking, respondToAssignedBooking } from '@/lib/booking-driver-response';

/**
 * Webhook entrant Geskap. Deux événements gérés :
 *  - message.status  : accusé de livraison/lecture/échec d'un envoi.
 *  - message.inbound : réponse du destinataire — utilisé ici pour les quick
 *    replies "Accepter"/"Refuser" du template 2chauffeur_assigne.
 *
 * En-tête de signature et forme du payload confirmés contre l'OpenAPI de
 * l'API (wa-api.geskap.com/openapi.json, marque blanche "CamaireTech") le
 * 2026-08-31 : `X-Camairetech-Signature: sha256=<hmac>` et
 * `{ event, data: { from, text, type, ... } }`. L'OpenAPI ne documente pas
 * explicitement la forme d'une réponse à un bouton quick-reply
 * (Accepter/Refuser) — par analogie avec les autres BSP WhatsApp, on suppose
 * qu'elle arrive comme un message texte classique (`type: "text"`) dont
 * `data.text` contient le libellé du bouton cliqué ; à confirmer au premier
 * test réel.
 */

const SIGNATURE_HEADER = 'x-camairetech-signature';

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

const DELIVERY_FAILED_HANDLER = 'whatsapp.deliveryFailed';

/** Premier champ texte non vide parmi les clés données (l'OpenAPI ne documente pas la forme d'un statut en échec). */
function firstString(source: Record<string, unknown> | undefined, keys: string[]): string | null {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return null;
}

function extractFailureReason(data: Record<string, unknown>): string {
  const nested = Array.isArray(data.errors) ? (data.errors[0] as Record<string, unknown> | undefined) : undefined;
  const errorObject =
    data.error && typeof data.error === 'object' ? (data.error as Record<string, unknown>) : undefined;

  const detail =
    firstString(data, ['error_message', 'error_title', 'reason', 'detail', 'message']) ??
    (typeof data.error === 'string' ? data.error : null) ??
    firstString(errorObject, ['message', 'title', 'error_data']) ??
    firstString(nested, ['message', 'title', 'error_data']);
  const code =
    firstString(data, ['error_code', 'code']) ??
    firstString(errorObject, ['code']) ??
    firstString(nested, ['code']);

  return [code ? `code ${code}` : null, detail].filter(Boolean).join(' — ') || 'raison non communiquée par Geskap';
}

/**
 * Geskap accepte l'envoi (HTTP 200) puis Meta peut le refuser après coup : l'échec n'arrive que par
 * ce webhook, jamais à l'appel de sendWhatsAppTemplate(). On l'inscrit dans la file des notifications en
 * 'failed' (jamais rejoué : le worker ne traite que 'pending') pour qu'il apparaisse dans le panneau
 * admin, avec un message qui dit où regarder quand il s'agit de la facturation Meta (131042).
 */
async function recordDeliveryFailure(data: Record<string, unknown> | undefined) {
  if (!data) return;
  const status = typeof data.status === 'string' ? data.status.toLowerCase() : '';
  if (status !== 'failed' && status !== 'error' && status !== 'undelivered') return;

  const reason = extractFailureReason(data);
  const isPaymentIssue = /131042|payment|eligibility/i.test(`${reason} ${JSON.stringify(data)}`);
  const messageId = firstString(data, ['id', 'message_id', 'wa_message_id']);
  const template = firstString(data, ['template', 'template_name']);
  const to = firstString(data, ['to', 'recipient']);

  const parts = [
    template ? `Gabarit « ${template} »` : null,
    to ? `vers ${to.length > 4 ? `${to.slice(0, -4).replace(/\d/g, '*')}${to.slice(-4)}` : to}` : null,
    `refusé après envoi : ${reason}.`,
    isPaymentIssue
      ? 'Facturation Meta, pas le solde de jetons Geskap : vérifier le moyen de paiement de la WABA et la catégorie réelle du gabarit (Utility/Marketing) dans WhatsApp Manager.'
      : null,
  ].filter(Boolean);

  try {
    if (messageId) {
      const existing = await db
        .select({ id: notificationQueueTable.id })
        .from(notificationQueueTable)
        .where(
          and(
            eq(notificationQueueTable.handler, DELIVERY_FAILED_HANDLER),
            like(notificationQueueTable.payload, `%${messageId}%`)
          )
        )
        .limit(1);
      // Geskap peut renvoyer le même événement : une seule ligne par message.
      if (existing.length > 0) return;
    }

    await db.insert(notificationQueueTable).values({
      channel: 'whatsapp',
      handler: DELIVERY_FAILED_HANDLER,
      payload: JSON.stringify(data),
      status: 'failed',
      attempts: 1,
      lastError: parts.join(' '),
    });
  } catch (error) {
    console.error('❌ [Webhook/Geskap] Impossible d’enregistrer l’échec de livraison:', error);
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
    await recordDeliveryFailure(data);
    return NextResponse.json({ ok: true });
  }

  if (event === 'message.inbound') {
    const fromPhone = data?.from as string;
    // Les libellés des boutons sont bilingues ("Accepter / Accept", "Refuser / Decline") :
    // on normalise (minuscules, accents retirés) avant de chercher les racines des deux langues.
    const buttonReply = ((data?.text as string) || '')
      .trim()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();

    if (!fromPhone) {
      return NextResponse.json({ error: 'Numéro expéditeur manquant' }, { status: 400 });
    }

    // reservation_modifiee porte ses propres boutons "Confirmer / Confirm" et
    // "Annuler / Cancel", envoyés au client ET au chauffeur. Ils sont traités en
    // premier et ne changent aucun état : sans ce test, un chauffeur cliquant
    // "Confirmer" sur un avis de modification acceptait à son insu la course en
    // attente détectée plus bas ("confirm" matchait l'acceptation).
    const isUpdateAck = ['confirmer', 'confirm', 'annuler', 'cancel'].some((w) =>
      buttonReply.includes(w)
    );
    if (isUpdateAck) {
      console.log(
        `ℹ️ [Webhook/Geskap] Accusé de lecture sur un avis de modification ("${buttonReply}") — aucun changement d'état`
      );
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Le refus est testé avant l'acceptation : "Refuser / Decline" ne contient aucune racine
    // d'acceptation, mais l'inverse n'est pas garanti sur tous les libellés possibles.
    const isReject = ['refus', 'declin', 'decline', 'reject'].some((w) => buttonReply.includes(w));
    const isAccept = !isReject && ['accept'].some((w) => buttonReply.includes(w));

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
