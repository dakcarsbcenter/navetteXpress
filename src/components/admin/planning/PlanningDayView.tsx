"use client"

import React, { useEffect, useMemo, useRef } from "react"
import { isSameDay } from "date-fns"
import {
  buildDriverRows,
  bookingStart,
  getRange,
  inRange,
  layoutDayLanes,
  type PlanningBooking,
} from "@/lib/booking-planning"
import { PlanningEvent, monoLabel } from "./PlanningEvent"

const HOUR_WIDTH = 64
const DRIVER_COL = 160
const LANE_HEIGHT = 46
const HOURS = Array.from({ length: 24 }, (_, h) => h)

interface Props {
  bookings: PlanningBooking[]
  drivers: { id: string; name: string }[]
  driverFilter: string
  anchor: Date
  onOpenBooking: (booking: PlanningBooking) => void
}

export function PlanningDayView({ bookings, drivers, driverFilter, anchor, onOpenBooking }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const today = new Date()
  const isToday = isSameDay(anchor, today)

  const rows = useMemo(() => {
    const range = getRange("day", anchor)
    return buildDriverRows(
      bookings.filter((b) => inRange(b, range)),
      drivers,
      driverFilter,
    )
  }, [bookings, drivers, driverFilter, anchor])

  // Heure de la première course du jour (null si journée vide).
  const firstBookingHour = useMemo(() => {
    const hours = rows.flatMap((r) => r.bookings.map((b) => bookingStart(b).getHours()))
    return hours.length ? Math.min(...hours) : null
  }, [rows])

  // Cadre la première course ; sinon l'heure courante (aujourd'hui) ou 6 h.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const fallback = isSameDay(anchor, new Date()) ? new Date().getHours() - 2 : 6
    const startHour = firstBookingHour !== null ? firstBookingHour - 1 : fallback
    el.scrollLeft = Math.max(0, startHour) * HOUR_WIDTH
  }, [anchor, firstBookingHour])

  const nowMinutes = today.getHours() * 60 + today.getMinutes()
  const trackWidth = 24 * HOUR_WIDTH
  const gridLines: React.CSSProperties = {
    backgroundImage: "linear-gradient(to right, #F0EAE0 1px, transparent 1px)",
    backgroundSize: `${HOUR_WIDTH}px 100%`,
  }

  return (
    <div ref={scrollRef} style={{ overflowX: "auto" }}>
      <div style={{ minWidth: DRIVER_COL + trackWidth }}>
        {/* Axe des heures */}
        <div style={{ display: "flex", borderBottom: "1px solid #E2DACD", backgroundColor: "#F7F3EC" }}>
          <div
            style={{ ...monoLabel, width: DRIVER_COL, flexShrink: 0, padding: "10px 14px", position: "sticky", left: 0, zIndex: 3, backgroundColor: "#F7F3EC", borderRight: "1px solid #E2DACD" }}
          >
            Chauffeur
          </div>
          <div style={{ display: "flex", width: trackWidth }}>
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ ...monoLabel, width: HOUR_WIDTH, flexShrink: 0, padding: "10px 6px", borderLeft: h === 0 ? "none" : "1px solid #F0EAE0" }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
        </div>

        {rows.length === 0 && (
          <div style={{ padding: "40px 16px", textAlign: "center", fontSize: "13px", color: "#9a938a", fontStyle: "italic" }}>
            Aucun chauffeur à afficher
          </div>
        )}

        {rows.map((row) => {
          const { items, laneCount } = layoutDayLanes(row.bookings, anchor)
          const height = laneCount * LANE_HEIGHT + 12
          return (
            <div key={row.key} style={{ display: "flex", borderBottom: "1px solid #F0EAE0" }}>
              <div
                style={{ width: DRIVER_COL, flexShrink: 0, padding: "12px 14px", position: "sticky", left: 0, zIndex: 2, backgroundColor: "#FFFFFF", borderRight: "1px solid #E2DACD", display: "flex", flexDirection: "column", gap: "2px" }}
              >
                <span style={{ fontSize: "12px", fontWeight: 600, color: row.unassigned ? "#B4643A" : "#12100E", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                  {row.name}
                </span>
                <span style={{ ...monoLabel, fontSize: "9px" }}>
                  {row.bookings.length === 0 ? "Libre" : `${row.bookings.length} course${row.bookings.length > 1 ? "s" : ""}`}
                </span>
              </div>
              <div style={{ position: "relative", width: trackWidth, height, ...gridLines }}>
                {isToday && (
                  <div
                    aria-hidden
                    style={{ position: "absolute", top: 0, bottom: 0, left: (nowMinutes / 60) * HOUR_WIDTH, width: "1px", backgroundColor: "#B8493C", zIndex: 1 }}
                  />
                )}
                {items.map(({ booking, startMin, endMin, lane }) => (
                  <PlanningEvent
                    key={booking.id}
                    booking={booking}
                    onOpen={onOpenBooking}
                    variant="block"
                    style={{
                      position: "absolute",
                      left: (startMin / 60) * HOUR_WIDTH + 1,
                      width: ((endMin - startMin) / 60) * HOUR_WIDTH - 2,
                      top: 6 + lane * LANE_HEIGHT,
                      height: LANE_HEIGHT - 4,
                      zIndex: 2,
                    }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
