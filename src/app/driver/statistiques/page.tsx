"use client"

import { useRouter } from "next/navigation"
import { DriverStats } from "@/components/driver/DriverStats"

export default function DriverStatistiquesPage() {
  const router = useRouter()

  return <DriverStats onBack={() => router.push("/driver/dashboard")} />
}
