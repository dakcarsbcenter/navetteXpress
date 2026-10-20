/**
 * Logique pure de la page admin Réservations : filtrage partagé par les vues
 * Cartes / Liste / Planning, et calculs de dates et de regroupement du Planning.
 *
 * Les dates sont lues dans le fuseau du navigateur, comme l'affichage existant
 * (toLocaleTimeString) : une course de 08:00 affichée sur la carte reste à 08:00
 * dans le planning.
 */
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns"
import { fr } from "date-fns/locale"

export interface PlanningBooking {
  id: number
  customerName: string
  passengerName?: string | null
  pickupAddress: string
  dropoffAddress: string
  scheduledDateTime: string
  status: string
  driverId: string | null
  price?: string | null
  /** Durée prévue en heures (decimal renvoyé en chaîne par l'API). */
  duration?: string | number | null
  driver?: { name: string }
}

export interface BookingFilters {
  status: string
  driver: string
  search: string
  sortBy: string
}

export type PlanningScale = "day" | "week" | "month" | "year"

export const DEFAULT_DURATION_HOURS = 2

/** Statuts qui ne génèrent pas de chiffre d'affaires prévisionnel. */
const NON_REVENUE_STATUSES = new Set(["cancelled", "rejected"])

const STATUS_PRIORITY: Record<string, number> = {
  pending: 0,
  assigned: 1,
  approved: 2,
  confirmed: 3,
  in_progress: 4,
  completed: 5,
  cancelled: 6,
  rejected: 7,
}

export const formatBookingRef = (id: number) => `IDX-${id.toString().padStart(4, "0")}`

/**
 * Filtre + tri de la liste de réservations. Source unique pour les trois vues.
 * La recherche accepte le nom, l'id (« 6 » ou « IDX-0006 »), l'origine et la destination.
 */
export function filterAndSortBookings<T extends PlanningBooking>(
  bookings: T[],
  filters: BookingFilters,
): T[] {
  let filtered = [...bookings]

  if (filters.status !== "all") {
    filtered = filtered.filter((b) => b.status === filters.status)
  }

  if (filters.driver !== "all") {
    filtered = filtered.filter((b) => b.driverId === filters.driver)
  }

  const term = filters.search.trim().toLowerCase()
  if (term) {
    filtered = filtered.filter(
      (b) =>
        b.id.toString().includes(term) ||
        formatBookingRef(b.id).toLowerCase().includes(term) ||
        b.customerName.toLowerCase().includes(term) ||
        (b.passengerName ?? "").toLowerCase().includes(term) ||
        b.pickupAddress.toLowerCase().includes(term) ||
        b.dropoffAddress.toLowerCase().includes(term),
    )
  }

  filtered.sort((a, b) => {
    if (filters.status === "all") {
      const aIdx = STATUS_PRIORITY[a.status] ?? 99
      const bIdx = STATUS_PRIORITY[b.status] ?? 99
      if (aIdx !== bIdx) return aIdx - bIdx
    }
    const dateA = new Date(a.scheduledDateTime).getTime()
    const dateB = new Date(b.scheduledDateTime).getTime()
    if (filters.sortBy === "date-desc") return dateB - dateA
    if (filters.sortBy === "date-asc") return dateA - dateB
    return 0
  })

  return filtered
}

// ───────────────────────── Dates ─────────────────────────

const WEEK_OPTIONS = { weekStartsOn: 1 as const, locale: fr }

export function getRange(scale: PlanningScale, anchor: Date): { start: Date; end: Date } {
  switch (scale) {
    case "day":
      return { start: startOfDay(anchor), end: endOfDay(anchor) }
    case "week":
      return { start: startOfWeek(anchor, WEEK_OPTIONS), end: endOfWeek(anchor, WEEK_OPTIONS) }
    case "month":
      return { start: startOfMonth(anchor), end: endOfMonth(anchor) }
    case "year":
      return { start: startOfYear(anchor), end: endOfYear(anchor) }
  }
}

export function shiftAnchor(scale: PlanningScale, anchor: Date, direction: 1 | -1): Date {
  switch (scale) {
    case "day":
      return addDays(anchor, direction)
    case "week":
      return addWeeks(anchor, direction)
    case "month":
      return addMonths(anchor, direction)
    case "year":
      return addYears(anchor, direction)
  }
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

export function formatPeriodLabel(scale: PlanningScale, anchor: Date): string {
  switch (scale) {
    case "day":
      return capitalize(format(anchor, "EEEE d MMMM yyyy", { locale: fr }))
    case "week": {
      const { start, end } = getRange("week", anchor)
      if (start.getFullYear() !== end.getFullYear()) {
        return `Semaine du ${format(start, "d MMM yyyy", { locale: fr })} au ${format(end, "d MMM yyyy", { locale: fr })}`
      }
      if (start.getMonth() !== end.getMonth()) {
        return `Semaine du ${format(start, "d MMM", { locale: fr })} au ${format(end, "d MMM yyyy", { locale: fr })}`
      }
      return `Semaine du ${format(start, "d", { locale: fr })} au ${format(end, "d MMMM yyyy", { locale: fr })}`
    }
    case "month":
      return capitalize(format(anchor, "MMMM yyyy", { locale: fr }))
    case "year":
      return `Année ${format(anchor, "yyyy")}`
  }
}

export const dayKey = (d: Date) => format(d, "yyyy-MM-dd")

export function bookingStart(b: PlanningBooking): Date {
  return new Date(b.scheduledDateTime)
}

// ───────────────────────── Drapeaux d'échéance ─────────────────────────

export type BookingFlag = "done" | "week" | "month"

export const FLAG_STYLE: Record<BookingFlag, { color: string; bg: string; label: string }> = {
  done: { color: "#B8493C", bg: "rgba(184,73,60,.12)", label: "Terminée" },
  week: { color: "#C99A1E", bg: "rgba(201,154,30,.16)", label: "Cette semaine" },
  month: { color: "#1B9E4B", bg: "rgba(27,158,75,.12)", label: "Ce mois-ci" },
}

/**
 * Drapeau de suivi d'une course : terminée (rouge), prévue d'ici dimanche (jaune),
 * prévue d'ici fin de mois (vert). Priorité dans cet ordre ; null sinon
 * (annulée/refusée, passée non clôturée, au-delà du mois).
 */
export function bookingFlag(b: PlanningBooking, now: Date = new Date()): BookingFlag | null {
  if (b.status === "completed") return "done"
  if (NON_REVENUE_STATUSES.has(b.status)) return null
  const t = bookingStart(b).getTime()
  if (t < startOfDay(now).getTime()) return null
  if (t <= endOfWeek(now, WEEK_OPTIONS).getTime()) return "week"
  if (t <= endOfMonth(now).getTime()) return "month"
  return null
}

export function bookingDurationHours(b: PlanningBooking): number {
  const n = typeof b.duration === "string" ? parseFloat(b.duration) : b.duration
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : DEFAULT_DURATION_HOURS
}

export function bookingEnd(b: PlanningBooking): Date {
  return new Date(bookingStart(b).getTime() + bookingDurationHours(b) * 3_600_000)
}

export function inRange(b: PlanningBooking, range: { start: Date; end: Date }): boolean {
  const t = bookingStart(b).getTime()
  return t >= range.start.getTime() && t <= range.end.getTime()
}

export function sortByStart<T extends PlanningBooking>(list: T[]): T[] {
  return [...list].sort((a, b) => bookingStart(a).getTime() - bookingStart(b).getTime())
}

export function groupByDay<T extends PlanningBooking>(bookings: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const b of bookings) {
    const key = dayKey(bookingStart(b))
    const list = map.get(key)
    if (list) list.push(b)
    else map.set(key, [b])
  }
  for (const [key, list] of map) map.set(key, sortByStart(list))
  return map
}

// ───────────────────────── Chauffeurs ─────────────────────────

export const UNASSIGNED_KEY = "__unassigned__"

export interface DriverRow<T extends PlanningBooking> {
  key: string
  name: string
  unassigned: boolean
  bookings: T[]
}

/**
 * Une ligne par chauffeur (même sans course sur la période, pour voir qui est libre),
 * plus « Non assigné » et les chauffeurs absents de la liste (désactivés) s'ils ont des courses.
 * Quand un filtre chauffeur est actif, seule sa ligne reste.
 */
export function buildDriverRows<T extends PlanningBooking>(
  bookings: T[],
  drivers: { id: string; name: string }[],
  driverFilter: string,
): DriverRow<T>[] {
  const rows = new Map<string, DriverRow<T>>()
  for (const d of drivers) {
    if (driverFilter !== "all" && d.id !== driverFilter) continue
    rows.set(d.id, { key: d.id, name: d.name, unassigned: false, bookings: [] })
  }

  for (const b of bookings) {
    const key = b.driverId ?? UNASSIGNED_KEY
    let row = rows.get(key)
    if (!row) {
      row = {
        key,
        name: b.driverId ? (b.driver?.name ?? "Chauffeur inconnu") : "Non assigné",
        unassigned: !b.driverId,
        bookings: [],
      }
      rows.set(key, row)
    }
    row.bookings.push(b)
  }

  const list = [...rows.values()]
  const named = list.filter((r) => !r.unassigned).sort((a, b) => a.name.localeCompare(b.name, "fr"))
  const unassigned = list.filter((r) => r.unassigned)
  return [...named, ...unassigned]
}

// ───────────────────────── Vue Jour ─────────────────────────

export interface DayLaneItem<T extends PlanningBooking> {
  booking: T
  startMin: number
  endMin: number
  lane: number
}

/** Largeur minimale d'une pastille, exprimée en minutes, pour que le texte reste lisible. */
export const MIN_VISUAL_MINUTES = 90

/**
 * Positionne les courses d'un chauffeur sur l'axe 0-1440 min d'une journée et les
 * répartit en pistes pour que deux courses qui se chevauchent ne se superposent pas.
 */
export function layoutDayLanes<T extends PlanningBooking>(
  bookings: T[],
  day: Date,
): { items: DayLaneItem<T>[]; laneCount: number } {
  const dayStart = startOfDay(day).getTime()
  const sorted = sortByStart(bookings)
  const laneEnds: number[] = []
  const items: DayLaneItem<T>[] = []

  for (const booking of sorted) {
    const startMin = Math.max(0, (bookingStart(booking).getTime() - dayStart) / 60_000)
    const realEnd = (bookingEnd(booking).getTime() - dayStart) / 60_000
    const endMin = Math.min(1440, Math.max(realEnd, startMin + MIN_VISUAL_MINUTES))
    let lane = laneEnds.findIndex((end) => end <= startMin)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(endMin)
    } else {
      laneEnds[lane] = endMin
    }
    items.push({ booking, startMin, endMin, lane })
  }

  return { items, laneCount: Math.max(1, laneEnds.length) }
}

// ───────────────────────── Vue Année ─────────────────────────

export interface MonthAggregate {
  month: number
  count: number
  /** CA estimé : somme des prix hors annulées/refusées. */
  revenue: number
  /** Courses actives sans prix (à tarifer), non comptées dans le CA. */
  unpriced: number
}

export function aggregateByMonth(bookings: PlanningBooking[], year: number): MonthAggregate[] {
  const months: MonthAggregate[] = Array.from({ length: 12 }, (_, month) => ({
    month,
    count: 0,
    revenue: 0,
    unpriced: 0,
  }))

  for (const b of bookings) {
    const d = bookingStart(b)
    if (d.getFullYear() !== year) continue
    const m = months[d.getMonth()]
    m.count += 1
    if (NON_REVENUE_STATUSES.has(b.status)) continue
    const price = b.price ? parseFloat(b.price) : NaN
    if (Number.isFinite(price) && price > 0) m.revenue += price
    else m.unpriced += 1
  }

  return months
}

export const formatFcfa = (amount: number) => `${Math.round(amount).toLocaleString("fr-FR")} F`
