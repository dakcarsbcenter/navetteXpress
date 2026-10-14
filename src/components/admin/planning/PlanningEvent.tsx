"use client"

import React from "react"
import { format } from "date-fns"
import { TONE_STYLE, toneForStatus } from "@/components/shared/StatusBadge"
import { bookingStart, formatBookingRef, type PlanningBooking } from "@/lib/booking-planning"

interface PlanningEventProps {
  booking: PlanningBooking
  onOpen: (booking: PlanningBooking) => void
  /** « chip » : pastille de grille (semaine) ; « block » : bloc positionné (jour). */
  variant?: "chip" | "block"
  style?: React.CSSProperties
}

export const monoLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "9.5px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#6E6A63",
}

export function PlanningEvent({ booking, onOpen, variant = "chip", style }: PlanningEventProps) {
  const tone = TONE_STYLE[toneForStatus("booking", booking.status)]
  const time = format(bookingStart(booking), "HH:mm")
  const title = `${formatBookingRef(booking.id)} · ${time} · ${booking.customerName}\n${booking.pickupAddress} → ${booking.dropoffAddress}`

  return (
    <button
      type="button"
      title={title}
      onClick={() => onOpen(booking)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        width: "100%",
        minWidth: 0,
        textAlign: "left",
        padding: variant === "block" ? "6px 8px" : "5px 7px",
        backgroundColor: tone.bg,
        border: `1px solid ${tone.color}33`,
        borderLeft: `3px solid ${tone.color}`,
        borderRadius: "3px",
        cursor: "pointer",
        overflow: "hidden",
        ...style,
      }}
    >
      <span
        className="truncate"
        style={{ fontSize: "11px", fontWeight: 600, color: "#12100E", lineHeight: 1.2 }}
      >
        <span style={{ fontFamily: "var(--font-mono)", color: tone.color }}>{time}</span>
        {" • "}
        {booking.customerName}
      </span>
      <span
        className="truncate"
        style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.04em", textTransform: "uppercase", color: "#6E6A63", lineHeight: 1.2 }}
      >
        {booking.pickupAddress} → {booking.dropoffAddress}
      </span>
    </button>
  )
}
