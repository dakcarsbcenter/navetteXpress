"use client"

import React, { useState, useEffect } from "react"
import {
  MagnifyingGlass as Search,
  SquaresFour as Grid,
  List,
  Plus,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Envelope as Mail
} from "@phosphor-icons/react"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { useNotification } from "@/hooks/useNotification"
import { BookingDetailsModal } from "./BookingDetailsModal"
import { StatusBadge } from "@/components/ui/StatusBadge"

interface Booking {
  id: number
  customerName: string
  customerEmail: string
  customerPhone: string
  pickupAddress: string
  dropoffAddress: string
  scheduledDateTime: string
  status: 'pending' | 'assigned' | 'approved' | 'rejected' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  driverId: string | null
  vehicleId: number | null
  price?: string | null
  notes?: string
  passengers?: number
  createdAt: string
  driver?: {
    id: string
    name: string
    email: string
    image?: string
  }
  vehicle?: {
    id: number
    make: string
    model: string
    plateNumber: string
    photo?: string
  }
}

interface Driver {
  id: string
  name: string
  email: string
  phone?: string
}

interface Vehicle {
  id: string
  make: string
  model: string
  plateNumber: string
}

export function BookingsManagementRedesigned() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { notifications, showSuccess, showError, removeNotification } = useNotification()

  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const [filters, setFilters] = useState({
    status: 'pending',
    driver: 'all',
    search: ''
  })

  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  useEffect(() => {
    fetchBookings()
    fetchDrivers()
    fetchVehicles()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [bookings, filters])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })

      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`)

      const result = await response.json()

      if (result.success) {
        const normalized: Booking[] = Array.isArray(result.data)
          ? result.data.map((row: any) => {
            const b = row.booking ?? row
            return {
              id: b.id,
              customerName: b.customerName,
              customerEmail: b.customerEmail,
              customerPhone: b.customerPhone,
              pickupAddress: b.pickupAddress,
              dropoffAddress: b.dropoffAddress,
              scheduledDateTime: b.scheduledDateTime,
              status: b.status,
              driverId: b.driverId,
              vehicleId: b.vehicleId,
              price: b.price,
              notes: b.notes,
              passengers: b.passengers || 1,
              createdAt: b.createdAt,
              driver: row.driver,
              vehicle: row.vehicle
            }
          })
          : []
        setBookings(normalized)
      } else {
        showError(result.error || 'Erreur inconnue', 'Erreur')
      }
    } catch (error) {
      console.error('❌ Erreur:', error)
      showError(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'Erreur')
      setBookings([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=driver', { cache: 'no-store' })
      if (response.ok) {
        const result = await response.json()
        if (result.success) setDrivers(result.data || [])
      }
    } catch (error) {
      console.error('Erreur chauffeurs:', error)
    }
  }

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles', { cache: 'no-store' })
      if (response.ok) {
        const result = await response.json()
        if (result.success) setVehicles(result.data || [])
      }
    } catch (error) {
      console.error('Erreur véhicules:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...bookings]

    if (filters.status !== 'all') {
      filtered = filtered.filter(b => b.status === filters.status)
    }

    if (filters.driver !== 'all') {
      filtered = filtered.filter(b => b.driverId === filters.driver)
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(b =>
        b.id.toString().includes(searchTerm) ||
        b.customerName.toLowerCase().includes(searchTerm) ||
        b.pickupAddress.toLowerCase().includes(searchTerm) ||
        b.dropoffAddress.toLowerCase().includes(searchTerm)
      )
    }

    setFilteredBookings(filtered)
  }

  const openBookingDetails = (booking: Booking) => {
    setSelectedBookingForDetails(booking)
    setIsDetailsModalOpen(true)
  }

  const closeBookingDetails = () => {
    setIsDetailsModalOpen(false)
    setSelectedBookingForDetails(null)
  }

  const handleBookingUpdate = () => {
    fetchBookings()
    showSuccess('Réservation mise à jour avec succès', 'Succès')
  }

  const getStatsData = () => {
    const total = bookings.length
    const pending = bookings.filter(b => b.status === 'pending').length
    const assigned = bookings.filter(b => b.status === 'assigned').length
    const confirmed = bookings.filter(b => b.status === 'confirmed').length
    const inProgress = bookings.filter(b => b.status === 'in_progress').length

    return { total, pending, assigned, confirmed, inProgress }
  }

  const stats = getStatsData()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"
          style={{ borderColor: 'var(--color-gold) transparent transparent transparent' }}></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Header & Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 flex flex-col justify-between"
          style={{ backgroundColor: 'var(--color-dash-card)' }}>
          <div>
            <h2 className="text-xl font-bold text-white">Logistique & Flux</h2>
            <p className="text-xs text-slate-500 mt-1">Supervision du trafic et des réservations</p>
          </div>

          <div className="mt-6 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                placeholder="Trajet, passager, ID..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-gold/50 transition-all bg-white/5 text-white"
              />
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all bg-white/5">
              {viewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
            </button>
          </div>
        </div>

        {[
          { label: 'Attente', value: stats.pending, color: 'var(--color-status-pending)', icon: <Clock size={16} /> },
          { label: 'Assignés', value: stats.assigned, color: 'var(--color-status-assigned)', icon: <User size={16} /> },
          { label: 'Confirmés', value: stats.confirmed, color: 'var(--color-status-confirmed)', icon: <MapPin size={16} /> },
          { label: 'En Cours', value: stats.inProgress, color: 'var(--color-status-inprogress)', icon: <Clock size={16} className="animate-pulse" /> },
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center"
            style={{ backgroundColor: 'var(--color-dash-card)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white font-mono">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-white/5" style={{ backgroundColor: 'var(--color-dash-card)' }}>
        <div className="flex items-center gap-2">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 outline-none focus:border-gold/50 cursor-pointer appearance-none min-w-[140px]">
            <option value="all">Tous les États</option>
            <option value="pending">En attente</option>
            <option value="assigned">Assignées</option>
            <option value="confirmed">Confirmées</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminées</option>
            <option value="cancelled">Annulées</option>
          </select>

          <select
            value={filters.driver}
            onChange={(e) => setFilters({ ...filters, driver: e.target.value })}
            className="text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 outline-none focus:border-gold/50 cursor-pointer appearance-none min-w-[160px]">
            <option value="all">Personnel: Tous</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {/* TODO */ }}
          className="sm:ml-auto btn-gold flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-gold/10">
          <Plus size={16} />
          Planifier Transfert
        </button>
      </div>

      {/* Main Content View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border border-white/5 rounded-2xl bg-white/[0.01]">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-700 mb-4">
                <Calendar size={32} />
              </div>
              <p className="text-slate-500 italic text-sm">Zone de silence - Aucune donnée active</p>
            </div>
          ) : (
            filteredBookings.map((booking, i) => (
              <div
                key={booking.id}
                onClick={() => openBookingDetails(booking)}
                className="group p-5 rounded-2xl border border-white/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer relative overflow-hidden"
                style={{ backgroundColor: 'var(--color-dash-card)' }}
              >
                {/* Visual indicator bar */}
                <div className="absolute top-0 left-0 w-1 h-full opacity-30 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: `var(--color-status-${booking.status.replace(/_/g, '')})` || 'var(--color-gold)' }} />

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border border-white/10 bg-white/5 text-gold group-hover:bg-gold group-hover:text-black transition-all">
                        {getInitials(booking.customerName)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#09090F] flex items-center justify-center bg-slate-800 text-[8px] text-white">
                        {booking.passengers}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight group-hover:text-gold transition-colors">{booking.customerName}</h3>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-tighter">IDX-{booking.id.toString().padStart(4, '0')}</p>
                    </div>
                  </div>
                  <StatusBadge statut={booking.status} />
                </div>

                <div className="space-y-4 mb-6 relative">
                  <div className="absolute left-1 top-2 bottom-2 w-px bg-white/5" />

                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_var(--color-gold)] mt-1.5 shrink-0 z-10" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Origine</p>
                      <p className="text-xs text-slate-300 truncate">{booking.pickupAddress}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full border border-white/20 mt-1.5 shrink-0 z-10 bg-[#09090F]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Destination</p>
                      <p className="text-xs text-slate-300 truncate">{booking.dropoffAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
                      <Calendar size={12} className="text-slate-500" />
                      <span className="text-[10px] font-bold text-slate-400">{formatDate(booking.scheduledDateTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
                      <Clock size={12} className="text-slate-500 ml-1" />
                      <span className="text-[10px] font-bold text-white font-mono">{formatTime(booking.scheduledDateTime)}</span>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-white font-mono">
                    {booking.price ? `${parseFloat(booking.price).toLocaleString('fr-FR')} F` : 'TBD'}
                  </div>
                </div>

                {booking.driver && (
                  <div className="mt-4 pt-4 flex items-center justify-between bg-white/[0.01] -mx-5 px-5 border-t border-white/[0.03]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[8px] font-bold text-blue-400">
                        {getInitials(booking.driver.name)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Chauffeur: <span className="text-slate-200">{booking.driver.name}</span></span>
                    </div>
                    {booking.vehicle && (
                      <div className="text-[9px] text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {booking.vehicle.plateNumber}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 overflow-hidden"
          style={{ backgroundColor: 'var(--color-dash-card)' }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Identité</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Planning</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trajectoire</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Terminal</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Facturation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredBookings.map((booking) => (
                <tr key={booking.id}
                  onClick={() => openBookingDetails(booking)}
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold bg-white/5 text-slate-500 group-hover:bg-gold group-hover:text-black transition-all border border-white/10 group-hover:border-gold">
                        {getInitials(booking.customerName)}
                      </div>
                      <div>
                        <span className="text-sm text-white font-bold block">{booking.customerName}</span>
                        <span className="text-[10px] text-slate-600 font-mono">IDX-{booking.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-white font-bold">{formatDate(booking.scheduledDateTime)}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{formatTime(booking.scheduledDateTime)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-[280px]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-1 rounded-full bg-gold" />
                        <p className="text-[11px] text-slate-300 truncate tracking-tight">{booking.pickupAddress}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <p className="text-[11px] text-slate-500 truncate tracking-tight italic">{booking.dropoffAddress}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge statut={booking.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-white font-mono block">
                      {booking.price ? `${parseFloat(booking.price).toLocaleString()} F` : '—'}
                    </span>
                    <span className="text-[10px] text-slate-600 uppercase tracking-tighter">Payé: <span className="text-gold">No</span></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {selectedBookingForDetails && (
        <BookingDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={closeBookingDetails}
          booking={selectedBookingForDetails}
          drivers={drivers}
          vehicles={vehicles}
          onUpdate={handleBookingUpdate}
        />
      )}
    </div>
  )
}
