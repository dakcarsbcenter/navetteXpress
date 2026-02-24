'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type Period = 'week' | 'month' | 'year' | 'custom'

interface AdminStats {
  globalStats: {
    totalRides: number
    totalEarnings: number
    totalDrivers: number
    completionRate: number
    activeDrivers?: number
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
  weeklyRevenue?: Array<{ week: string; revenue: number }>
  courseDistribution?: Array<{ type: string; count: number; percentage: number }>
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
      case 'custom': return 'Personnalisé'
      default: return 'Cette semaine'
    }
  }

  const getCurrentDate = () => {
    const date = new Date()
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2">
              Statistiques Globales
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
              Analysez les performances de votre flotte en temps réel.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="font-medium text-slate-700 dark:text-slate-300 hidden sm:inline">Exporter</span>
            </button>
            <span className="text-slate-600 dark:text-slate-400 font-medium text-xs sm:text-sm hidden md:inline">{getCurrentDate()}</span>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Période */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                Période:
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['week', 'month', 'year', 'custom'] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePeriodChange(p)}
                    disabled={loading}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                      period === p
                        ? 'bg-[#A73B3C] text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {getPeriodLabel(p)}
                  </button>
                ))}
              </div>
            </div>


            {/* Chauffeur */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 sm:hidden">
                Chauffeur:
              </label>
              <select
                id="driver-filter"
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#A73B3C] focus:border-[#A73B3C] bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 sm:min-w-[200px] font-medium"
                disabled={loading}
              >
                <option value="all">Tous les chauffeurs</option>
                {stats?.driverStats.map((driver) => (
                  <option key={driver.driverId} value={driver.driverId}>
                    {driver.name || `Chauffeur ${driver.driverId.slice(-4)}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A73B3C] mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Chargement des statistiques...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Erreur de chargement
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            </div>
          </div>
        ) : filteredStats ? (
          <>
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {/* Total Courses */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Total Courses</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {filteredStats.globalStats.totalRides.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  +2% vs semaine dern.
                </p>
              </div>

              {/* Revenus Totaux */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Revenus Totaux</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {(filteredStats.globalStats.totalEarnings / 1000).toFixed(1)}M FCFA
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  +12% croissance
                </p>
              </div>

              {/* Chauffeurs Actifs */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Chauffeurs Actifs</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {filteredStats.globalStats.activeDrivers || filteredStats.globalStats.totalDrivers}/{filteredStats.globalStats.totalDrivers}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  2 en pause
                </p>
              </div>

              {/* Taux Complétion */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Taux Complétion</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {filteredStats.globalStats.completionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-orange-500 dark:text-orange-400 font-medium">
                  ▲ 2 annulées
                </p>
              </div>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Evolution des Revenus */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4 sm:mb-6">
                  Evolution des Revenus (Semaine)
                </h3>
                <div className="relative h-48 sm:h-64">
                  {/* Graphique simplifié - ligne de tendance */}
                  <svg className="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
                    {/* Grille horizontale */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line
                        key={i}
                        x1="0"
                        y1={50 * i}
                        x2="800"
                        y2={50 * i}
                        stroke="currentColor"
                        className="text-slate-200 dark:text-slate-700"
                        strokeWidth="1"
                      />
                    ))}
                    {/* Zone de remplissage */}
                    <defs>
                      <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#A73B3C', stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: '#A73B3C', stopOpacity: 0.05 }} />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 150 L 114 130 L 228 140 L 342 110 L 456 125 L 570 95 L 684 120 L 800 85 L 800 250 L 0 250 Z"
                      fill="url(#revenueGradient)"
                    />
                    {/* Ligne de revenus */}
                    <path
                      d="M 0 150 L 114 130 L 228 140 L 342 110 L 456 125 L 570 95 L 684 120 L 800 85"
                      fill="none"
                      stroke="#A73B3C"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Points */}
                    {[
                      { x: 0, y: 150 },
                      { x: 114, y: 130 },
                      { x: 228, y: 140 },
                      { x: 342, y: 110 },
                      { x: 456, y: 125 },
                      { x: 570, y: 95 },
                      { x: 684, y: 120 },
                      { x: 800, y: 85 }
                    ].map((point, i) => (
                      <circle
                        key={i}
                        cx={point.x}
                        cy={point.y}
                        r="5"
                        fill="#A73B3C"
                        className="hover:r-7 transition-all"
                      />
                    ))}
                  </svg>
                  {/* Labels des jours */}
                  <div className="flex justify-between mt-2 text-xs text-slate-600 dark:text-slate-400">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Répartition des Courses */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4 sm:mb-6">
                  Répartition des Courses
                </h3>
                <div className="flex items-center justify-center mb-4 sm:mb-6">
                  {/* Graphique Donut simplifié */}
                  <svg className="w-36 h-36 sm:w-44 sm:h-44" viewBox="0 0 180 180">
                    <circle
                      cx="90"
                      cy="90"
                      r="70"
                      fill="none"
                      stroke="#A73B3C"
                      strokeWidth="30"
                      strokeDasharray="198 440"
                      transform="rotate(-90 90 90)"
                    />
                    <circle
                      cx="90"
                      cy="90"
                      r="70"
                      fill="none"
                      stroke="#E5C16C"
                      strokeWidth="30"
                      strokeDasharray="154 440"
                      strokeDashoffset="-198"
                      transform="rotate(-90 90 90)"
                    />
                    <circle
                      cx="90"
                      cy="90"
                      r="70"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="30"
                      strokeDasharray="88 440"
                      strokeDashoffset="-352"
                      transform="rotate(-90 90 90)"
                    />
                  </svg>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#A73B3C]"></div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">Transfert</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#E5C16C]"></div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">Privé</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">35%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">Mise à dispo</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">20%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau Performance par Chauffeur */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                  Performance par Chauffeur
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Rechercher un chauffeur..."
                    className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#A73B3C] focus:border-[#A73B3C] bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              
              {filteredStats.driverStats.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 dark:text-slate-400">Aucun chauffeur actif pour cette période.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-900">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Chauffeur
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Courses
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Revenus
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Note Moy.
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Taux Complétion
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {filteredStats.driverStats.map((driver) => (
                        <tr key={driver.driverId} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#A73B3C] flex items-center justify-center text-white font-semibold text-sm">
                                {driver.name?.charAt(0).toUpperCase() || 'P'}
                              </div>
                              <div className="hidden sm:block">
                                <div className="text-sm font-medium text-slate-900 dark:text-white">
                                  {driver.name}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {driver.email}
                                </div>
                              </div>
                              <div className="block sm:hidden">
                                <div className="text-xs font-medium text-slate-900 dark:text-white">
                                  {driver.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                              {driver.totalRides || 0}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                              {driver.completedRides || 0} terminées
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                              {(driver.totalEarnings || 0).toLocaleString()} F
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            {(driver.averageRating || 0) > 0 ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                                  {(driver.averageRating || 0).toFixed(1)}
                                </span>
                                <span className="text-[#E5C16C] text-sm">★</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <div className="flex-1 h-1.5 sm:h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden min-w-[30px] sm:min-w-[60px]">
                                <div 
                                  className={`h-full rounded-full ${
                                    (driver.completionRate || 0) >= 90 ? 'bg-emerald-500' :
                                    (driver.completionRate || 0) >= 70 ? 'bg-orange-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${driver.completionRate || 0}%` }}
                                />
                              </div>
                              <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white min-w-[35px] sm:min-w-[45px]">
                                {(driver.completionRate || 0).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
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
            <p className="text-slate-500 dark:text-slate-400">Aucune donnée disponible.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminGlobalStats
