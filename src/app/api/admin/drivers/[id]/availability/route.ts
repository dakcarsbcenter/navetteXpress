export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { driverAvailabilityTable, users } from '@/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { requireUsersRead, requireUsersUpdate } from '@/utils/admin-permissions';
import {
  FULL_DAY_END,
  FULL_DAY_START,
  buildWeekDrafts,
  isValidRange,
  isValidTime,
  normalizeTime,
} from '@/lib/driver-availability-shared';
import type { DriverAvailabilityRow } from '@/types/dashboard';

/**
 * Planning d'un chauffeur, edite par l'admin a sa place (certains chauffeurs ne
 * peuvent pas renseigner leur propre disponibilite).
 *
 * Contrairement a /api/driver/availability (une requete par jour, pilotee par
 * l'id de ligne), le PUT ci-dessous remplace toute la semaine recurrente de
 * maniere atomique, et chaque suppression verifie que la ligne appartient bien
 * au chauffeur cible.
 */

type Guard = () => Promise<string>;

/** Pattern commun aux routes admin : 401 sans session, 403 si droits insuffisants. */
function permissionResponse(permError: unknown) {
  const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
  const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
  return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
}

/** Verifie les droits puis l'existence du chauffeur. Renvoie une reponse d'erreur, ou null si tout va bien. */
async function guardDriver(guard: Guard, driverId: string): Promise<NextResponse | null> {
  try {
    await guard();
  } catch (permError) {
    return permissionResponse(permError);
  }

  if (!driverId) {
    return NextResponse.json({ success: false, error: 'ID invalide' }, { status: 400 });
  }

  const driver = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, driverId))
    .limit(1);

  if (!driver.length || driver[0].role !== 'driver') {
    return NextResponse.json({ success: false, error: 'Chauffeur non trouvé' }, { status: 404 });
  }

  return null;
}

async function loadRows(driverId: string) {
  return db
    .select()
    .from(driverAvailabilityTable)
    .where(eq(driverAvailabilityTable.driverId, driverId))
    .orderBy(driverAvailabilityTable.dayOfWeek, driverAvailabilityTable.startTime);
}

function buildPayload(rows: DriverAvailabilityRow[]) {
  return {
    weekly: buildWeekDrafts(rows),
    exceptions: rows.filter((row) => row.specificDate),
  };
}

// GET - Semaine recurrente agregee + exceptions datees
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const denied = await guardDriver(requireUsersRead, id);
    if (denied) return denied;

    const rows = (await loadRows(id)) as unknown as DriverAvailabilityRow[];

    return NextResponse.json({ success: true, data: buildPayload(rows) });
  } catch (error) {
    console.error('Erreur lors de la récupération du planning chauffeur:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// PUT - Remplace atomiquement toute la semaine recurrente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const denied = await guardDriver(requireUsersUpdate, id);
    if (denied) return denied;

    const body = await request.json();
    const weekly = body?.weekly;

    if (!Array.isArray(weekly)) {
      return NextResponse.json({ success: false, error: 'Le champ "weekly" est requis' }, { status: 400 });
    }

    const seenDays = new Set<number>();
    const toInsert: { dayOfWeek: number; startTime: string; endTime: string }[] = [];

    for (const day of weekly) {
      const dayOfWeek = Number(day?.dayOfWeek);
      if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return NextResponse.json(
          { success: false, error: 'Jour invalide (doit être entre 0 et 6)' },
          { status: 400 }
        );
      }
      if (seenDays.has(dayOfWeek)) {
        return NextResponse.json(
          { success: false, error: `Le jour ${dayOfWeek} est présent plusieurs fois` },
          { status: 400 }
        );
      }
      seenDays.add(dayOfWeek);

      if (!day?.isOpen) continue;

      if (!isValidTime(day?.start) || !isValidTime(day?.end)) {
        return NextResponse.json(
          { success: false, error: 'Horaire invalide (format attendu HH:mm)' },
          { status: 400 }
        );
      }
      if (!isValidRange(day.start, day.end)) {
        return NextResponse.json(
          { success: false, error: "L'heure de début doit précéder l'heure de fin" },
          { status: 400 }
        );
      }

      toInsert.push({
        dayOfWeek,
        startTime: normalizeTime(day.start),
        endTime: normalizeTime(day.end),
      });
    }

    await db.transaction(async (tx) => {
      // On remplace la semaine entiere plutot que de calculer un diff : pas
      // d'etat intermediaire incoherent, pas de ligne orpheline.
      await tx
        .delete(driverAvailabilityTable)
        .where(
          and(
            eq(driverAvailabilityTable.driverId, id),
            isNull(driverAvailabilityTable.specificDate)
          )
        );

      if (toInsert.length > 0) {
        await tx.insert(driverAvailabilityTable).values(
          toInsert.map((day) => ({
            driverId: id,
            dayOfWeek: day.dayOfWeek,
            startTime: day.startTime,
            endTime: day.endTime,
            isAvailable: true,
            specificDate: null,
            notes: null,
            updatedAt: new Date(),
          }))
        );
      }
    });

    const rows = (await loadRows(id)) as unknown as DriverAvailabilityRow[];

    return NextResponse.json({
      success: true,
      data: buildPayload(rows),
      message: 'Planning hebdomadaire mis à jour',
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du planning chauffeur:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// POST - Ajoute une exception datee (absence ou disponibilite exceptionnelle)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const denied = await guardDriver(requireUsersUpdate, id);
    if (denied) return denied;

    const body = await request.json();
    const { specificDate, isAvailable, fullDay, start, end, notes } = body ?? {};

    if (typeof specificDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(specificDate)) {
      return NextResponse.json(
        { success: false, error: 'Date invalide (format attendu AAAA-MM-JJ)' },
        { status: 400 }
      );
    }

    const date = new Date(`${specificDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ success: false, error: 'Date invalide' }, { status: 400 });
    }

    const startTime = fullDay ? FULL_DAY_START : start;
    const endTime = fullDay ? FULL_DAY_END : end;

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return NextResponse.json(
        { success: false, error: 'Horaire invalide (format attendu HH:mm)' },
        { status: 400 }
      );
    }
    if (!isValidRange(startTime, endTime)) {
      return NextResponse.json(
        { success: false, error: "L'heure de début doit précéder l'heure de fin" },
        { status: 400 }
      );
    }

    const created = await db
      .insert(driverAvailabilityTable)
      .values({
        driverId: id,
        dayOfWeek: date.getDay(),
        startTime: normalizeTime(startTime),
        endTime: normalizeTime(endTime),
        isAvailable: isAvailable === true,
        specificDate: date,
        notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      { success: true, data: created[0], message: 'Exception ajoutée' },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'exception:", error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// DELETE ?rowId= - Supprime une ligne, uniquement si elle appartient a ce chauffeur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const denied = await guardDriver(requireUsersUpdate, id);
    if (denied) return denied;

    const rowId = Number(new URL(request.url).searchParams.get('rowId'));
    if (!Number.isInteger(rowId) || rowId <= 0) {
      return NextResponse.json({ success: false, error: 'rowId requis' }, { status: 400 });
    }

    // Le filtre porte sur (id, driverId) : impossible de supprimer la ligne
    // d'un autre chauffeur en devinant son id.
    const deleted = await db
      .delete(driverAvailabilityTable)
      .where(
        and(
          eq(driverAvailabilityTable.id, rowId),
          eq(driverAvailabilityTable.driverId, id)
        )
      )
      .returning({ id: driverAvailabilityTable.id });

    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Disponibilité non trouvée pour ce chauffeur' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Disponibilité supprimée' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la disponibilité:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
