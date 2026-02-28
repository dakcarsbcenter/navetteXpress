import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  ChartBar,
  CaretLeft,
  Car,
  TrendUp as TrendingUp,
  CreditCard,
  Star,
  Calendar,
  Clock,
  CaretRight,
  Trophy,
  Lightbulb,
  Heart,
  MapPin
} from "@phosphor-icons/react"

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
      const response = await fetch(`/api/driver/stats?period=${selectedPeriod}`)
      if (!response.ok) throw new Error('Erreur lors de la récupération des statistiques')
      const data = await response.json()
      if (data.success && data.data) setStats(data.data)
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const periods = [
    { key: 'week' as const, label: 'Semaine' },
    { key: 'month' as const, label: 'Mois' },
    { key: 'year' as const, label: 'Année' }
  ]

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            weight={(i < Math.floor(rating)) ? "fill" : "regular"}
            className={(i < Math.floor(rating)) ? "text-yellow-500" : "text-gray-600"}
          />
        ))}
      </div>
    )
  }

  const getCompletionRate = () => ((stats.completedRides / (stats.totalRides || 1)) * 100).toFixed(1)
  const getEarningsPerRide = () => (stats.totalEarnings / (stats.totalRides || 1)).toFixed(0)
  const getEarningsPerHour = () => (stats.totalEarnings / ((stats.totalRides || 1) * 1.5)).toFixed(0)
  const getEarningsPerKm = () => (stats.totalEarnings / ((stats.totalRides || 1) * 15)).toFixed(0)

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fadeIn">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{
              backgroundColor: 'var(--color-driver-card)',
              border: '1px solid var(--color-driver-border)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Analyses de Performance
            </h1>
            <p className="text-sm font-mono" style={{ color: 'var(--color-text-muted)' }}>
              Période : {periods.find(p => p.key === selectedPeriod)?.label}
            </p>
          </div>
        </div>

        {/* Sélecteur de période style "Tab" */}
        <div className="flex p-1 rounded-xl shrink-0"
          style={{ backgroundColor: 'var(--color-driver-card)', border: '1px solid var(--color-driver-border)' }}>
          {periods.map(period => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className="px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
              style={{
                backgroundColor: selectedPeriod === period.key ? 'var(--color-driver-accent)' : 'transparent',
                color: selectedPeriod === period.key ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN STATS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Total Courses */}
        <div className="driver-card-enter rounded-2xl p-6 relative overflow-hidden group"
          style={{ backgroundColor: 'var(--color-driver-card)', border: '1px solid var(--color-driver-border)' }}>
          <div className="absolute -right-4 -top-4 text-blue-500/10 group-hover:scale-110 transition-transform duration-500">
            <Car size={100} weight="light" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--color-driver-accent)' }}>
              <ChartBar size={20} weight="fill" />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Total Courses</span>
          </div>
          <p className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {stats.totalRides}
          </p>
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
            <span className="text-emerald-500">✓ {stats.completedRides}</span>
            <span className="text-red-500">✕ {stats.cancelledRides}</span>
          </div>
        </div>

        {/* Revenus Totaux */}
        <div className="driver-card-enter rounded-2xl p-6 relative overflow-hidden group"
          style={{ backgroundColor: 'var(--color-driver-card)', border: '1px solid var(--color-driver-border)', animationDelay: '0.1s' }}>
          <div className="absolute -right-4 -top-4 text-emerald-500/10 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp size={100} weight="light" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-500"
              style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
              <TrendingUp size={20} weight="bold" />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Revenus Totaux</span>
          </div>
          <p className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {stats.totalEarnings.toLocaleString()} <span className="text-sm font-normal text-emerald-500">FCFA</span>
          </p>
          <div className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">
            Optimisé par volume
          </div>
        </div>

        {/* Revenus par Course */}
        <div className="driver-card-enter rounded-2xl p-6 relative overflow-hidden group"
          style={{ backgroundColor: 'var(--color-driver-card)', border: '1px solid var(--color-driver-border)', animationDelay: '0.2s' }}>
          <div className="absolute -right-4 -top-4 text-blue-500/10 group-hover:scale-110 transition-transform duration-500">
            <CreditCard size={100} weight="light" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-400"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
              <CreditCard size={20} weight="bold" />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Moy. / Course</span>
          </div>
          <p className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {getEarningsPerRide()} <span className="text-sm font-normal text-blue-400">FCFA</span>
          </p>
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
            <span className="text-blue-400">{getCompletionRate()}% Complétion</span>
          </div>
        </div>

        {/* Note Moyenne */}
        <div className="driver-card-enter rounded-2xl p-6 relative overflow-hidden group"
          style={{ backgroundColor: 'var(--color-driver-card)', border: '1px solid var(--color-driver-border)', animationDelay: '0.3s' }}>
          <div className="absolute -right-4 -top-4 text-yellow-500/10 group-hover:scale-110 transition-transform duration-500">
            <Star size={100} weight="fill" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-yellow-500"
              style={{ backgroundColor: 'rgba(234,179,8,0.1)' }}>
              <Star size={20} weight="fill" />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Note Moyenne</span>
          </div>
          <p className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {stats.averageRating}<span className="text-sm font-normal text-gray-500">/5</span>
          </p>
          <div className="flex items-center justify-between">
            {getRatingStars(stats.averageRating)}
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              {stats.totalRatings} AVIS
            </span>
          </div>
        </div>
      </div>

      {/* ── CHARTS & ANALYTICS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Performance Mensuelle (Graphique à barres horizontal) */}
        <div className="driver-card-enter rounded-2xl p-6"
          style={{ backgroundColor: 'var(--color-driver-card)', border: '1px solid var(--color-driver-border)' }}>
          <div className="flex items-center gap-2 mb-8">
            <Calendar className="text-blue-500" size={18} weight="light" />
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Performance Mensuelle</h3>
          </div>
          <div className="space-y-6">
            {stats.monthlyData.map((month, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{month.month}</span>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-white">{month.rides} courses</span>
                    <span className="block text-[10px] font-mono text-emerald-500">{month.earnings.toLocaleString()} FCFA</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${(month.rides / (Math.max(...stats.monthlyData.map(m => m.rides)) || 1)) * 100}%`,
                      background: 'linear-gradient(90deg, #3B82F6 0%, #6366F1 100%)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition des Notes */}
        <div className="driver-card-enter rounded-2xl p-6"
          style={{ backgroundColor: 'var(--color-driver-card)', border: '1px solid var(--color-driver-border)', animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-8">
            <Star className="text-yellow-500" size={18} weight="fill" />
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Répartition des Avis</h3>
          </div>
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map(stars => {
              const rating = stats.ratingDistribution.find(r => r.stars === stars) || { count: 0, percentage: 0 };
              const maxCount = Math.max(...stats.ratingDistribution.map(r => r.count)) || 1;
              return (
                <div key={stars} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-12 shrink-0">
                    <span className="text-xs font-bold text-white">{stars}</span>
                    <Star size={12} weight="fill" className="text-yellow-500" />
                  </div>
                  <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(rating.count / maxCount) * 100}%`,
                        backgroundColor: stars >= 4 ? '#10B981' : stars >= 3 ? '#F59E0B' : '#EF4444'
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono w-10 text-right text-gray-500">
                    {rating.count}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 flex justify-around text-center">
            <div>
              <p className="text-lg font-bold text-white">{stats.totalRatings}</p>
              <p className="text-[9px] uppercase font-bold text-gray-500 tracking-tighter">Total Avis</p>
            </div>
            <div>
              <p className="text-lg font-bold text-yellow-500">{stats.averageRating}</p>
              <p className="text-[9px] uppercase font-bold text-gray-500 tracking-tighter">Note Finale</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── PEAK HOURS & TOP ROUTES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Heures de Pointe */}
        <div className="driver-card-enter rounded-2xl p-6"
          style={{ backgroundColor: 'var(--color-driver-card)', border: '1px solid var(--color-driver-border)' }}>
          <div className="flex items-center gap-2 mb-8">
            <Clock className="text-blue-500" size={18} weight="light" />
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Heures de Pointe</h3>
          </div>
          <div className="flex items-end justify-between h-[180px] pt-4 gap-1">
            {stats.peakHours.map((hourData, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full h-full flex items-end">
                  <div
                    className="w-full rounded-t-lg transition-all duration-700 hover:brightness-125"
                    style={{
                      height: `${(hourData.rides / (Math.max(...stats.peakHours.map(h => h.rides)) || 1)) * 100}%`,
                      backgroundColor: 'rgba(59,130,246,0.2)',
                      borderTop: '2px solid #3B82F6'
                    }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {hourData.rides} runs
                  </div>
                </div>
                <span className="text-[9px] font-mono text-gray-500 leading-none">{hourData.hour}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trajets les Plus Fréquents */}
        <div className="driver-card-enter rounded-2xl p-6"
          style={{ backgroundColor: 'var(--color-driver-card)', border: '1px solid var(--color-driver-border)', animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-8">
            <MapPin className="text-blue-500" size={18} weight="light" />
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Trajets les Plus Fréquents</h3>
          </div>
          <div className="space-y-3">
            {stats.topRoutes.slice(0, 4).map((route, idx) => (
              <div key={idx} className="p-4 rounded-xl transition-all hover:bg-white/5 border border-white/[0.03]"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white truncate max-w-[70%]">
                    {route.from.split(',')[0]} <CaretRight size={10} weight="bold" className="text-gray-500" /> {route.to.split(',')[0]}
                  </div>
                  <span className="text-[10px] font-mono text-blue-400">{route.count} x</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-[10px] text-gray-500 italic">Prix moyen: {route.avgPrice} FCFA</div>
                  <div className="text-sm font-bold text-emerald-500">{(route.count * route.avgPrice).toLocaleString()} FCFA</div>
                </div>
              </div>
            ))}
            {stats.topRoutes.length === 0 && (
              <div className="text-center py-8 text-sm italic text-gray-600">
                Pas assez de données pour les trajets fréquents.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ANALYSES & CONSEILS ── */}
      <div className="driver-card-enter rounded-2xl p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(10:15:25,1) 100%)',
          border: '1px solid rgba(59,130,246,0.1)'
        }}>
        <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
          <Lightbulb className="text-yellow-500" size={20} weight="fill" />
          Analyses & Conseils Personnalisés
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-blue-400"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
              <Trophy size={24} weight="fill" />
            </div>
            <h4 className="text-sm font-bold text-white">Performance</h4>
            <p className="text-xs leading-relaxed text-gray-400">
              Votre taux de complétion de <span className="text-emerald-500 font-bold">{getCompletionRate()}%</span> est exceptionnel. Vous faites partie de nos meilleurs chauffeurs.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-400"
              style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
              <TrendingUp size={24} weight="bold" />
            </div>
            <h4 className="text-sm font-bold text-white">Optimisation</h4>
            <p className="text-xs leading-relaxed text-gray-400">
              Les créneaux de fin de journée semblent les plus rentables pour vous. Maximisez vos sorties entre <span className="text-blue-400 font-bold">17h et 20h</span>.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-rose-400"
              style={{ backgroundColor: 'rgba(244,63,94,0.1)' }}>
              <Heart size={24} weight="fill" />
            </div>
            <h4 className="text-sm font-bold text-white">Relation Client</h4>
            <p className="text-xs leading-relaxed text-gray-400">
              Votre note de <span className="text-yellow-500 font-bold">{stats.averageRating}/5</span> est stable. Les passagers apprécient votre ponctualité.
            </p>
          </div>

        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-4">
  <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-pulse"
       style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>
    Navette Xpress
  </div>
</div>
            <p className="text-white font-bold animate-pulse">Analyse des données...</p>
          </div>
        </div>
      )}

    </div>
  )
}

