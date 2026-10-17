"use client"

import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toIntlLocale } from "@/lib/intl-locale"
import { COMMISSION_RATE, type CommissionPeriod } from "@/lib/commission"

interface PeriodCommission {
  gross: number
  commission: number
  rides: number
  previousCommission: number
  deltaPercent: number | null
}

type CommissionData = Record<CommissionPeriod, PeriodCommission>

const PERIODS: CommissionPeriod[] = ["week", "month", "year"]
const RATE_PERCENT = Math.round(COMMISSION_RATE * 100)

interface CommissionPanelProps {
  period: CommissionPeriod
  onPeriodChange: (period: CommissionPeriod) => void
}

export function CommissionPanel({ period, onPeriodChange }: CommissionPanelProps) {
  const t = useTranslations("admin.overview.commission")
  const intlLocale = toIntlLocale(useLocale())
  const fmt = (n: number) => Math.round(n).toLocaleString(intlLocale)

  const [data, setData] = useState<CommissionData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/admin/commissions")
        const json = await res.json()
        if (cancelled) return
        if (json.success) setData(json.data)
        else setError(true)
      } catch (err) {
        console.error("Erreur lors du chargement des commissions:", err)
        if (!cancelled) setError(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const now = new Date()
  const monthName = now.toLocaleDateString(intlLocale, { month: "long" })
  const cardTitles: Record<CommissionPeriod, string> = {
    week: t("cards.week"),
    month: t("cards.month", { month: monthName }),
    year: t("cards.year", { year: now.getFullYear() }),
  }

  return (
    <section style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "6px", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{ display: "grid", placeItems: "center", minWidth: "44px", height: "34px", padding: "0 8px", borderRadius: "5px", backgroundColor: "#1F5245", color: "#FFFFFF", fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700 }}>
            {RATE_PERCENT}%
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#12100E" }}>{t("title", { rate: RATE_PERCENT })}</h3>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#6E6A63" }}>{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6E6A63" }}>{t("period")}</span>
          <div className="flex items-center gap-1" style={{ border: "1px solid #E2DACD", borderRadius: "4px", padding: "3px", backgroundColor: "#F7F3EC" }}>
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPeriodChange(p)}
                aria-pressed={period === p}
                style={{
                  padding: "6px 14px", borderRadius: "3px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer",
                  backgroundColor: period === p ? "#1F5245" : "transparent",
                  color: period === p ? "#FFFFFF" : "#6E6A63",
                }}
              >
                {t(`periods.${p}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <p style={{ margin: 0, fontSize: "13px", color: "#B8493C" }}>{t("error")}</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: "14px" }}>
          {PERIODS.map((p) => {
            const entry = data?.[p]
            const selected = period === p
            const delta = entry?.deltaPercent
            return (
              <div
                key={p}
                style={{
                  display: "flex", flexDirection: "column", gap: "10px", padding: "16px 18px", borderRadius: "5px",
                  backgroundColor: "#F7F3EC",
                  border: `1px solid ${selected ? "#1F5245" : "#E2DACD"}`,
                  boxShadow: selected ? "0 0 0 1px #1F5245" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3d3a35" }}>{cardTitles[p]}</span>
                  {typeof delta === "number" && (
                    <span
                      title={t("deltaHint")}
                      style={{
                        padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600,
                        backgroundColor: delta >= 0 ? "rgba(31,82,69,.12)" : "rgba(184,73,60,.12)",
                        color: delta >= 0 ? "#1F5245" : "#B8493C",
                      }}
                    >
                      {delta >= 0 ? "+" : ""}{delta.toLocaleString(intlLocale)}%
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "26px", fontWeight: 600, letterSpacing: "-0.01em", color: "#12100E" }}>
                    {entry ? `${fmt(entry.commission)} F` : "…"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#6E6A63" }}>CFA</span>
                </div>
                <span style={{ fontSize: "11.5px", color: "#6E6A63" }}>
                  {entry ? t("gross", { amount: fmt(entry.gross), count: entry.rides }) : " "}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
