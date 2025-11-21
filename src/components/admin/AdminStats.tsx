'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface GlobalMetrics {
  totalRides: number
  totalEarnings: number
  activeDrivers: number
  completedRides: number
  cancelledRides: number
  averageEarningsPerRide: number
  completionRate: number
}

interface StatusBreakdown {
  status: string
  count: number
  earnings: number
  percentage: number
}

interface DriverStat {
  driverId: string
  driverName: string
  driverEmail: string
  totalRides: number
  completedRides: number
  cancelledRides: number
  totalEarnings: number
  averageRating: number
  totalRatings: number
  completionRate: number
  earningsPerRide: number
}

interface MonthlyData {
  month: string
  rides: number
  earnings: number
  drivers: number
}

interface TopRoute {
  from: string
  to: string
  count: number
  avgPrice: number
  totalEarnings: number
}

interface AdminStatsData {
  period: string
  dateRange: {
    start: string
    end: string
  }
  globalMetrics: GlobalMetrics
  statusBreakdown: StatusBreakdown[]
  driverStats: DriverStat[]
  monthlyData: MonthlyData[]
  topRoutes: TopRoute[]
}

type Period = 'week' | 'month' | 'year'

interface AdminStatsProps {
  onBack: () => void
}

export default function AdminStats({ onBack }: AdminStatsProps) {
  const { data: session } = useSession()
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month')
  const [stats, setStats] = useState<AdminStatsData>({
    period: 'month',
    dateRange: { start: '', end: '' },
    globalMetrics: {
      totalRides: 0,
      totalEarnings: 0,
      activeDrivers: 0,
      completedRides: 0,
      cancelledRides: 0,
      averageEarningsPerRide: 0,
      completionRate: 0
    },
    statusBreakdown: [],
    driverStats: [],
    monthlyData: [],
    topRoutes: []
  })
  const [isLoading, setIsLoading] = useState(false)

  // Récupérer les statistiques administrateur
  useEffect(() => {
    if (session?.user && 'role' in session.user && session.user.role === 'admin') {
      fetchAdminStats()
    }
  }, [session, selectedPeriod])

  const fetchAdminStats = async () => {
    try {
      setIsLoading(true)
      console.log(`🔄 [ADMIN] Récupération des statistiques pour la période: ${selectedPeriod}`)
      
      const response = await fetch(`/api/admin/stats?period=${selectedPeriod}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques')
      }

      const data = await response.json()
      console.log(`📊 [ADMIN] Statistiques reçues pour ${selectedPeriod}:`, data.data)
      
      if (data.success && data.data) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques admin:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const periods = [
    { key: 'week' as const, label: 'Cette semaine' },
    { key: 'month' as const, label: 'Ce mois' },
    { key: 'year' as const, label: 'Cette année' }
  ]

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'text-green-600 bg-green-100',
      cancelled: 'text-red-600 bg-red-100', 
      confirmed: 'text-blue-600 bg-blue-100',
      in_progress: 'text-orange-600 bg-orange-100',
      assigned: 'text-purple-600 bg-purple-100'
    } as const
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      completed: 'Complétées',
      cancelled: 'Annulées',
      confirmed: 'Confirmées', 
      in_progress: 'En cours',
      assigned: 'Assignées'
    } as const
    return labels[status as keyof typeof labels] || status
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Statistiques Globales - {periods.find(p => p.key === selectedPeriod)?.label}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Vue d'ensemble des performances de tous les chauffeurs
                </p>
              </div>
            </div>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {periods.map(period => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                  selectedPeriod === period.key
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {isLoading && selectedPeriod === period.key ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>{period.label}</span>
                  </div>
                ) : (
                  period.label
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Global Metrics */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 rounded-2xl z-10 flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Chargement des statistiques...</span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-xl">🚗</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.globalMetrics.totalRides}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">✅ {stats.globalMetrics.completedRides} complétées</span>
              <span className="text-red-500 dark:text-red-400">❌ {stats.globalMetrics.cancelledRides} annulées</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Revenus Totaux</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.globalMetrics.totalEarnings.toLocaleString()} FCFA</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{stats.globalMetrics.averageEarningsPerRide} FCFA/course</span>
              <span className="text-green-600 dark:text-green-400">Taux: {stats.globalMetrics.completionRate}%</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 text-xl">👥</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Chauffeurs Actifs</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.globalMetrics.activeDrivers}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {stats.globalMetrics.activeDrivers > 0 ? Math.round(stats.globalMetrics.totalRides / stats.globalMetrics.activeDrivers) : 0} courses/chauffeur
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 text-xl">📈</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Performance</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.globalMetrics.completionRate}%</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Taux de complétion global</span>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Performance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Performance par Chauffeur</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Chauffeur</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Courses</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Revenus</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Note</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Taux</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">FCFA/Course</th>
              </tr>
            </thead>
            <tbody>
              {stats.driverStats.map((driver) => (
                <tr key={driver.driverId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{driver.driverName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{driver.driverEmail}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="font-medium text-gray-900 dark:text-white">{driver.totalRides}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {driver.completedRides}✅ {driver.cancelledRides}❌
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="font-medium text-green-600 dark:text-green-400">
                      {Number(driver.totalEarnings).toLocaleString()} FCFA
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {driver.averageRating.toFixed(1)}
                      </span>
                      <span className="text-yellow-400">⭐</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {driver.totalRatings} avis
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className={`font-medium ${
                      driver.completionRate >= 80 ? 'text-green-600' : 
                      driver.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {driver.completionRate}%
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {driver.earningsPerRide} FCFA
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts and Additional Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Répartition par Statut</h3>
          <div className="space-y-4">
            {stats.statusBreakdown.map((status) => (
              <div key={status.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.status)}`}>
                    {getStatusLabel(status.status)}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {status.count} courses
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {status.percentage}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {status.earnings.toLocaleString()} FCFA
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Routes */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Routes Populaires</h3>
          <div className="space-y-4">
            {stats.topRoutes.slice(0, 5).map((route, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {route.from}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {route.to}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-600 dark:text-gray-400">
                    <span>{route.count} courses</span>
                    <span>•</span>
                    <span>Prix moyen: {route.avgPrice} FCFA</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-600 dark:text-green-400">
                    {route.totalEarnings.toLocaleString()} FCFA
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
