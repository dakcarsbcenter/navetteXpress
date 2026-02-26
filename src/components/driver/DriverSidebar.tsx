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
      className="w-[220px] flex flex-col shrink-0 hidden lg:flex h-screen sticky top-0"
      style={{
        backgroundColor: '#060A0D',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}>

      {/* ── LOGO ── */}
      <div className="px-5 py-5 flex items-center gap-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">NX</span>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Navette <span style={{ color: 'var(--color-gold)' }}>Xpress</span>
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Espace chauffeur
          </p>
        </div>
      </div>

      {/* ── PROFIL CHAUFFEUR ── */}
      <div className="px-4 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.08))',
                color: 'var(--color-driver-accent)',
                border: '1px solid rgba(59,130,246,0.2)',
              }}>
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
            <p className="text-sm font-semibold truncate"
              style={{ color: 'var(--color-text-primary)' }}>
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

        <p className="px-3 pb-2 pt-1 text-[10px] tracking-[0.15em] uppercase"
          style={{ color: 'var(--color-text-muted)' }}>
          Navigation
        </p>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group"
            style={{
              backgroundColor: currentView === item.id ? 'var(--color-driver-accent-bg)' : 'transparent',
              color: currentView === item.id ? 'var(--color-driver-accent)' : 'var(--color-dash-nav-text)',
              borderLeft: currentView === item.id ? '2px solid var(--color-driver-accent)' : '2px solid transparent',
            }}
          >
            <span className={`${currentView === item.id ? 'text-blue-500' : 'text-gray-500 group-hover:text-gray-300'}`}>
              {item.icon}
            </span>
            <span className={currentView === item.id ? 'font-medium' : 'group-hover:text-white'}>
              {item.label}
            </span>
            {item.badge && (
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--color-driver-accent)', color: '#fff' }}>
                {item.badge}
              </span>
            )}
          </button>
        ))}

      </nav>

      {/* ── DÉCONNEXION ── */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
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
