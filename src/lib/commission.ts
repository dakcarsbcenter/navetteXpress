// Commission prélevée par Navettexpress sur chaque course terminée.
// Calculée à la volée sur le CA brut : aucune colonne en base.
export const COMMISSION_RATE = 0.15

export type CommissionPeriod = "week" | "month" | "year"

export function computeCommission(gross: number): number {
  return Math.round(gross * COMMISSION_RATE)
}

export interface PeriodRange {
  start: Date
  end: Date
  prevStart: Date
  prevEnd: Date
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

// Semaine calendaire (lundi 00h → maintenant), mois depuis le 1er, année depuis le 1er janvier.
// La plage précédente couvre la même durée écoulée, pour ne pas comparer du partiel à du complet.
export function getPeriodRange(period: CommissionPeriod, now: Date = new Date()): PeriodRange {
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  const time: [number, number, number, number] = [now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds()]

  if (period === "week") {
    const sinceMonday = (now.getDay() + 6) % 7
    return {
      start: new Date(y, m, d - sinceMonday),
      end: now,
      prevStart: new Date(y, m, d - sinceMonday - 7),
      prevEnd: new Date(y, m, d - 7, ...time),
    }
  }

  if (period === "month") {
    const prevMonth = new Date(y, m - 1, 1)
    const prevDay = Math.min(d, daysInMonth(prevMonth.getFullYear(), prevMonth.getMonth()))
    return {
      start: new Date(y, m, 1),
      end: now,
      prevStart: prevMonth,
      prevEnd: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevDay, ...time),
    }
  }

  const prevDay = Math.min(d, daysInMonth(y - 1, m))
  return {
    start: new Date(y, 0, 1),
    end: now,
    prevStart: new Date(y - 1, 0, 1),
    prevEnd: new Date(y - 1, m, prevDay, ...time),
  }
}
