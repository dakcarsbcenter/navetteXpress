import type { LucideIcon } from "lucide-react"

export type TrendType = "up" | "down" | "neutral"
export type MissionStatus = "À l'heure" | "Confirmée" | "Retard" | "Annulée"
export type HistoryStatus = "Terminé" | "En cours" | "Annulé"

export interface StatCardProps {
  icon: LucideIcon
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
