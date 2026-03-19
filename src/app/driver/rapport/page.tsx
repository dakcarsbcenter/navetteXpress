"use client"

import { useRouter } from "next/navigation"
import { VehicleReport } from "@/components/driver/VehicleReport"

export default function DriverRapportPage() {
  const router = useRouter()

  return <VehicleReport onBack={() => router.push("/driver/dashboard")} />
}
