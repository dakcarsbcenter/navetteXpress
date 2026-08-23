"use client"

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { SignOut, List, X } from '@phosphor-icons/react'

export type AdminTabIcon = React.ComponentType<{ size?: number; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"; className?: string }>

export interface AdminTab {
  id: string
  label: string
  Icon: AdminTabIcon
}

export interface AdminTabGroup {
  label: string
  tabs: AdminTab[]
}

interface AdminSidebarProps {
  groups: AdminTabGroup[]
  activeTab: string
  onTabChange: (id: string) => void
  pendingBookingsCount: number
  userName?: string | null
  userEmail?: string | null
}

function NavButton({ tab, active, onClick, badge }: { tab: AdminTab; active: boolean; onClick: () => void; badge?: number }) {
  const Icon = tab.Icon
  return (
    <button
      onClick={onClick}
      className={
        active
          ? 'w-full flex items-center gap-3 px-3 py-2.5 rounded-r-xl text-sm font-medium border-l-2 border-(--color-dash-nav-active-border) bg-(--color-dash-nav-active-bg) text-(--color-dash-nav-active-text)'
          : 'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-(--color-dash-nav-text) transition-colors hover:bg-[color-mix(in_srgb,var(--color-dash-nav-active-bg)_50%,transparent)]'
      }
    >
      <Icon size={16} weight={active ? 'fill' : 'regular'} />
      <span>{tab.label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-(--color-gold) text-white">
          {badge}
        </span>
      )}
    </button>
  )
}

export function AdminSidebar({ groups, activeTab, onTabChange, pendingBookingsCount, userName, userEmail }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const initials = userName?.charAt(0).toUpperCase() || 'A'

  const body = (onLinkClick?: () => void) => (
    <>
      <div className="px-6 py-5 flex items-center gap-3 border-b border-(--color-dash-sidebar-border)">
        <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 bg-(--color-accent)">
          <span className="text-white font-bold text-sm">NX</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-(--color-text-primary)">
            Navette <span className="text-(--color-accent)">Xpress</span>
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full block bg-(--color-success)" />
            <span className="text-[10px] text-(--color-text-muted)">Système opérationnel</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto dash-scroll">
        {groups.map(group => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-[10px] tracking-[0.15em] uppercase font-bold text-(--color-text-muted)">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.tabs.map(tab => (
                <NavButton
                  key={tab.id}
                  tab={tab}
                  active={activeTab === tab.id}
                  onClick={() => { onTabChange(tab.id); onLinkClick?.() }}
                  badge={tab.id === 'bookings' ? pendingBookingsCount : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-(--color-dash-sidebar-border)">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[color-mix(in_srgb,var(--color-dash-card)_60%,transparent)]">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 bg-(--color-gold-subtle) text-(--color-gold)">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-(--color-text-primary)">{userName || 'Administrateur'}</p>
            <p className="text-[10px] truncate text-(--color-text-muted)">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/', redirect: true })}
          className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-xs transition-colors text-(--color-text-muted) hover:bg-red-500/10 hover:text-red-500"
        >
          <SignOut size={14} />
          Déconnexion
        </button>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden lg:flex w-[260px] flex-col shrink-0 overflow-hidden bg-(--color-dash-sidebar)">
        {body()}
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 px-4 flex items-center justify-between bg-(--color-dash-sidebar) border-b border-(--color-dash-sidebar-border)">
        <p className="text-sm font-semibold text-(--color-text-primary)">
          Navette <span className="text-(--color-accent)">Xpress</span>
        </p>
        <button onClick={() => setMobileOpen(true)} className="text-(--color-text-primary)" aria-label="Ouvrir le menu">
          <List size={22} />
        </button>
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-60 bg-black/60 flex justify-end">
          <div className="w-72 h-full flex flex-col bg-(--color-dash-sidebar)">
            <div className="flex justify-end p-4">
              <button onClick={() => setMobileOpen(false)} className="text-(--color-text-muted)" aria-label="Fermer le menu">
                <X size={20} />
              </button>
            </div>
            {body(() => setMobileOpen(false))}
          </div>
        </div>
      )}
    </>
  )
}
