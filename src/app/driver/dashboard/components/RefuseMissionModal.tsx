"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

interface RefuseMissionModalProps {
  bookingId: number
  isLoading: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}

const REASON_KEYS = ["vehicleIssue", "traffic", "emergency", "tooFar", "other"] as const

export function RefuseMissionModal({ bookingId, isLoading, onCancel, onConfirm }: RefuseMissionModalProps) {
  const t = useTranslations("driver.home.course.refuse")
  const [selected, setSelected] = useState<string>("")
  const [detail, setDetail] = useState("")

  const canConfirm = selected !== "" && (selected !== "other" || detail.trim() !== "")

  const handleConfirm = () => {
    if (!canConfirm) return
    const reason = selected === "other" ? detail.trim() : t(`reasons.${selected}`)
    onConfirm(reason)
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(18,16,14,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", zIndex: 100 }}>
      <div style={{ background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", width: "100%", maxWidth: "440px", maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2DACD", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#B8493C" }}>
            {t("modalRef", { id: bookingId })}
          </span>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, letterSpacing: "-0.01em" }}>{t("modalTitle")}</h3>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.5, color: "#3d3a35", background: "rgba(184,73,60,.08)", border: "1px solid rgba(184,73,60,.25)", borderRadius: "4px", padding: "12px 14px" }}>
            {t("warning")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>
              {t("reasonLabel")}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {REASON_KEYS.map((key) => (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    border: `1px solid ${selected === key ? "#B8493C" : "#E2DACD"}`,
                    borderRadius: "4px",
                    background: selected === key ? "rgba(184,73,60,.06)" : "#FFFFFF",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="refuseReason"
                    value={key}
                    checked={selected === key}
                    onChange={() => setSelected(key)}
                    style={{ accentColor: "#B8493C" }}
                  />
                  <span style={{ fontSize: "13.5px", color: "#12100E" }}>{t(`reasons.${key}`)}</span>
                </label>
              ))}
            </div>
          </div>

          {selected === "other" && (
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={t("otherPlaceholder")}
              rows={3}
              style={{ width: "100%", resize: "none", border: "1px solid #E2DACD", borderRadius: "4px", padding: "10px 12px", fontSize: "13.5px", fontFamily: "Archivo, sans-serif", color: "#12100E" }}
            />
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #E2DACD", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{ height: "42px", padding: "0 18px", background: "#FFFFFF", border: "1px solid #12100E", borderRadius: "4px", color: "#12100E", fontSize: "13px", fontWeight: 600, cursor: isLoading ? "default" : "pointer" }}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            style={{
              height: "42px",
              padding: "0 18px",
              background: "#B8493C",
              border: "none",
              borderRadius: "4px",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 600,
              cursor: !canConfirm || isLoading ? "default" : "pointer",
              opacity: !canConfirm || isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? t("confirming") : t("confirm")}
          </button>
        </div>
      </div>
    </div>
  )
}
