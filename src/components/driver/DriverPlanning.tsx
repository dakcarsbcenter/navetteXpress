"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  MagnifyingGlass as Search,
  Funnel as Filter,
  Calendar as CalendarIcon,
  CaretLeft,
  Phone,
  MapPin,
  NavigationArrow as Navigation,
  Clock,
  Eye,
  X,
  CheckCircle,
  WarningCircle as AlertCircle,
  TrendUp as TrendingUp,
  Car,
  DotsThreeVertical as MoreVertical
} from "@phosphor-icons/react"
import { MissionStatusBadge } from './MissionStatusBadge'

interface PlanningProps {
  onBack: () => void
}

interface Booking {
  id: number
  client: string
  phone: string
  pickup: string
  destination: string
  date: string
  time: string
  status: 'confirmed' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'assigned'
  vehicle: string
  price: number
  duration: string
  notes?: string
}

interface BookingData {
  id: number
  customerName: string
  customerPhone: string
  pickupAddress: string
  dropoffAddress: string
  scheduledDateTime: string
  status: string
  price: string | number
  vehicle?: {
    make: string
    model: string
    licensePlate: string
    color: string
  }
}

interface APIResponse {
  success: boolean
  data: Array<{
    booking: BookingData
    vehicle: any
  }>
}

export function DriverPlanning({ onBack }: PlanningProps) {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('today')
  const [sortBy, setSortBy] = useState<'date' | 'client' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Récupérer les réservations du chauffeur
  useEffect(() => {
    if (session?.user && 'role' in session.user && session.user.role === 'driver') {
      fetchDriverBookings()
    }
  }, [session])

  // Filtrer et trier les réservations
  useEffect(() => {
    let result = [...bookings]

    if (searchTerm) {
      result = result.filter(booking =>
        booking.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.phone.includes(searchTerm)
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter(booking => booking.status === statusFilter)
    }

    const today = new Date().toISOString().split('T')[0]
    if (dateFilter === 'today') {
      result = result.filter(booking => booking.date === today)
    } else if (dateFilter === 'upcoming') {
      result = result.filter(booking => booking.date >= today)
    } else if (dateFilter === 'past') {
      result = result.filter(booking => booking.date < today)
    }

    result.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'date') {
        const dateA = new Date(`${a.date} ${a.time}`)
        const dateB = new Date(`${b.date} ${b.time}`)
        comparison = dateA.getTime() - dateB.getTime()
      } else if (sortBy === 'client') {
        comparison = a.client.localeCompare(b.client)
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredBookings(result)
  }, [bookings, searchTerm, statusFilter, dateFilter, sortBy, sortOrder])

  const fetchDriverBookings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/driver/bookings')
      if (!response.ok) throw new Error('Erreur lors de la récupération des réservations')
      const data: APIResponse = await response.json()
      if (data.success && data.data) {
        const transformedBookings: Booking[] = data.data.map(item => {
          const scheduledDate = new Date(item.booking.scheduledDateTime)
          return {
            id: item.booking.id,
            client: item.booking.customerName,
            phone: item.booking.customerPhone,
            pickup: item.booking.pickupAddress,
            destination: item.booking.dropoffAddress,
            date: scheduledDate.toISOString().split('T')[0],
            time: scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            status: item.booking.status as any,
            vehicle: item.vehicle ? `${item.vehicle.make} ${item.vehicle.model}` : 'Véhicule non assigné',
            price: typeof item.booking.price === 'string' ? parseFloat(item.booking.price) : item.booking.price,
            duration: "30 min"
          }
        })
        setBookings(transformedBookings)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(date)
  }

  const openDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsModalOpen(true)
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleBookingAction = async (action: 'confirm' | 'reject') => {
    if (!selectedBooking) return
    setIsUpdating(true)
    try {
      const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled'
      const response = await fetch(`/api/driver/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour')
      }
      setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: newStatus as any } : b))
      showToast(action === 'confirm' ? 'Réservation confirmée avec succès ✅' : 'Réservation rejetée avec succès ❌', 'success')
      setIsModalOpen(false)
      setSelectedBooking(null)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erreur lors de la mise à jour', 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fadeIn">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-white dark:bg-driver-card border border-gray-300 dark:border-driver-border text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Planning des Missions
            </h1>
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
              Flux en temps réel • {filteredBookings.length} assignées
            </p>
          </div>
        </div>

        {/* Quick Stats style "Road" */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white dark:bg-driver-card border border-gray-200 dark:border-driver-border">
          <div className="px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-tight">
            Aujourd'hui : {bookings.filter(b => b.date === new Date().toISOString().split('T')[0]).length} trajets
          </div>
          <div className="px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-tight">
            Total : {filteredBookings.reduce((sum, b) => sum + b.price, 0).toLocaleString()} FCFA
          </div>
        </div>
      </div>

      {/* ── FILTERS & SEARCH ── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-driver-card border border-gray-200 dark:border-driver-border shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar stylish */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-500 transition-colors" size={18} weight="bold" />
            <input
              type="text"
              placeholder="Nom du client, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white outline-none placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Custom Selects "Road Mode" */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={16} weight="bold" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm appearance-none text-gray-900 dark:text-white outline-none focus:border-blue-500"
              >
                <option value="all">Statut (Tous)</option>
                <option value="assigned">Assigné</option>
                <option value="confirmed">Confirmé</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminé</option>
              </select>
            </div>
            <div className="relative flex-1">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={16} weight="bold" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm appearance-none text-gray-900 dark:text-white outline-none focus:border-blue-500"
              >
                <option value="today">Aujourd'hui</option>
                <option value="upcoming">À venir</option>
                <option value="past">Historique</option>
                <option value="all">Tout</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={() => fetchDriverBookings()}
              className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-xs font-bold uppercase text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* ── MISSIONS LIST (CARD-BASED) ── */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-4">
  <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-linear-to-r from-gold via-white to-gold animate-pulse"
       style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>
    Navette Xpress
  </div>
</div>
            <p className="font-mono text-sm text-blue-400 animate-pulse">SYNCHRONISATION DU FLUX...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border-2 border-dashed border-white/5">
            <AlertCircle size={48} weight="light" className="mx-auto text-gray-700 mb-4" />
            <h3 className="text-lg font-bold text-gray-500">Aucune mission trouvée</h3>
            <p className="text-sm text-gray-600">Ajustez vos filtres ou contactez le dispatching.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                onClick={() => openDetails(booking)}
                className="driver-card-enter group relative p-5 rounded-2xl bg-white dark:bg-driver-card border border-gray-200 dark:border-driver-border hover:border-blue-500 transition-all cursor-pointer overflow-hidden"
              >
                {/* Status indicator on the left edge */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${booking.status === 'confirmed' ? 'bg-emerald-500' :
                  booking.status === 'in_progress' ? 'bg-blue-500' :
                    booking.status === 'completed' ? 'bg-purple-500' : 'bg-orange-500'
                  }`} />

                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center border border-gray-300 dark:border-white/10 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/10 transition-colors">
                      <span className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {booking.client.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">{booking.client}</h3>
                      <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                        <Clock size={10} weight="bold" /> {formatDate(booking.date)} • {booking.time}
                      </div>
                    </div>
                  </div>
                  <MissionStatusBadge statut={booking.status} size="sm" />
                </div>

                <div className="grid grid-cols-1 gap-3 py-4 border-y border-gray-200 dark:border-white/5">
                  <div className="flex items-start gap-2">
                    <MapPin className="text-emerald-500 mt-1 shrink-0" size={14} weight="fill" />
                    <span className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">{booking.pickup}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation className="text-blue-500 mt-1 shrink-0" size={14} weight="fill" />
                    <span className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">{booking.destination}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-3">
                    <a
                      href={(() => {
                        // Sanitize phone: allow only digits and + prefix to prevent XSS via tel: links
                        // snyk:ignore[javascript/DOMXSS] - phone number is sanitized to digits/+ only before use in tel: URI
                        const sanitized = (booking.phone || '').replace(/[^+\d]/g, '')
                        return /* snyk:ignore[javascript/DOMXSS] */sanitized.length >= 7 ? `tel:${sanitized}` : '#'
                      })()}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                    >
                      <Phone size={16} weight="fill" />
                    </a>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-500 font-bold">{booking.price.toLocaleString()} FCFA</span>
                  </div>
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye size={16} weight="bold" className="text-blue-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL DETAILS (ROAD MODE) ── */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-100 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-driver-bg border border-gray-300 dark:border-driver-border rounded-3xl shadow-2xl overflow-hidden animate-slide-up">

            {/* Header Modal */}
            <div className="relative h-32 bg-linear-to-br from-blue-600 to-indigo-900 p-6 flex flex-col justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/80 transition-all"
              >
                <X size={20} weight="bold" />
              </button>
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{selectedBooking.client}</h2>
                  <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                    <Phone size={14} weight="fill" /> {selectedBooking.phone}
                  </div>
                </div>
                <MissionStatusBadge statut={selectedBooking.status} />
              </div>
            </div>

            <div className="p-6 space-y-6">

              {/* Info Trajet Box */}
              <div className="space-y-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center pt-1 gap-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <div className="w-0.5 h-10 bg-gray-300 dark:bg-white/10" />
                    <Navigation size={14} weight="fill" className="text-blue-500" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-widest">Enlèvement</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{selectedBooking.pickup}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-widest">Destination</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{selectedBooking.destination}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 2 col pour Heure / Prix / Véhicule */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10">
                  <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Timing</p>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white font-mono">
                    <Clock size={16} weight="bold" className="text-blue-600 dark:text-blue-400" /> {selectedBooking.time}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10">
                  <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Revenu Mission</p>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    <TrendingUp size={16} weight="bold" /> {selectedBooking.price.toLocaleString()} FCFA
                  </div>
                </div>
                <div className="col-span-2 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10">
                  <p className="text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-widest">Véhicule Assigné</p>
                  <div className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
                    <Car size={16} weight="light" className="text-gray-600 dark:text-gray-400" /> {selectedBooking.vehicle}
                  </div>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="p-4 rounded-xl bg-orange-100 dark:bg-orange-500/5 border border-orange-300 dark:border-orange-500/20">
                  <p className="text-[10px] font-bold uppercase text-orange-700 dark:text-orange-400 mb-1">Instructions Supplémentaires</p>
                  <p className="text-xs text-orange-800 dark:text-orange-100/70">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Action Buttons Road Mode */}
              <div className="pt-2">
                {(selectedBooking.status === 'assigned' || selectedBooking.status === 'pending') ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleBookingAction('reject')}
                      disabled={isUpdating}
                      className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white font-bold hover:bg-red-100 dark:hover:bg-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 transition-all disabled:opacity-50"
                    >
                      <X size={18} weight="bold" /> Rejeter
                    </button>
                    <button
                      onClick={() => handleBookingAction('confirm')}
                      disabled={isUpdating}
                      className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                      {isUpdating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle size={18} weight="bold" /> Confirmer</>}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-4 rounded-2xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                  >
                    Fermer l'Aperçu
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-200 animate-slide-up">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${toast.type === 'success'
            ? 'bg-white dark:bg-driver-bg border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-400'
            : 'bg-white dark:bg-driver-bg border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-400'
            }`}>
            {toast.type === 'success' ? <CheckCircle size={20} weight="fill" /> : <AlertCircle size={20} weight="fill" />}
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
