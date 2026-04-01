"use client"

import { useState, useEffect } from 'react'
import { Bell } from '@phosphor-icons/react'
import { usePathname, useSearchParams } from 'next/navigation'

const tabTitleMap: Record<string, string> = {
  overview: "Vue d'ensemble",
  bookings: 'Mes Réservations',
  quotes: 'Mes Devis',
  invoices: 'Mes Factures',
  'create-reviews': 'Évaluer des trajets',
  reviews: 'Mes Avis',
  profile: 'Mon Profil',
  vehicles: 'Véhicules',
  users: 'Utilisateurs',
}

function ClientTopbarInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [notifCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
    return date.toLocaleDateString('fr-FR', options).toUpperCase()
  }

  const formatDateShort = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }
    return date.toLocaleDateString('fr-FR', options).toUpperCase()
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const currentTab = searchParams?.get('tab')
  const pageTitle = currentTab
    ? (tabTitleMap[currentTab] ?? "Vue d'ensemble")
    : "Vue d'ensemble"

  return (
    <header
      className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b px-3 py-3 backdrop-blur md:px-6 md:py-4"
      style={{
        borderColor: 'var(--color-client-border)',
        backgroundColor: 'color-mix(in srgb, var(--color-client-card) 90%, transparent)',
      }}
    >
      <div>
        <h1
          className="text-xs font-black uppercase tracking-[0.15em] sm:text-sm sm:tracking-[0.2em]"
          style={{ color: 'var(--color-client-text-primary)' }}
        >
          {pageTitle}
        </h1>
        <div
          className="mt-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide sm:text-[11px] sm:tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          <p className="hidden sm:block">{formatDate(currentDateTime)}</p>
          <p className="sm:hidden">{formatDateShort(currentDateTime)}</p>
          <span>—</span>
          <p>{formatTime(currentDateTime)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => {}}
          className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors sm:h-11 sm:w-11"
          style={{
            border: '1px solid var(--color-client-border)',
            backgroundColor: 'var(--color-client-surface)',
            color: 'var(--text-muted)',
          }}
          aria-label="Notifications"
        >
          <Bell
            size={18}
            className="transition-transform group-hover:-rotate-12"
          />
          {notifCount > 0 && (
            <span
              className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--color-client-accent)' }}
            />
          )}
        </button>
      </div>
    </header>
  )
}

export function ClientTopbar() {
  return <ClientTopbarInner />
}
