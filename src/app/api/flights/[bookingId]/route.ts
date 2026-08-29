export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { bookingsTable, flightApiUsageTable } from '@/schema';
import { eq, sql } from 'drizzle-orm';
import { requireBookingsRead } from '@/utils/admin-permissions';
import { fetchFlightStatus } from '@/lib/aviationstack';

// Cooldown minimum entre deux vérifications en direct d'une même réservation.
const COOLDOWN_MS = 15 * 60 * 1000;
// Garde-fou de quota mensuel AviationStack (palier gratuit ~100 requêtes/mois) :
// on s'arrête à 90 pour garder une marge de manœuvre en fin de mois.
const MONTHLY_SOFT_CAP = 90;

type Booking = typeof bookingsTable.$inferSelect;

type Access =
  | { ok: true; mode: 'refresh' | 'readonly'; booking: Booking }
  | { ok: false; status: number; error: string };

/**
 * Seul le créateur de la demande (client ou entreprise, via userId) peut
 * déclencher une vérification en direct ("refresh"). Le chauffeur assigné et
 * l'admin ont uniquement un accès en lecture au dernier statut connu, pour ne
 * pas consommer inutilement le quota AviationStack.
 */
async function resolveAccess(bookingId: number): Promise<Access> {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: 'Non authentifié' };
  }

  const rows = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (rows.length === 0) {
    return { ok: false, status: 404, error: 'Réservation non trouvée' };
  }
  const booking = rows[0];

  const role = 'role' in session.user ? (session.user as { role?: string }).role : undefined;
  const isOwner = Boolean(booking.userId) && booking.userId === session.user.id;
  const isAssignedDriver = role === 'driver' && Boolean(booking.driverId) && booking.driverId === session.user.id;

  if (isOwner) {
    return { ok: true, mode: 'refresh', booking };
  }
  if (isAssignedDriver) {
    return { ok: true, mode: 'readonly', booking };
  }
  if (role === 'admin') {
    try {
      await requireBookingsRead();
    } catch {
      return { ok: false, status: 403, error: 'Accès refusé' };
    }
    return { ok: true, mode: 'readonly', booking };
  }

  return { ok: false, status: 403, error: 'Accès refusé' };
}

function serializeFlight(booking: Booking) {
  return {
    flightNumber: booking.flightNumber,
    airline: booking.airline,
    flightStatus: booking.flightStatus,
    flightScheduledTime: booking.flightScheduledTime,
    flightEstimatedTime: booking.flightEstimatedTime,
    flightLastCheckedAt: booking.flightLastCheckedAt,
  };
}

// GET — lecture du statut en cache. Autorisé pour le créateur, le chauffeur
// assigné et l'admin (lecture seule pour ces deux derniers). Ne consomme
// jamais de quota AviationStack.
export async function GET(request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { bookingId } = await params;
    const id = parseInt(bookingId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID de réservation invalide' }, { status: 400 });
    }

    const access = await resolveAccess(id);
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }

    return NextResponse.json({ success: true, data: serializeFlight(access.booking) });
  } catch (error) {
    console.error('Erreur lors de la lecture du statut de vol:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// POST — déclenche une vérification en direct auprès d'AviationStack.
// Réservé au créateur de la demande (mode 'refresh'). Bloqué par un cooldown
// par réservation et un quota mensuel global.
export async function POST(request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { bookingId } = await params;
    const id = parseInt(bookingId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID de réservation invalide' }, { status: 400 });
    }

    const access = await resolveAccess(id);
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }
    if (access.mode !== 'refresh') {
      return NextResponse.json(
        { success: false, error: 'Seul le créateur de la demande peut vérifier ce vol.' },
        { status: 403 }
      );
    }

    const { booking } = access;
    if (!booking.flightNumber) {
      return NextResponse.json(
        { success: false, error: 'Aucun numéro de vol renseigné pour cette réservation.' },
        { status: 400 }
      );
    }

    if (booking.flightLastCheckedAt) {
      const elapsed = Date.now() - new Date(booking.flightLastCheckedAt).getTime();
      if (elapsed < COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          { success: false, error: 'Veuillez patienter avant de revérifier ce vol.', retryAfterSeconds },
          { status: 429 }
        );
      }
    }

    const monthKey = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const usageRows = await db
      .select()
      .from(flightApiUsageTable)
      .where(eq(flightApiUsageTable.monthKey, monthKey))
      .limit(1);
    const currentCount = usageRows[0]?.callCount ?? 0;
    if (currentCount >= MONTHLY_SOFT_CAP) {
      return NextResponse.json(
        { success: false, error: 'Quota de vérification de vols atteint pour ce mois-ci. Réessayez plus tard.' },
        { status: 503 }
      );
    }

    const result = await fetchFlightStatus(booking.flightNumber);
    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Vérification impossible pour le moment.' },
        { status: 502 }
      );
    }

    // L'appel a abouti (qu'un vol ait été trouvé ou non) : il compte dans le quota.
    await db
      .insert(flightApiUsageTable)
      .values({ monthKey, callCount: 1 })
      .onConflictDoUpdate({
        target: flightApiUsageTable.monthKey,
        set: { callCount: sql`${flightApiUsageTable.callCount} + 1`, updatedAt: new Date() },
      });

    const now = new Date();
    const updated = await db
      .update(bookingsTable)
      .set({
        flightStatus: result.data.status,
        flightScheduledTime: result.data.scheduledTime ? new Date(result.data.scheduledTime) : null,
        flightEstimatedTime: result.data.estimatedTime ? new Date(result.data.estimatedTime) : null,
        flightLastCheckedAt: now,
        flightRawData: result.data.raw,
        updatedAt: now,
      })
      .where(eq(bookingsTable.id, id))
      .returning();

    return NextResponse.json({ success: true, data: serializeFlight(updated[0]) });
  } catch (error) {
    console.error('Erreur lors de la vérification du vol:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// PATCH — saisie/correction du numéro de vol et de la compagnie après la
// création de la demande. Réservé au créateur (utile notamment pour
// l'entreprise, qui doit renseigner le vol occurrence par occurrence).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { bookingId } = await params;
    const id = parseInt(bookingId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID de réservation invalide' }, { status: 400 });
    }

    const access = await resolveAccess(id);
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }
    if (access.mode !== 'refresh') {
      return NextResponse.json(
        { success: false, error: 'Seul le créateur de la demande peut modifier les informations de vol.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const flightNumber = typeof body.flightNumber === 'string' ? body.flightNumber.trim() : '';
    const airline = typeof body.airline === 'string' ? body.airline.trim() : '';

    if (!flightNumber) {
      return NextResponse.json({ success: false, error: 'Numéro de vol requis' }, { status: 400 });
    }

    // Un nouveau numéro de vol invalide le statut en cache.
    const updated = await db
      .update(bookingsTable)
      .set({
        flightNumber,
        airline: airline || null,
        flightStatus: null,
        flightScheduledTime: null,
        flightEstimatedTime: null,
        flightLastCheckedAt: null,
        flightRawData: null,
        updatedAt: new Date(),
      })
      .where(eq(bookingsTable.id, id))
      .returning();

    return NextResponse.json({ success: true, data: serializeFlight(updated[0]) });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des informations de vol:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
