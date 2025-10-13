'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type Period = 'week' | 'month' | 'year'

interface AdminStats {
  globalStats: {
    totalRides: number
    totalEarnings: number
    totalDrivers: number
    completionRate: number
  }
  driverStats: Array<{
    driverId: string
    name: string
    email: string
    totalRides: number
    completedRides: number
    totalEarnings: number
    averageRating: number
    completionRate: number
    earningsPerRide: number
  }>
}

const AdminGlobalStats = () => {
  const { data: session } = useSession()
  const [period, setPeriod] = useState<Period>('week')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all')

  const fetchStats = async (selectedPeriod: Period) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/stats?period=${selectedPeriod}`)
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
      
      const response_data = await response.json()
      console.log('📊 [AdminGlobalStats] Response reçue:', response_data)
      
      if (!response_data.success) {
        throw new Error(response_data.message || 'Erreur API')
      }

      // Restructurer les données si nécessaire
      const statsData: AdminStats = {
        globalStats: response_data.data.globalMetrics || response_data.data.globalStats,
        driverStats: response_data.data.driverStats || []
      }

      // Debug temporaire
      if (statsData.driverStats.length > 0) {
        console.log('🔍 [Frontend] Premier chauffeur reçu:', statsData.driverStats[0])
      }
      
      setStats(statsData)
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchStats(period)
    }
  }, [session, period])

  const handlePeriodChange = async (newPeriod: Period) => {
    setPeriod(newPeriod)
    await fetchStats(newPeriod)
  }

  const getPeriodLabel = (period: Period): string => {
    switch (period) {
      case 'week': return 'Cette semaine'
      case 'month': return 'Ce mois'
      case 'year': return 'Cette année'
      default: return 'Cette semaine'
    }
  }

  const getCompletionRateColor = (rate: number): string => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Filtrer les statistiques selon le chauffeur sélectionné
  const getFilteredStats = () => {
    if (!stats) return null
    
    if (selectedDriverId === 'all') {
      return stats
    }

    // Filtrer pour un chauffeur spécifique
    const selectedDriver = stats.driverStats.find(driver => driver.driverId === selectedDriverId)
    if (!selectedDriver) return stats

    return {
      globalStats: {
        totalRides: selectedDriver.totalRides,
        totalEarnings: selectedDriver.totalEarnings,
        totalDrivers: 1,
        completionRate: selectedDriver.completionRate
      },
      driverStats: [selectedDriver]
    }
  }

  const filteredStats = getFilteredStats()

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Accès non autorisé
          </h3>
          <p className="text-gray-600">
            Vous devez être connecté pour voir cette page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header et filtres */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-gray-900">
            📊 Statistiques Globales
            {selectedDriverId !== 'all' && (
              <span className="text-lg font-normal text-blue-600 ml-2">
                - {stats?.driverStats.find(d => d.driverId === selectedDriverId)?.name}
              </span>
            )}
          </h2>
          
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Section Période */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-sm font-semibold text-gray-700 min-w-fit">
                📅 Période:
              </label>
              <div className="flex gap-2">
                {(['week', 'month', 'year'] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePeriodChange(p)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      period === p
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading && period === p && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {getPeriodLabel(p)}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Chauffeur */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label htmlFor="driver-filter" className="text-sm font-semibold text-gray-700 min-w-fit">
                👨‍💼 Chauffeur:
              </label>
              <select
                id="driver-filter"
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-w-[250px] font-medium"
                disabled={loading}
              >
                <option value="all" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">🌍 Statistiques Globales (Tous)</option>
                {stats?.driverStats.map((driver) => (
                  <option key={driver.driverId} value={driver.driverId} className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">
                    👤 {driver.name || `Chauffeur ${driver.driverId.slice(-4)}`}
                  </option>
                ))}
              </select>
              
              {/* Bouton Reset */}
              {selectedDriverId !== 'all' && (
                <button
                  onClick={() => setSelectedDriverId('all')}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                  title="Revenir à la vue globale"
                >
                  🔄 Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Indicateur de mode */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`px-3 py-1 rounded-full font-medium ${
              selectedDriverId === 'all' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {selectedDriverId === 'all' ? '🌐 Vue Globale' : '👤 Vue Individuelle'}
            </div>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600 font-medium">{getPeriodLabel(period)}</span>
            {filteredStats && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">
                  {filteredStats.globalStats.totalRides} course{filteredStats.globalStats.totalRides > 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des statistiques...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erreur de chargement
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      ) : filteredStats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-2xl font-semibold text-gray-900">{filteredStats.globalStats.totalRides.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenus Totaux</p>
                  <p className="text-2xl font-semibold text-gray-900">{filteredStats.globalStats.totalEarnings.toLocaleString()} FCFA</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {selectedDriverId === 'all' ? 'Chauffeurs Actifs' : 'Chauffeur Sélectionné'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">{filteredStats.globalStats.totalDrivers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taux de Complétion</p>
                  <p className="text-2xl font-semibold text-gray-900">{filteredStats.globalStats.completionRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDriverId === 'all' ? 'Performance par Chauffeur' : 
                 `Performance de ${filteredStats.driverStats[0]?.name || 'Chauffeur sélectionné'}`}
              </h3>
            </div>
            
            {filteredStats.driverStats.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucun chauffeur actif pour cette période.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chauffeur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Courses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenus
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Note Moy.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Taux Complétion
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rev./Course
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStats.driverStats.map((driver) => (
                      <tr key={driver.driverId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {driver.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {driver.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {driver.totalRides || 0} total
                          </div>
                          <div className="text-sm text-gray-500">
                            {driver.completedRides || 0} complétées
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {(driver.totalEarnings || 0).toLocaleString()} FCFA
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm text-gray-900">
                              {(driver.averageRating || 0) > 0 ? (
                                <>
                                  <span className="font-medium">{(driver.averageRating || 0).toFixed(1)}</span>
                                  <span className="text-yellow-400 ml-1">★</span>
                                </>
                              ) : (
                                <span className="text-gray-400">Aucune note</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCompletionRateColor(driver.completionRate || 0)} bg-opacity-10`}>
                            {(driver.completionRate || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(driver.earningsPerRide || 0).toLocaleString()} FCFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucune donnée disponible.</p>
        </div>
      )}
    </div>
  )
}

export default AdminGlobalStats