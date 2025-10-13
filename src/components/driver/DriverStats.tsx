"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface DriverStatsProps {
  onBack: () => void
}

interface StatsData {
  period: 'week' | 'month' | 'year'
  totalRides: number
  completedRides: number
  cancelledRides: number
  totalEarnings: number
  averageRating: number
  totalRatings: number
  statusBreakdown: { status: string; count: number; earnings: number; percentage: number }[]
  peakHours: { hour: number; rides: number }[]
  monthlyData: { month: string; year?: string; rides: number; earnings: number }[]
  ratingDistribution: { stars: number; count: number; percentage: number }[]
  topRoutes: { from: string; to: string; count: number; avgPrice: number }[]
}

export function DriverStats({ onBack }: DriverStatsProps) {
  const { data: session } = useSession()
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [stats, setStats] = useState<StatsData>({
    period: 'month',
    totalRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalRatings: 0,
    statusBreakdown: [],
    peakHours: [],
    monthlyData: [],
    ratingDistribution: [],
    topRoutes: []
  })
  const [isLoading, setIsLoading] = useState(false)

  // Récupérer les statistiques du chauffeur
  useEffect(() => {
    if (session?.user && 'role' in session.user && session.user.role === 'driver') {
      fetchDriverStats()
    }
  }, [session, selectedPeriod])

  const fetchDriverStats = async () => {
    try {
      setIsLoading(true)
      console.log(`🔄 Récupération des statistiques pour la période: ${selectedPeriod}`)
      
      const response = await fetch(`/api/driver/stats?period=${selectedPeriod}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques')
      }

      const data = await response.json()
      console.log(`📊 Statistiques reçues pour ${selectedPeriod}:`, data.data)
      
      if (data.success && data.data) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const periods = [
    { key: 'week' as const, label: 'Cette semaine' },
    { key: 'month' as const, label: 'Ce mois' },
    { key: 'year' as const, label: 'Cette année' }
  ]

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex items-center space-x-1">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="text-yellow-400">⭐</span>
        ))}
        {hasHalfStar && <span className="text-yellow-400">⭐</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300">⭐</span>
        ))}
      </div>
    )
  }

  const getCompletionRate = () => {
    return ((stats.completedRides / stats.totalRides) * 100).toFixed(1)
  }

  const getEarningsPerRide = () => {
    if (stats.totalRides === 0) return '0'
    return (stats.totalEarnings / stats.totalRides).toFixed(0)
  }

  const getEarningsPerHour = () => {
    // Estimation basée sur une moyenne de 1.5h par course
    const estimatedHours = stats.totalRides * 1.5
    if (estimatedHours === 0) return '0'
    return (stats.totalEarnings / estimatedHours).toFixed(0)
  }

  const getEarningsPerKm = () => {
    // Estimation basée sur une moyenne de 15km par course
    const estimatedDistance = stats.totalRides * 15
    if (estimatedDistance === 0) return '0'
    return (stats.totalEarnings / estimatedDistance).toFixed(0)
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
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Statistiques - {periods.find(p => p.key === selectedPeriod)?.label}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Analysez vos performances détaillées
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

      {/* Main Stats Grid */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 rounded-2xl z-10 flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalRides}</p>
              </div>
            </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600 dark:text-green-400">✅ {stats.completedRides} terminées</span>
            <span className="text-red-500 dark:text-red-400">❌ {stats.cancelledRides} annulées</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-xl">💰</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenus Totaux</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalEarnings.toLocaleString()} FCFA</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{getEarningsPerHour()} FCFA/h</span>
            <span className="text-gray-600 dark:text-gray-400">{getEarningsPerKm()} FCFA/km</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
              <span className="text-orange-600 dark:text-orange-400 text-xl">💳</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenus par Course</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{getEarningsPerRide()} FCFA</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Estimation: {getEarningsPerHour()} FCFA/h</span>
            <span className="text-green-600 dark:text-green-400">Taux: {getCompletionRate()}%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 text-xl">⭐</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Note Moyenne</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.averageRating}/5</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            {getRatingStars(stats.averageRating)}
            <span className="text-sm text-gray-600 dark:text-gray-400">{stats.totalRatings} avis</span>
          </div>
        </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Performance Mensuelle</h3>
          <div className="space-y-4">
            {stats.monthlyData.map((month) => (
              <div key={month.month} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {month.month}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {month.rides} courses
                      </span>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {month.earnings.toLocaleString()} FCFA
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(month.rides / Math.max(...stats.monthlyData.map(m => m.rides))) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Répartition des Notes</h3>
          <div className="space-y-4">
            {stats.ratingDistribution.reverse().map((rating) => (
              <div key={rating.stars} className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 w-16">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {rating.stars}
                  </span>
                  <span className="text-yellow-400">⭐</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {rating.count} avis
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {((rating.count / stats.totalRatings) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        rating.stars >= 4 ? 'bg-green-500' : rating.stars >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${(rating.count / Math.max(...stats.ratingDistribution.map(r => r.count))) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Hours and Top Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Heures de Pointe</h3>
          <div className="space-y-3">
            {stats.peakHours.map((hour) => (
              <div key={hour.hour} className="flex items-center space-x-4">
                <div className="w-16 text-sm font-medium text-gray-600 dark:text-gray-400">
                  {hour.hour}h00
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {hour.rides} courses
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-600 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${(hour.rides / Math.max(...stats.peakHours.map(h => h.rides))) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Routes */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Trajets les Plus Fréquents</h3>
          <div className="space-y-4">
            {stats.topRoutes.map((route, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
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
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {(route.count * route.avgPrice).toLocaleString()} FCFA
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    total
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Analyses & Conseils</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="text-3xl mb-3">🏆</div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Performance Excellente</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Votre taux de complétion de {getCompletionRate()}% est au-dessus de la moyenne
            </p>
          </div>
          <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="text-3xl mb-3">💡</div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Optimisation</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Concentrez-vous sur les créneaux 17h-19h pour maximiser vos revenus
            </p>
          </div>
          <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <div className="text-3xl mb-3">⭐</div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Service Client</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Votre note de {stats.averageRating}/5 témoigne d&apos;un service de qualité
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
