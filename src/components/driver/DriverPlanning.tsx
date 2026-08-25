"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarBlank, Clock, Coins, Car, ListChecks } from "@phosphor-icons/react"
import { UpcomingMissions } from "@/app/driver/dashboard/components/UpcomingMissions"
import { ContentCard, EmptyState, MetricCard, SectionHeader } from "@/components/driver/shared"
import type { DriverBookingsApiResponse, MissionItem } from "@/types/dashboard"

type BookingStatus = "confirmed" | "pending" | "in_progress" | "completed" | "cancelled" | "assigned"

const VALID_BOOKING_STATUSES = new Set<string>(["assigned", "pending", "in_progress", "completed", "cancelled", "confirmed"])

interface PlanningProps {
  onBack: () => void
}

interface PlanningMission {
  id: number
  date: Date
  status: BookingStatus
  pickup: string
  destination: string
  value: number
}

const WEEK_DAYS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"]
const HOUR_LABELS = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"]

function getWeekStart(input: Date): Date {
  const date = new Date(input)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function normalizeStatus(status: string): BookingStatus {
  return VALID_BOOKING_STATUSES.has(status) ? (status as BookingStatus) : "confirmed"
}

export function DriverPlanning({ onBack }: PlanningProps) {
  const [missions, setMissions] = useState<PlanningMission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDriverBookings = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/driver/bookings")
        if (!response.ok) {
          setMissions([])
          return
        }

        const data: DriverBookingsApiResponse = await response.json()
        if (!data.success || !Array.isArray(data.data)) {
          setMissions([])
          return
        }

        const transformed = data.data.map((item) => {
          const missionDate = new Date(item.booking.scheduledDateTime)
          const value = typeof item.booking.price === "string" ? Number.parseFloat(item.booking.price) : Number(item.booking.price ?? 0)

          return {
            id: item.booking.id,
            date: missionDate,
            status: normalizeStatus(item.booking.status),
            pickup: item.booking.pickupAddress,
            destination: item.booking.dropoffAddress,
            value: Number.isFinite(value) ? value : 0,
          }
        })

        setMissions(transformed)
      } catch (error) {
        console.error("Erreur planning:", error)
        setMissions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchDriverBookings()
  }, [])

  const now = useMemo(() => new Date(), [])
  const weekStart = useMemo(() => getWeekStart(now), [now])
  const weekDays = useMemo(() => WEEK_DAYS.map((label, index) => ({ label, date: new Date(weekStart.getTime() + index * 86400000) })), [weekStart])

  const weekMissions = useMemo(() => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    return missions.filter((mission) => mission.date >= weekStart && mission.date < weekEnd)
  }, [missions, weekStart])

  // Pre-compute day→missions map for O(1) calendar column lookup instead of O(N) filter per column
  const missionsByDay = useMemo(() => {
    const map = new Map<string, PlanningMission[]>()
    for (const mission of weekMissions) {
      const key = `${mission.date.getFullYear()}-${mission.date.getMonth()}-${mission.date.getDate()}`
      const list = map.get(key) ?? []
      list.push(mission)
      map.set(key, list)
    }
    return map
  }, [weekMissions])

  const upcomingMissions = useMemo<MissionItem[]>(() => {
    return missions
      .filter((mission) => mission.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5)
      .map((mission) => {
        const status: MissionItem["status"] = mission.status === "pending" ? "delayed" : "confirmed"
        return {
          id: mission.id,
          departure: mission.pickup,
          destination: mission.destination,
          time: mission.date.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
          status,
        }
      })
  }, [missions, now])

  const summary = useMemo(() => {
    const total = weekMissions.length
    const hours = weekMissions.length * 2
    const revenue = weekMissions.reduce((sum, mission) => sum + mission.value, 0)

    return {
      total,
      hours,
      revenue,
    }
  }, [weekMissions])

  const subtitle = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now)

  return (
    <div className="space-y-5 pb-20 md:pb-4">
      <SectionHeader title="PLANNING" subtitle={subtitle} />

      <ContentCard title="Vue hebdomadaire" indicator="gold" className="overflow-x-auto">
        {isLoading ? (
          <EmptyState icon={<Clock size={28} />} title="CHARGEMENT DU PLANNING" description="Synchronisation des missions en cours" />
        ) : weekMissions.length === 0 ? (
          <EmptyState icon={<CalendarBlank size={28} />} title="EN ATTENTE DE MISSION" description="Aucune mission planifiée cette semaine" />
        ) : (
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[90px_repeat(7,minmax(0,1fr))] border-b border-(--border) pb-2">
              <div className="text-[0.72rem] uppercase tracking-widest text-(--text-muted)">Heures</div>
              {weekDays.map((day) => (
                <div key={day.label} className="text-center">
                  <p className="text-xs font-semibold text-(--text-primary)">{day.label}</p>
                  <p className="text-[0.72rem] text-(--text-secondary)">{day.date.getDate().toString().padStart(2, "0")}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-[90px_repeat(7,minmax(0,1fr))] gap-x-2">
              <div className="space-y-6 pt-1">
                {HOUR_LABELS.map((hour) => (
                  <p key={hour} className="text-[0.72rem] text-(--text-muted)">{hour}</p>
                ))}
              </div>

              {weekDays.map((day, columnIndex) => {
                const dayKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`
                const dayMissions = missionsByDay.get(dayKey) ?? []

                return (
                  <div key={day.label + columnIndex} className="relative min-h-[310px] rounded-xl border border-(--border) bg-[color-mix(in_srgb,var(--bg-primary)_55%,transparent)] p-2">
                    {dayMissions.map((mission) => {
                      const hour = mission.date.getHours() + mission.date.getMinutes() / 60
                      const top = Math.max(0, ((hour - 6) / 16) * 270)
                      const isPending = mission.status === "pending"

                      return (
                        <div
                          key={mission.id}
                          className={`absolute left-2 right-2 rounded-lg border px-2 py-1.5 text-[0.68rem] font-semibold ${isPending
                            ? "border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-(--accent)"
                            : "border-[color-mix(in_srgb,var(--success)_35%,transparent)] bg-[color-mix(in_srgb,var(--success)_20%,transparent)] text-(--success)"
                            }`}
                          style={{ top: `${top}px` }}
                        >
                          <p>{mission.date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                          <p className="truncate">{mission.pickup} → {mission.destination}</p>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </ContentCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingMissions missions={upcomingMissions} />
        </div>
        <div className="space-y-4">
          <MetricCard icon={ListChecks} label="Missions planifiées" value={summary.total} badge={summary.total > 0 ? "Active" : "Neutre"} delay={0} />
          <MetricCard icon={Clock} label="Heures de conduite" value={`${summary.hours}h`} badge="Stable" iconTone="green" delay={50} />
          <MetricCard icon={Coins} label="Revenus estimés" value={`${Math.round(summary.revenue).toLocaleString("fr-FR")} F`} badge="En attente" delay={100} />
        </div>
      </div>
    </div>
  )
}
