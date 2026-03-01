"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Users,
  Car,
  CalendarCheck,
  CurrencyDollar as DollarSign,
  ArrowRight,
  ShieldCheck,
  Star,
  ChartBar as BarChart3,
  Clock,
  Pulse as Activity,
  Lightning as Zap,
  CaretRight as ChevronRight,
  Megaphone,
  MapPin
} from "@phosphor-icons/react"

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

interface RecentBooking {
  id: number
  customerName: string
  status: string
  price?: string | null
  scheduledDateTime: string
  pickupAddress: string
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
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
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Mise à jour de l'heure en temps réel
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Chargement des statistiques et réservations récentes
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
        monthlyGrowth: { users: 0, bookings: 0, revenue: 0 }
      }

      try {
        setIsLoading(true)

        // Fetch stats and recent bookings in parallel
        const [statsRes, bookingsRes] = await Promise.all([
          fetch('/api/admin/overview'),
          fetch('/api/admin/bookings')
        ])

        if (statsRes.ok) {
          const data = await statsRes.json()
          const apiData = data.data || {}
          setStats({
            ...defaultStats,
            ...apiData,
            monthlyGrowth: {
              users: apiData.monthlyGrowth?.users ?? 0,
              bookings: apiData.monthlyGrowth?.bookings ?? 0,
              revenue: apiData.monthlyGrowth?.revenue ?? 0
            }
          })
        }

        if (bookingsRes.ok) {
          const data = await bookingsRes.json()
          if (data.success && Array.isArray(data.data)) {
            const recent = data.data.slice(0, 8).map((item: any) => ({
              id: item.booking?.id || 0,
              customerName: item.booking?.customerName || 'Inconnu',
              status: item.booking?.status || 'pending',
              price: item.booking?.price,
              scheduledDateTime: item.booking?.scheduledDateTime || '',
              pickupAddress: item.booking?.pickupAddress || ''
            }))
            setRecentBookings(recent)
          }
        }

      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const userRole = (session?.user as { role?: string })?.role
    if (session?.user && userRole === 'admin') {
      fetchStats()
    } else {
      setIsLoading(false)
    }
  }, [session])

  const userRole = (session?.user as { role?: string })?.role
  const isAdmin = userRole === 'admin'
  const userName = session?.user?.name || 'Opérateur'

  // Quick actions with lucide-react icons
  const allQuickActions: QuickAction[] = [
    {
      id: 'users', title: 'Utilisateurs', description: 'Comptes et accès',
      icon: <Users size={18} />, color: '#3B82F6',
      onClick: () => onNavigate('users')
    },
    {
      id: 'vehicles', title: 'Flotte', description: 'Véhicules & maintenance',
      icon: <Car size={18} />, color: '#10B981',
      onClick: () => onNavigate('vehicles')
    },
    {
      id: 'bookings', title: 'Réservations', description: 'Suivi en temps réel',
      icon: <CalendarCheck size={18} />, color: '#F59E0B',
      onClick: () => onNavigate('bookings')
    },
    {
      id: 'stats', title: 'Analytics', description: 'Performances',
      icon: <BarChart3 size={18} />, color: '#8B5CF6',
      onClick: () => onNavigate('stats'),
      adminOnly: true
    },
    {
      id: 'permissions', title: 'Permissions', description: 'Contrôle d\'accès',
      icon: <ShieldCheck size={18} />, color: '#EF4444',
      onClick: () => onNavigate('permissions'),
      adminOnly: true
    },
    {
      id: 'reviews', title: 'Avis Clients', description: 'Satisfaction',
      icon: <Star size={18} />, color: '#F59E0B',
      onClick: () => onNavigate('reviews')
    },
    {
      id: 'locations', title: 'Lieux', description: 'Gérer les adresses',
      icon: <MapPin size={18} />, color: '#10B981',
      onClick: () => onNavigate('locations'),
      adminOnly: true
    },
    {
      id: 'ads', title: 'Publicités', description: 'Gérer les pubs',
      icon: <Megaphone size={18} />, color: '#6366f1',
      onClick: () => onNavigate('ads')
    }
  ]

  const quickActions = allQuickActions.filter(action => !action.adminOnly || isAdmin)

  // Helper: format relative time
  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return '—'
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'À l\'instant'
    if (mins < 60) return `Il y a ${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${Math.floor(hours / 24)}j`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-pulse"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>
            Navette Xpress
          </div>
        </div>
      </div>
    )
  }

  // KPI Data
  const kpiData = [
    {
      label: 'Revenu Total',
      value: `${stats.totalRevenue.toLocaleString('fr-FR')} F`,
      growth: stats.monthlyGrowth?.revenue,
      color: '#C9A84C',
      icon: <DollarSign size={18} />
    },
    {
      label: 'Réservations',
      value: stats.totalBookings.toString(),
      growth: stats.monthlyGrowth?.bookings,
      color: '#3B82F6',
      icon: <CalendarCheck size={18} />
    },
    {
      label: 'Flotte Active',
      value: stats.activeVehicles.toString(),
      color: '#10B981',
      icon: <Car size={18} />
    },
    {
      label: 'Clients',
      value: stats.totalUsers.toString(),
      growth: stats.monthlyGrowth?.users,
      color: '#8B5CF6',
      icon: <Users size={18} />
    },
    {
      label: 'Complétion',
      value: `${stats.totalBookings > 0 ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%`,
      color: '#F59E0B',
      icon: <Activity size={18} />
    },
  ]

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* HERO HEADER */}
      <div className="relative p-6 rounded-2xl border border-white/5 overflow-hidden"
        style={{ backgroundColor: 'var(--color-dash-card)' }}>
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, var(--color-gold) 0%, transparent 70%)' }} />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="status-pulse w-2 h-2 rounded-full block" style={{ backgroundColor: '#10B981' }} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
                Système Opérationnel
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Bienvenue, <span style={{ color: 'var(--color-gold)' }}>{userName}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Centre de commande — Tableau de bord principal
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-white font-mono tracking-tight">
                {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="hidden md:flex w-px h-10 bg-white/5" />
            <div className="hidden md:flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">En attente</span>
              <span className="text-xl font-bold font-mono" style={{ color: 'var(--color-gold)' }}>
                {stats.pendingBookings}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiData.map((kpi, i) => (
          <div
            key={i}
            className="group p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            style={{
              backgroundColor: 'var(--color-dash-card)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: kpi.color }} />

            <div className="flex justify-between items-start mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}>
                {kpi.icon}
              </div>
              {kpi.growth !== undefined && (
                <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${kpi.growth >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                  {kpi.growth >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {kpi.growth >= 0 ? '+' : ''}{kpi.growth}%
                </div>
              )}
            </div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">
              {kpi.label}
            </p>
            <h3 className="text-xl font-bold text-white font-mono tracking-tight">
              {kpi.value}
            </h3>
          </div>
        ))}
      </div>

      {/* ACTIVITY & RECENT BOOKINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ACTIVITÉ (60%) */}
        <div className="lg:col-span-3 p-6 rounded-2xl border border-white/5"
          style={{ backgroundColor: 'var(--color-dash-card)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity size={14} style={{ color: 'var(--color-gold)' }} />
                Activité Plateforme
              </h4>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">
                Aperçu des flux sur les 7 derniers jours
              </p>
            </div>
            <select id="period-filter" name="period" className="bg-white/5 border border-white/10 text-[10px] text-slate-400 uppercase tracking-widest rounded-lg px-3 py-1.5 outline-none focus:border-gold/50 cursor-pointer appearance-none">
              <option>7 jours</option>
              <option>30 jours</option>
            </select>
          </div>

          {/* Mini bar chart visualization */}
          <div className="h-[260px] flex items-end gap-2 px-2 pt-4 pb-2 relative">
            {/* Horizontal guide lines */}
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="absolute left-0 right-0 border-t border-white/[0.03]"
                style={{ top: `${20 + i * 20}%` }} />
            ))}

            {/* Bars */}
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => {
              const barHeights = [65, 80, 55, 90, 75, 45, 60]
              const values = [12, 18, 9, 22, 15, 8, 11]
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2 group relative z-10">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 bg-[#1a1a2e] border border-white/10 rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                    <span className="text-[10px] text-white font-bold font-mono">{values[i]} réserv.</span>
                  </div>
                  <div
                    className="w-full rounded-t-lg transition-all duration-500 group-hover:brightness-125 relative overflow-hidden"
                    style={{
                      height: `${barHeights[i]}%`,
                      background: `linear-gradient(to top, ${i === 3 ? 'var(--color-gold)' : 'rgba(201,168,76,0.3)'}, transparent)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{day}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* RÉSERVATIONS RÉCENTES (40%) */}
        <div className="lg:col-span-2 flex flex-col rounded-2xl border border-white/5 overflow-hidden"
          style={{ backgroundColor: 'var(--color-dash-card)' }}>

          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock size={14} style={{ color: 'var(--color-gold)' }} />
              Flux Récents
            </h4>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              {recentBookings.length} entrées
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[340px] dash-scroll">
            {recentBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-700">
                  <CalendarCheck size={24} />
                </div>
                <p className="text-[11px] text-slate-600 italic">Aucune donnée récente</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.02]">
                {recentBookings.map((booking, i) => (
                  <div key={booking.id || i}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => onNavigate('bookings')}>

                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold bg-white/5 border border-white/10 text-slate-500 shrink-0 group-hover:bg-gold group-hover:text-black group-hover:border-gold transition-all">
                      {booking.customerName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-gold transition-colors">
                        {booking.customerName}
                      </p>
                      <p className="text-[10px] text-slate-600 font-mono truncate">
                        {booking.pickupAddress || `IDX-${booking.id}`}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge statut={booking.status} />
                      <span className="text-[10px] text-slate-600 font-mono">
                        {booking.price ? `${parseFloat(booking.price).toLocaleString()} F` : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/5 bg-white/[0.01]">
            <button
              onClick={() => onNavigate('bookings')}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold rounded-xl border border-white/5 transition-all hover:bg-gold/5"
              style={{ color: 'var(--color-gold)' }}>
              Voir toutes les réservations
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Zap size={14} style={{ color: 'var(--color-gold)' }} />
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Accès Rapide</h4>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-200 hover:-translate-y-0.5 text-center"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                style={{ backgroundColor: `${action.color}12`, color: action.color }}>
                {action.icon}
              </div>
              <div>
                <h5 className="text-[11px] font-bold text-white group-hover:text-gold transition-colors leading-tight">{action.title}</h5>
                <p className="text-[9px] text-slate-600 mt-0.5 leading-tight">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
