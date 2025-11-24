"use client"

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import React from 'react'

type ViewType = 'home' | 'planning' | 'availability' | 'vehicle-report' | 'stats' | 'profile'

interface Props {
  currentView: ViewType
  setCurrentView: (v: ViewType) => void
  pendingBookingsCount?: number
}

export default function DriverSidebar({ currentView, setCurrentView, pendingBookingsCount = 0 }: Props) {
  const menuItems: { id: ViewType; label: string; icon: string; badge?: number | null }[] = [
    { id: 'home', label: 'Tableau de Bord', icon: '🏠', badge: pendingBookingsCount > 0 ? pendingBookingsCount : null },
    { id: 'planning', label: 'Planning', icon: '📅' },
    { id: 'availability', label: 'Disponibilités', icon: '🕐' },
    { id: 'vehicle-report', label: 'Profil & Véhicule', icon: '🚗' },
    { id: 'stats', label: 'Statistiques', icon: '📊' },
    { id: 'profile', label: 'Profil', icon: '👤' },
  ]

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-48 bg-[#3B4BA5] shadow-lg z-50">
      <Link href="/" className="flex items-center justify-center gap-2 px-4 py-6 border-b border-blue-700">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <span className="text-[#3B4BA5] font-bold text-lg">NX</span>
        </div>
      </Link>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`group w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === item.id
                ? 'bg-white text-[#3B4BA5] font-medium'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title={item.label}
          >
            <span className="text-xl shrink-0">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
            {item.badge && (
              <span className="ml-auto w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-blue-700">
        <button
          onClick={async () => {
            await signOut({ callbackUrl: '/', redirect: true })
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-sm">Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
