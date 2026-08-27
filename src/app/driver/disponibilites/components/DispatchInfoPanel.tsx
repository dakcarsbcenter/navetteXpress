"use client"

import { useTranslations } from "next-intl"

interface DispatchInfoPanelProps {
  openDays: number
  exceptionsCount: number
  assignedCount: number
}

export function DispatchInfoPanel({ openDays, exceptionsCount, assignedCount }: DispatchInfoPanelProps) {
  const t = useTranslations("driver.availability.dispatch")

  const lines = [
    { label: t("openDays"), value: `${openDays} / 7` },
    { label: t("activeExceptions"), value: String(exceptionsCount) },
    { label: t("assignedRides"), value: String(assignedCount) },
  ]

  return (
    <div style={{ background: "#E8DCC8", borderRadius: "4px", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#12100E" }}>{t("title")}</span>
      <p style={{ margin: 0, fontSize: "14px", color: "#3d3a35", lineHeight: 1.6 }}>{t("description")}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "14px", borderTop: "1px solid rgba(18,16,14,.15)" }}>
        {lines.map((line) => (
          <div key={line.label} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "14px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#3d3a35" }}>{line.label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", fontWeight: 600, color: "#12100E" }}>{line.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
