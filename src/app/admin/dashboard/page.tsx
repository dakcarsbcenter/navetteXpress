"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { usePermissions } from "@/hooks/usePermissions"

// Composants pour chaque section
import { VehiclesManagementRedesigned } from "@/components/admin/VehiclesManagementRedesigned"
import { BookingsManagementRedesigned } from "@/components/admin/BookingsManagementRedesigned"
import { ModernPermissionsManagement } from "@/components/admin/ModernPermissionsManagement"
import PermissionsManagementRedesigned from "@/components/admin/PermissionsManagementRedesigned"
import ReviewsManagementRedesigned from "@/components/admin/ReviewsManagementRedesigned"
import { QuotesManagementRedesigned } from "@/components/admin/QuotesManagementRedesigned"
import { UsersManagementRedesigned } from "@/components/admin/UsersManagementRedesigned"
import AdminGlobalStats from "@/components/admin/AdminGlobalStats"
import { ModernAdminDashboard } from "@/components/admin/ModernAdminDashboard"
import InvoicesManagementRedesigned from "@/components/admin/InvoicesManagementRedesigned"

type TabType = 'modern' | 'users' | 'vehicles' | 'bookings' | 'quotes' | 'invoices' | 'permissions' | 'reviews' | 'stats'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const { permissions, loading: permissionsLoading, canRead, canManage } = usePermissions()
  const [activeTab, setActiveTab] = useState<TabType>('modern')
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0)

  // Récupérer le nombre de réservations en attente
  useEffect(() => {
    const fetchPendingBookingsCount = async () => {
      try {
        const response = await fetch('/api/admin/bookings')
        if (response.ok) {
          const data = await response.json()
          if (data.success && Array.isArray(data.data)) {
            // Compter les réservations avec le statut "pending" (En attente)
            const pendingCount = data.data.filter((booking: any) => 
              booking.booking?.status === 'pending'
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
  }, [session])

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
    { id: 'invoices' as TabType, label: 'Factures', shortLabel: 'Factures', icon: '🧾', resource: '', always: true },
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
        return <UsersManagementRedesigned userPermissions={permissions} />
      case 'vehicles':
        return <VehiclesManagementRedesigned />
      case 'bookings':
        return <BookingsManagementRedesigned />
      case 'quotes':
        return <QuotesManagementRedesigned />
      case 'invoices':
        return <InvoicesManagementRedesigned />
      case 'permissions':
        return <PermissionsManagementRedesigned />
      case 'reviews':
        return <ReviewsManagementRedesigned />
      default:
        return <ModernAdminDashboard onNavigate={(section: string) => setActiveTab(section as TabType)} />
    }
  }

  // Affichage avec sidebar pour toutes les vues
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Sidebar gauche - Style NavetteHub */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-[#1A1A1A] border-r border-slate-800 shadow-2xl z-50">
        {/* Logo avec badge rouge */}
        <div className="p-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#A73B3C] rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-white font-bold text-lg">Navette</span>
                <span className="text-[#A73B3C] font-bold text-lg">Hub</span>
              </div>
            </div>
          </Link>
          
          {/* Badge système opérationnel */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Système opérationnel</span>
          </div>
        </div>

        {/* Navigation avec sections */}
        <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
          {/* Section PRINCIPAL */}
          <div>
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PRINCIPAL</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('modern')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeTab === 'modern'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm font-medium">Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeTab === 'stats'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-medium">Statistiques</span>
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeTab === 'bookings'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Réservations</span>
                {canRead('bookings') && pendingBookingsCount > 0 && (
                  <span className="ml-auto w-6 h-6 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {pendingBookingsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Section GESTION */}
          <div>
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GESTION</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeTab === 'users'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-sm font-medium">Utilisateurs</span>
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeTab === 'vehicles'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
                </svg>
                <span className="text-sm font-medium">Flotte & Véhicules</span>
              </button>
            </div>
          </div>

          {/* Section FINANCE & ADMIN */}
          <div>
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">FINANCE & ADMIN</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('quotes')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeTab === 'quotes'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium">Devis</span>
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeTab === 'invoices'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Factures</span>
              </button>
              <button
                onClick={() => setActiveTab('permissions')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeTab === 'permissions'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm font-medium">Permissions</span>
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeTab === 'reviews'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="text-sm font-medium">Avis Clients</span>
              </button>
            </div>
          </div>
        </nav>

        {/* User section avec avatar rond */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-slate-800 rounded-lg">
            <div className="w-10 h-10 bg-[#A73B3C] rounded-full flex items-center justify-center text-white font-bold shrink-0">
              {session.user.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">Admin Hub</p>
              <p className="text-slate-400 text-xs truncate">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1A1A1A] border-b border-slate-800 shadow-lg">
        <div className="px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#A73B3C] rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
                </svg>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-white font-bold text-base">Navette</span>
                <span className="text-[#A73B3C] font-bold text-base">Hub</span>
              </div>
              <span className="px-2 py-0.5 bg-[#A73B3C]/20 text-[#A73B3C] rounded text-xs font-bold">
                ADMIN
              </span>
            </div>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menu mobile dropdown */}
        {mobileMenuOpen && (
          <div className="bg-[#1A1A1A] border-t border-slate-800">
            <div className="px-3 py-3 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {/* Section PRINCIPAL */}
              <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase">Principal</div>
              <button
                onClick={() => {
                  setActiveTab('modern')
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'modern'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('stats')
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'stats'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Statistiques</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('bookings')
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'bookings'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Réservations</span>
                {pendingBookingsCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {pendingBookingsCount}
                  </span>
                )}
              </button>

              {/* Section GESTION */}
              <div className="px-2 py-2 pt-4 text-xs font-semibold text-slate-500 uppercase">Gestion</div>
              <button
                onClick={() => {
                  setActiveTab('users')
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'users'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Utilisateurs</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('vehicles')
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'vehicles'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
                </svg>
                <span>Flotte & Véhicules</span>
              </button>

              {/* Section FINANCE & ADMIN */}
              <div className="px-2 py-2 pt-4 text-xs font-semibold text-slate-500 uppercase">Finance & Admin</div>
              <button
                onClick={() => {
                  setActiveTab('quotes')
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'quotes'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Devis</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('invoices')
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'invoices'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span>Factures</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('permissions')
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'permissions'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Permissions</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('reviews')
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'reviews'
                    ? 'bg-[#A73B3C] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span>Avis Clients</span>
              </button>

              {/* User section */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-lg mb-2">
                  <div className="w-9 h-9 bg-[#A73B3C] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {session.user.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">Admin Hub</p>
                    <p className="text-slate-400 text-xs truncate">{session.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 lg:pt-0 pt-16 transition-all duration-300 bg-slate-50 dark:bg-slate-900">
        {renderContent()}
      </main>
    </div>
  )
}


