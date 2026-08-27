"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import { AssignmentQueueCard, type DriverInfo, type QueueItem } from "./AssignmentQueueCard"
import { RecentBookingsTable, type RecentBooking } from "./RecentBookingsTable"
import { AwaitingDecisionPanel, CorridorLoadPanel, NewAccountsPanel, type AwaitingDecision, type CorridorSegment, type NewAccount } from "./OverviewSidePanels"
import { toIntlLocale } from "@/lib/intl-locale"

interface OverviewData {
  inProgressBookings: number
  activeDrivers: number
  totalDrivers: number
  activeVehicles: number
  totalVehicles: number
  todayRevenue: number
  awaitingDecision: AwaitingDecision
  corridorSegments: CorridorSegment[]
  recentBookings: RecentBooking[]
  recentUsers: NewAccount[]
}

function Kpi({ value, label, note, color }: { value: string; label: string; note: string; color?: string }) {
  return (
    <div style={{ flex: "1 1 168px", minWidth: "168px", padding: "20px 22px", borderRight: "1px solid #E2DACD", display: "flex", flexDirection: "column", gap: "8px" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "23px", fontWeight: 600, letterSpacing: "-0.01em", color: color ?? "#12100E" }}>{value}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>{label}</span>
      <span style={{ fontSize: "12px", color: "#3d3a35" }}>{note}</span>
    </div>
  )
}

export function AdminOverview() {
  const t = useTranslations("admin.overview")
  const intlLocale = toIntlLocale(useLocale())

  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [drivers, setDrivers] = useState<DriverInfo[] | null>(null)
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [assigningDriverId, setAssigningDriverId] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [proposingPrice, setProposingPrice] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/overview")
      const json = await res.json()
      if (json.success) setOverview(json.data)
    } catch (error) {
      console.error("Erreur lors du chargement de la vue d'ensemble:", error)
    }
  }, [])

  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/assignment-queue")
      const json = await res.json()
      if (json.success) setQueue(json.data)
    } catch (error) {
      console.error("Erreur lors du chargement de la file d'assignation:", error)
    }
  }, [])

  useEffect(() => {
    (async () => {
      await Promise.all([loadOverview(), loadQueue()])
      setLoading(false)
    })()
  }, [loadOverview, loadQueue])

  const currentId = queue[0]?.id

  useEffect(() => {
    if (!currentId) {
      setDrivers(null)
      return
    }
    let cancelled = false
    setLoadingDrivers(true)
    fetch(`/api/admin/bookings/${currentId}/available-drivers`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) setDrivers(json.data.drivers)
      })
      .catch((error) => console.error("Erreur lors du chargement des chauffeurs:", error))
      .finally(() => { if (!cancelled) setLoadingDrivers(false) })
    return () => { cancelled = true }
  }, [currentId])

  const handleAssign = useCallback(async (driverId: string) => {
    const current = queue[0]
    if (!current) return
    setAssigningDriverId(driverId)
    setAssignError(null)
    try {
      const res = await fetch(`/api/admin/bookings/${current.id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setAssignError(json.error || t("queue.assignError"))
        return
      }
      await Promise.all([loadQueue(), loadOverview()])
    } catch (error) {
      console.error("Erreur lors de l'assignation:", error)
      setAssignError(t("queue.assignError"))
    } finally {
      setAssigningDriverId(null)
    }
  }, [queue, loadQueue, loadOverview, t])

  const handleDriverClick = useCallback((driver: DriverInfo) => {
    if (driver.status !== "available") {
      setAssignError(driver.reason ?? t("queue.assignError"))
      return
    }
    handleAssign(driver.id)
  }, [handleAssign, t])

  const handleSkip = useCallback(() => {
    setAssignError(null)
    setQueue((q) => (q.length > 1 ? [...q.slice(1), q[0]] : q))
  }, [])

  const handleProposePrice = useCallback(async (price: number) => {
    const current = queue[0]
    if (!current) return
    setProposingPrice(true)
    try {
      const res = await fetch(`/api/admin/bookings/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price }),
      })
      const json = await res.json()
      if (json.success) {
        setQueue((q) => q.map((item, i) => (i === 0 ? { ...item, price } : item)))
      }
    } catch (error) {
      console.error("Erreur lors de la proposition de prix:", error)
    } finally {
      setProposingPrice(false)
    }
  }, [queue])

  if (loading || !overview) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "#E2DACD", borderTopColor: "#1F5245" }} />
      </div>
    )
  }

  const queueEmpty = queue.length === 0
  const unavailableDrivers = Math.max(overview.totalDrivers - overview.activeDrivers, 0)
  const inactiveVehicles = Math.max(overview.totalVehicles - overview.activeVehicles, 0)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
      <section style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#1F5245" }}>{t("corridorLabel")}</span>
          <h2 style={{ margin: 0, fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            {t("headline.inProgress", { count: overview.inProgressBookings })}, {t("headline.toAssign", { count: queue.length })}.
          </h2>
          <p style={{ margin: 0, fontSize: "15px", color: "#3d3a35", lineHeight: 1.5 }}>
            {queueEmpty ? t("subline.queueEmpty") : t("subline.queueActive")}
          </p>
        </div>
      </section>

      <section style={{ display: "flex", flexWrap: "wrap", borderTop: "1px solid #E2DACD", borderBottom: "1px solid #E2DACD" }}>
        <Kpi
          value={String(queue.length)}
          label={t("kpis.toAssign")}
          note={queueEmpty ? t("kpis.notes.toAssignEmpty") : t("kpis.notes.toAssignPending")}
          color={queueEmpty ? "#1F5245" : "#B4643A"}
        />
        <Kpi value={String(overview.inProgressBookings)} label={t("kpis.inProgress")} note={t("kpis.notes.inProgress")} />
        <Kpi
          value={`${overview.activeDrivers}/${overview.totalDrivers}`}
          label={t("kpis.activeDrivers")}
          note={t("kpis.notes.driversUnavailable", { count: unavailableDrivers })}
        />
        <Kpi
          value={String(overview.activeVehicles)}
          label={t("kpis.activeVehicles")}
          note={t("kpis.notes.vehiclesInactive", { count: inactiveVehicles })}
        />
        <Kpi
          value={`${Math.round(overview.todayRevenue).toLocaleString(intlLocale)} F`}
          label={t("kpis.todayRevenue")}
          note={t("kpis.notes.revenue")}
        />
      </section>

      <AssignmentQueueCard
        queue={queue}
        drivers={drivers}
        loadingDrivers={loadingDrivers}
        assigningDriverId={assigningDriverId}
        assignError={assignError}
        onAssign={(driverId) => {
          const driver = drivers?.find((d) => d.id === driverId)
          if (driver) handleDriverClick(driver)
        }}
        onSkip={handleSkip}
        onProposePrice={handleProposePrice}
        proposingPrice={proposingPrice}
      />

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: "24px", alignItems: "start" }}>
        <RecentBookingsTable bookings={overview.recentBookings} />

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <AwaitingDecisionPanel decisions={overview.awaitingDecision} />
          <CorridorLoadPanel segments={overview.corridorSegments} />
          <NewAccountsPanel accounts={overview.recentUsers} />
        </div>
      </section>
    </div>
  )
}
