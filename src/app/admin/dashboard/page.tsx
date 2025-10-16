"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { usePermissions } from "@/hooks/usePermissions"

// Composants pour chaque section
import { VehiclesManagement } from "@/components/admin/VehiclesManagement"
import { ModernBookingsManagement } from "@/components/admin/ModernBookingsManagement"
import { ModernPermissionsManagement } from "@/components/admin/ModernPermissionsManagement"
import { ModernReviewsManagement } from "@/components/admin/ModernReviewsManagement"
import { ModernQuotesManagement } from "@/components/admin/ModernQuotesManagement"
import AdminGlobalStats from "@/components/admin/AdminGlobalStats"
import { ModernAdminDashboard } from "@/components/admin/ModernAdminDashboard"

type TabType = 'modern' | 'vehicles' | 'bookings' | 'quotes' | 'permissions' | 'reviews' | 'stats'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const { permissions, loading: permissionsLoading, canRead, canManage } = usePermissions()
  const [activeTab, setActiveTab] = useState<TabType>('modern')
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

  const allTabs = [
    { id: 'modern' as TabType, label: 'Dashboard', icon: '🏠', resource: '', always: true },
    { id: 'stats' as TabType, label: 'Statistiques Globales', icon: '📈', resource: '', always: true },
    { id: 'vehicles' as TabType, label: 'Véhicules', icon: '🚗', resource: 'vehicles' },
    { id: 'bookings' as TabType, label: 'Réservations', icon: '📅', resource: 'bookings' },
    { id: 'quotes' as TabType, label: 'Devis', icon: '💰', resource: 'quotes' },
    { id: 'permissions' as TabType, label: 'Permissions', icon: '🔐', resource: 'users', requireManage: true },
    { id: 'reviews' as TabType, label: 'Avis', icon: '⭐', resource: 'reviews' },
  ]

  // Filtrer les onglets selon les permissions
  const tabs = allTabs.filter(tab => {
    // Les onglets toujours visibles (Dashboard, Stats)
    if (tab.always) return true
    
    // Si on charge encore les permissions, montrer tous les onglets pour éviter le flicker
    if (permissionsLoading) return true
    
    // Pour les administrateurs, montrer tous les onglets
    if ((session?.user as any)?.role === 'admin') return true
    
    // Pour les autres rôles, vérifier les permissions
    if (tab.resource) {
      if (tab.requireManage) {
        return canManage(tab.resource)
      } else {
        return canRead(tab.resource) || canManage(tab.resource)
      }
    }
    
    return false
  })

  const renderContent = () => {
    switch (activeTab) {
      case 'modern':
        return <ModernAdminDashboard onNavigate={(section: string) => setActiveTab(section as TabType)} />
      case 'stats':
        return <AdminGlobalStats />
      case 'vehicles':
        return <VehiclesManagement />
      case 'bookings':
        return <ModernBookingsManagement />
      case 'quotes':
        return <ModernQuotesManagement />
      case 'permissions':
        return <ModernPermissionsManagement />
      case 'reviews':
        return <ModernReviewsManagement />
      default:
        return <ModernAdminDashboard onNavigate={(section: string) => setActiveTab(section as TabType)} />
    }
  }

  // Si on est sur le dashboard moderne, affichage en plein écran
  if (activeTab === 'modern') {
    return (
      <div className="min-h-screen">
        {/* Header simple pour le dashboard moderne */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <Link href="/" className="text-xl font-bold text-slate-900 dark:text-white">
                  🚗 Navette Xpress
                </Link>
                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-full text-sm font-medium">
                  ADMIN
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Navigation pills compacte */}
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-4">
                  {tabs.slice(0, 6).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title={tab.label}
                    >
                      <span className="text-base">{tab.icon}</span>
                      <span className="ml-1 hidden lg:inline">{tab.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
                
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {session.user.name}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden md:inline">Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard moderne en plein écran */}
        <div className="pt-16">
          {renderContent()}
        </div>
      </div>
    )
  }

  // Affichage traditionnel pour les autres tabs
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
