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
import { ComposedPermissionsMatrix } from "@/components/admin/ComposedPermissionsMatrix"
import { ModernReviewsManagement } from "@/components/admin/ModernReviewsManagement"
import { ModernQuotesManagement } from "@/components/admin/ModernQuotesManagement"
import { ModernUsersManagement } from "@/components/admin/ModernUsersManagement"
import AdminGlobalStats from "@/components/admin/AdminGlobalStats"
import { ModernAdminDashboard } from "@/components/admin/ModernAdminDashboard"

type TabType = 'modern' | 'users' | 'vehicles' | 'bookings' | 'quotes' | 'permissions' | 'reviews' | 'stats'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const { permissions, loading: permissionsLoading, canRead, canManage } = usePermissions()
  const [activeTab, setActiveTab] = useState<TabType>('modern')
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      redirect("/auth/signin")
    }
    
    const userRole = (session?.user as { role?: string })?.role
    if (session?.user && userRole !== 'admin' && userRole !== 'manager') {
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

  const userRole = (session?.user as { role?: string })?.role
  if (!session?.user || (userRole !== 'admin' && userRole !== 'manager')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Accès refusé. Seuls les administrateurs et managers peuvent accéder à cette page.</div>
      </div>
    )
  }

  const allTabs = [
    { id: 'modern' as TabType, label: 'Dashboard', shortLabel: 'Dashboard', icon: '🏠', resource: '', always: true },
    { id: 'stats' as TabType, label: 'Statistiques', shortLabel: 'Stats', icon: '📈', resource: '', adminOnly: true },
    { id: 'users' as TabType, label: 'Utilisateurs', shortLabel: 'Users', icon: '👥', resource: 'users' },
    { id: 'vehicles' as TabType, label: 'Véhicules', shortLabel: 'Véhicules', icon: '🚗', resource: 'vehicles' },
    { id: 'bookings' as TabType, label: 'Réservations', shortLabel: 'Réserv.', icon: '📅', resource: 'bookings' },
    { id: 'quotes' as TabType, label: 'Devis', shortLabel: 'Devis', icon: '💰', resource: 'quotes' },
    { id: 'permissions' as TabType, label: 'Permissions', shortLabel: 'Perms', icon: '🔐', resource: 'users', requireManage: true, adminOnly: true },
    { id: 'reviews' as TabType, label: 'Avis', shortLabel: 'Avis', icon: '⭐', resource: 'reviews' },
  ]

  // Filtrer les onglets selon les permissions
  const tabs = allTabs.filter(tab => {
    // Les onglets toujours visibles (Dashboard)
    if (tab.always) return true
    
    // Si on charge encore les permissions, montrer tous les onglets pour éviter le flicker
    if (permissionsLoading) return true
    
    const userRole = (session?.user as any)?.role
    
    // Les onglets adminOnly sont uniquement pour les admins
    if (tab.adminOnly && userRole !== 'admin') return false
    
    // Pour les administrateurs, montrer tous les onglets
    if (userRole === 'admin') return true
    
    // Pour les managers et autres rôles, vérifier les permissions dynamiques
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
      case 'users':
        return <ModernUsersManagement userPermissions={permissions} />
      case 'vehicles':
        return <VehiclesManagement />
      case 'bookings':
        return <ModernBookingsManagement />
      case 'quotes':
        return <ModernQuotesManagement />
      case 'permissions':
        return <ComposedPermissionsMatrix />
      case 'reviews':
        return <ModernReviewsManagement />
      default:
        return <ModernAdminDashboard onNavigate={(section: string) => setActiveTab(section as TabType)} />
    }
  }

  // Si on est sur le dashboard moderne, affichage avec sidebar
  if (activeTab === 'modern') {
    return (
      <div className="min-h-screen flex">
        {/* Sidebar gauche - Navigation épurée */}
        <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-20 xl:w-64 bg-gradient-to-b from-slate-900 to-slate-950 dark:from-slate-950 dark:to-black border-r border-slate-700 shadow-2xl z-50 transition-all duration-300">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center xl:justify-start gap-3 p-6 border-b border-slate-700">
            <img 
              src="/logo.svg" 
              alt="NavetteXpress" 
              className="h-10 w-10 flex-shrink-0"
            />
            <span className="hidden xl:block text-white font-bold text-lg">NavetteXpress</span>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={tab.label}
              >
                <span className="text-2xl flex-shrink-0">{tab.icon}</span>
                <span className="hidden xl:block font-semibold text-sm">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="hidden xl:block ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-700">
            <div className="hidden xl:block mb-3">
              <div className="px-4 py-3 bg-slate-800 rounded-xl">
                <p className="text-white font-semibold text-sm truncate">{session.user.name}</p>
                <p className="text-slate-400 text-xs truncate">{session.user.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center justify-center xl:justify-start gap-3 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <span className="px-3 py-1.5 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 text-red-800 dark:text-red-200 rounded-full text-xs font-bold whitespace-nowrap shadow-sm border border-red-300 dark:border-red-700">
                  👑 ADMIN
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
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md"
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
            <div className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-t border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="px-4 py-3 space-y-2 max-h-[70vh] overflow-y-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span className="flex-1 text-left">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Main content */}
        <main className="flex-1 lg:ml-20 xl:ml-64 lg:pt-0 pt-16 transition-all duration-300">
          {renderContent()}
        </main>
      </div>
    )
  }

  // Affichage traditionnel pour les autres tabs
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b-2 border-gray-200 dark:border-gray-700">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-16 lg:h-18">
            <div className="flex items-center gap-3 lg:gap-5">
              <Link href="/" className="flex items-center hover:scale-105 transition-transform">
                <img 
                  src="/logo.svg" 
                  alt="NavetteXpress" 
                  className="h-9 lg:h-11 w-auto"
                />
              </Link>
              <span className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 text-red-800 dark:text-red-200 rounded-full text-xs lg:text-sm font-bold shadow-sm border border-red-300 dark:border-red-700">
                👑 ADMIN
              </span>
            </div>
            
            <div className="flex items-center gap-3 lg:gap-4">
              <span className="hidden lg:block text-sm text-gray-600 dark:text-gray-400 truncate max-w-[180px] px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <strong>{session.user.name || session.user.email}</strong>
              </span>
              <Link
                href="/dashboard"
                className="hidden md:flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold text-sm px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden lg:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Navigation Tabs - Desktop optimisé avec plus d'espace */}
        <div className="mb-6 sm:mb-10 hidden sm:block">
          <nav className="flex flex-wrap gap-3 bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-lg border-2 border-slate-100 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl scale-[1.02]'
                    : 'bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 hover:from-slate-100 hover:to-slate-200 dark:hover:from-gray-600 dark:hover:to-gray-700 hover:shadow-lg hover:scale-[1.02] border border-slate-200 dark:border-gray-600'
                }`}
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Navigation Tabs - Mobile optimisé */}
        <div className="mb-4 sm:hidden">
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabType)}
              className="w-full pl-12 pr-4 py-3.5 bg-gradient-to-r from-white to-slate-50 dark:from-gray-800 dark:to-gray-900 border-2 border-slate-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.icon} {tab.label}
                </option>
              ))}
            </select>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
              {tabs.find(t => t.id === activeTab)?.icon}
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
