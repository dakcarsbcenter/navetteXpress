"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Car, Coins, Star, Users, FileText, User } from "@phosphor-icons/react"
import { StatCard } from "@/app/driver/dashboard/components/StatCard"
import { MissionRadar } from "@/app/driver/dashboard/components/MissionRadar"
import { UpcomingMissions } from "@/app/driver/dashboard/components/UpcomingMissions"
import { RevenueChart } from "@/app/driver/dashboard/components/RevenueChart"
import { RecentHistory } from "@/app/driver/dashboard/components/RecentHistory"
import styles from "@/styles/driver-dashboard.module.css"
import type {
  DriverBookingsApiResponse,
  HistoryItem,
  MissionItem,
  RevenuePoint,
} from "@/types/dashboard"

function formatMoney(value: number): string {
  return `${Math.round(value).toLocaleString("fr-FR")} F`
}

function formatDateLabel(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function DriverDashboardPage() {
  const [bookings, setBookings] = useState<DriverBookingsApiResponse["data"]>([])

  useEffect(() => {
    const fetchDriverBookings = async () => {
      try {
        const response = await fetch("/api/driver/bookings")
        if (!response.ok) {
          return
        }

        const data: DriverBookingsApiResponse = await response.json()
        if (data.success && Array.isArray(data.data)) {
          setBookings(data.data)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des réservations:", error)
      }
    }

    fetchDriverBookings()
  }, [])

  const statValues = useMemo(() => {
    const today = new Date().toDateString()
    const completedToday = bookings.filter((item) => {
      const bookingDate = new Date(item.booking.scheduledDateTime).toDateString()
      return bookingDate === today && item.booking.status === "completed"
    })

    const revenueToday = completedToday.reduce((sum, item) => {
      const currentPrice = typeof item.booking.price === "string"
        ? Number.parseFloat(item.booking.price)
        : Number(item.booking.price ?? 0)
      return Number.isFinite(currentPrice) ? sum + currentPrice : sum
    }, 0)

    return {
      totalCourses: bookings.length,
      revenueToday,
    }
  }, [bookings])

  const upcomingMissions = useMemo<MissionItem[]>(() => {
    return bookings
      .filter((item) => item.booking.status === "assigned" || item.booking.status === "pending")
      .slice(0, 5)
      .map((item) => ({
        id: item.booking.id,
        departure: item.booking.pickupAddress,
        destination: item.booking.dropoffAddress,
        time: new Date(item.booking.scheduledDateTime).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "Confirmée",
      }))
  }, [bookings])

  const history = useMemo<HistoryItem[]>(() => {
    return bookings
      .filter((item) => ["completed", "in_progress", "cancelled"].includes(item.booking.status))
      .slice(0, 8)
      .map((item) => ({
        id: item.booking.id,
        date: formatDateLabel(item.booking.scheduledDateTime),
        trajet: `${item.booking.pickupAddress} → ${item.booking.dropoffAddress}`,
        distance: "—",
        revenu: formatMoney(typeof item.booking.price === "string" ? Number.parseFloat(item.booking.price) : Number(item.booking.price ?? 0)),
        statut: item.booking.status === "completed"
          ? "Terminé"
          : item.booking.status === "cancelled"
            ? "Annulé"
            : "En cours",
      }))
  }, [bookings])

  const revenueData = useMemo<RevenuePoint[]>(() => {
    const days = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"]
    const revenueByDay = new Array(7).fill(0)
    for (const item of bookings) {
      if (item.booking.status !== "completed") continue
      const date = new Date(item.booking.scheduledDateTime)
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1
      const rawPrice = item.booking.price
      const price = typeof rawPrice === "string" ? Number.parseFloat(rawPrice) : Number(rawPrice ?? 0)
      if (Number.isFinite(price)) revenueByDay[dayIndex] += price
    }
    return days.map((day, index) => ({ day, value: revenueByDay[index] }))
  }, [bookings])

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className={styles.pageGrid}>
        <div className="xl:col-span-1">
          <StatCard icon={Car} label="Total Courses" value={statValues.totalCourses} trend="+0%" trendType="neutral" animationDelay={0} />
        </div>
        <div className="xl:col-span-1">
          <StatCard icon={Users} label="Chauffeurs actifs" value="2/2" trend="Stable" trendType="up" animationDelay={100} />
        </div>
        <div className="xl:col-span-1">
          <StatCard icon={Coins} label="Revenus du jour" value={`${Math.round(statValues.revenueToday)} F`} trend="+0%" trendType="neutral" animationDelay={200} />
        </div>
        <div className="xl:col-span-1">
          <StatCard icon={Star} label="Note moyenne" value="4.9/5" trend="+0.1" trendType="up" animationDelay={300} />
        </div>

        <div className="xl:col-span-2">
          <MissionRadar />
        </div>
        <div className="xl:col-span-2">
          <UpcomingMissions missions={upcomingMissions} />
        </div>

        <div className="xl:col-span-3">
          <RevenueChart data={revenueData} />
        </div>
        <section className="driver-dashboard-card xl:col-span-1 rounded-2xl border border-(--border) bg-(--bg-card) p-4 sm:p-6">
          <h3 className="mb-3 font-heading text-base font-bold text-(--text-primary) sm:mb-4 sm:text-lg">Raccourcis</h3>
          <div className="grid gap-3">
            <Link
              href="/driver/rapport"
              className="driver-dashboard-card inline-flex items-center gap-2.5 rounded-xl border border-(--border) bg-[color-mix(in_srgb,var(--bg-secondary)_65%,transparent)] px-3 py-2.5 text-xs font-semibold text-(--text-primary) sm:gap-3 sm:px-4 sm:py-3 sm:text-sm"
            >
              <FileText size={16} className="text-(--accent) sm:h-[18px] sm:w-[18px]" />
              Rapport
            </Link>
            <Link
              href="/driver/profil"
              className="driver-dashboard-card inline-flex items-center gap-2.5 rounded-xl border border-(--border) bg-[color-mix(in_srgb,var(--bg-secondary)_65%,transparent)] px-3 py-2.5 text-xs font-semibold text-(--text-primary) sm:gap-3 sm:px-4 sm:py-3 sm:text-sm"
            >
              <User size={16} className="text-(--accent) sm:h-[18px] sm:w-[18px]" />
              Profil
            </Link>
          </div>
        </section>

        <div className="xl:col-span-4">
          <RecentHistory items={history} />
        </div>
      </div>
    </div>
  )
}


