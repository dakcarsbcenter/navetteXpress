"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"
import { Bell, SignOut } from "@phosphor-icons/react"
import { ThemeToggle } from "@/app/driver/dashboard/components/ThemeToggle"
import { DashboardLanguageSwitcher } from "@/components/dashboard/DashboardLanguageSwitcher"
import { toIntlLocale } from "@/lib/intl-locale"

type PhosphorIcon = React.ComponentType<{
  size?: number
  className?: string
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"
  style?: React.CSSProperties
}>

export type DashboardAccent = "lagune" | "terre"

const ACCENT_HEX: Record<DashboardAccent, string> = {
  lagune: "#1F5245",
  terre: "#B4643A",
}

function accentRgba(accent: DashboardAccent, alpha: number) {
  const hex = ACCENT_HEX[accent]
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export interface DashboardNavItem {
  href: string
  label: string
  icon: PhosphorIcon
  badge?: number
}

export interface DashboardNavGroup {
  label: string
  items: DashboardNavItem[]
}

export interface DashboardShellChip {
  tone: "live" | "neutral"
  label: string
}

export interface DashboardShellDutyToggle {
  active: boolean
  onToggle: () => void
  activeLabel: string
  inactiveLabel: string
}

interface DashboardShellProps {
  space: string
  accent: DashboardAccent
  groups: DashboardNavGroup[]
  title: string
  chip?: DashboardShellChip
  hasNotifications?: boolean
  identitySubtitle?: string
  dutyToggle?: DashboardShellDutyToggle
  children: React.ReactNode
}

function getInitials(name?: string | null) {
  if (!name) return "NX"
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2)
}

function NavLink({ item, active, accent }: { item: DashboardNavItem; active: boolean; accent: DashboardAccent }) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className="relative flex h-[38px] items-center gap-3 rounded-[3px] px-3 text-[13px] transition-colors md:h-10"
      style={{
        borderLeft: active ? `2px solid ${ACCENT_HEX[accent]}` : "2px solid transparent",
        backgroundColor: active ? accentRgba(accent, 0.18) : "transparent",
        color: active ? "#F7F3EC" : "#9a938a",
        fontWeight: active ? 600 : 400,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "rgba(247,243,236,.05)"
          e.currentTarget.style.color = "#F7F3EC"
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "transparent"
          e.currentTarget.style.color = "#9a938a"
        }
      }}
    >
      <Icon size={17} weight={active ? "fill" : "regular"} style={active ? { color: ACCENT_HEX[accent] } : undefined} />
      <span className="truncate">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span
          className="ml-auto shrink-0 rounded-[2px] px-1.5 py-0.5 font-mono text-[9px]"
          style={{ color: ACCENT_HEX[accent], border: `1px solid ${accentRgba(accent, 0.4)}`, fontFamily: "var(--font-mono)" }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  )
}

export function DashboardShell({ space, accent, groups, title, chip, hasNotifications, identitySubtitle, dutyToggle, children }: DashboardShellProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const t = useTranslations("common.actions")
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const longDate = now.toLocaleDateString(intlLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  const time = now.toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" })

  const flatItems = groups.flatMap((group) => group.items)
  // Les espaces a onglets (client, entreprise, admin) codent l'onglet actif dans
  // ?tab=..., pas dans le pathname : on compare aussi ce parametre plutot que de
  // ne matcher que le chemin, sinon toutes leurs entrees de nav paraissent actives.
  const currentTab = searchParams?.get("tab") ?? null
  const isActive = (href: string) => {
    const [hrefPath, hrefQuery] = href.split("?")
    if (pathname !== hrefPath) return false
    const hrefTab = hrefQuery ? new URLSearchParams(hrefQuery).get("tab") : null
    return hrefTab === currentTab
  }

  const sidebarNav = (
    <nav className="flex-1 space-y-[22px] overflow-y-auto px-3 py-5">
      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p
            className="px-3 pb-2 font-mono text-[9px] font-bold uppercase"
            style={{ color: "#6E6A63", letterSpacing: "0.20em", fontFamily: "var(--font-mono)" }}
          >
            {group.label}
          </p>
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} accent={accent} />
          ))}
        </div>
      ))}
    </nav>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--font-body)" }}>
      {/* Sidebar */}
      <aside className="hidden w-[248px] shrink-0 flex-col md:flex" style={{ backgroundColor: "#12100E" }}>
        <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: "1px solid #2e2b27" }}>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[3px]" style={{ backgroundColor: "#F7F3EC" }}>
            <span className="text-[15px] font-bold" style={{ color: "#12100E" }}>NX</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold" style={{ color: "#F7F3EC" }}>Navette Xpress</p>
            <p
              className="truncate font-mono text-[9px] font-semibold uppercase"
              style={{ color: ACCENT_HEX[accent], letterSpacing: "0.18em", fontFamily: "var(--font-mono)" }}
            >
              {space}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid #2e2b27" }}>
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[3px] font-mono text-[12px]"
            style={{ border: "1px solid #3a3631", color: "#F7F3EC", fontFamily: "var(--font-mono)" }}
          >
            {getInitials(session?.user?.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold" style={{ color: "#F7F3EC" }}>{session?.user?.name ?? "—"}</p>
            <p className="truncate font-mono text-[9px]" style={{ color: "#9a938a", fontFamily: "var(--font-mono)" }}>
              {identitySubtitle ?? session?.user?.email ?? ""}
            </p>
          </div>
        </div>

        {dutyToggle && (
          <div className="px-4 pt-4">
            <button
              type="button"
              onClick={dutyToggle.onToggle}
              className="flex h-11 w-full items-center justify-between gap-2 rounded-[3px] px-3 font-mono text-[10px] uppercase transition-colors"
              style={{ border: "1px solid #3a3631", color: "#F7F3EC", letterSpacing: "0.14em", fontFamily: "var(--font-mono)" }}
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-[7px] w-[7px] shrink-0 rounded-full"
                  style={{ backgroundColor: dutyToggle.active ? "#22C55E" : "#94A3B8" }}
                />
                {dutyToggle.active ? dutyToggle.activeLabel : dutyToggle.inactiveLabel}
              </span>
              <span
                className="relative block h-[18px] w-[34px] shrink-0 rounded-full"
                style={{ backgroundColor: dutyToggle.active ? ACCENT_HEX[accent] : "#3a3631" }}
              >
                <span
                  className="absolute top-0.5 h-[14px] w-[14px] rounded-full transition-[left]"
                  style={{ backgroundColor: "#F7F3EC", left: dutyToggle.active ? "18px" : "2px" }}
                />
              </span>
            </button>
          </div>
        )}

        {sidebarNav}

        <div className="space-y-3 p-4" style={{ borderTop: "1px solid #2e2b27" }}>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DashboardLanguageSwitcher dropDirection="up" />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex h-10 w-full items-center gap-2 rounded-[3px] px-3 text-[13px] transition-colors"
            style={{ border: "1px solid #3a3631", color: "#9a938a" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#B8493C" }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#9a938a" }}
          >
            <SignOut size={16} />
            {t("logout")}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6"
          style={{ backgroundColor: "#F7F3EC", borderBottom: "1px solid #E2DACD", minHeight: "74px" }}
        >
          <div>
            <h1
              className="font-mono text-[11px] font-semibold uppercase"
              style={{ color: "#12100E", letterSpacing: "0.20em", fontFamily: "var(--font-mono)" }}
            >
              {title}
            </h1>
            <div className="mt-1 flex items-center gap-2 font-mono text-[10px]" style={{ color: "#6E6A63", fontFamily: "var(--font-mono)" }}>
              <span className="hidden sm:inline">{longDate.toUpperCase()}</span>
              <span className="hidden sm:inline">—</span>
              <span>{time}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {chip && (
              <span
                className="inline-flex h-[38px] items-center gap-1.5 rounded-[4px] px-3 font-mono text-[10px] font-semibold uppercase"
                style={{ backgroundColor: "#ffffff", border: "1px solid #E2DACD", color: "#3d3a35", letterSpacing: "0.12em", fontFamily: "var(--font-mono)" }}
              >
                <span
                  className={`h-[6px] w-[6px] shrink-0 rounded-full${chip.tone === "live" ? " live-badge" : ""}`}
                  style={{ backgroundColor: chip.tone === "live" ? "#22C55E" : "#6E6A63" }}
                />
                {chip.label}
              </span>
            )}

            <button
              type="button"
              aria-label={t("notifications")}
              className="relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-[4px]"
              style={{ backgroundColor: "#ffffff", border: "1px solid #E2DACD", color: "#3d3a35" }}
            >
              <Bell size={18} />
              {hasNotifications && (
                <span className="absolute right-2 top-2 h-[6px] w-[6px] rounded-full" style={{ backgroundColor: "#B4643A" }} />
              )}
            </button>

            <div
              className="grid h-[38px] w-[38px] place-items-center rounded-[4px] font-mono text-[11px] font-semibold"
              style={{ backgroundColor: "#ffffff", border: "1px solid #E2DACD", color: "#12100E", fontFamily: "var(--font-mono)" }}
            >
              {getInitials(session?.user?.name)}
            </div>
          </div>
        </header>

        <main className="dash-scroll flex-1 overflow-y-auto p-4 pb-24 md:p-6" style={{ backgroundColor: "#F7F3EC" }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom bar, derived from the same groups */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 md:hidden"
        style={{ backgroundColor: "#12100E", borderTop: "1px solid #2e2b27" }}
      >
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(flatItems.length, 6)}, 1fr)` }}>
          {flatItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-w-0 flex-col items-center gap-1 rounded-[3px] px-1 py-2 text-[10px]"
                style={{ color: active ? ACCENT_HEX[accent] : "#9a938a", backgroundColor: active ? accentRgba(accent, 0.18) : "transparent" }}
              >
                <Icon size={18} weight={active ? "fill" : "regular"} />
                <span className="w-full truncate text-center">{item.label.split(" ")[0]}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
