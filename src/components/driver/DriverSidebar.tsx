"use client"

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import React, { useState } from 'react'
import { Power, SignOut, SquaresFour, Calendar, Clock, Wrench, ChartBar, User } from "@phosphor-icons/react"
import { useDriverView } from '@/context/DriverViewContext'

type ViewType = 'home' | 'planning' | 'availability' | 'vehicle-report' | 'stats' | 'profile'

interface Props {
  currentView?: ViewType
  setCurrentView?: (v: ViewType) => void
  pendingBookingsCount?: number
}

export default function DriverSidebar(props: Props) {
  const { data: session } = useSession()
  const [isOnline, setIsOnline] = useState(true) // Mock state for availability

  // Use context if props are missing
  const context = useDriverView()
  const currentView = props.currentView || context.currentView
  const setCurrentView = props.setCurrentView || context.setCurrentView
  const pendingBookingsCount = props.pendingBookingsCount ?? context.pendingBookingsCount

  const menuItems: { id: ViewType; label: string; icon: React.ReactNode; badge?: number | null }[] = [
    { id: 'home', label: 'Tableau de Bord', icon: <SquaresFour size={18} weight={currentView === 'home' ? "fill" : "regular"} />, badge: pendingBookingsCount > 0 ? pendingBookingsCount : null },
    { id: 'planning', label: 'Planning', icon: <Calendar size={18} weight={currentView === 'planning' ? "fill" : "regular"} /> },
    { id: 'availability', label: 'Disponibilités', icon: <Clock size={18} weight={currentView === 'availability' ? "fill" : "regular"} /> },
    { id: 'vehicle-report', label: 'Rapport Véhicule', icon: <Wrench size={18} weight={currentView === 'vehicle-report' ? "fill" : "regular"} /> },
    { id: 'stats', label: 'Statistiques', icon: <ChartBar size={18} weight={currentView === 'stats' ? "fill" : "regular"} /> },
    { id: 'profile', label: 'Profil', icon: <User size={18} weight={currentView === 'profile' ? "fill" : "regular"} /> },
  ]

  const getInitials = (name?: string | null) => {
    if (!name) return 'CH'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  return (
    <aside
      className="w-[220px] hidden lg:flex flex-col shrink-0 h-screen sticky top-0 bg-gray-900 dark:bg-[#060A0D] border-r border-gray-700 dark:border-white/5">

      {/* ── LOGO ── */}
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-gray-700 dark:border-white/5">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white dark:text-white font-bold text-sm">NX</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Navette <span className="text-amber-500 dark:text-gold">Xpress</span>
          </p>
          <p className="text-[10px] mt-0.5 text-gray-300 dark:text-gray-400">
            Espace chauffeur
          </p>
        </div>
      </div>

      {/* ── PROFIL CHAUFFEUR ── */}
      <div className="px-4 py-5 border-b border-gray-700 dark:border-white/5">

        <div className="flex items-center gap-3 mb-4">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-semibold bg-gradient-to-br from-blue-500/25 to-blue-500/10 text-blue-400 dark:text-blue-400 border border-blue-500/20">
              {getInitials(session?.user?.name)}
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 transition-colors"
              style={{
                backgroundColor: isOnline ? 'var(--color-success)' : '#4B5563',
                borderColor: '#060A0D',
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
              {session?.user?.name || 'Chauffeur'}
            </p>
            <p className="text-[10px]" style={{ color: isOnline ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
              {isOnline ? 'En service' : 'Hors service'}
            </p>
          </div>
        </div>

        {/* Toggle disponibilité */}
        <button
          onClick={() => setIsOnline(!isOnline)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          style={{
            backgroundColor: isOnline ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isOnline ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
            color: isOnline ? 'var(--color-success)' : 'var(--color-text-secondary)',
          }}>
          <span className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${isOnline ? 'avail-online' : ''}`}
              style={{ backgroundColor: isOnline ? 'var(--color-success)' : '#4B5563' }}
            />
            {isOnline ? 'Disponible' : 'Indisponible'}
          </span>
          <Power size={14} weight="bold" />
        </button>

      </div>

      {/* ── NAVIGATION ── */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto dash-scroll">

        <p className="px-3 pb-2 pt-1 text-[10px] tracking-[0.15em] uppercase text-gray-500 dark:text-gray-400">
          Navigation
        </p>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group ${
              currentView === item.id 
                ? 'bg-blue-600/10 dark:bg-driver-accent-bg text-blue-600 dark:text-driver-accent border-l-2 border-blue-600 dark:border-driver-accent' 
                : 'border-l-2 border-transparent text-gray-300 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className={currentView === item.id ? 'text-blue-600 dark:text-blue-500' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-300'}>
              {item.icon}
            </span>
            <span className={currentView === item.id ? 'font-medium' : 'group-hover:text-gray-900 dark:group-hover:text-white'}>
              {item.label}
            </span>
            {item.badge && (
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 dark:bg-driver-accent text-white">
                {item.badge}
              </span>
            )}
          </button>
        ))}

      </nav>

      {/* ── DÉCONNEXION ── */}
      <div className="p-3 border-t border-gray-700 dark:border-white/5">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all text-gray-400 hover:text-red-500 hover:bg-red-500/10"
        >
          <SignOut size={16} weight="bold" />
          Déconnexion
        </button>
      </div>

    </aside>
  )
}
