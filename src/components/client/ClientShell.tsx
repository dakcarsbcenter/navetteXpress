"use client"

import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { DashboardShell, type DashboardNavGroup } from "@/components/shared/DashboardShell"
import { clientNavigation } from "@/config/dashboard-navigation"
import { useConversations } from "@/hooks/useConversations"

export function ClientShell({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const t = useTranslations("client")
  const { unreadTotal } = useConversations()

  const groups: DashboardNavGroup[] = clientNavigation.map((group) => ({
    label: t(group.labelKey),
    items: group.items.map((item) => ({
      href: item.href,
      label: t(item.labelKey),
      icon: item.icon,
      badge: item.href === "/client/dashboard?tab=messages" && unreadTotal > 0 ? unreadTotal : undefined,
    })),
  }))

  const tab = searchParams?.get("tab") ?? "overview"
  const titleKey = tab.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())

  return (
    <DashboardShell
      space={t("sidebar.brandTagline")}
      accent="lagune"
      groups={groups}
      title={t(`topbar.titles.${titleKey}`)}
    >
      {children}
    </DashboardShell>
  )
}
