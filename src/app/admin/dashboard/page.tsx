"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"

// Composants pour chaque section
import { UsersManagement } from "@/components/admin/UsersManagement"
import { VehiclesManagement } from "@/components/admin/VehiclesManagement"
import { BookingsManagement } from "@/components/admin/BookingsManagement"
import { PermissionsManagement } from "@/components/admin/PermissionsManagement"
import { ReviewsManagement } from "@/components/admin/ReviewsManagement"
import { SessionsManagement } from "@/components/admin/SessionsManagement"
import { QuotesManagement } from "@/components/admin/QuotesManagement"
import { AdminStats } from "@/components/admin/AdminStats"

type TabType = 'overview' | 'users' | 'vehicles' | 'bookings' | 'quotes' | 'permissions' | 'reviews' | 'sessions'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      redirect("/auth/signin")
    }
    
    if (session?.user && (session.user as { role?: string }).role !== 'admin') {
      redirect("/dashboard")
    }
    
    setIsLoading(false)
  }, [session, status])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    )
  }

  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Accès refusé. Seuls les administrateurs peuvent accéder à cette page.</div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Vue d\'ensemble', icon: '📊' },
    { id: 'users' as TabType, label: 'Utilisateurs', icon: '👥' },
    { id: 'vehicles' as TabType, label: 'Véhicules', icon: '🚗' },
    { id: 'bookings' as TabType, label: 'Réservations', icon: '📅' },
    { id: 'quotes' as TabType, label: 'Devis', icon: '💰' },
    { id: 'permissions' as TabType, label: 'Permissions', icon: '🔐' },
    { id: 'reviews' as TabType, label: 'Avis', icon: '⭐' },
    { id: 'sessions' as TabType, label: 'Sessions', icon: '🔑' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminStats />
      case 'users':
        return <UsersManagement />
      case 'vehicles':
        return <VehiclesManagement />
      case 'bookings':
        return <BookingsManagement />
      case 'quotes':
        return <QuotesManagement />
      case 'permissions':
        return <PermissionsManagement />
      case 'reviews':
        return <ReviewsManagement />
      case 'sessions':
        return <SessionsManagement />
      default:
        return <AdminStats />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
                🚗 Navette Xpress
              </Link>
              <span className="ml-4 px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-full text-sm font-medium">
                ADMIN
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Connecté en tant que: <strong>{session.user.name || session.user.email}</strong>
              </span>
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Retour au dashboard
              </Link>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
