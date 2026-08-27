// Codes, not display labels — translated at render time via the
// driver.home.missionStatus message namespace.
export type MissionStatus = "onTime" | "confirmed" | "delayed" | "cancelled"

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

export interface DriverBookingApiItem {
  booking: {
    id: number
    pickupAddress: string
    dropoffAddress: string
    scheduledDateTime: string
    status: string
    price: string | number | null
    customerName: string
    customerPhone: string
    passengers: number
    luggage: number
    duration: string | number | null
    notes: string | null
  }
}

export interface DriverBookingsApiResponse {
  success: boolean
  data: DriverBookingApiItem[]
}

export interface DriverAvailabilityRow {
  id: number
  driverId: string
  dayOfWeek: number // 0 = dimanche ... 6 = samedi, comme Date.getDay()
  startTime: string
  endTime: string
  isAvailable: boolean
  specificDate: string | null
  notes: string | null
}

export interface DriverAvailabilityApiResponse {
  success: boolean
  data: DriverAvailabilityRow[]
}
