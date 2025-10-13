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

    if (session?.user && (session.user as { role?: string }).role === 'admin') {
      fetchStats()
    }
  }, [session])

  // Actions rapides avec style moderne
  const quickActions: QuickAction[] = [
    {
      id: 'users',
      title: 'Gestion Utilisateurs',
      description: 'Gérer les comptes et rôles',
      icon: '👥',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/50',
      onClick: () => onNavigate('permissions')
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
      onClick: () => onNavigate('stats')
    },
    {
      id: 'permissions',
      title: 'Permissions',
      description: 'Contrôle d\'accès et sécurité',
      icon: '🔐',
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/50',
      onClick: () => onNavigate('permissions')
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

  const formatGrowth = (value: number | undefined) => {
    if (value === undefined || value === null) return '0%'
    return value > 0 ? `+${value}%` : `${value}%`
  }

  const getGrowthColor = (value: number | undefined) => {
    if (value === undefined || value === null) return 'text-gray-600'
    return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header moderne avec salutation dynamique */}
        <div className="mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Bonjour, {session?.user?.name || 'Administrateur'} 👋
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  {currentTime.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
                  Tableau de bord administrateur - Navette Xpress
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {currentTime.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-500">
                  Heure locale
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques principales avec design moderne */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Utilisateurs */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Utilisateurs</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {isLoading ? '...' : (stats?.totalUsers || 0).toLocaleString()}
                </p>
                <p className={`text-sm font-medium ${getGrowthColor(stats?.monthlyGrowth?.users)}`}>
                  {formatGrowth(stats?.monthlyGrowth?.users)} ce mois
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-2xl">👥</span>
              </div>
            </div>
          </div>

          {/* Réservations */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Réservations</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {isLoading ? '...' : (stats?.totalBookings || 0).toLocaleString()}
                </p>
                <p className={`text-sm font-medium ${getGrowthColor(stats?.monthlyGrowth?.bookings)}`}>
                  {formatGrowth(stats?.monthlyGrowth?.bookings)} ce mois
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-2xl">📅</span>
              </div>
            </div>
          </div>

          {/* Revenus */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Revenus Totaux</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {isLoading ? '...' : `${(stats?.totalRevenue || 0).toLocaleString()} F`}
                </p>
                <p className={`text-sm font-medium ${getGrowthColor(stats?.monthlyGrowth?.revenue)}`}>
                  {formatGrowth(stats?.monthlyGrowth?.revenue)} ce mois
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-2xl">💰</span>
              </div>
            </div>
          </div>

          {/* Véhicules Actifs */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Véhicules Actifs</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {isLoading ? '...' : stats?.activeVehicles || 0}
                </p>
                <p className="text-sm font-medium text-green-600">
                  {stats?.totalDrivers || 0} chauffeurs
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-2xl">🚗</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status en temps réel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-green-500">🟢</span>
              Statut Système
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Réservations en attente</span>
                <span className="font-semibold text-orange-600">{stats?.pendingBookings || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Courses terminées</span>
                <span className="font-semibold text-green-600">{stats?.completedBookings || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Chauffeurs actifs</span>
                <span className="font-semibold text-blue-600">{stats?.totalDrivers || 0}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-blue-500">📈</span>
              Performances du Mois
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(((stats?.completedBookings || 0) / Math.max(stats?.totalBookings || 0, 1)) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Taux de réussite</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.totalClients || 0}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Clients actifs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">4.8/5</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Note moyenne</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides avec style moderne */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Actions Rapides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:scale-105 transition-all duration-300 text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${action.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-xl">{action.icon}</span>
                  </div>
                  <svg 
                    className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {action.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Message de motivation */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                🎉 Excellent travail !
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Votre plateforme fonctionne parfaitement. Continuez à offrir une excellente expérience à vos utilisateurs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}