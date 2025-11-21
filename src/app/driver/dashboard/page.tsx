"use client"

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePermissions } from '@/hooks/usePermissions'
import { DriverDashboardHome } from "@/components/driver/DriverDashboardHome"
import { DriverPlanning } from "@/components/driver/DriverPlanning"
import { VehicleReport } from "@/components/driver/VehicleReport"
import { DriverStats } from "@/components/driver/DriverStats"
import Link from "next/link"
import { DriverProfile } from "@/components/driver/DriverProfile"
import { DriverAvailabilityManager } from "@/components/driver/DriverAvailabilityManager"
import { DriverAvailabilityCalendar } from "@/components/driver/DriverAvailabilityCalendar"
// import { SimpleDriverTest } from "@/components/driver/SimpleDriverTest"

type ViewType = 'home' | 'planning' | 'availability' | 'vehicle-report' | 'stats' | 'profile'

export default function DriverDashboard() {
  const [currentView, setCurrentView] = useState<ViewType>('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = useSession()
  const { hasPermission, loading: permissionsLoading } = usePermissions()

  const handleNavigation = (view: ViewType) => {
    console.log('Navigation reçue:', view)
    setCurrentView(view)
  }

  const menuItems = [
    { id: 'home' as ViewType, label: 'Dashboard', icon: '🏠' },
    { id: 'planning' as ViewType, label: 'Planning', icon: '📅' },
    { id: 'availability' as ViewType, label: 'Disponibilités', icon: '🕐' },
    { id: 'vehicle-report' as ViewType, label: 'Véhicule', icon: '🔧' },
    { id: 'stats' as ViewType, label: 'Statistiques', icon: '📊' },
    { id: 'profile' as ViewType, label: 'Profil', icon: '👤' },
  ]

  const renderView = () => {
    console.log('Rendering view:', currentView)
    switch (currentView) {
      case 'planning':
        return <DriverPlanning onBack={() => setCurrentView('home')} />
      case 'availability':
        return (
          <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <button
                onClick={() => setCurrentView('home')}
                className="mb-6 flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour
              </button>
              <DriverAvailabilityCalendar />
            </div>
          </div>
        )
      case 'vehicle-report':
        return <VehicleReport onBack={() => setCurrentView('home')} />
      case 'stats':
        return <DriverStats onBack={() => setCurrentView('home')} />
      case 'profile':
        return <DriverProfile onBack={() => setCurrentView('home')} />
      default:
        return <DriverDashboardHome 
          onNavigate={handleNavigation} 
          hasPermission={hasPermission}
          permissionsLoading={permissionsLoading}
        />
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar gauche - Navigation épurée */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-20 xl:w-64 bg-linear-to-b from-blue-900 to-blue-950 dark:from-blue-950 dark:to-black border-r border-blue-700 shadow-2xl z-50 transition-all duration-300">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center xl:justify-start gap-3 p-6 border-b border-blue-700">
          <img 
            src="/logo.svg" 
            alt="NavetteXpress" 
            className="h-10 w-10 shrink-0"
          />
          <span className="hidden xl:block text-white font-bold text-lg">NavetteXpress</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`group w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
                  : 'text-blue-300 hover:text-white hover:bg-blue-800'
              }`}
              title={item.label}
            >
              <span className="text-2xl shrink-0">{item.icon}</span>
              <span className="hidden xl:block font-semibold text-sm">{item.label}</span>
              {currentView === item.id && (
                <div className="hidden xl:block ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-blue-700">
          <div className="hidden xl:block mb-3">
            <div className="px-4 py-3 bg-blue-800 rounded-xl">
              <p className="text-white font-semibold text-sm truncate">{session?.user?.name || 'Chauffeur'}</p>
              <p className="text-blue-300 text-xs truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center justify-center xl:justify-start gap-3 px-4 py-3 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden xl:inline">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-b-2 border-slate-200 dark:border-slate-700 shadow-md">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center">
                <img 
                  src="/logo.svg" 
                  alt="NavetteXpress" 
                  className="h-9 w-auto"
                />
              </Link>
              <span className="px-3 py-1.5 bg-linear-to-r from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-800 dark:text-blue-200 rounded-full text-xs font-bold whitespace-nowrap shadow-sm border border-blue-300 dark:border-blue-700">
                🚗 CHAUFFEUR
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile dropdown */}
        {mobileMenuOpen && (
          <div className="bg-linear-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-t border-slate-200 dark:border-slate-700 shadow-lg">
            <div className="px-4 py-3 space-y-2 max-h-[70vh] overflow-y-auto">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    currentView === item.id
                      ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 lg:ml-20 xl:ml-64 lg:pt-0 pt-16 transition-all duration-300">
        {renderView()}
      </main>
    </div>
  )
}


