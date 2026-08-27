"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { toIntlLocale } from "@/lib/intl-locale"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { DriverBookingApiItem } from "@/types/dashboard"

export function MissionsToday({ bookings }: { bookings: DriverBookingApiItem["booking"][] }) {
  const t = useTranslations("driver.home.missions")
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)

  const sorted = [...bookings].sort(
    (a, b) => new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime()
  )

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", padding: "18px 24px", borderBottom: "1px solid #E2DACD" }}>
        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em" }}>{t("title")}</h3>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>
          {t("count", { count: sorted.length })}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p style={{ margin: 0, padding: "32px 24px", fontSize: "13px", color: "#6E6A63" }}>{t("empty")}</p>
      ) : (
        sorted.map((booking) => {
          const price = typeof booking.price === "string" ? Number.parseFloat(booking.price) : Number(booking.price ?? 0)
          const meta = [`${booking.passengers} pax`, booking.luggage ? `${booking.luggage} bagages` : null].filter(Boolean).join(" · ")

          return (
            <div
              key={booking.id}
              style={{ display: "grid", gridTemplateColumns: "64px minmax(0, 1fr) auto auto", alignItems: "center", gap: "16px", padding: "16px 24px", borderBottom: "1px solid #F0EAE0" }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "#12100E" }}>
                {new Date(booking.scheduledDateTime).toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" })}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", minWidth: 0 }}>
                <span style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.005em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {booking.pickupAddress} → {booking.dropoffAddress}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E6A63" }}>{meta}</span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500, color: "#12100E", whiteSpace: "nowrap" }}>
                {Number.isFinite(price) ? `${Math.round(price).toLocaleString(intlLocale)} F` : "—"}
              </span>
              <StatusBadge domain="booking" value={booking.status} audience="driver" live={booking.status === "in_progress"} />
            </div>
          )
        })
      )}

      <div style={{ padding: "16px 24px" }}>
        <Link href="/driver/history" style={{ fontSize: "13px", fontWeight: 600, color: "#12100E", borderBottom: "2px solid #12100E", paddingBottom: "2px" }}>
          {t("viewHistory")}
        </Link>
      </div>
    </div>
  )
}
