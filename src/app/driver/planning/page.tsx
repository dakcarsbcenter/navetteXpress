"use client"

import { useRouter } from "next/navigation"
import { DriverPlanning } from "@/components/driver/DriverPlanning"

export default function DriverPlanningPage() {
  const router = useRouter()

  return <DriverPlanning onBack={() => router.push("/driver/dashboard")} />
}
