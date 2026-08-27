"use client"

import { useLocale, useTranslations } from "next-intl"
import { toIntlLocale } from "@/lib/intl-locale"

export interface DayDraft {
  dayOfWeek: number // 0 = dimanche ... 6 = samedi
  isOpen: boolean
  start: string // "HH:MM"
  end: string
  ids: number[]
}

interface WeeklyScheduleCardProps {
  days: DayDraft[]
  exceptionsCount: number
  onToggle: (dayOfWeek: number) => void
  onChangeTime: (dayOfWeek: number, field: "start" | "end", value: string) => void
}

// Un lundi de référence quelconque : sert uniquement à obtenir le nom complet
// du jour dans la locale courante via Intl, sans dupliquer 7 libellés par langue.
const REFERENCE_MONDAY = new Date(2024, 0, 1)

function weekdayName(dayOfWeek: number, intlLocale: string) {
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const date = new Date(REFERENCE_MONDAY)
  date.setDate(date.getDate() + offset)
  return date.toLocaleDateString(intlLocale, { weekday: "long" })
}

export function WeeklyScheduleCard({ days, exceptionsCount, onToggle, onChangeTime }: WeeklyScheduleCardProps) {
  const t = useTranslations("driver.availability")
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)
  const openCount = days.filter((d) => d.isOpen).length

  return (
    <section style={{ background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", padding: "18px 24px", borderBottom: "1px solid #E2DACD", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em" }}>{t("weeklyTitle")}</h3>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>
          {t("weeklySummary", { openCount, exceptionsCount })}
        </span>
      </div>

      {days.map((day) => {
        const name = weekdayName(day.dayOfWeek, intlLocale)
        return (
          <div
            key={day.dayOfWeek}
            style={{ display: "flex", alignItems: "center", gap: "20px", padding: "16px 24px", borderBottom: "1px solid #F0EAE0", flexWrap: "wrap" }}
          >
            <button
              type="button"
              onClick={() => onToggle(day.dayOfWeek)}
              aria-pressed={day.isOpen}
              style={{ display: "flex", alignItems: "center", gap: "12px", background: "transparent", border: "none", cursor: "pointer", padding: 0, minWidth: "150px" }}
            >
              <span style={{ display: "block", width: "44px", height: "26px", borderRadius: "13px", background: day.isOpen ? "#1F5245" : "#D8CFC0", position: "relative", flexShrink: 0, transition: "background .2s" }}>
                <span style={{ position: "absolute", top: "3px", left: day.isOpen ? "21px" : "3px", width: "20px", height: "20px", borderRadius: "50%", background: "#FFFFFF", transition: "left .2s" }} />
              </span>
              <span style={{ fontSize: "14.5px", fontWeight: 600, color: day.isOpen ? "#12100E" : "#6E6A63", textTransform: "capitalize" }}>{name}</span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <input
                type="time"
                value={day.start}
                disabled={!day.isOpen}
                onChange={(e) => onChangeTime(day.dayOfWeek, "start", e.target.value)}
                style={{
                  height: "40px", padding: "0 14px", border: `1px solid ${day.isOpen ? "#E2DACD" : "#EFE8DC"}`, borderRadius: "3px",
                  fontFamily: "var(--font-mono)", fontSize: "13px", color: day.isOpen ? "#12100E" : "#9a938a", background: day.isOpen ? "#FFFFFF" : "#F7F3EC",
                }}
              />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#6E6A63" }}>→</span>
              <input
                type="time"
                value={day.end}
                disabled={!day.isOpen}
                onChange={(e) => onChangeTime(day.dayOfWeek, "end", e.target.value)}
                style={{
                  height: "40px", padding: "0 14px", border: `1px solid ${day.isOpen ? "#E2DACD" : "#EFE8DC"}`, borderRadius: "3px",
                  fontFamily: "var(--font-mono)", fontSize: "13px", color: day.isOpen ? "#12100E" : "#9a938a", background: day.isOpen ? "#FFFFFF" : "#F7F3EC",
                }}
              />
            </div>

            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: day.isOpen ? "#1F5245" : "#6E6A63", marginLeft: "auto" }}>
              {day.isOpen ? t("available") : t("unavailable")}
            </span>
          </div>
        )
      })}
    </section>
  )
}
