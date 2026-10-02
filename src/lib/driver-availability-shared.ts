import type { DriverAvailabilityRow } from "@/types/dashboard"

/**
 * Semantique de la table `driver_availability`, partagee par l'ecran chauffeur
 * (/driver/disponibilites) et l'ecran admin (modale Planning de UsersManagement).
 * Logique pure : pas de JSX, pas de fetch, utilisable cote serveur comme client.
 *
 * Trois concepts dans une seule table :
 *  - recurrent          : specificDate IS NULL + dayOfWeek + plage + isAvailable = true
 *  - exception indispo  : specificDate renseignee + isAvailable = false
 *  - exception dispo    : specificDate renseignee + isAvailable = true
 */

// Lundi -> dimanche a l'affichage, mais day_of_week en base suit Date.getDay()
// (0 = dimanche ... 6 = samedi) : voir docs/redesign/README.md, section Chauffeur.
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

/** Plage horaire par defaut proposee quand un jour n'a aucune ligne en base. */
export const DEFAULT_START = "06:00"
export const DEFAULT_END = "22:00"

/** Bornes utilisees pour encoder une exception « toute la journee ». */
export const FULL_DAY_START = "00:00"
export const FULL_DAY_END = "23:59"

/** Un jour de la semaine recurrente, tel qu'edite dans l'UI (une seule plage par jour). */
export interface WeekDayDraft {
  dayOfWeek: number // 0 = dimanche ... 6 = samedi
  isOpen: boolean
  start: string // "HH:mm"
  end: string // "HH:mm"
  ids: number[] // lignes en base agregees dans ce brouillon
}

/**
 * Normalise une heure vers "HH:mm:ss".
 * Le seed de migrations/create-driver-availability.sql ecrit "08:00" alors que
 * l'UI ecrit "08:00:00" : on ramene tout au format long a l'ecriture.
 */
export function normalizeTime(value: string): string {
  const [hours = "00", minutes = "00", seconds = "00"] = value.trim().split(":")
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`
}

/**
 * Convertit une heure en minutes depuis minuit, quel que soit son format
 * ("08:00" comme "08:00:00"). Indispensable pour comparer : en comparaison de
 * chaines, "08:00" < "08:00:00", donc une course a l'heure pile d'ouverture
 * etait refusee.
 */
export function toMinutes(value: string): number {
  const [hours = "0", minutes = "0"] = value.trim().split(":")
  return Number(hours) * 60 + Number(minutes)
}

/** true si `time` est dans la plage [start, end], bornes incluses. */
export function isWithinRange(time: string, start: string, end: string): boolean {
  const t = toMinutes(time)
  return t >= toMinutes(start) && t <= toMinutes(end)
}

/** Tronque une heure stockee ("08:00:00") vers la valeur attendue par <input type="time">. */
export function toInputTime(value: string): string {
  return value.slice(0, 5)
}

/** true si la plage est valide : debut strictement avant fin. */
export function isValidRange(start: string, end: string): boolean {
  return toMinutes(start) < toMinutes(end)
}

/** true si la valeur ressemble a une heure "HH:mm" ou "HH:mm:ss" valide. */
export function isValidTime(value: unknown): value is string {
  if (typeof value !== "string") return false
  const match = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.exec(value.trim())
  return match !== null
}

/**
 * Agrege les lignes recurrentes en un brouillon par jour (min start / max end).
 * Le modele autorise plusieurs plages par jour, l'UI n'en expose qu'une : les ids
 * surnumeraires sont conserves pour pouvoir etre nettoyes a l'enregistrement.
 */
export function buildWeekDrafts(rows: DriverAvailabilityRow[]): WeekDayDraft[] {
  return DAY_ORDER.map((dayOfWeek) => {
    const recurring = rows.filter((row) => !row.specificDate && row.isAvailable && row.dayOfWeek === dayOfWeek)
    if (recurring.length === 0) {
      return { dayOfWeek, isOpen: false, start: DEFAULT_START, end: DEFAULT_END, ids: [] }
    }
    const start = recurring.reduce((min, row) => (row.startTime < min ? row.startTime : min), recurring[0].startTime)
    const end = recurring.reduce((max, row) => (row.endTime > max ? row.endTime : max), recurring[0].endTime)
    return {
      dayOfWeek,
      isOpen: true,
      start: toInputTime(start),
      end: toInputTime(end),
      ids: recurring.map((row) => row.id),
    }
  })
}

// Un lundi de reference quelconque : sert uniquement a obtenir le nom complet
// du jour dans la locale courante via Intl, sans dupliquer 7 libelles par langue.
const REFERENCE_MONDAY = new Date(2024, 0, 1)

export function weekdayName(dayOfWeek: number, intlLocale: string): string {
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const date = new Date(REFERENCE_MONDAY)
  date.setDate(date.getDate() + offset)
  return date.toLocaleDateString(intlLocale, { weekday: "long" })
}

/** true si l'exception couvre la journee entiere (00:00 -> 23:59). */
export function isFullDayException(row: Pick<DriverAvailabilityRow, "startTime" | "endTime">): boolean {
  return toInputTime(row.startTime) === FULL_DAY_START && toInputTime(row.endTime) === FULL_DAY_END
}

/** Trie les exceptions par date croissante. */
export function sortExceptions(exceptions: DriverAvailabilityRow[]): DriverAvailabilityRow[] {
  return [...exceptions].sort(
    (a, b) => new Date(a.specificDate ?? 0).getTime() - new Date(b.specificDate ?? 0).getTime()
  )
}
