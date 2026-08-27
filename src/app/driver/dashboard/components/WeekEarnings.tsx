"use client"

import { useLocale, useTranslations } from "next-intl"
import { toIntlLocale } from "@/lib/intl-locale"

interface DayBar {
  day: string
  value: number
  isToday: boolean
}

interface WeekEarningsProps {
  total: number
  completedCount: number
  averageFare: number
  rating: number
  bars: DayBar[]
}

export function WeekEarnings({ total, completedCount, averageFare, rating, bars }: WeekEarningsProps) {
  const t = useTranslations("driver.home.week")
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)
  const maxValue = Math.max(...bars.map((b) => b.value), 1)

  return (
    <div style={{ background: "#12100E", borderRadius: "4px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#B4643A" }}>{t("title")}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "28px", fontWeight: 600, color: "#F7F3EC", letterSpacing: "-0.01em" }}>
          {Math.round(total).toLocaleString(intlLocale)} <span style={{ fontSize: "13px", fontWeight: 400, color: "#9a938a" }}>FCFA</span>
        </span>
        <span style={{ fontSize: "12px", color: "#9a938a", lineHeight: 1.5 }}>
          {completedCount > 0 ? t("note", { count: completedCount }) : t("noteEmpty")}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "96px" }}>
        {bars.map((bar) => (
          <div key={bar.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "100%", height: `${Math.max(Math.round((bar.value / maxValue) * 72), 3)}px`, background: bar.isToday ? "#B4643A" : "#3D7A67", borderRadius: "1px" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E6A63" }}>{bar.day}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", paddingTop: "16px", borderTop: "1px solid #2e2b27" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: 600, color: "#F7F3EC" }}>{completedCount}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{t("completed")}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: 600, color: "#F7F3EC" }}>{Math.round(averageFare).toLocaleString(intlLocale)} F</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{t("average")}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: 600, color: "#F7F3EC" }}>{rating > 0 ? rating.toFixed(1) : "—"}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{t("rating")}</span>
        </div>
      </div>
    </div>
  )
}
