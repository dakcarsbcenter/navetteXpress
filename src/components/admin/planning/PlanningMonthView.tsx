"use client"

import React, { useMemo } from "react"
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns"
import { fr } from "date-fns/locale"
import { TONE_STYLE, toneForStatus } from "@/components/shared/StatusBadge"
import { bookingStart, dayKey, groupByDay, type PlanningBooking } from "@/lib/booking-planning"
import { monoLabel } from "./PlanningEvent"

const MAX_LABELS = 2
const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

interface Props {
  bookings: PlanningBooking[]
  anchor: Date
  onPickDay: (day: Date) => void
}

export function PlanningMonthView({ bookings, anchor, onPickDay }: Props) {
  const byDay = useMemo(() => groupByDay(bookings), [bookings])
  const days = useMemo(() => {
    const options = { weekStartsOn: 1 as const }
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(anchor), options),
      end: endOfWeek(endOfMonth(anchor), options),
    })
  }, [anchor])
  const today = new Date()

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 760 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", backgroundColor: "#F7F3EC", borderBottom: "1px solid #E2DACD" }}>
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ ...monoLabel, padding: "10px 8px", textAlign: "center" }}>{w}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {days.map((d) => {
            const list = byDay.get(dayKey(d)) ?? []
            const inMonth = isSameMonth(d, anchor)
            const isToday = isSameDay(d, today)
            const shown = list.slice(0, MAX_LABELS)
            const extra = list.length - shown.length
            return (
              <button
                key={dayKey(d)}
                type="button"
                onClick={() => onPickDay(d)}
                title={list.length ? `${list.length} trajet${list.length > 1 ? "s" : ""} — voir la journée` : "Voir la journée"}
                style={{ minHeight: "104px", padding: "8px", textAlign: "left", display: "flex", flexDirection: "column", gap: "4px", cursor: "pointer", borderRight: "1px solid #F0EAE0", borderBottom: "1px solid #F0EAE0", backgroundColor: isToday ? "rgba(31,82,69,.06)" : inMonth ? "#FFFFFF" : "#FBF8F2", opacity: inMonth ? 1 : 0.55 }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: isToday ? 700 : 500, color: isToday ? "#1F5245" : "#3d3a35" }}>
                    {format(d, "d", { locale: fr })}
                  </span>
                  {list.length > 0 && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", fontWeight: 600, padding: "1px 6px", borderRadius: "2px", backgroundColor: "#1F5245", color: "#FFFFFF" }}>
                      {list.length} trajet{list.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {shown.map((b) => {
                  const tone = TONE_STYLE[toneForStatus("booking", b.status)]
                  return (
                    <span
                      key={b.id}
                      className="truncate"
                      style={{ display: "block", fontSize: "10px", padding: "2px 5px", borderRadius: "2px", backgroundColor: tone.bg, borderLeft: `2px solid ${tone.color}`, color: "#12100E" }}
                    >
                      <span style={{ fontFamily: "var(--font-mono)", color: tone.color }}>{format(bookingStart(b), "HH:mm")}</span> {b.customerName}
                    </span>
                  )
                })}
                {extra > 0 && (
                  <span style={{ ...monoLabel, fontSize: "9px", color: "#1F5245", fontWeight: 600 }}>+{extra} autre{extra > 1 ? "s" : ""}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
