"use client"

import React, { useMemo } from "react"
import { addDays, format, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import {
  buildDriverRows,
  dayKey,
  getRange,
  groupByDay,
  inRange,
  type PlanningBooking,
} from "@/lib/booking-planning"
import { PlanningEvent, monoLabel } from "./PlanningEvent"

const MAX_CHIPS = 3
const DRIVER_COL = 150

interface Props {
  bookings: PlanningBooking[]
  drivers: { id: string; name: string }[]
  driverFilter: string
  anchor: Date
  onOpenBooking: (booking: PlanningBooking) => void
  onPickDay: (day: Date) => void
}

export function PlanningWeekView({ bookings, drivers, driverFilter, anchor, onOpenBooking, onPickDay }: Props) {
  const days = useMemo(() => {
    const { start } = getRange("week", anchor)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [anchor])

  const rows = useMemo(() => {
    const range = getRange("week", anchor)
    return buildDriverRows(
      bookings.filter((b) => inRange(b, range)),
      drivers,
      driverFilter,
    ).map((row) => ({ ...row, byDay: groupByDay(row.bookings) }))
  }, [bookings, drivers, driverFilter, anchor])

  const today = new Date()
  const columns = `${DRIVER_COL}px repeat(7, minmax(128px, 1fr))`

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: DRIVER_COL + 7 * 128 }}>
        <div style={{ display: "grid", gridTemplateColumns: columns, borderBottom: "1px solid #E2DACD", backgroundColor: "#F7F3EC" }}>
          <div style={{ ...monoLabel, padding: "10px 14px", position: "sticky", left: 0, zIndex: 2, backgroundColor: "#F7F3EC", borderRight: "1px solid #E2DACD" }}>
            Chauffeur
          </div>
          {days.map((d) => {
            const isToday = isSameDay(d, today)
            return (
              <button
                key={dayKey(d)}
                type="button"
                onClick={() => onPickDay(d)}
                title="Voir cette journée"
                style={{ ...monoLabel, padding: "10px 8px", textAlign: "center", cursor: "pointer", backgroundColor: isToday ? "rgba(31,82,69,.12)" : "transparent", color: isToday ? "#1F5245" : "#6E6A63", fontWeight: isToday ? 700 : 400, borderLeft: "1px solid #F0EAE0" }}
              >
                {format(d, "EEE d", { locale: fr })}
              </button>
            )
          })}
        </div>

        {rows.length === 0 && (
          <div style={{ padding: "40px 16px", textAlign: "center", fontSize: "13px", color: "#9a938a", fontStyle: "italic" }}>
            Aucun chauffeur à afficher
          </div>
        )}

        {rows.map((row) => (
          <div key={row.key} style={{ display: "grid", gridTemplateColumns: columns, borderBottom: "1px solid #F0EAE0" }}>
            <div style={{ padding: "12px 14px", position: "sticky", left: 0, zIndex: 1, backgroundColor: "#FFFFFF", borderRight: "1px solid #E2DACD", display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: row.unassigned ? "#B4643A" : "#12100E", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                {row.name}
              </span>
              <span style={{ ...monoLabel, fontSize: "9px" }}>
                {row.bookings.length === 0 ? "Libre" : `${row.bookings.length} course${row.bookings.length > 1 ? "s" : ""}`}
              </span>
            </div>
            {days.map((d) => {
              const list = row.byDay.get(dayKey(d)) ?? []
              const shown = list.slice(0, MAX_CHIPS)
              const extra = list.length - shown.length
              return (
                <div
                  key={dayKey(d)}
                  style={{ minHeight: "84px", padding: "6px", display: "flex", flexDirection: "column", gap: "4px", borderLeft: "1px solid #F0EAE0", backgroundColor: isSameDay(d, today) ? "rgba(31,82,69,.04)" : "transparent" }}
                >
                  {list.length === 0 && (
                    <div aria-hidden style={{ flex: 1, border: "1px dashed #EDE6D9", borderRadius: "3px" }} />
                  )}
                  {shown.map((b) => (
                    <PlanningEvent key={b.id} booking={b} onOpen={onOpenBooking} />
                  ))}
                  {extra > 0 && (
                    <button
                      type="button"
                      onClick={() => onPickDay(d)}
                      style={{ ...monoLabel, padding: "3px 6px", textAlign: "left", cursor: "pointer", color: "#1F5245", fontWeight: 600 }}
                    >
                      +{extra} autre{extra > 1 ? "s" : ""}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
