"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"
import { toIntlLocale } from "@/lib/intl-locale"
import { CorridorBanner } from "@/app/driver/dashboard/components/CorridorBanner"
import { CourseCard, type CoursePhase } from "@/app/driver/dashboard/components/CourseCard"
import { RefuseMissionModal } from "@/app/driver/dashboard/components/RefuseMissionModal"
import { KpiBand } from "@/app/driver/dashboard/components/KpiBand"
import { MissionsToday } from "@/app/driver/dashboard/components/MissionsToday"
import { WeekEarnings } from "@/app/driver/dashboard/components/WeekEarnings"
import { VehicleReportPanel, type VehicleReportItem } from "@/app/driver/dashboard/components/VehicleReportPanel"
import type { DriverBookingApiItem, DriverBookingsApiResponse } from "@/types/dashboard"

const ACTIVE_STATUSES = ["assigned", "confirmed", "in_progress"]

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = result.getDay() === 0 ? 7 : result.getDay() // lundi = 1 ... dimanche = 7
  result.setDate(result.getDate() - (day - 1))
  result.setHours(0, 0, 0, 0)
  return result
}

export default function DriverDashboardPage() {
  const { data: session } = useSession()
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)
  const t = useTranslations("driver.home")

  const [bookings, setBookings] = useState<DriverBookingApiItem["booking"][]>([])
  const [monthRating, setMonthRating] = useState({ average: 0, count: 0 })
  const [vehicleReports, setVehicleReports] = useState<VehicleReportItem[]>([])
  const [phase, setPhase] = useState<CoursePhase>("nouvelle")
  const [busy, setBusy] = useState(false)
  const [incidentReported, setIncidentReported] = useState(false)
  const [refuseModalOpen, setRefuseModalOpen] = useState(false)
  const [refusing, setRefusing] = useState(false)

  const fetchBookings = useCallback(async () => {
    try {
      const response = await fetch("/api/driver/bookings")
      if (!response.ok) return
      const data: DriverBookingsApiResponse = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setBookings(data.data.map((item) => item.booking))
      }
    } catch (error) {
      console.error("Erreur lors du chargement des réservations:", error)
    }
  }, [])

  useEffect(() => {
    fetchBookings()

    const fetchRating = async () => {
      try {
        const response = await fetch("/api/driver/stats?period=month")
        if (!response.ok) return
        const data = await response.json()
        if (data.success) {
          setMonthRating({ average: data.data.averageRating ?? 0, count: data.data.totalRatings ?? 0 })
        }
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error)
      }
    }

    const fetchVehicleReports = async () => {
      try {
        const response = await fetch("/api/vehicle-reports")
        if (!response.ok) return
        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          setVehicleReports(data.data)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des rapports véhicule:", error)
      }
    }

    fetchRating()
    fetchVehicleReports()
  }, [fetchBookings])

  const current = useMemo(() => {
    const candidates = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status))
    const inProgress = candidates.find((b) => b.status === "in_progress")
    if (inProgress) return inProgress
    return [...candidates].sort(
      (a, b) => new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime()
    )[0]
  }, [bookings])

  // Le statut reel (assigned/confirmed/in_progress) ne distingue pas
  // "en route" de "sur place" : ce sont des sous-etapes locales, sans
  // colonne dediee en base, tant que le chauffeur n'a pas demarre la course.
  useEffect(() => {
    if (!current) return
    if (current.status === "assigned") setPhase("nouvelle")
    else if (current.status === "in_progress") setPhase("encours")
    else if (current.status === "confirmed") {
      setPhase((prev) => (prev === "enroute" || prev === "surplace" ? prev : "acceptee"))
    }
    setIncidentReported(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.status])

  const patchStatus = useCallback(async (id: number, status: string, extra?: Record<string, unknown>) => {
    setBusy(true)
    try {
      const response = await fetch(`/api/driver/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra }),
      })
      if (response.ok) {
        await fetchBookings()
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la course:", error)
    } finally {
      setBusy(false)
    }
  }, [fetchBookings])

  const handleRefuse = useCallback(async (reason: string) => {
    if (!current) return
    setRefusing(true)
    try {
      const response = await fetch(`/api/driver/bookings/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancellationReason: reason }),
      })
      if (response.ok) {
        setRefuseModalOpen(false)
        await fetchBookings()
      }
    } catch (error) {
      console.error("Erreur lors du refus de la mission:", error)
    } finally {
      setRefusing(false)
    }
  }, [current, fetchBookings])

  const handleAdvance = useCallback(() => {
    if (!current) return
    switch (phase) {
      case "nouvelle":
        patchStatus(current.id, "confirmed")
        break
      case "acceptee":
        setPhase("enroute")
        break
      case "enroute":
        setPhase("surplace")
        break
      case "surplace":
        patchStatus(current.id, "in_progress")
        break
      case "encours":
        patchStatus(current.id, "completed")
        break
    }
  }, [current, phase, patchStatus])

  const today = new Date()
  const todayBookings = useMemo(
    () => bookings.filter((b) => isSameDay(new Date(b.scheduledDateTime), today)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookings]
  )

  const kpis = useMemo(() => {
    const completedToday = todayBookings.filter((b) => b.status === "completed")
    const remaining = todayBookings.filter((b) => ACTIVE_STATUSES.includes(b.status))
    const collected = completedToday.reduce((sum, b) => {
      const price = typeof b.price === "string" ? Number.parseFloat(b.price) : Number(b.price ?? 0)
      return Number.isFinite(price) ? sum + price : sum
    }, 0)
    const lastRemaining = [...remaining].sort(
      (a, b) => new Date(b.scheduledDateTime).getTime() - new Date(a.scheduledDateTime).getTime()
    )[0]

    return [
      { value: String(todayBookings.length), label: t("kpis.todayCount"), note: t("kpis.todayNote", { count: completedToday.length }) },
      {
        value: String(remaining.length),
        label: t("kpis.remaining"),
        note: lastRemaining
          ? t("kpis.remainingNote", { time: new Date(lastRemaining.scheduledDateTime).toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" }) })
          : t("kpis.remainingNoteEmpty"),
      },
      { value: `${Math.round(collected).toLocaleString(intlLocale)} F`, label: t("kpis.collected"), note: t("kpis.collectedNote") },
      {
        value: monthRating.average > 0 ? monthRating.average.toFixed(1) : "—",
        label: t("kpis.ratingMonth"),
        note: monthRating.count > 0 ? t("kpis.ratingNote", { count: monthRating.count }) : t("kpis.ratingNoteEmpty"),
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayBookings, monthRating, intlLocale])

  const week = useMemo(() => {
    const weekStart = startOfWeek(today)
    const bars = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart)
      day.setDate(day.getDate() + i)
      const dayTotal = bookings
        .filter((b) => b.status === "completed" && isSameDay(new Date(b.scheduledDateTime), day))
        .reduce((sum, b) => {
          const price = typeof b.price === "string" ? Number.parseFloat(b.price) : Number(b.price ?? 0)
          return Number.isFinite(price) ? sum + price : sum
        }, 0)
      return {
        day: day.toLocaleDateString(intlLocale, { weekday: "short" }).toUpperCase(),
        value: dayTotal,
        isToday: isSameDay(day, today),
      }
    })
    const total = bars.reduce((sum, b) => sum + b.value, 0)
    const completedCount = bookings.filter(
      (b) => b.status === "completed" && new Date(b.scheduledDateTime) >= weekStart
    ).length

    return { bars, total, completedCount, averageFare: completedCount > 0 ? total / completedCount : 0 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, intlLocale])

  const firstName = session?.user?.name?.split(" ")[0] ?? ""
  const hour = today.getHours()
  const greeting = hour < 18 ? t("greeting.morning") : t("greeting.evening")
  const dayline = todayBookings.length > 0 ? t("dayline", { count: todayBookings.length }) : t("daylineEmpty")

  return (
    <div className="flex flex-col gap-7">
      <CorridorBanner />

      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-7">
        <section className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#B4643A" }}>
              {t("eyebrow")}
            </span>
            <h2 style={{ margin: 0, fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
              {greeting}, {firstName}.
            </h2>
            <p style={{ margin: 0, fontSize: "15px", color: "#3d3a35", lineHeight: 1.5 }}>{dayline}</p>
          </div>
          <Link href="/driver/planning" style={{ fontSize: "13px", fontWeight: 600, color: "#12100E", borderBottom: "2px solid #12100E", paddingBottom: "2px" }}>
            {t("viewPlanning")}
          </Link>
        </section>

        <CourseCard
          booking={current}
          phase={phase}
          busy={busy}
          incidentReported={incidentReported}
          onAdvance={handleAdvance}
          onReportIncident={() => setIncidentReported(true)}
          onRequestRefuse={() => setRefuseModalOpen(true)}
        />

        {refuseModalOpen && current && (
          <RefuseMissionModal
            bookingId={current.id}
            isLoading={refusing}
            onCancel={() => setRefuseModalOpen(false)}
            onConfirm={handleRefuse}
          />
        )}

        <KpiBand kpis={kpis} />

        <section className="grid items-start gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))" }}>
          <MissionsToday bookings={todayBookings} />
          <div className="flex flex-col gap-6">
            <WeekEarnings total={week.total} completedCount={week.completedCount} averageFare={week.averageFare} rating={monthRating.average} bars={week.bars} />
            <VehicleReportPanel reports={vehicleReports} />
          </div>
        </section>
      </div>
    </div>
  )
}
