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
  totalHours: number
  totalDistance: number
  averageRating: number
  totalRatings: number
  peakHours: { hour: number; rides: number }[]
  monthlyData: { month: string; rides: number; earnings: number }[]
  ratingDistribution: { stars: number; count: number }[]
  topRoutes: { from: string; to: string; count: number; avgPrice: number }[]
}

export function DriverStats({ onBack }: DriverStatsProps) {
  const { data: session } = useSession()
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [stats, setStats] = useState<StatsData>({
    period: 'month',
    totalRides: 156,
    completedRides: 148,
    cancelledRides: 8,
    totalEarnings: 12840,
    totalHours: 420,
    totalDistance: 8750,
    averageRating: 4.8,
    totalRatings: 142,
    peakHours: [
      { hour: 7, rides: 12 },
      { hour: 8, rides: 18 },
      { hour: 9, rides: 15 },
      { hour: 17, rides: 20 },
      { hour: 18, rides: 25 },
      { hour: 19, rides: 16 }
    ],
    monthlyData: [
      { month: 'Jan', rides: 45, earnings: 3200 },
      { month: 'Fév', rides: 52, earnings: 3680 },
      { month: 'Mar', rides: 48, earnings: 3420 },
      { month: 'Avr', rides: 56, earnings: 4180 },
      { month: 'Mai', rides: 61, earnings: 4590 },
      { month: 'Jui', rides: 58, earnings: 4320 }
    ],
    ratingDistribution: [
      { stars: 5, count: 89 },
      { stars: 4, count: 35 },
      { stars: 3, count: 12 },
      { stars: 2, count: 4 },
      { stars: 1, count: 2 }
    ],
    topRoutes: [
      { from: 'Aéroport AIBD', to: 'Dakar Centre', count: 28, avgPrice: 165 },
      { from: 'Gare du Nord', to: 'La Défense', count: 22, avgPrice: 85 },
      { from: 'Aéroport AIBD', to: 'Dakar Sud', count: 18, avgPrice: 140 },
      { from: 'Châtelet', to: 'Aéroport CDG', count: 15, avgPrice: 170 }
    ]
  })

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

  const getEarningsPerHour = () => {
    return (stats.totalEarnings / stats.totalHours).toFixed(0)
  }

  const getEarningsPerKm = () => {
    return (stats.totalEarnings / stats.totalDistance).toFixed(2)
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
                  Statistiques
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
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedPeriod === period.key
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
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
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalEarnings.toLocaleString()}€</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{getEarningsPerHour()}€/h</span>
            <span className="text-gray-600 dark:text-gray-400">{getEarningsPerKm()}€/km</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
              <span className="text-orange-600 dark:text-orange-400 text-xl">⏱️</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Heures Travaillées</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalHours}h</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{(stats.totalHours / stats.totalRides).toFixed(1)}h/course</span>
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

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Performance Mensuelle</h3>
          <div className="space-y-4">
            {stats.monthlyData.map((month, index) => (
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
                        {month.earnings.toLocaleString()}€
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
                    <span>Prix moyen: {route.avgPrice}€</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {(route.count * route.avgPrice).toLocaleString()}€
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
              Votre note de {stats.averageRating}/5 témoigne d'un service de qualité
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
