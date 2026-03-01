"use client"

import { useState, useEffect } from 'react'
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
import DriverSidebar from '@/components/driver/DriverSidebar'
import { CaretLeft } from "@phosphor-icons/react"
// import { SimpleDriverTest } from "@/components/driver/SimpleDriverTest"

import { useDriverView } from '@/context/DriverViewContext'

type ViewType = 'home' | 'planning' | 'availability' | 'vehicle-report' | 'stats' | 'profile'

export default function DriverDashboard() {
  const { currentView, setCurrentView, setPendingBookingsCount } = useDriverView()
  const { data: session } = useSession()
  const { hasPermission, loading: permissionsLoading } = usePermissions()

  // Récupérer le nombre de réservations en attente et l'envoyer au contexte
  useEffect(() => {
    const fetchPendingBookingsCount = async () => {
      try {
        const response = await fetch('/api/driver/bookings')
        if (response.ok) {
          const data = await response.json()
          if (data.success && Array.isArray(data.data)) {
            const pendingCount = data.data.filter((item: any) =>
              item.booking?.status === 'pending' || item.status === 'assigned'
            ).length
            setPendingBookingsCount(pendingCount)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des réservations:', error)
      }
    }

    if (session?.user) {
      fetchPendingBookingsCount()
    }
  }, [session, setPendingBookingsCount])

  const handleNavigation = (view: ViewType) => {
    console.log('Navigation reçue:', view)
    setCurrentView(view)
  }

  const renderView = () => {
    console.log('Rendering view:', currentView)
    switch (currentView) {
      case 'planning':
        return <DriverPlanning onBack={() => setCurrentView('home')} />
      case 'availability':
        return (
          <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <button
                onClick={() => setCurrentView('home')}
                className="mb-8 flex items-center gap-2 px-6 py-3 bg-driver-card border border-driver-border text-white rounded-2xl hover:bg-white/5 transition-all shadow-xl"
              >
                <CaretLeft size={20} weight="bold" />
                Retour au Tableau de Bord
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
    <div className="animate-fadeIn">
      {renderView()}
    </div>
  )
}


