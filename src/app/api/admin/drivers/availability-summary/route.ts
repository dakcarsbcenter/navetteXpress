export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { driverAvailabilityTable, users } from '@/schema';
import { eq } from 'drizzle-orm';
import { requireUsersRead } from '@/utils/admin-permissions';

/**
 * Resume du planning de tous les chauffeurs, pour la liste admin.
 * Permet de reperer d'un coup d'oeil un chauffeur sans planning : sans ligne en
 * base, checkDriverAvailability() le considere indisponible et il devient
 * invisible pour le dispatch.
 */
export async function GET() {
  try {
    try {
      await requireUsersRead();
    } catch (permError) {
      const errorMessage = permError instanceof Error ? permError.message : 'Permission refusée';
      const statusCode = errorMessage.includes('Unauthorized') ? 401 : 403;
      return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
    }

    // Une seule requete : les lignes de disponibilite restreintes aux chauffeurs.
    // Le volume est faible (quelques lignes par chauffeur), l'agregation se fait ici.
    const rows = await db
      .select({
        driverId: driverAvailabilityTable.driverId,
        dayOfWeek: driverAvailabilityTable.dayOfWeek,
        isAvailable: driverAvailabilityTable.isAvailable,
        specificDate: driverAvailabilityTable.specificDate,
      })
      .from(driverAvailabilityTable)
      .innerJoin(users, eq(users.id, driverAvailabilityTable.driverId))
      .where(eq(users.role, 'driver'));

    const openDaysByDriver = new Map<string, Set<number>>();
    const exceptionsByDriver = new Map<string, number>();

    for (const row of rows) {
      if (row.specificDate) {
        exceptionsByDriver.set(row.driverId, (exceptionsByDriver.get(row.driverId) ?? 0) + 1);
        continue;
      }
      // Meme semantique que buildWeekDrafts : un jour est « ouvert » s'il porte
      // au moins une plage recurrente disponible.
      if (!row.isAvailable) continue;
      const days = openDaysByDriver.get(row.driverId) ?? new Set<number>();
      days.add(row.dayOfWeek);
      openDaysByDriver.set(row.driverId, days);
    }

    const data: Record<string, { openDays: number; exceptions: number }> = {};
    for (const driverId of new Set([...openDaysByDriver.keys(), ...exceptionsByDriver.keys()])) {
      data[driverId] = {
        openDays: openDaysByDriver.get(driverId)?.size ?? 0,
        exceptions: exceptionsByDriver.get(driverId) ?? 0,
      };
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erreur lors de la récupération du résumé des plannings:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
