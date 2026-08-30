"use client"

import { Suspense, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { usePermissions } from "@/hooks/usePermissions"
import { AdminOverview } from "./components/AdminOverview"
import { BookingsManagement } from "@/components/admin/BookingsManagement"
import { QuotesManagement } from "@/components/admin/QuotesManagement"
import { UsersManagement } from "@/components/admin/UsersManagement"
import { VehiclesManagement } from "@/components/admin/VehiclesManagement"
import { ServicesManager } from "@/components/admin/ServicesManager"
import { LocationsManagement } from "@/components/admin/LocationsManagement"
import { PricingSegmentsManagement } from "@/components/admin/PricingSegmentsManagement"
import PermissionsManagement from "@/components/admin/PermissionsManagement"
import InvoicesManagement from "@/components/admin/InvoicesManagement"
import ReviewsManagement from "@/components/admin/ReviewsManagement"
import AdminGlobalStats from "@/components/admin/AdminGlobalStats"
import CompanyRequestsManagement from "@/components/admin/CompanyRequestsManagement"
import SupportManagement from "@/components/admin/SupportManagement"

type TabId = "overview" | "bookings" | "quotes" | "drivers" | "support" | "vehicles" | "services" | "locations" | "pricing" | "users" | "company-requests" | "permissions" | "invoices" | "reviews" | "stats"

const TAB_IDS: TabId[] = ["overview", "bookings", "quotes", "drivers", "support", "vehicles", "services", "locations", "pricing", "users", "company-requests", "permissions", "invoices", "reviews", "stats"]

const TAB_ACCESS: Record<TabId, { resource?: string; adminOnly?: boolean; requireManage?: boolean }> = {
  overview: {},
  bookings: { resource: "bookings" },
  quotes: { resource: "quotes" },
  drivers: { resource: "users" },
  support: {},
  vehicles: { resource: "vehicles" },
  services: { adminOnly: true },
  locations: { adminOnly: true },
  pricing: { adminOnly: true },
  users: { resource: "users" },
  "company-requests": { resource: "users" },
  permissions: { resource: "users", requireManage: true, adminOnly: true },
  invoices: {},
  reviews: { resource: "reviews" },
  stats: { adminOnly: true },
}

function AdminDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("admin")
  const { permissions, loading: permissionsLoading, canRead, canManage } = usePermissions()
  const [checkingAuth, setCheckingAuth] = useState(true)

  const tabParam = searchParams?.get("tab")
  const activeTab: TabId = tabParam && TAB_IDS.includes(tabParam as TabId) ? (tabParam as TabId) : "overview"

  const userRole = (session?.user as { role?: string } | undefined)?.role

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    if (session?.user && userRole !== "admin" && userRole !== "manager") {
      router.push("/dashboard")
      return
    }
    setCheckingAuth(false)
  }, [session, status, userRole, router])

  if (status === "loading" || checkingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-[#6E6A63] font-[family-name:var(--font-ibm-plex-mono)] text-sm">{t("loading")}</div>
      </div>
    )
  }

  if (!session?.user || (userRole !== "admin" && userRole !== "manager")) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-[#B8493C] text-sm">{t("accessDenied")}</div>
      </div>
    )
  }

  const rule = TAB_ACCESS[activeTab]
  const canAccessTab = (() => {
    if (permissionsLoading) return true
    if (rule.adminOnly && userRole !== "admin") return false
    if (userRole === "admin") return true
    if (!rule.resource) return true
    return rule.requireManage ? canManage(rule.resource) : canRead(rule.resource) || canManage(rule.resource)
  })()

  if (!canAccessTab) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-[#B8493C] text-sm">{t("accessDenied")}</div>
      </div>
    )
  }

  switch (activeTab) {
    case "overview":
      return <AdminOverview />
    case "bookings":
      return <BookingsManagement />
    case "quotes":
      return <QuotesManagement />
    case "drivers":
      return <UsersManagement userPermissions={permissions} initialRoleFilter="driver" />
    case "support":
      return <SupportManagement />
    case "vehicles":
      return <VehiclesManagement />
    case "services":
      return <ServicesManager />
    case "locations":
      return <LocationsManagement />
    case "pricing":
      return <PricingSegmentsManagement />
    case "users":
      return <UsersManagement userPermissions={permissions} />
    case "company-requests":
      return <CompanyRequestsManagement />
    case "permissions":
      return <PermissionsManagement />
    case "invoices":
      return <InvoicesManagement />
    case "reviews":
      return <ReviewsManagement />
    case "stats":
      return <AdminGlobalStats />
    default:
      return <AdminOverview />
  }
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "#E2DACD", borderTopColor: "#1F5245" }} />
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  )
}
