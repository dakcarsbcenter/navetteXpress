"use client"

import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { DashboardShell, type DashboardNavGroup } from "@/components/shared/DashboardShell"
import { adminNavigation } from "@/config/dashboard-navigation"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const t = useTranslations("admin")

  const groups: DashboardNavGroup[] = adminNavigation.map((group) => ({
    label: t(group.labelKey),
    items: group.items.map((item) => ({
      href: item.href,
      label: t(item.labelKey),
      icon: item.icon,
    })),
  }))

  const tab = searchParams?.get("tab") ?? "overview"

  return (
    <DashboardShell
      space={t("sidebar.brandTagline")}
      accent="lagune"
      groups={groups}
      title={t(`topbar.titles.${tab}`)}
      chip={{ tone: "live", label: t("topbar.systemStatus") }}
    >
      {children}
    </DashboardShell>
  )
}
