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
import { LocationsManagementRedesigned } from "@/components/admin/LocationsManagementRedesigned"
import PublicitesClient from "@/components/admin/ads/PublicitesClient"

type TabType = 'modern' | 'users' | 'vehicles' | 'bookings' | 'quotes' | 'invoices' | 'permissions' | 'reviews' | 'stats' | 'ads' | 'locations'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const { permissions, loading: permissionsLoading, canRead, canManage } = usePermissions()
  const [activeTab, setActiveTab] = useState<TabType>('modern')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab) {
        setActiveTab(tab as TabType);
        window.history.replaceState({}, '', '/admin/dashboard');
      }
    }
  }, []);
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
    { id: 'locations' as TabType, label: 'Lieux', shortLabel: 'Lieux', icon: '📍', resource: '', always: true, adminOnly: true },
    { id: 'ads' as TabType, label: 'Publicités', shortLabel: 'Pubs', icon: '📢', resource: '', always: true },
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
      case 'locations':
        return <LocationsManagementRedesigned />
      case 'ads':
        return <AdsManagementWrapper />
      default:
        return <ModernAdminDashboard onNavigate={(section: string) => setActiveTab(section as TabType)} />
    }
  }

  // Wrapper for Ads Component to fetch data client-side since page.tsx is a client component
  const AdsManagementWrapper = () => {
    const [ads, setAds] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      const fetchAds = async () => {
        try {
          const res = await fetch('/api/ads/all')
          if (res.ok) {
            const data = await res.json()
            setAds(data)
          }
        } catch (error) {
          console.error('Error fetching ads:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchAds()
    }, [])

    if (loading) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-4">
  <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-pulse"
       style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>
    Navette Xpress
  </div>
</div>
        </div>
      )
    }

    return <PublicitesClient ads={ads} />
  }

  // Affichage avec sidebar redessinée "Command Center"
  return (
    <div className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--color-dash-bg)', fontFamily: 'var(--font-body)' }}>

      {/* SIDEBAR */}
      <aside
        className="hidden lg:flex w-[260px] flex-col shrink-0 overflow-y-auto dash-scroll"
        style={{
          backgroundColor: 'var(--color-dash-sidebar)',
          borderRight: '1px solid var(--color-dash-sidebar-border)',
        }}>

        {/* ── LOGO ── */}
        <div className="px-6 py-5 flex items-center gap-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-8 h-8 bg-gold rounded flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--color-gold)' }}>
            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold"
              style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}>
              Navette <span>Xpress</span>
            </p>
            {/* Indicateur système opérationnel */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="status-pulse w-1.5 h-1.5 rounded-full block"
                style={{ backgroundColor: '#10B981' }} />
              <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                Système opérationnel
              </span>
            </div>
          </div>
        </div>

        {/* ── NAVIGATION ── */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 mb-2 text-[10px] tracking-[0.15em] uppercase font-bold"
            style={{ color: 'var(--color-text-muted)' }}>
            Principal
          </p>

          {tabs.filter(t => ['modern', 'stats', 'bookings'].includes(t.id)).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative"
              style={activeTab === tab.id ? {
                backgroundColor: 'var(--color-dash-nav-active-bg)',
                color: 'var(--color-dash-nav-active-text)',
                borderLeft: '2px solid var(--color-dash-nav-active-border)',
                borderRadius: '0 12px 12px 0'
              } : {
                color: 'var(--color-dash-nav-text)'
              }}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'bookings' && pendingBookingsCount > 0 && (
                <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-gold)', color: '#000' }}>
                  {pendingBookingsCount}
                </span>
              )}
            </button>
          ))}

          <p className="px-3 pt-4 pb-2 text-[10px] tracking-[0.15em] uppercase font-bold"
            style={{ color: 'var(--color-text-muted)' }}>
            Gestion
          </p>
          {tabs.filter(t => ['users', 'vehicles'].includes(t.id)).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative"
              style={activeTab === tab.id ? {
                backgroundColor: 'var(--color-dash-nav-active-bg)',
                color: 'var(--color-dash-nav-active-text)',
                borderLeft: '2px solid var(--color-dash-nav-active-border)',
                borderRadius: '0 12px 12px 0'
              } : {
                color: 'var(--color-dash-nav-text)'
              }}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}

          <p className="px-3 pt-4 pb-2 text-[10px] tracking-[0.15em] uppercase font-bold"
            style={{ color: 'var(--color-text-muted)' }}>
            Finance & Admin
          </p>
          {tabs.filter(t => ['quotes', 'invoices', 'ads', 'permissions', 'reviews', 'locations'].includes(t.id)).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative"
              style={activeTab === tab.id ? {
                backgroundColor: 'var(--color-dash-nav-active-bg)',
                color: 'var(--color-dash-nav-active-text)',
                borderLeft: '2px solid var(--color-dash-nav-active-border)',
                borderRadius: '0 12px 12px 0'
              } : {
                color: 'var(--color-dash-nav-text)'
              }}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* ── PROFIL UTILISATEUR ── */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: 'var(--color-gold)' }}>
              {session.user.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate"
                style={{ color: 'var(--color-text-primary)' }}>
                {session.user.name || 'Administrateur'}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                {session.user.email}
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              await signOut({ callbackUrl: '/', redirect: true })
            }}
            className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-xs transition-all duration-150 hover:bg-red-500/10 hover:text-red-500"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ZONE CONTENU */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOPBAR */}
        <header className="flex items-center justify-between px-6 lg:px-8 py-4 shrink-0"
          style={{
            backgroundColor: 'var(--color-dash-bg)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
          <div>
            <h1 className="text-xl font-semibold"
              style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}>
              {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Navette Xpress Admin
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'var(--color-text-secondary)',
              }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {pendingBookingsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-gold)', color: '#000' }}>
                  {pendingBookingsCount > 9 ? '9+' : pendingBookingsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className="btn-gold flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden sm:inline">Nouveau</span>
            </button>
          </div>
        </header>

        {/* CONTENU SCROLLABLE */}
        <main className="flex-1 overflow-y-auto dash-scroll p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>

      {/* MOBILE OVERLAY (Simplified for now) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#09090F] border-b border-white/5 p-4 flex justify-between items-center h-16">
        <div className="flex items-center gap-2">
          <span>Navette</span> <span>Xpress</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-black/80 flex justify-end">
          <div className="w-64 bg-[#09090F] h-full p-6">
            <button onClick={() => setMobileMenuOpen(false)} className="text-white mb-8">Fermer</button>
            <div className="space-y-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                  className="w-full text-left text-white py-2 flex items-center gap-3"
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



