"use client"

import React, { useMemo, useState } from "react"
import { CaretLeft, CaretRight } from "@phosphor-icons/react"
import { TONE_STYLE } from "@/components/shared/StatusBadge"
import {
  formatPeriodLabel,
  getRange,
  inRange,
  shiftAnchor,
  type PlanningBooking,
  type PlanningScale,
} from "@/lib/booking-planning"
import { PlanningDayView } from "./PlanningDayView"
import { PlanningWeekView } from "./PlanningWeekView"
import { PlanningMonthView } from "./PlanningMonthView"
import { PlanningYearView } from "./PlanningYearView"
import { monoLabel } from "./PlanningEvent"

const SCALES: { value: PlanningScale; label: string }[] = [
  { value: "day", label: "Jour" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "year", label: "Année" },
]

const LEGEND: { label: string; tone: keyof typeof TONE_STYLE }[] = [
  { label: "À traiter", tone: "attente" },
  { label: "Confirmée", tone: "valide" },
  { label: "En cours", tone: "enCours" },
  { label: "Terminée", tone: "clos" },
  { label: "Annulée / refusée", tone: "arrete" },
]

const iconButton: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
  height: "34px",
  padding: "0 10px",
  border: "1px solid #E2DACD",
  backgroundColor: "#FFFFFF",
  color: "#3d3a35",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
}

interface Props {
  /** Réservations déjà filtrées (recherche, statut, chauffeur) par la page. */
  bookings: PlanningBooking[]
  drivers: { id: string; name: string }[]
  driverFilter: string
  onOpenBooking: (booking: PlanningBooking) => void
}

export function BookingsPlanning({ bookings, drivers, driverFilter, onOpenBooking }: Props) {
  const [scale, setScale] = useState<PlanningScale>("week")
  const [anchor, setAnchor] = useState<Date>(() => new Date())

  const range = useMemo(() => getRange(scale, anchor), [scale, anchor])
  const countInPeriod = useMemo(() => bookings.filter((b) => inRange(b, range)).length, [bookings, range])

  const pickDay = (day: Date) => {
    setAnchor(day)
    setScale("day")
  }
  const pickMonth = (month: Date) => {
    setAnchor(month)
    setScale("month")
  }

  return (
    <section style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", overflow: "hidden" }}>
      {/* Barre de contrôle */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px 16px", padding: "14px 18px", borderBottom: "1px solid #E2DACD" }}>
        <div style={{ display: "flex" }}>
          <button type="button" aria-label="Période précédente" onClick={() => setAnchor(shiftAnchor(scale, anchor, -1))} style={{ ...iconButton, borderRadius: "3px 0 0 3px" }}>
            <CaretLeft size={14} weight="bold" />
          </button>
          <button type="button" onClick={() => setAnchor(new Date())} style={{ ...iconButton, borderLeft: "none", borderRight: "none" }}>
            Aujourd&apos;hui
          </button>
          <button type="button" aria-label="Période suivante" onClick={() => setAnchor(shiftAnchor(scale, anchor, 1))} style={{ ...iconButton, borderRadius: "0 3px 3px 0" }}>
            <CaretRight size={14} weight="bold" />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: "1 1 200px", minWidth: 0 }}>
          <span aria-live="polite" style={{ fontSize: "15px", fontWeight: 600, color: "#12100E", letterSpacing: "-0.01em" }}>
            {formatPeriodLabel(scale, anchor)}
          </span>
          <span style={monoLabel}>
            {countInPeriod} course{countInPeriod > 1 ? "s" : ""} sur la période
          </span>
        </div>

        <div role="tablist" aria-label="Échelle du planning" style={{ display: "flex", border: "1px solid #E2DACD", borderRadius: "3px", overflow: "hidden" }}>
          {SCALES.map((s) => {
            const active = scale === s.value
            return (
              <button
                key={s.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setScale(s.value)}
                style={{ height: "34px", padding: "0 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer", backgroundColor: active ? "#1F5245" : "#FFFFFF", color: active ? "#FFFFFF" : "#3d3a35", border: "none" }}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Légende */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", padding: "10px 18px", borderBottom: "1px solid #F0EAE0" }}>
        {LEGEND.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5" style={monoLabel}>
            <span aria-hidden style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: TONE_STYLE[l.tone].color }} />
            {l.label}
          </span>
        ))}
      </div>

      {scale === "day" && (
        <PlanningDayView bookings={bookings} drivers={drivers} driverFilter={driverFilter} anchor={anchor} onOpenBooking={onOpenBooking} />
      )}
      {scale === "week" && (
        <PlanningWeekView bookings={bookings} drivers={drivers} driverFilter={driverFilter} anchor={anchor} onOpenBooking={onOpenBooking} onPickDay={pickDay} />
      )}
      {scale === "month" && <PlanningMonthView bookings={bookings} anchor={anchor} onPickDay={pickDay} />}
      {scale === "year" && <PlanningYearView bookings={bookings} anchor={anchor} onPickMonth={pickMonth} />}
    </section>
  )
}
