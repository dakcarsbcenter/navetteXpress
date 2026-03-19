"use client"

import { useRouter } from "next/navigation"
import { DriverProfile } from "@/components/driver/DriverProfile"

export default function DriverProfilPage() {
  const router = useRouter()

  return <DriverProfile onBack={() => router.push("/driver/dashboard")} />
}
