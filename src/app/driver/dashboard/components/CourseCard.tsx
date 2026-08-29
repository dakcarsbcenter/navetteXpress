"use client"

import { useTranslations, useLocale } from "next-intl"
import { toIntlLocale } from "@/lib/intl-locale"
import { StatusBadge, TONE_STYLE, type Tone } from "@/components/shared/StatusBadge"
import type { DriverBookingApiItem } from "@/types/dashboard"

export type CoursePhase = "nouvelle" | "acceptee" | "enroute" | "surplace" | "encours" | "terminee"

const PHASE_TONE: Record<CoursePhase, Tone> = {
  nouvelle: "attente",
  acceptee: "valide",
  enroute: "valide",
  surplace: "valide",
  encours: "enCours",
  terminee: "clos",
}

interface CourseCardProps {
  booking?: DriverBookingApiItem["booking"]
  phase: CoursePhase
  busy: boolean
  incidentReported: boolean
  onAdvance: () => void
  onReportIncident: () => void
  onRequestRefuse?: () => void
}

function formatTime(dateInput: string | Date, intlLocale: string) {
  return new Date(dateInput).toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" })
}

function formatDuration(hours: number) {
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h > 0 && m > 0) return `~${h}H${String(m).padStart(2, "0")}`
  if (h > 0) return `~${h}H`
  return `~${m} MIN`
}

export function CourseCard({ booking, phase, busy, incidentReported, onAdvance, onReportIncident, onRequestRefuse }: CourseCardProps) {
  const t = useTranslations("driver.home.course")
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)

  if (!booking) {
    return (
      <section style={{ background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", padding: "48px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#12100E" }}>{t("empty.title")}</p>
        <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#6E6A63" }}>{t("empty.description")}</p>
      </section>
    )
  }

  const tone = TONE_STYLE[PHASE_TONE[phase]]
  const isLive = phase === "encours"
  const pickupTime = formatTime(booking.scheduledDateTime, intlLocale)
  const durationHours = booking.duration ? Number(booking.duration) : 0
  const dropoffDate = durationHours > 0 ? new Date(new Date(booking.scheduledDateTime).getTime() + durationHours * 3600000) : null

  const statusLine = phase === "acceptee"
    ? t("status.acceptee", { time: pickupTime })
    : phase === "encours"
      ? t("status.encours", { destination: booking.dropoffAddress })
      : t(`status.${phase}`)

  const mapsHref = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(booking.pickupAddress)}&destination=${encodeURIComponent(booking.dropoffAddress)}`
  const price = typeof booking.price === "string" ? Number.parseFloat(booking.price) : Number(booking.price ?? 0)

  return (
    <section style={{ background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "14px 24px", borderBottom: "1px solid #E2DACD", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", height: "26px", padding: "0 10px", borderRadius: "2px", background: tone.bg }}>
            <span className={isLive ? "live-badge" : undefined} style={{ width: "6px", height: "6px", borderRadius: "50%", background: tone.color }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: tone.color }}>
              {t(`steps.${phase}`)}
            </span>
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", color: "#6E6A63" }}>{t("ref", { id: booking.id })}</span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6E6A63" }}>{statusLine}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: "1px", background: "#E2DACD" }}>
        <div style={{ padding: "28px 24px", background: "#FFFFFF", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0 }}>
              <span style={{ width: "13px", height: "13px", borderRadius: "50%", border: "2px solid #1F5245", background: "#FFFFFF" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{t("departure")}</span>
            </div>
            <span style={{ flex: 1, height: "1.5px", background: "#12100E", margin: "0 16px 22px" }} />
            {durationHours > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0, marginBottom: "22px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#6E6A63" }}>{formatDuration(durationHours)}</span>
              </div>
            )}
            <span style={{ flex: 1, height: "1.5px", background: "#12100E", margin: "0 16px 22px" }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px", flexShrink: 0 }}>
              <span style={{ width: "13px", height: "13px", borderRadius: "50%", border: "2px solid #B4643A", background: "#FFFFFF" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{t("arrival")}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3 }}>{booking.pickupAddress}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", color: "#12100E", marginTop: "2px" }}>
                {t("pickupAt", { time: pickupTime })}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "right" }}>
              <span style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3 }}>{booking.dropoffAddress}</span>
              {dropoffDate && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", color: "#12100E", marginTop: "2px" }}>
                  {t("dropoffEstimated", { time: formatTime(dropoffDate, intlLocale) })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: "28px 24px", background: "#FFFFFF", display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{t("passenger")}</span>
            <span style={{ fontSize: "17px", fontWeight: 600 }}>{booking.customerName}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#12100E", border: "1px solid #E2DACD", borderRadius: "2px", padding: "4px 8px" }}>
                {t("passengersCount", { count: booking.passengers })}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#12100E", border: "1px solid #E2DACD", borderRadius: "2px", padding: "4px 8px" }}>
                {t("luggageCount", { count: booking.luggage })}
              </span>
            </div>
          </div>

          {booking.flightNumber && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", background: "#F7F3EC", border: "1px solid #E2DACD", borderRadius: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{t("flight.title")}</span>
                <StatusBadge domain="flight" value={booking.flightStatus || "unknown"} audience="driver" live={booking.flightStatus === "active"} />
              </div>
              <span style={{ fontSize: "15px", fontWeight: 600 }}>
                {booking.flightNumber}{booking.airline ? ` · ${booking.airline}` : ""}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#6E6A63" }}>
                {booking.flightLastCheckedAt
                  ? t("flight.lastChecked", { time: formatTime(booking.flightLastCheckedAt, intlLocale) })
                  : t("flight.neverChecked")}
              </span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", paddingTop: "18px", borderTop: "1px solid #E2DACD" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{t("priceLabel")}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "22px", fontWeight: 600, letterSpacing: "-0.01em" }}>
              {Number.isFinite(price) ? Math.round(price).toLocaleString(intlLocale) : "—"} <span style={{ fontSize: "12px", fontWeight: 400, color: "#6E6A63" }}>FCFA</span>
            </span>
          </div>
          <p style={{ margin: "-12px 0 0", fontSize: "12px", color: "#6E6A63", lineHeight: 1.5 }}>{t("priceNote")}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>
            {phase !== "terminee" && (
              <button
                type="button"
                disabled={busy}
                onClick={onAdvance}
                style={{ height: "48px", background: "#1F5245", border: "none", borderRadius: "4px", color: "#FFFFFF", fontFamily: "Archivo, sans-serif", fontSize: "14px", fontWeight: 600, cursor: busy ? "wait" : "pointer", letterSpacing: "0.01em", opacity: busy ? 0.7 : 1 }}
              >
                {t(`actions.${phase}`)}
              </button>
            )}
            {phase === "nouvelle" && onRequestRefuse && (
              <button
                type="button"
                disabled={busy}
                onClick={onRequestRefuse}
                style={{ height: "42px", background: "#FFFFFF", border: "1px solid #B8493C", borderRadius: "4px", color: "#B8493C", fontFamily: "Archivo, sans-serif", fontSize: "13px", fontWeight: 600, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1 }}
              >
                {t("refuse.button")}
              </button>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <a
                href={`tel:${booking.customerPhone}`}
                style={{ flex: 1, height: "44px", background: "#FFFFFF", border: "1px solid #12100E", borderRadius: "4px", color: "#12100E", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
              >
                {t("call")}
              </a>
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                style={{ flex: 1, height: "44px", background: "#FFFFFF", border: "1px solid #12100E", borderRadius: "4px", color: "#12100E", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
              >
                {t("itinerary")}
              </a>
            </div>
            <button
              type="button"
              onClick={onReportIncident}
              disabled={incidentReported}
              style={{ height: "40px", background: "transparent", border: "none", color: "#6E6A63", fontSize: "12px", fontWeight: 500, cursor: incidentReported ? "default" : "pointer", textDecoration: "underline", textDecorationThickness: "1px", textUnderlineOffset: "3px" }}
            >
              {incidentReported ? t("incidentReported") : t("reportIncident")}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
