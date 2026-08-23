"use client"

import { BellSimple, Plus } from '@phosphor-icons/react'

interface AdminTopbarProps {
  title: string
  pendingBookingsCount: number
  onCreateNew: () => void
}

export function AdminTopbar({ title, pendingBookingsCount, onCreateNew }: AdminTopbarProps) {
  return (
    <header className="flex items-center justify-between px-6 lg:px-8 py-4 shrink-0 mt-16 lg:mt-0 bg-(--color-dash-bg) border-b border-(--color-dash-sidebar-border)">
      <div>
        <h1 className="text-xl font-semibold text-(--color-text-primary)" style={{ fontFamily: 'var(--font-body)' }}>
          {title}
        </h1>
        <p className="text-xs mt-0.5 text-(--color-text-muted)">Navette Xpress Admin</p>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors border border-(--color-dash-sidebar-border) text-(--color-text-secondary) hover:text-(--color-text-primary)">
          <BellSimple size={16} />
          {pendingBookingsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-(--color-gold) text-white">
              {pendingBookingsCount > 9 ? '9+' : pendingBookingsCount}
            </span>
          )}
        </button>

        <button onClick={onCreateNew} className="btn-gold flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
          <Plus size={16} />
          <span className="hidden sm:inline">Nouveau</span>
        </button>
      </div>
    </header>
  )
}
