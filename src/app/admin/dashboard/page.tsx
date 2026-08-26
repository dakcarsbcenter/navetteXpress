"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { usePermissions } from "@/hooks/usePermissions"
import { HouseLine, TrendUp, Users as PhosphorUsers, Van, CalendarBlank, Money, Receipt, LockSimple, Star, MapPin, Megaphone, Bell as PhosphorBell, Robot } from '@phosphor-icons/react'
import { AdminSidebar, type AdminTabGroup } from "@/components/admin/AdminSidebar"
import { AdminTopbar } from "@/components/admin/AdminTopbar"

// Composants pour chaque section
import { VehiclesManagementRedesigned } from "@/components/admin/VehiclesManagementRedesigned"
import { BookingsManagementRedesigned } from "@/components/admin/BookingsManagementRedesigned"
import PermissionsManagementRedesigned from "@/components/admin/PermissionsManagementRedesigned"
import ReviewsManagementRedesigned from "@/components/admin/ReviewsManagementRedesigned"
import { QuotesManagementRedesigned } from "@/components/admin/QuotesManagementRedesigned"
import { UsersManagementRedesigned } from "@/components/admin/UsersManagementRedesigned"
import AdminGlobalStats from "@/components/admin/AdminGlobalStats"
import { ModernAdminDashboard } from "@/components/admin/ModernAdminDashboard"
import InvoicesManagementRedesigned from "@/components/admin/InvoicesManagementRedesigned"
import { LocationsManagementRedesigned } from "@/components/admin/LocationsManagementRedesigned"
import PublicitesClient, { type Ad } from "@/components/admin/ads/PublicitesClient"
import { ServicesManager } from "@/components/admin/ServicesManager"
import { AgentAdminPanel } from "@/components/admin/AgentAdminPanel"

type TabType = 'modern' | 'users' | 'vehicles' | 'bookings' | 'quotes' | 'invoices' | 'permissions' | 'reviews' | 'stats' | 'ads' | 'locations' | 'services' | 'agent'

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
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0)
  const [openUserCreateTrigger, setOpenUserCreateTrigger] = useState(0)

  // Récupérer le nombre de réservations en attente
  useEffect(() => {
    const fetchPendingBookingsCount = async () => {
      try {
        const response = await fetch('/api/admin/bookings')
        if (response.ok) {
          const data = await response.json()
          if (data.success && Array.isArray(data.data)) {
            // Compter les réservations avec le statut "pending" (En attente)
            const pendingCount = data.data.filter((booking: { booking?: { status?: string } }) =>
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

  type TabIconType = React.ComponentType<{ size?: number; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"; className?: string }>

  const allTabs: Array<{
    id: TabType;
    label: string;
    shortLabel: string;
    Icon: TabIconType;
    resource?: string;
    always?: boolean;
    adminOnly?: boolean;
    requireManage?: boolean;
  }> = [
    { id: 'modern', label: 'Dashboard', shortLabel: 'Dashboard', Icon: HouseLine, always: true },
    { id: 'stats', label: 'Statistiques', shortLabel: 'Stats', Icon: TrendUp, adminOnly: true },
    { id: 'users', label: 'Utilisateurs', shortLabel: 'Users', Icon: PhosphorUsers, resource: 'users' },
    { id: 'vehicles', label: 'Véhicules', shortLabel: 'Véhicules', Icon: Van, resource: 'vehicles' },
    { id: 'bookings', label: 'Réservations', shortLabel: 'Réserv.', Icon: CalendarBlank, resource: 'bookings' },
    { id: 'quotes', label: 'Devis', shortLabel: 'Devis', Icon: Money, resource: 'quotes' },
    { id: 'invoices', label: 'Factures', shortLabel: 'Factures', Icon: Receipt, always: true },
    { id: 'permissions', label: 'Permissions', shortLabel: 'Perms', Icon: LockSimple, resource: 'users', requireManage: true, adminOnly: true },
    { id: 'reviews', label: 'Avis', shortLabel: 'Avis', Icon: Star, resource: 'reviews' },
    { id: 'locations', label: 'Lieux', shortLabel: 'Lieux', Icon: MapPin, always: true, adminOnly: true },
    { id: 'ads', label: 'Publicités', shortLabel: 'Pubs', Icon: Megaphone, always: true },
    { id: 'services', label: 'Services', shortLabel: 'Services', Icon: PhosphorBell, always: true, adminOnly: true },
    { id: 'agent', label: 'Agent IA', shortLabel: 'Agent IA', Icon: Robot, always: true, adminOnly: true },
  ]

  // Filtrer les onglets selon les permissions
  const tabs = allTabs.filter(tab => {
    // Les onglets toujours visibles (Dashboard)
    if (tab.always) return true

    // Si on charge encore les permissions, montrer tous les onglets pour éviter le flicker
    if (permissionsLoading) return true

    const userRole = (session?.user as { role?: string } | undefined)?.role

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

  const navGroups: AdminTabGroup[] = [
    { label: 'Principal', tabs: tabs.filter(t => ['modern', 'stats', 'bookings'].includes(t.id)) },
    { label: 'Gestion', tabs: tabs.filter(t => ['users', 'vehicles'].includes(t.id)) },
    { label: 'Finance & Admin', tabs: tabs.filter(t => ['quotes', 'invoices', 'ads', 'permissions', 'reviews', 'locations', 'services'].includes(t.id)) },
    { label: 'Assistant IA', tabs: tabs.filter(t => ['agent'].includes(t.id)) },
  ].filter(group => group.tabs.length > 0)

  const renderContent = () => {
    switch (activeTab) {
      case 'modern':
        return <ModernAdminDashboard onNavigate={(section: string) => setActiveTab(section as TabType)} />
      case 'stats':
        return <AdminGlobalStats />
      case 'users':
        return <UsersManagementRedesigned userPermissions={permissions} openCreate={openUserCreateTrigger} />
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
      case 'services':
        return <ServicesManager />
      case 'ads':
        return <AdsManagementWrapper />
      case 'agent':
        return <AgentAdminPanel />
      default:
        return <ModernAdminDashboard onNavigate={(section: string) => setActiveTab(section as TabType)} />
    }
  }

  // Wrapper for Ads Component to fetch data client-side since page.tsx is a client component
  const AdsManagementWrapper = () => {
    const [ads, setAds] = useState<Ad[]>([])
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
            <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-linear-to-r from-gold via-white to-gold animate-pulse"
              style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>
              Navette Xpress
            </div>
          </div>
        </div>
      )
    }

    return <PublicitesClient ads={ads} />
  }

  // Affichage avec sidebar/topbar unifiées (même gabarit que client/chauffeur)
  return (
    <div className="flex h-screen overflow-hidden bg-(--color-dash-bg)" style={{ fontFamily: 'var(--font-body)' }}>
      <AdminSidebar
        groups={navGroups}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabType)}
        pendingBookingsCount={pendingBookingsCount}
        userName={session.user.name}
        userEmail={session.user.email}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopbar
          title={tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
          pendingBookingsCount={pendingBookingsCount}
          onCreateNew={() => {
            if (activeTab === 'users') {
              setOpenUserCreateTrigger(t => t + 1)
            } else {
              setActiveTab('bookings')
            }
          }}
        />

        <main className="flex-1 overflow-y-auto dash-scroll p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}



