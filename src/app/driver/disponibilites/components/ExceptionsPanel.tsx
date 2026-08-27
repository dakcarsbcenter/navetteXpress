"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Trash } from "@phosphor-icons/react"
import { toIntlLocale } from "@/lib/intl-locale"
import type { DriverAvailabilityRow } from "@/types/dashboard"

interface ExceptionsPanelProps {
  exceptions: DriverAvailabilityRow[]
  onChanged: () => void
}

export function ExceptionsPanel({ exceptions, onChanged }: ExceptionsPanelProps) {
  const t = useTranslations("driver.availability.exceptions")
  const tRoot = useTranslations("driver.availability")
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)

  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [date, setDate] = useState("")
  const [type, setType] = useState<"available" | "unavailable">("unavailable")
  const [fullDay, setFullDay] = useState(true)
  const [start, setStart] = useState("06:00")
  const [end, setEnd] = useState("22:00")
  const [notes, setNotes] = useState("")

  const resetForm = () => {
    setDate("")
    setType("unavailable")
    setFullDay(true)
    setStart("06:00")
    setEnd("22:00")
    setNotes("")
    setAdding(false)
  }

  const submit = async () => {
    if (!date) return
    setSaving(true)
    try {
      const dayOfWeek = new Date(`${date}T00:00:00`).getDay()
      await fetch("/api/driver/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek,
          specificDate: date,
          startTime: fullDay ? "00:00:00" : `${start}:00`,
          endTime: fullDay ? "23:59:00" : `${end}:00`,
          isAvailable: type === "available",
          notes: notes || null,
        }),
      })
      resetForm()
      onChanged()
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'exception:", error)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    setDeletingId(id)
    try {
      await fetch(`/api/driver/availability?id=${id}`, { method: "DELETE" })
      onChanged()
    } catch (error) {
      console.error("Erreur lors de la suppression de l'exception:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const sorted = [...exceptions].sort(
    (a, b) => new Date(a.specificDate ?? 0).getTime() - new Date(b.specificDate ?? 0).getTime()
  )

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em" }}>{t("title")}</h3>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6E6A63" }}>{t("badge")}</span>
      </div>

      {sorted.length === 0 && !adding && (
        <p style={{ margin: 0, fontSize: "13px", color: "#6E6A63" }}>{t("empty")}</p>
      )}

      {sorted.map((exception) => {
        const specificDate = new Date(exception.specificDate ?? 0)
        const isFullDay = exception.startTime.slice(0, 5) === "00:00" && exception.endTime.slice(0, 5) === "23:59"
        const range = { start: exception.startTime.slice(0, 5), end: exception.endTime.slice(0, 5) }
        const label = !exception.isAvailable && isFullDay
          ? t("unavailableAllDay")
          : exception.isAvailable
            ? t("availableRange", range)
            : t("unavailableRange", range)

        return (
          <div key={exception.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px", border: "1px solid #E2DACD", borderRadius: "3px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", width: "44px", flexShrink: 0 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 600, lineHeight: 1 }}>{specificDate.getDate().toString().padStart(2, "0")}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E6A63" }}>
                {specificDate.toLocaleDateString(intlLocale, { month: "short" }).replace(".", "")}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: "13.5px", fontWeight: 600, color: exception.isAvailable ? "#1F5245" : "#B8493C" }}>{label}</span>
              {exception.notes && <span style={{ fontSize: "12.5px", color: "#6E6A63", lineHeight: 1.45 }}>{exception.notes}</span>}
            </div>
            <button
              type="button"
              onClick={() => remove(exception.id)}
              disabled={deletingId === exception.id}
              style={{ width: "36px", height: "36px", background: "transparent", border: "1px solid #E2DACD", borderRadius: "3px", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}
            >
              <Trash size={15} color="#6E6A63" />
            </button>
          </div>
        )
      })}

      {adding ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "14px", border: "1px solid #E2DACD", borderRadius: "3px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ flex: "1 1 150px", height: "40px", padding: "0 12px", border: "1px solid #E2DACD", borderRadius: "3px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "#12100E" }}
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "available" | "unavailable")}
              style={{ flex: "1 1 150px", height: "40px", padding: "0 12px", border: "1px solid #E2DACD", borderRadius: "3px", fontSize: "13px", color: "#12100E", background: "#FFFFFF" }}
            >
              <option value="unavailable">{tRoot("unavailable")}</option>
              <option value="available">{tRoot("available")}</option>
            </select>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#3d3a35" }}>
            <input type="checkbox" checked={fullDay} onChange={(e) => setFullDay(e.target.checked)} />
            {t("fullDay")}
          </label>

          {!fullDay && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={{ height: "40px", padding: "0 12px", border: "1px solid #E2DACD", borderRadius: "3px", fontFamily: "var(--font-mono)", fontSize: "13px" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#6E6A63" }}>→</span>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={{ height: "40px", padding: "0 12px", border: "1px solid #E2DACD", borderRadius: "3px", fontFamily: "var(--font-mono)", fontSize: "13px" }} />
            </div>
          )}

          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("notesPlaceholder")}
            style={{ height: "40px", padding: "0 12px", border: "1px solid #E2DACD", borderRadius: "3px", fontSize: "13px", color: "#12100E" }}
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={submit}
              disabled={!date || saving}
              style={{ flex: 1, height: "42px", background: "#1F5245", border: "none", borderRadius: "4px", color: "#FFFFFF", fontSize: "13px", fontWeight: 600, cursor: saving ? "wait" : "pointer", opacity: !date || saving ? 0.7 : 1 }}
            >
              {t("confirm")}
            </button>
            <button
              type="button"
              onClick={resetForm}
              style={{ flex: 1, height: "42px", background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", color: "#12100E", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          style={{ height: "46px", background: "#FFFFFF", border: "1px dashed #12100E", borderRadius: "4px", color: "#12100E", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
        >
          {t("add")}
        </button>
      )}
    </div>
  )
}
