"use client"

import { useTranslations } from "next-intl"

export interface DayCard {
  key: string
  label: string
  date: string
  isOpen: boolean
  slot: string
  count: number
}

export function WeekDayCards({ days }: { days: DayCard[] }) {
  const t = useTranslations("driver.planning")

  return (
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" }}>
      {days.map((day) => (
        <div
          key={day.key}
          style={{
            background: day.isOpen ? "#FFFFFF" : "#F7F3EC",
            border: `1px solid ${day.isOpen ? "#12100E" : "#E2DACD"}`,
            borderRadius: "4px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            minHeight: "108px",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: day.isOpen ? "#B4643A" : "#6E6A63" }}>
              {day.label}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: 600, color: day.isOpen ? "#12100E" : "#6E6A63" }}>
              {day.date}
            </span>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E6A63" }}>
            {day.isOpen ? day.slot : t("closed")}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "auto" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "19px", fontWeight: 600, color: day.isOpen ? "#12100E" : "#6E6A63" }}>
              {day.count}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>
              {t("dayCourseLabel", { count: day.count })}
            </span>
          </div>
        </div>
      ))}
    </section>
  )
}
