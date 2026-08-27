"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { StatusBadge } from "@/components/shared/StatusBadge"

export interface VehicleReportItem {
  id: number
  title: string
  status: string
}

export function VehicleReportPanel({ reports }: { reports: VehicleReportItem[] }) {
  const t = useTranslations("driver.home.vehicleReport")
  const pending = reports.filter((r) => r.status === "open" || r.status === "in_progress")

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em" }}>{t("title")}</h3>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: pending.length > 0 ? "#B4643A" : "#1F5245" }}>
          {pending.length > 0 ? t("pending", { count: pending.length }) : t("upToDate")}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: "13px", color: "#3d3a35", lineHeight: 1.55 }}>{t("description")}</p>

      {pending.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#E2DACD", border: "1px solid #E2DACD", borderRadius: "3px", overflow: "hidden" }}>
          {pending.slice(0, 3).map((report) => (
            <div key={report.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "12px 14px", background: "#FFFFFF" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{report.title}</span>
              <StatusBadge domain="report" value={report.status} audience="driver" live={report.status === "in_progress"} />
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: "13px", color: "#6E6A63" }}>{t("empty")}</p>
      )}

      <Link
        href="/driver/rapport"
        style={{ height: "44px", background: "#FFFFFF", border: "1px solid #12100E", borderRadius: "4px", color: "#12100E", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
      >
        {t("cta")}
      </Link>
    </div>
  )
}
