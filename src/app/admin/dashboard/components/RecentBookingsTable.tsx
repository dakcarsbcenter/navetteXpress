"use client"

import { useTranslations, useLocale } from "next-intl"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { toIntlLocale } from "@/lib/intl-locale"

export interface RecentBooking {
  id: number
  clientName: string
  driverName: string
  status: string
  amount: number
}

export function RecentBookingsTable({ bookings }: { bookings: RecentBooking[] }) {
  const t = useTranslations("admin.overview.recent")
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", padding: "18px 24px", borderBottom: "1px solid #E2DACD" }}>
        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em" }}>{t("title")}</h3>
      </div>

      {bookings.length === 0 ? (
        <p style={{ margin: 0, padding: "24px", fontSize: "13px", color: "#6E6A63" }}>{t("empty")}</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "70px minmax(0, 1fr) 130px auto auto", gap: "14px", padding: "12px 24px", borderBottom: "1px solid #E2DACD" }}>
            {(["ref", "client", "driver", "amount", "status"] as const).map((col) => (
              <span key={col} style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63", textAlign: col === "amount" ? "right" : "left" }}>
                {t(`columns.${col}`)}
              </span>
            ))}
          </div>
          {bookings.map((booking) => (
            <div key={booking.id} style={{ display: "grid", gridTemplateColumns: "70px minmax(0, 1fr) 130px auto auto", gap: "14px", alignItems: "center", padding: "14px 24px", borderBottom: "1px solid #F0EAE0" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 500 }}>NX-{booking.id}</span>
              <span style={{ fontSize: "13.5px", fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{booking.clientName}</span>
              <span style={{ fontSize: "13px", color: booking.driverName ? "#3d3a35" : "#B4643A" }}>{booking.driverName || t("noDriver")}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", textAlign: "right", whiteSpace: "nowrap" }}>
                {Math.round(booking.amount).toLocaleString(intlLocale)} FCFA
              </span>
              <StatusBadge domain="booking" value={booking.status} audience="admin" live={booking.status === "in_progress"} />
            </div>
          ))}
        </>
      )}
    </div>
  )
}
