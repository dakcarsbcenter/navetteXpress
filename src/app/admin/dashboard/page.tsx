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

  // Affichage avec sidebar pour toutes les vues
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
