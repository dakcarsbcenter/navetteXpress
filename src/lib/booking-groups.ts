/**
 * Une demande de réservation à plusieurs trajets crée une course par trajet, toutes
 * porteuses du même `bookings.booking_group_id`. Elles restent traitées
 * individuellement (chacune a son chauffeur, son prix, son statut) mais le client
 * comme l'admin doivent voir qu'elles viennent d'une même demande.
 *
 * La position n'est pas stockée : elle se déduit de l'ordre de création, qui est
 * celui des identifiants puisque les courses d'un groupe sont insérées dans la même
 * transaction, dans l'ordre saisi par le client.
 */
export interface GroupedBookingLike {
  id: number;
  bookingGroupId?: string | null;
}

export interface BookingGroupPosition {
  position: number;
  total: number;
}

/**
 * Indexe par id de réservation la place qu'elle occupe dans sa demande.
 * Les réservations sans groupe — l'immense majorité — sont absentes de la map.
 *
 * La liste passée peut être partielle (une page, un filtre de statut) : le total
 * reflète alors ce qui est visible. C'est volontaire, afficher « 1/3 » en n'ayant
 * chargé qu'une course sur trois serait plus trompeur qu'utile.
 */
export function buildBookingGroupPositions<T extends GroupedBookingLike>(
  bookings: T[]
): Map<number, BookingGroupPosition> {
  const groups = new Map<string, T[]>();

  for (const booking of bookings) {
    if (!booking.bookingGroupId) continue;
    const existing = groups.get(booking.bookingGroupId);
    if (existing) {
      existing.push(booking);
    } else {
      groups.set(booking.bookingGroupId, [booking]);
    }
  }

  const positions = new Map<number, BookingGroupPosition>();

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const ordered = [...group].sort((a, b) => a.id - b.id);
    ordered.forEach((booking, index) => {
      positions.set(booking.id, { position: index + 1, total: ordered.length });
    });
  }

  return positions;
}
