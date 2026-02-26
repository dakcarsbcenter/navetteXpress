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
        <div className="text-center p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
          <h3 className="text-lg font-semibold text-white mb-2">Accès non autorisé</h3>
          <p className="text-slate-400 text-sm">Vous devez être connecté pour voir cette page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Statistiques Globales</h1>
          <p className="text-xs text-slate-500 mt-0.5">Analyse en temps réel de la performance plateforme</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:text-white transition-all text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Exporter Rapport</span>
          </button>
          <div className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-gold text-xs font-bold" style={{ color: 'var(--color-gold)' }}>
            {getCurrentDate()}
          </div>
        </div>
      </div>

      {/* Filters Box */}
      <div className="p-5 rounded-2xl border border-white/5" style={{ backgroundColor: 'var(--color-dash-card)' }}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Période:</span>
            <div className="flex gap-1.5 p-1 rounded-xl bg-black/20 border border-white/5">
              {(['week', 'month', 'year'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  disabled={loading}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${period === p
                      ? 'bg-gold text-black shadow-lg shadow-gold/10'
                      : 'text-slate-500 hover:text-slate-300'
                    }`}
                  style={period === p ? { backgroundColor: 'var(--color-gold)' } : {}}
                >
                  {getPeriodLabel(p)}
                </button>
              ))}
            </div>
          </div>

          <div className="h-8 w-px bg-white/5 hidden sm:block" />

          <div className="flex items-center gap-3 flex-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chauffeur:</span>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="flex-1 max-w-[280px] px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white outline-none focus:border-gold/50 transition-all appearance-none cursor-pointer"
              disabled={loading}
            >
              <option value="all">Tous les chauffeurs</option>
              {stats?.driverStats.map((driver) => (
                <option key={driver.driverId} value={driver.driverId}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold"
            style={{ borderColor: 'var(--color-gold) transparent transparent transparent' }}></div>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 text-sm">
          <strong>Erreur:</strong> {error}
        </div>
      ) : filteredStats ? (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Courses', value: filteredStats.globalStats.totalRides.toLocaleString(), icon: '🚗', color: '#C9A84C', growth: '+2%' },
              { label: 'Chauffeurs', value: `${filteredStats.globalStats.activeDrivers || filteredStats.globalStats.totalDrivers}/${filteredStats.globalStats.totalDrivers}`, icon: '👤', color: '#8B5CF6', growth: 'Actifs' },
              { label: 'Revenus', value: `${(filteredStats.globalStats.totalEarnings / 1000).toLocaleString()}k F`, icon: '💰', color: '#10B981', growth: '+12%' },
              { label: 'Complétion', value: `${filteredStats.globalStats.completionRate.toFixed(1)}%`, icon: '📈', color: '#F59E0B', growth: 'Taux' },
            ].map((kpi, i) => (
              <div key={i} className="p-5 rounded-2xl border border-white/5 transition-all hover:translate-y-[-2px]"
                style={{ backgroundColor: 'var(--color-dash-card)', borderLeft: `2px solid ${kpi.color}` }}>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xl">{kpi.icon}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-400">{kpi.growth}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
                <h3 className="text-2xl font-bold text-white font-mono">{kpi.value}</h3>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5" style={{ backgroundColor: 'var(--color-dash-card)' }}>
              <h3 className="text-sm font-semibold text-white mb-6">Évolution des Revenus</h3>
              <div className="h-64 relative">
                <svg className="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
                  <path
                    d="M 0 150 L 114 130 L 228 140 L 342 110 L 456 125 L 570 95 L 684 120 L 800 85 L 800 250 L 0 250 Z"
                    fill="rgba(201,168,76,0.05)"
                  />
                  <path
                    d="M 0 150 L 114 130 L 228 140 L 342 110 L 456 125 L 570 95 L 684 120 L 800 85"
                    fill="none"
                    stroke="var(--color-gold)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {[0, 114, 228, 342, 456, 570, 684, 800].map((x, i) => (
                    <circle key={i} cx={x} cy={150 - (i % 3) * 20} r="3" fill="var(--color-gold)" />
                  ))}
                </svg>
                <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <span key={d}>{d}</span>)}
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/5" style={{ backgroundColor: 'var(--color-dash-card)' }}>
              <h3 className="text-sm font-semibold text-white mb-6">Répartition Courses</h3>
              <div className="flex flex-col items-center justify-center h-full pb-6">
                <div className="relative w-40 h-40 mb-6">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-gold)" strokeWidth="12" strokeDasharray="180 251" strokeDashoffset="0" transform="rotate(-90 50 50)" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-white">72%</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Usage</span>
                  </div>
                </div>
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gold" style={{ backgroundColor: 'var(--color-gold)' }} />
                      <span className="text-[11px] text-slate-300">Transferts</span>
                    </div>
                    <span className="text-[11px] font-mono text-white">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-[11px] text-slate-300">Privé</span>
                    </div>
                    <span className="text-[11px] font-mono text-white">35%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Performance */}
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ backgroundColor: 'var(--color-dash-card)' }}>
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <h3 className="text-sm font-semibold text-white">Performance Chauffeurs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chauffeur</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Courses</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Complétion</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Revenus</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.driverStats.map((driver) => (
                    <tr key={driver.driverId} className="hover:bg-white/[0.02] transition-colors border-b border-white/[0.03]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center font-bold text-[10px]" style={{ color: 'var(--color-gold)' }}>
                            {getInitials(driver.name)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{driver.name}</p>
                            <p className="text-[10px] text-slate-500">{driver.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-bold text-slate-200">{driver.totalRides}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 justify-center">
                          <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full bg-gold" style={{ width: `${driver.completionRate}%`, backgroundColor: 'var(--color-gold)' }} />
                          </div>
                          <span className="text-[10px] font-bold text-white">{driver.completionRate.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-bold text-white font-mono">{driver.totalEarnings.toLocaleString()} F</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default AdminGlobalStats
