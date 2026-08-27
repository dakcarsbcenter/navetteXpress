"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { WeeklyScheduleCard, type DayDraft } from "@/app/driver/disponibilites/components/WeeklyScheduleCard"
import { ExceptionsPanel } from "@/app/driver/disponibilites/components/ExceptionsPanel"
import { DispatchInfoPanel } from "@/app/driver/disponibilites/components/DispatchInfoPanel"
import type { DriverAvailabilityApiResponse, DriverAvailabilityRow, DriverBookingsApiResponse } from "@/types/dashboard"

// Lundi -> dimanche a l'affichage, mais day_of_week en base suit Date.getDay()
// (0 = dimanche ... 6 = samedi) : voir docs/redesign/README.md, section Chauffeur.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const ACTIVE_STATUSES = ["assigned", "confirmed", "in_progress"]

function buildDrafts(rows: DriverAvailabilityRow[]): DayDraft[] {
  return DAY_ORDER.map((dayOfWeek) => {
    const recurring = rows.filter((row) => !row.specificDate && row.isAvailable && row.dayOfWeek === dayOfWeek)
    if (recurring.length === 0) {
      return { dayOfWeek, isOpen: false, start: "06:00", end: "22:00", ids: [] }
    }
    const start = recurring.reduce((min, row) => (row.startTime < min ? row.startTime : min), recurring[0].startTime)
    const end = recurring.reduce((max, row) => (row.endTime > max ? row.endTime : max), recurring[0].endTime)
    return { dayOfWeek, isOpen: true, start: start.slice(0, 5), end: end.slice(0, 5), ids: recurring.map((row) => row.id) }
  })
}

export default function DriverDisponibilitesPage() {
  const t = useTranslations("driver.availability")

  const [rows, setRows] = useState<DriverAvailabilityRow[]>([])
  const [drafts, setDrafts] = useState<DayDraft[]>(() => buildDrafts([]))
  const [assignedCount, setAssignedCount] = useState(0)
  const [saving, setSaving] = useState(false)

  const reloadAvailability = useCallback(async () => {
    try {
      const response = await fetch("/api/driver/availability")
      if (!response.ok) return
      const data: DriverAvailabilityApiResponse = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setRows(data.data)
        setDrafts(buildDrafts(data.data))
      }
    } catch (error) {
      console.error("Erreur lors du chargement des disponibilités:", error)
    }
  }, [])

  useEffect(() => {
    reloadAvailability()

    const fetchBookings = async () => {
      try {
        const response = await fetch("/api/driver/bookings")
        if (!response.ok) return
        const data: DriverBookingsApiResponse = await response.json()
        if (data.success && Array.isArray(data.data)) {
          setAssignedCount(data.data.filter((item) => ACTIVE_STATUSES.includes(item.booking.status)).length)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des réservations:", error)
      }
    }
    fetchBookings()
  }, [reloadAvailability])

  const exceptions = useMemo(() => rows.filter((row) => row.specificDate), [rows])
  const openCount = drafts.filter((d) => d.isOpen).length

  const toggleDay = (dayOfWeek: number) => {
    setDrafts((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, isOpen: !d.isOpen } : d)))
  }

  const changeTime = (dayOfWeek: number, field: "start" | "end", value: string) => {
    setDrafts((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d)))
  }

  const saveWeekly = async () => {
    setSaving(true)
    try {
      await Promise.all(
        drafts.map(async (day) => {
          if (!day.isOpen) {
            await Promise.all(day.ids.map((id) => fetch(`/api/driver/availability?id=${id}`, { method: "DELETE" })))
            return
          }

          const payload = { dayOfWeek: day.dayOfWeek, startTime: `${day.start}:00`, endTime: `${day.end}:00`, isAvailable: true }
          if (day.ids.length === 0) {
            await fetch("/api/driver/availability", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          } else {
            const [first, ...rest] = day.ids
            await fetch("/api/driver/availability", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: first, ...payload }),
            })
            await Promise.all(rest.map((id) => fetch(`/api/driver/availability?id=${id}`, { method: "DELETE" })))
          }
        })
      )
      await reloadAvailability()
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des disponibilités:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-7">
      <section className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-2">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#B4643A" }}>
            {t("eyebrow")}
          </span>
          <h2 style={{ margin: 0, fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            {t("headline", { count: openCount })}
          </h2>
          <p style={{ margin: 0, fontSize: "15px", color: "#3d3a35", lineHeight: 1.5, maxWidth: "46em" }}>{t("description")}</p>
        </div>
        <button
          type="button"
          onClick={saveWeekly}
          disabled={saving}
          style={{ height: "46px", padding: "0 18px", background: "#1F5245", border: "none", borderRadius: "4px", color: "#FFFFFF", fontSize: "13px", fontWeight: 600, cursor: saving ? "wait" : "pointer", whiteSpace: "nowrap", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? t("saving") : t("save")}
        </button>
      </section>

      <WeeklyScheduleCard days={drafts} exceptionsCount={exceptions.length} onToggle={toggleDay} onChangeTime={changeTime} />

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "24px", alignItems: "start" }}>
        <ExceptionsPanel exceptions={exceptions} onChanged={reloadAvailability} />
        <DispatchInfoPanel openDays={openCount} exceptionsCount={exceptions.length} assignedCount={assignedCount} />
      </section>
    </div>
  )
}
