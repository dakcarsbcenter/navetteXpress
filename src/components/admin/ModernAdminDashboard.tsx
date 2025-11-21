"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

// Types pour les statistiques
interface AdminStats {
  totalUsers: number
  totalDrivers: number
  totalClients: number
  totalBookings: number
  pendingBookings: number
  completedBookings: number
  totalRevenue: number
  activeVehicles: number
  monthlyGrowth?: {
    users?: number
    bookings?: number
    revenue?: number
  }
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  color: string
  bgColor: string
  onClick: () => void
  adminOnly?: boolean
}

interface ModernAdminDashboardProps {
  onNavigate: (section: string) => void
}

export function ModernAdminDashboard({ onNavigate }: ModernAdminDashboardProps) {
  const { data: session } = useSession()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDrivers: 0,
    totalClients: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    activeVehicles: 0,
    monthlyGrowth: {
      users: 0,
      bookings: 0,
      revenue: 0
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Mise à jour de l'heure en temps réel
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Chargement des statistiques
  useEffect(() => {
    const fetchStats = async () => {
      const defaultStats = {
        totalUsers: 0,
        totalDrivers: 0,
        totalClients: 0,
        totalBookings: 0,
        pendingBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        activeVehicles: 0,
        monthlyGrowth: {
          users: 0,
          bookings: 0,
          revenue: 0
        }
      }
      
      try {
        setIsLoading(true)
        const response = await fetch('/api/admin/overview')
        if (response.ok) {
          const data = await response.json()
          console.log('📊 Données reçues de l\'API:', data)
          // Fusionner les données de l'API avec les valeurs par défaut
          const apiData = data.data || {}
          const newStats = {
            ...defaultStats,
            ...apiData,
            monthlyGrowth: {
              users: apiData.monthlyGrowth?.users ?? 0,
              bookings: apiData.monthlyGrowth?.bookings ?? 0,
              revenue: apiData.monthlyGrowth?.revenue ?? 0
            }
          }
          console.log('📊 Stats finales:', newStats)
          setStats(newStats)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const userRole = (session?.user as { role?: string })?.role
    // Seuls les admins peuvent charger les statistiques
    if (session?.user && userRole === 'admin') {
      fetchStats()
    } else {
      setIsLoading(false)
    }
  }, [session])

  const userRole = (session?.user as { role?: string })?.role
  const isAdmin = userRole === 'admin'

  // Actions rapides avec style moderne
  const allQuickActions: QuickAction[] = [
    {
      id: 'users',
      title: 'Gestion Utilisateurs',
      description: 'Gérer les comptes et rôles',
      icon: '👥',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/50',
      onClick: () => onNavigate('users')
    },
    {
      id: 'vehicles',
      title: 'Flotte Véhicules',
      description: 'Gérer la flotte et maintenance',
      icon: '🚗',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/50',
      onClick: () => onNavigate('vehicles')
    },
    {
      id: 'bookings',
      title: 'Réservations',
      description: 'Suivre les courses en temps réel',
      icon: '📅',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/50',
      onClick: () => onNavigate('bookings')
    },
    {
      id: 'stats',
      title: 'Analytics',
      description: 'Statistiques et performances',
      icon: '📊',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/50',
      onClick: () => onNavigate('stats'),
      adminOnly: true
    },
    {
      id: 'permissions',
      title: 'Permissions',
      description: 'Contrôle d\'accès et sécurité',
      icon: '🔐',
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/50',
      onClick: () => onNavigate('permissions'),
      adminOnly: true
    },
    {
      id: 'reviews',
      title: 'Avis Clients',
      description: 'Modération et satisfaction',
      icon: '⭐',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
      onClick: () => onNavigate('reviews')
    }
  ]

  // Filtrer les actions selon le rôle
  const quickActions = allQuickActions.filter(action => !action.adminOnly || isAdmin)

  const formatGrowth = (value: number | undefined) => {
    if (value === undefined || value === null) return '0%'
    return value > 0 ? `+${value}%` : `${value}%`
  }

  const getGrowthColor = (value: number | undefined) => {
    if (value === undefined || value === null) return 'text-gray-600'
    return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        
        {/* Header simple */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Vue d'ensemble
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {currentTime.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })} - {currentTime.toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenus Totaux */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#A73B3C] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Revenus Totaux</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : `${(stats?.totalRevenue || 0).toLocaleString()} F`}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              {formatGrowth(stats?.monthlyGrowth?.revenue)} ce mois
            </p>
          </div>

          {/* Réservations */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#E5C16C] flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Réservations</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : (stats?.totalBookings || 0).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              {formatGrowth(stats?.monthlyGrowth?.bookings)} ce mois
            </p>
          </div>

          {/* Utilisateurs */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Utilisateurs</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : (stats?.totalUsers || 0).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              {formatGrowth(stats?.monthlyGrowth?.users)} ce mois
            </p>
          </div>

          {/* Flotte Active */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Flotte Active</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : stats?.activeVehicles || 0}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              {stats?.totalDrivers || 0} chauffeurs actifs
            </p>
          </div>
        </div>

        {/* Performances et Statut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performances du Mois */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Performances du Mois
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-2">
                  {(((stats?.completedBookings || 0) / Math.max(stats?.totalBookings || 0, 1)) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Taux de réussite</div>
                <div className="mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(((stats?.completedBookings || 0) / Math.max(stats?.totalBookings || 0, 1)) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#A73B3C] mb-2">
                  {stats?.totalClients || 0}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Clients actifs</div>
                <div className="mt-3 flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-slate-300 dark:text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#E5C16C] mb-2">4.8</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Note moyenne</div>
                <div className="mt-3 flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < 4 ? 'text-[#E5C16C]' : 'text-slate-300 dark:text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Statut Système */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Statut Système
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">Réservations en attente</span>
                <span className="font-bold text-lg text-[#E5C16C]">{stats?.pendingBookings || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">Courses terminées</span>
                <span className="font-bold text-lg text-emerald-600">{stats?.completedBookings || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Chauffeurs actifs</span>
                <span className="font-bold text-lg text-[#A73B3C]">{stats?.totalDrivers || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Rapides */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Actions Rapides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Gestion des Utilisateurs */}
            <button
              onClick={() => onNavigate('users')}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-[#A73B3C] transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-lg bg-[#A73B3C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Gestion des Utilisateurs
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Gérer les comptes utilisateurs
              </p>
            </button>

            {/* Flotte & Véhicules */}
            <button
              onClick={() => onNavigate('vehicles')}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-[#E5C16C] transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-lg bg-[#E5C16C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Flotte & Véhicules
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Gérer les véhicules
              </p>
            </button>

            {/* Réservations */}
            <button
              onClick={() => onNavigate('bookings')}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-500 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Réservations
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Voir toutes les réservations
              </p>
            </button>

            {/* Statistiques */}
            <button
              onClick={() => onNavigate('stats')}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-emerald-500 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-lg bg-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Statistiques
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Analyses et rapports
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
