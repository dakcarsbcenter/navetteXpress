"use client"

import { useLocale, useTranslations } from "next-intl"
import { toIntlLocale } from "@/lib/intl-locale"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { DriverBookingApiItem } from "@/types/dashboard"

export function WeekMissionsList({ bookings }: { bookings: DriverBookingApiItem["booking"][] }) {
  const t = useTranslations("driver.planning.missions")
  const tCourse = useTranslations("driver.home.course")
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)

  const sorted = [...bookings].sort(
    (a, b) => new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime()
  )
  const total = sorted
    .filter((b) => b.status !== "cancelled" && b.status !== "rejected")
    .reduce((sum, b) => {
      const price = typeof b.price === "string" ? Number.parseFloat(b.price) : Number(b.price ?? 0)
      return Number.isFinite(price) ? sum + price : sum
    }, 0)

  return (
    <section style={{ background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", padding: "18px 24px", borderBottom: "1px solid #E2DACD", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em" }}>{t("title")}</h3>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>
          {t("summary", { count: sorted.length, total: Math.round(total).toLocaleString(intlLocale) })}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p style={{ margin: 0, padding: "32px 24px", fontSize: "13px", color: "#6E6A63" }}>{t("empty")}</p>
      ) : (
        sorted.map((booking) => {
          const date = new Date(booking.scheduledDateTime)
          const price = typeof booking.price === "string" ? Number.parseFloat(booking.price) : Number(booking.price ?? 0)
          const meta = [
            date.toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" }),
            tCourse("passengersCount", { count: booking.passengers }),
            booking.luggage ? tCourse("luggageCount", { count: booking.luggage }) : null,
          ].filter(Boolean).join(" · ")

          return (
            <div
              key={booking.id}
              style={{ padding: "18px 24px", borderBottom: "1px solid #F0EAE0", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", width: "56px", flexShrink: 0 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6E6A63" }}>
                  {date.toLocaleDateString(intlLocale, { weekday: "short" }).toUpperCase()}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "17px", fontWeight: 600, lineHeight: 1 }}>
                  {date.getDate().toString().padStart(2, "0")}
                </span>
              </div>

              <div style={{ flex: 1, minWidth: "260px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <span style={{ width: "11px", height: "11px", borderRadius: "50%", border: "2px solid #1F5245", background: "#FFFFFF" }} />
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>{booking.pickupAddress}</span>
                  </div>
                  <span style={{ flex: 1, minWidth: "20px", height: "1.5px", background: "#12100E", margin: "0 12px" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>{booking.dropoffAddress}</span>
                    <span style={{ width: "11px", height: "11px", borderRadius: "50%", border: "2px solid #B4643A", background: "#FFFFFF" }} />
                  </div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E6A63" }}>{meta}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap" }}>
                  {Number.isFinite(price) ? `${Math.round(price).toLocaleString(intlLocale)} F` : "—"}
                </span>
                <StatusBadge domain="booking" value={booking.status} audience="driver" live={booking.status === "in_progress"} />
              </div>
            </div>
          )
        })
      )}
    </section>
  )
}
