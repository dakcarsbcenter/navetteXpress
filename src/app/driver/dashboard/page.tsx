"use client"

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { DriverDashboardHome } from "@/components/driver/DriverDashboardHome"
import { DriverPlanning } from "@/components/driver/DriverPlanning"
import { VehicleReport } from "@/components/driver/VehicleReport"
import { DriverStats } from "@/components/driver/DriverStats"
import Link from "next/link"
import { SimpleDriverTest } from "@/components/driver/SimpleDriverTest"

type ViewType = 'home' | 'planning' | 'vehicle-report' | 'stats'

export default function DriverDashboard() {
  const [currentView, setCurrentView] = useState<ViewType>('home')
  const { data: session } = useSession()

  const handleNavigation = (view: ViewType) => {
    console.log('Navigation reçue:', view)
    setCurrentView(view)
  }

  const renderView = () => {
    console.log('Rendering view:', currentView)
    switch (currentView) {
      case 'planning':
        return <DriverPlanning onBack={() => {
          console.log('Retour vers home depuis planning')
          setCurrentView('home')
        }} />
      case 'vehicle-report':
        return <VehicleReport onBack={() => {
          console.log('Retour vers home depuis vehicle-report')
          setCurrentView('home')
        }} />
      case 'stats':
        return <DriverStats onBack={() => {
          console.log('Retour vers home depuis stats')
          setCurrentView('home')
        }} />
      default:
        return <DriverDashboardHome onNavigate={handleNavigation} />
    }
  }

  // Version de test simple - décommenter pour tester
  // return <SimpleDriverTest />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header avec bouton déconnexion */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
                🚗 Navette Xpress
              </Link>
              <span className="ml-4 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                CHAUFFEUR
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Connecté en tant que: <strong>{session?.user?.name || session?.user?.email}</strong>
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        {/* Debug indicator */}
        <div className="fixed top-20 right-4 bg-black text-white px-3 py-1 rounded-full text-xs z-50">
          Vue active: {currentView}
        </div>
        {renderView()}
      </div>
    </div>
  )
}
