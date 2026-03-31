"use client"

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { SquaresFour, CalendarBlank, Clock, ChartBar, SignOut, User, Wrench, Circle } from '@phosphor-icons/react'
import { ThemeToggle } from '@/app/driver/dashboard/components/ThemeToggle'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone" }>
}

const principalItems: NavItem[] = [
  { href: '/driver/dashboard', label: 'Tableau de bord', icon: SquaresFour },
  { href: '/driver/planning', label: 'Planning', icon: CalendarBlank },
]

const managementItems: NavItem[] = [
  { href: '/driver/disponibilites', label: 'Disponibilités', icon: Clock },
  { href: '/driver/rapport', label: 'Rapport Véhicule', icon: Wrench },
  { href: '/driver/statistiques', label: 'Statistiques', icon: ChartBar },
  { href: '/driver/profil', label: 'Profil', icon: User },
]

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={`driver-dashboard-card relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${active
        ? 'border-(--accent) bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-(--accent)'
        : 'border-transparent text-(--text-muted) hover:border-(--border) hover:bg-[color-mix(in_srgb,var(--bg-card)_75%,transparent)] hover:text-(--text-primary)'
      }`}
    >
      {active && <span className="absolute -left-3 top-2 h-7 w-1 rounded-full bg-(--accent)" />}
      <Icon size={16} weight={active ? "fill" : "regular"} />
      <span>{item.label}</span>
    </Link>
  )
}

export default function DriverSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const getInitials = (name?: string | null) => {
    if (!name) return 'CH'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-(--border) bg-(--bg-secondary) md:flex">
        <div className="border-b border-(--border) px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-(--accent)">
              <span className="text-xs font-bold text-black">NX</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-(--text-primary)">
                Navette <span className="text-(--accent)">Xpress</span>
              </p>
              <p className="text-[10px] text-(--text-muted)">Espace chauffeur</p>
            </div>
          </div>
        </div>

        <div className="border-b border-(--border) px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-(--border) bg-(--bg-card) text-xs font-bold text-(--text-primary)">
              {getInitials(session?.user?.name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-(--text-primary)">{session?.user?.name ?? 'Chauffeur'}</p>
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--success)_15%,transparent)] px-2 py-0.5 text-[11px] text-(--success)">
                <Circle size={8} weight="fill" />
                Disponible
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          <div className="space-y-2">
            <p className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-(--text-muted)">Principal</p>
            {principalItems.map((item) => (
              <SidebarLink key={item.href} item={item} active={pathname === item.href} />
            ))}
          </div>

          <div className="space-y-2">
            <p className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-(--text-muted)">Gestion</p>
            {managementItems.map((item) => (
              <SidebarLink key={item.href} item={item} active={pathname === item.href} />
            ))}
          </div>

        </nav>

        <div className="space-y-3 border-t border-(--border) p-4">
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="driver-dashboard-card inline-flex h-11 w-full items-center gap-2 rounded-xl border border-(--border) bg-(--bg-card) px-3 text-sm text-(--text-muted) hover:text-(--danger)"
          >
            <SignOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-(--border) bg-(--bg-secondary)/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-6 gap-1">
          {[...principalItems, ...managementItems].map((item) => {
            const Icon = item.icon
            const active = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] ${active ? 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-(--accent)' : 'text-(--text-muted)'}`}
              >
                <Icon size={18} weight={active ? "fill" : "regular"} />
                <span>{item.label.split(' ')[0]}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
