"use client"

import React, { useState, useEffect } from "react"
import {
  MagnifyingGlass as Search,
  SquaresFour as Grid,
  List,
  MapPin,
  Calendar,
  Clock,
  User,
  Trash
} from "@phosphor-icons/react"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { BulkDeleteModal } from "@/components/ui/BulkDeleteModal"
import { useNotification } from "@/hooks/useNotification"
import { BookingDetailsModal } from "./BookingDetailsModal"
import { StatusBadge, TONE_STYLE, toneForStatus } from "@/components/shared/StatusBadge"

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

const selectStyle: React.CSSProperties = {
  height: '38px', padding: '0 12px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '12.5px', color: '#3d3a35', backgroundColor: '#FFFFFF', minWidth: '150px',
}

export function BookingsManagement() {
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
    search: '',
    sortBy: 'date-desc'
  })

  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<number>>(new Set())
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)

  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  useEffect(() => {
    fetchBookings()
    fetchDrivers()
    fetchVehicles()
  }, [])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    filtered.sort((a, b) => {
      if (filters.status === 'all') {
        const priority = { 'pending': 0, 'assigned': 1, 'approved': 2, 'confirmed': 3, 'in_progress': 4, 'completed': 5, 'cancelled': 6, 'rejected': 7 };
        const aStatusIdx = priority[a.status as keyof typeof priority] ?? 99;
        const bStatusIdx = priority[b.status as keyof typeof priority] ?? 99;

        if (aStatusIdx !== bStatusIdx) return aStatusIdx - bStatusIdx;
      }

      const dateA = new Date(a.scheduledDateTime).getTime();
      const dateB = new Date(b.scheduledDateTime).getTime();

      if (filters.sortBy === 'date-desc') return dateB - dateA;
      if (filters.sortBy === 'date-asc') return dateA - dateB;
      return 0;
    });

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

  const toggleSelectAll = () => {
    if (selectedBookingIds.size === filteredBookings.length && filteredBookings.length > 0) {
      setSelectedBookingIds(new Set())
    } else {
      setSelectedBookingIds(new Set(filteredBookings.map(b => b.id)))
    }
  }

  const toggleSelectBooking = (e: React.MouseEvent, bookingId: number) => {
    e.stopPropagation()
    setSelectedBookingIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId)
      } else {
        newSet.add(bookingId)
      }
      return newSet
    })
  }

  const handleBulkDelete = async () => {
    try {
      const response = await fetch('/api/admin/bookings/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedBookingIds) })
      })

      const data = await response.json()

      if (response.ok) {
        showSuccess(data.message || 'Réservations supprimées', 'Succès')
        setSelectedBookingIds(new Set())
        fetchBookings()
      } else {
        showError(data.error || 'Erreur lors de la suppression', 'Erreur')
      }
    } catch (error) {
      showError('Erreur technique', 'Erreur')
    }
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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "#E2DACD", borderTopColor: "#1F5245" }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      <NotificationCenter notifications={notifications} onRemove={removeNotification} />

      {/* Header */}
      <section style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#1F5245' }}>
            Logistique &amp; flux
          </span>
          <h2 style={{ margin: 0, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Réservations.
          </h2>
          <p style={{ margin: 0, fontSize: '15px', color: '#3d3a35' }}>
            Supervision du trafic et des réservations.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', borderTop: '1px solid #E2DACD', borderBottom: '1px solid #E2DACD' }}>
        {[
          { label: 'En attente', value: stats.pending, icon: Clock },
          { label: 'Assignés', value: stats.assigned, icon: User },
          { label: 'Confirmés', value: stats.confirmed, icon: MapPin },
          { label: 'En cours', value: stats.inProgress, icon: Clock },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} style={{ padding: '18px 20px', borderRight: i < 3 ? '1px solid #E2DACD' : 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Icon size={17} style={{ color: '#1F5245' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '23px', fontWeight: 600, letterSpacing: '-0.01em', color: '#12100E' }}>{stat.value}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>{stat.label}</span>
            </div>
          )
        })}
      </section>

      {/* Control Bar */}
      <section className="flex flex-col sm:flex-row items-center gap-3 flex-wrap">
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#6E6A63' }} />
          <input
            type="text"
            placeholder="Trajet, passager, ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: '100%', height: '38px', padding: '0 12px 0 36px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '12.5px', color: '#12100E' }}
          />
        </div>

        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={selectStyle}>
          <option value="all">Tous les états</option>
          <option value="pending">En attente</option>
          <option value="assigned">Assignées</option>
          <option value="confirmed">Confirmées</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminées</option>
          <option value="cancelled">Annulées</option>
        </select>

        <select value={filters.driver} onChange={(e) => setFilters({ ...filters, driver: e.target.value })} style={selectStyle}>
          <option value="all">Personnel : tous</option>
          {drivers.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })} style={selectStyle}>
          <option value="date-desc">Plus récentes</option>
          <option value="date-asc">Plus anciennes</option>
        </select>

        <div className="flex items-center gap-2" style={{ marginLeft: 'auto' }}>
          {selectedBookingIds.size > 0 && (
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-2"
              style={{ height: '38px', padding: '0 14px', backgroundColor: 'rgba(184,73,60,.08)', border: '1px solid rgba(184,73,60,.25)', borderRadius: '3px', color: '#B8493C', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Trash size={14} />
              Supprimer ({selectedBookingIds.size})
            </button>
          )}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63' }}
          >
            {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
          </button>
        </div>
      </section>

      {/* Main Content View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBookings.length === 0 ? (
            <div className="col-span-full" style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed #E2DACD', borderRadius: '4px' }}>
              <Calendar size={28} style={{ color: '#E2DACD', marginBottom: '10px' }} />
              <p style={{ margin: 0, fontSize: '13px', color: '#9a938a', fontStyle: 'italic' }}>Aucune donnée active</p>
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const accent = TONE_STYLE[toneForStatus('booking', booking.status)].color
              return (
                <div
                  key={booking.id}
                  onClick={() => openBookingDetails(booking)}
                  className="relative"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', padding: '18px', cursor: 'pointer', overflow: 'hidden' }}
                >
                  <div className="absolute top-0 left-0" style={{ width: '3px', height: '100%', backgroundColor: accent }} />

                  <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedBookingIds.has(booking.id)}
                      onChange={(e) => toggleSelectBooking(e as unknown as React.MouseEvent, booking.id)}
                      style={{ width: '15px', height: '15px', accentColor: '#1F5245' }}
                    />
                  </div>

                  <div className="flex justify-between items-start" style={{ marginBottom: '16px', paddingRight: '24px', paddingLeft: '6px' }}>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div style={{ width: '38px', height: '38px', borderRadius: '3px', backgroundColor: 'rgba(31,82,69,.08)', display: 'grid', placeItems: 'center', fontSize: '11px', fontWeight: 600, color: '#1F5245' }}>
                          {getInitials(booking.customerName)}
                        </div>
                        <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #FFFFFF', backgroundColor: '#12100E', display: 'grid', placeItems: 'center', fontSize: '8px', color: '#F7F3EC' }}>
                          {booking.passengers}
                        </div>
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#12100E' }}>{booking.customerName}</h3>
                        <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '0.06em', color: '#6E6A63' }}>IDX-{booking.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                    <StatusBadge domain="booking" value={booking.status} audience="admin" live={booking.status === 'in_progress'} />
                  </div>

                  <div style={{ marginBottom: '16px', paddingLeft: '6px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                    <div className="flex items-start gap-3">
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#1F5245', marginTop: '5px', flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: '0 0 2px', fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6E6A63' }}>Origine</p>
                        <p style={{ margin: 0, fontSize: '12.5px', color: '#3d3a35' }} className="truncate">{booking.pickupAddress}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', border: '1px solid #E2DACD', marginTop: '5px', flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: '0 0 2px', fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6E6A63' }}>Destination</p>
                        <p style={{ margin: 0, fontSize: '12.5px', color: '#3d3a35' }} className="truncate">{booking.dropoffAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between" style={{ paddingTop: '14px', paddingLeft: '6px', borderTop: '1px solid #F0EAE0' }}>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5" style={{ padding: '4px 8px', borderRadius: '3px', backgroundColor: '#F7F3EC' }}>
                        <Calendar size={11} style={{ color: '#6E6A63' }} />
                        <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#3d3a35' }}>{formatDate(booking.scheduledDateTime)}</span>
                      </div>
                      <div className="flex items-center gap-1.5" style={{ padding: '4px 8px', borderRadius: '3px', backgroundColor: '#F7F3EC' }}>
                        <Clock size={11} style={{ color: '#6E6A63' }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', fontWeight: 600, color: '#12100E' }}>{formatTime(booking.scheduledDateTime)}</span>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#12100E' }}>
                      {booking.price ? `${parseFloat(booking.price).toLocaleString('fr-FR')} F` : 'TBD'}
                    </div>
                  </div>

                  {booking.driver && (
                    <div className="flex items-center justify-between" style={{ marginTop: '12px', paddingTop: '12px', paddingLeft: '6px', borderTop: '1px solid #F0EAE0' }}>
                      <div className="flex items-center gap-2">
                        <div style={{ width: '22px', height: '22px', borderRadius: '3px', backgroundColor: 'rgba(31,82,69,.08)', display: 'grid', placeItems: 'center', fontSize: '8px', fontWeight: 600, color: '#1F5245' }}>
                          {getInitials(booking.driver.name)}
                        </div>
                        <span style={{ fontSize: '10.5px', color: '#6E6A63' }}>Chauffeur : <span style={{ color: '#12100E', fontWeight: 500 }}>{booking.driver.name}</span></span>
                      </div>
                      {booking.vehicle && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6E6A63', backgroundColor: '#F7F3EC', padding: '2px 8px', borderRadius: '2px' }}>
                          {booking.vehicle.plateNumber}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      ) : (
        <section style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2DACD' }}>
                  <th style={{ padding: '12px 16px', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={filteredBookings.length > 0 && selectedBookingIds.size === filteredBookings.length}
                      onChange={toggleSelectAll}
                      style={{ width: '15px', height: '15px', accentColor: '#1F5245' }}
                    />
                  </th>
                  {['Identité', 'Planning', 'Trajectoire', 'Statut', 'Facturation'].map((h, i) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: i === 4 ? 'right' : 'left', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} onClick={() => openBookingDetails(booking)} style={{ borderBottom: '1px solid #F0EAE0', cursor: 'pointer' }}>
                    <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedBookingIds.has(booking.id)}
                        onChange={(e) => toggleSelectBooking(e as unknown as React.MouseEvent, booking.id)}
                        style={{ width: '15px', height: '15px', accentColor: '#1F5245' }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: '32px', height: '32px', borderRadius: '3px', backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', display: 'grid', placeItems: 'center', fontSize: '10px', fontWeight: 600, color: '#6E6A63' }}>
                          {getInitials(booking.customerName)}
                        </div>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#12100E', display: 'block' }}>{booking.customerName}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#9a938a' }}>IDX-{booking.id}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#12100E' }}>{formatDate(booking.scheduledDateTime)}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#6E6A63' }}>{formatTime(booking.scheduledDateTime)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ maxWidth: '260px' }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: '3px' }}>
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#1F5245' }} />
                          <p style={{ margin: 0, fontSize: '11.5px', color: '#3d3a35' }} className="truncate">{booking.pickupAddress}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', border: '1px solid #E2DACD' }} />
                          <p style={{ margin: 0, fontSize: '11.5px', color: '#9a938a', fontStyle: 'italic' }} className="truncate">{booking.dropoffAddress}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge domain="booking" value={booking.status} audience="admin" live={booking.status === 'in_progress'} />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#12100E', display: 'block' }}>
                        {booking.price ? `${parseFloat(booking.price).toLocaleString()} F` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
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

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        count={selectedBookingIds.size}
        resourceName="réservations"
      />
    </div>
  )
}
