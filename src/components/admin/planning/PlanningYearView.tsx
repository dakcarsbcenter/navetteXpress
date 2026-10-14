"use client"

import React, { useMemo } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { aggregateByMonth, formatFcfa, type PlanningBooking } from "@/lib/booking-planning"
import { monoLabel } from "./PlanningEvent"

interface Props {
  bookings: PlanningBooking[]
  anchor: Date
  onPickMonth: (month: Date) => void
}

export function PlanningYearView({ bookings, anchor, onPickMonth }: Props) {
  const year = anchor.getFullYear()
  const months = useMemo(() => aggregateByMonth(bookings, year), [bookings, year])
  const maxCount = Math.max(1, ...months.map((m) => m.count))
  const totalCount = months.reduce((s, m) => s + m.count, 0)
  const totalRevenue = months.reduce((s, m) => s + m.revenue, 0)
  const totalUnpriced = months.reduce((s, m) => s + m.unpriced, 0)
  const currentMonth = new Date().getFullYear() === year ? new Date().getMonth() : -1

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", padding: "14px 18px", borderBottom: "1px solid #E2DACD", backgroundColor: "#F7F3EC" }}>
        <Total label="Courses" value={String(totalCount)} />
        <Total label="CA estimé (hors annulées)" value={formatFcfa(totalRevenue)} />
        {totalUnpriced > 0 && <Total label="Sans prix (à tarifer)" value={String(totalUnpriced)} muted />}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 210px), 1fr))", gap: "1px", backgroundColor: "#F0EAE0" }}>
        {months.map((m) => {
          const date = new Date(year, m.month, 1)
          const isCurrent = m.month === currentMonth
          return (
            <button
              key={m.month}
              type="button"
              onClick={() => onPickMonth(date)}
              title="Voir ce mois"
              style={{ padding: "16px 18px", textAlign: "left", display: "flex", flexDirection: "column", gap: "10px", cursor: "pointer", backgroundColor: isCurrent ? "rgba(31,82,69,.06)" : "#FFFFFF" }}
            >
              <span style={{ ...monoLabel, color: isCurrent ? "#1F5245" : "#6E6A63", fontWeight: isCurrent ? 700 : 400 }}>
                {format(date, "MMMM", { locale: fr })}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "22px", fontWeight: 600, color: m.count ? "#12100E" : "#C9C1B2" }}>
                {m.count}
                <span style={{ fontSize: "11px", fontWeight: 400, color: "#6E6A63", marginLeft: "6px" }}>
                  course{m.count > 1 ? "s" : ""}
                </span>
              </span>
              <div aria-hidden style={{ height: "4px", borderRadius: "2px", backgroundColor: "#F0EAE0" }}>
                <div style={{ width: `${(m.count / maxCount) * 100}%`, height: "100%", borderRadius: "2px", backgroundColor: "#1F5245" }} />
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "#3d3a35" }}>
                {m.revenue > 0 ? formatFcfa(m.revenue) : "—"}
                {m.unpriced > 0 && (
                  <span style={{ marginLeft: "6px", fontSize: "10px", fontWeight: 400, color: "#B4643A" }}>
                    +{m.unpriced} sans prix
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Total({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={monoLabel}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 600, color: muted ? "#B4643A" : "#12100E" }}>{value}</span>
    </div>
  )
}
