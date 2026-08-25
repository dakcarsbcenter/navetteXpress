import type React from "react"

export type TrendType = "up" | "down" | "neutral"
// Codes, not display labels — translated at render time via the
// driver.home.missionStatus / driver.home.historyStatus message namespaces.
export type MissionStatus = "onTime" | "confirmed" | "delayed" | "cancelled"
export type HistoryStatus = "completed" | "inProgress" | "cancelled"

type PhosphorIcon = React.ComponentType<{ size?: number; className?: string; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone" }>

export interface StatCardProps {
  icon: PhosphorIcon
  label: string
  value: string | number
  trend?: string
  trendType?: TrendType
  animationDelay?: number
}

export interface MissionItem {
  id: number
  departure: string
  destination: string
  time: string
  status: MissionStatus
}

export interface UpcomingMissionsProps {
  missions: MissionItem[]
}

export interface RevenuePoint {
  day: string
  value: number
}

export interface RevenueChartProps {
  data?: RevenuePoint[]
}

export interface HistoryItem {
  id: number
  date: string
  trajet: string
  distance: string
  revenu: string
  statut: HistoryStatus
}

export interface RecentHistoryProps {
  items: HistoryItem[]
}

export interface DriverBookingApiItem {
  booking: {
    id: number
    pickupAddress: string
    dropoffAddress: string
    scheduledDateTime: string
    status: string
    price: string | number | null
  }
}

export interface DriverBookingsApiResponse {
  success: boolean
  data: DriverBookingApiItem[]
}
