'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { CarProfile, Users, CurrencyDollar, TrendUp } from '@phosphor-icons/react'

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

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const selectStyle: React.CSSProperties = { height: '38px', padding: '0 12px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13px', color: '#12100E', backgroundColor: '#FFFFFF' }

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

      if (!response_data.success) {
        throw new Error(response_data.message || 'Erreur API')
      }

      const statsData: AdminStats = {
        globalStats: response_data.data.globalMetrics || response_data.data.globalStats,
        driverStats: response_data.data.driverStats || []
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
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getFilteredStats = () => {
    if (!stats) return null

    if (selectedDriverId === 'all') {
      return stats
    }

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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div style={{ textAlign: 'center', padding: '32px', border: '1px solid #E2DACD', borderRadius: '4px', backgroundColor: '#FFFFFF' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: '#12100E' }}>Accès non autorisé</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#6E6A63' }}>Vous devez être connecté pour voir cette page.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Header */}
      <section style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#1F5245' }}>
            Analyse
          </span>
          <h2 style={{ margin: 0, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Statistiques globales.
          </h2>
          <p style={{ margin: 0, fontSize: '15px', color: '#3d3a35' }}>
            Analyse en temps réel de la performance plateforme.
          </p>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E6A63', border: '1px solid #E2DACD', borderRadius: '4px', padding: '8px 14px' }}>
          {getCurrentDate()}
        </span>
      </section>

      {/* Filters */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', padding: '18px 20px' }}>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E6A63' }}>Période :</span>
            <div className="flex items-center gap-1" style={{ border: '1px solid #E2DACD', borderRadius: '4px', padding: '3px', backgroundColor: '#F7F3EC' }}>
              {(['week', 'month', 'year'] as Period[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePeriodChange(p)}
                  disabled={loading}
                  style={{
                    padding: '6px 14px', borderRadius: '3px', fontSize: '11.5px', fontWeight: 600,
                    backgroundColor: period === p ? '#1F5245' : 'transparent',
                    color: period === p ? '#FFFFFF' : '#6E6A63',
                  }}
                >
                  {getPeriodLabel(p)}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:block" style={{ height: '32px', width: '1px', backgroundColor: '#E2DACD' }} />

          <div className="flex items-center gap-3" style={{ flex: 1 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E6A63' }}>Chauffeur :</span>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              disabled={loading}
              style={{ ...selectStyle, flex: 1, maxWidth: '280px' }}
            >
              <option value="all">Tous les chauffeurs</option>
              {stats?.driverStats.map((driver) => (
                <option key={driver.driverId} value={driver.driverId}>{driver.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "#E2DACD", borderTopColor: "#1F5245" }} />
        </div>
      ) : error ? (
        <div style={{ padding: '16px 20px', borderRadius: '4px', backgroundColor: 'rgba(184,73,60,.06)', border: '1px solid rgba(184,73,60,.25)', color: '#B8493C', fontSize: '13px' }}>
          <strong>Erreur :</strong> {error}
        </div>
      ) : filteredStats ? (
        <>
          {/* Main Stats Grid */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', borderTop: '1px solid #E2DACD', borderBottom: '1px solid #E2DACD' }}>
            {[
              { label: 'Total courses', value: filteredStats.globalStats.totalRides.toLocaleString(), icon: CarProfile },
              { label: 'Chauffeurs', value: `${filteredStats.globalStats.activeDrivers || filteredStats.globalStats.totalDrivers}/${filteredStats.globalStats.totalDrivers}`, icon: Users },
              { label: 'Revenus', value: `${(filteredStats.globalStats.totalEarnings / 1000).toLocaleString()}k F`, icon: CurrencyDollar },
              { label: 'Complétion', value: `${filteredStats.globalStats.completionRate.toFixed(1)}%`, icon: TrendUp },
            ].map((kpi, i) => {
              const Icon = kpi.icon
              return (
                <div key={i} style={{ padding: '18px 20px', borderRight: i < 3 ? '1px solid #E2DACD' : 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Icon size={17} weight="fill" style={{ color: '#1F5245' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '23px', fontWeight: 600, letterSpacing: '-0.01em', color: '#12100E' }}>{kpi.value}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>{kpi.label}</span>
                </div>
              )
            })}
          </section>

          {/* Charts Row */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', padding: '22px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '13px', fontWeight: 600, color: '#12100E' }}>Évolution des revenus</h3>
              <div style={{ height: '220px', position: 'relative' }}>
                <svg className="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
                  <path
                    d="M 0 150 L 114 130 L 228 140 L 342 110 L 456 125 L 570 95 L 684 120 L 800 85 L 800 250 L 0 250 Z"
                    fill="rgba(31,82,69,.06)"
                  />
                  <path
                    d="M 0 150 L 114 130 L 228 140 L 342 110 L 456 125 L 570 95 L 684 120 L 800 85"
                    fill="none"
                    stroke="#1F5245"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {[0, 114, 228, 342, 456, 570, 684, 800].map((x, i) => (
                    <circle key={i} cx={x} cy={150 - (i % 3) * 20} r="3" fill="#1F5245" />
                  ))}
                </svg>
                <div className="flex justify-between" style={{ marginTop: '12px', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6E6A63' }}>
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <span key={d}>{d}</span>)}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', padding: '22px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '13px', fontWeight: 600, color: '#12100E' }}>Répartition courses</h3>
              <div className="flex flex-col items-center justify-center" style={{ paddingBottom: '10px' }}>
                <div className="relative" style={{ width: '150px', height: '150px', marginBottom: '20px' }}>
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#F0EAE0" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#1F5245" strokeWidth="12" strokeDasharray="180 251" strokeDashoffset="0" transform="rotate(-90 50 50)" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '19px', fontWeight: 600, color: '#12100E' }}>72%</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6E6A63' }}>Usage</span>
                  </div>
                </div>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1F5245' }} />
                      <span style={{ fontSize: '12px', color: '#3d3a35' }}>Transferts</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#12100E' }}>45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#B4643A' }} />
                      <span style={{ fontSize: '12px', color: '#3d3a35' }}>Privé</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#12100E' }}>35%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Table Performance */}
          <section style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2DACD' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#12100E' }}>Performance chauffeurs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2DACD' }}>
                    <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Chauffeur</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Courses</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Complétion</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Revenus</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.driverStats.map((driver) => (
                    <tr key={driver.driverId} style={{ borderBottom: '1px solid #F0EAE0' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="flex items-center gap-3">
                          <div style={{ width: '30px', height: '30px', borderRadius: '3px', backgroundColor: 'rgba(31,82,69,.08)', display: 'grid', placeItems: 'center', fontSize: '10px', fontWeight: 600, color: '#1F5245' }}>
                            {getInitials(driver.name)}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 600, color: '#12100E' }}>{driver.name}</p>
                            <p style={{ margin: 0, fontSize: '10.5px', color: '#6E6A63' }}>{driver.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#12100E' }}>{driver.totalRides}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="flex items-center gap-3 justify-center">
                          <div style={{ width: '90px', height: '6px', borderRadius: '2px', backgroundColor: '#F0EAE0', overflow: 'hidden' }}>
                            <div style={{ height: '100%', backgroundColor: '#1F5245', width: `${driver.completionRate}%` }} />
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', fontWeight: 600, color: '#12100E' }}>{driver.completionRate.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', fontWeight: 600, color: '#12100E' }}>{driver.totalEarnings.toLocaleString()} F</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

export default AdminGlobalStats
