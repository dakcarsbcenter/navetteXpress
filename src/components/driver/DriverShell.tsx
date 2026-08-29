"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { DashboardShell, type DashboardNavGroup } from "@/components/shared/DashboardShell"
import { driverNavigation } from "@/config/dashboard-navigation"
import { useConversations } from "@/hooks/useConversations"

const pathTitleKeys: Record<string, string> = {
  "/driver/dashboard": "dashboard",
  "/driver/planning": "planning",
  "/driver/disponibilites": "availability",
  "/driver/rapport": "report",
  "/driver/statistiques": "statistics",
  "/driver/profil": "profile",
  "/driver/history": "history",
}

export function DriverShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const t = useTranslations("driver")
  const [onDuty, setOnDuty] = useState(true)
  const [pendingReports, setPendingReports] = useState(0)
  const { unreadTotal } = useConversations()

  useEffect(() => {
    let cancelled = false

    const fetchPendingReports = async () => {
      try {
        const response = await fetch("/api/vehicle-reports")
        if (!response.ok) return
        const data = await response.json()
        if (!cancelled && data.success && Array.isArray(data.data)) {
          const count = data.data.filter((report: { status: string }) =>
            report.status === "open" || report.status === "in_progress"
          ).length
          setPendingReports(count)
        }
      } catch {
        // silencieux : le badge reste a 0, non bloquant pour la navigation
      }
    }

    fetchPendingReports()
    const interval = setInterval(fetchPendingReports, 5 * 60000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const groups: DashboardNavGroup[] = driverNavigation.map((group) => ({
    label: t(group.labelKey),
    items: group.items.map((item) => ({
      href: item.href,
      label: t(item.labelKey),
      icon: item.icon,
      badge: item.href === "/driver/rapport" && pendingReports > 0
        ? pendingReports
        : item.href === "/driver/messages" && unreadTotal > 0
          ? unreadTotal
          : undefined,
    })),
  }))

  const titleKey = pathTitleKeys[pathname ?? ""] ?? "dashboard"

  return (
    <DashboardShell
      space={t("sidebar.brandTagline")}
      accent="terre"
      groups={groups}
      title={t(`topbar.titles.${titleKey}`)}
      chip={{ tone: onDuty ? "live" : "neutral", label: onDuty ? t("duty.on") : t("duty.off") }}
      dutyToggle={{
        active: onDuty,
        onToggle: () => setOnDuty((prev) => !prev),
        activeLabel: t("duty.on"),
        inactiveLabel: t("duty.off"),
      }}
    >
      {children}
    </DashboardShell>
  )
}
