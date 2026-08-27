"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toIntlLocale } from "@/lib/intl-locale"
import { WeekDayCards, type DayCard } from "@/app/driver/planning/components/WeekDayCards"
import { WeekMissionsList } from "@/app/driver/planning/components/WeekMissionsList"
import type {
  DriverAvailabilityApiResponse,
  DriverAvailabilityRow,
  DriverBookingApiItem,
  DriverBookingsApiResponse,
} from "@/types/dashboard"

function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = result.getDay() === 0 ? 7 : result.getDay() // lundi = 1 ... dimanche = 7
  result.setDate(result.getDate() - (day - 1))
  result.setHours(0, 0, 0, 0)
  return result
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function addDays(date: Date, amount: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

export default function DriverPlanningPage() {
  const t = useTranslations("driver.planning")
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)

  const [weekOffset, setWeekOffset] = useState(0)
  const [bookings, setBookings] = useState<DriverBookingApiItem["booking"][]>([])
  const [availability, setAvailability] = useState<DriverAvailabilityRow[]>([])

  useEffect(() => {
    const fetchBookings = async () => {
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
    }

    const fetchAvailability = async () => {
      try {
        const response = await fetch("/api/driver/availability")
        if (!response.ok) return
        const data: DriverAvailabilityApiResponse = await response.json()
        if (data.success && Array.isArray(data.data)) {
          setAvailability(data.data)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des disponibilités:", error)
      }
    }

    fetchBookings()
    fetchAvailability()
  }, [])

  const weekStart = useMemo(() => addDays(startOfWeek(new Date()), weekOffset * 7), [weekOffset])
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart])

  const weekBookings = useMemo(
    () => bookings.filter((b) => {
      const date = new Date(b.scheduledDateTime)
      return date >= weekStart && date < weekEnd
    }),
    [bookings, weekStart, weekEnd]
  )

  const days = useMemo<DayCard[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i)
      const dayOfWeek = date.getDay()

      const exception = availability.find((row) => {
        if (!row.specificDate) return false
        return isSameDay(new Date(row.specificDate), date)
      })

      let isOpen: boolean
      let slot: string
      if (exception) {
        isOpen = exception.isAvailable
        slot = `${exception.startTime.slice(0, 5)} — ${exception.endTime.slice(0, 5)}`
      } else {
        const recurring = availability.filter((row) => !row.specificDate && row.isAvailable && row.dayOfWeek === dayOfWeek)
        isOpen = recurring.length > 0
        if (isOpen) {
          const start = recurring.reduce((min, row) => (row.startTime < min ? row.startTime : min), recurring[0].startTime)
          const end = recurring.reduce((max, row) => (row.endTime > max ? row.endTime : max), recurring[0].endTime)
          slot = `${start.slice(0, 5)} — ${end.slice(0, 5)}`
        } else {
          slot = t("closed")
        }
      }

      const count = bookings.filter((b) => isSameDay(new Date(b.scheduledDateTime), date)).length

      return {
        key: date.toISOString(),
        label: date.toLocaleDateString(intlLocale, { weekday: "short" }).toUpperCase(),
        date: date.getDate().toString().padStart(2, "0"),
        isOpen,
        slot,
        count,
      }
    })
  }, [weekStart, availability, bookings, intlLocale, t])

  const closedDays = days.filter((d) => !d.isOpen).length

  const eyebrow = t("weekOf", {
    start: weekStart.toLocaleDateString(intlLocale, { day: "numeric" }),
    end: addDays(weekStart, 6).toLocaleDateString(intlLocale, { day: "numeric", month: "long" }),
  })

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-7">
      <section className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-2">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#B4643A" }}>
            {eyebrow}
          </span>
          <h2 style={{ margin: 0, fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            {t("headline", { count: weekBookings.length })}
          </h2>
          <p style={{ margin: 0, fontSize: "15px", color: "#3d3a35", lineHeight: 1.5 }}>{t("weekNote", { count: closedDays })}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={t("prevWeek")}
            onClick={() => setWeekOffset((prev) => prev - 1)}
            style={{ width: "44px", height: "44px", background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", cursor: "pointer", display: "grid", placeItems: "center" }}
          >
            <span style={{ fontSize: "17px", color: "#12100E" }}>‹</span>
          </button>
          <button
            type="button"
            aria-label={t("nextWeek")}
            onClick={() => setWeekOffset((prev) => prev + 1)}
            style={{ width: "44px", height: "44px", background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", cursor: "pointer", display: "grid", placeItems: "center" }}
          >
            <span style={{ fontSize: "17px", color: "#12100E" }}>›</span>
          </button>
        </div>
      </section>

      <WeekDayCards days={days} />
      <WeekMissionsList bookings={weekBookings} />
    </div>
  )
}
