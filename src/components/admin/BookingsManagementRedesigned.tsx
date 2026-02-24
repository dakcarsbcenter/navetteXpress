"use client"

import React, { useState, useEffect } from "react"
import { Search, Grid, List, Plus, MapPin, Calendar, Clock, User, Phone, Mail } from "lucide-react"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { useNotification } from "@/hooks/useNotification"
import { BookingDetailsModal } from "./BookingDetailsModal"

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

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string }> = {
      pending: { label: 'En attente', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
      assigned: { label: 'Assignée', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
      confirmed: { label: 'Confirmée', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
      in_progress: { label: 'En cours', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
      completed: { label: 'Terminée', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
      cancelled: { label: 'Annulée', color: 'text-red-600', bg: 'bg-red-50 border-red-200' }
    }
    return configs[status] || configs.pending
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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <button className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Réservations</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-gray-600 hover:text-gray-900 p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button
              onClick={() => {/* TODO: Open create modal */}}
              className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-gray-500 mb-1">TOTAL</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-amber-50 border border-gray-200 border-l-4 border-l-amber-500 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-amber-700 mb-1">EN ATTENTE</div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.pending}</div>
          </div>
          <div className="bg-blue-50 border border-gray-200 border-l-4 border-l-blue-500 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-blue-700 mb-1">ASSIGNÉES</div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.assigned}</div>
          </div>
          <div className="bg-green-50 border border-gray-200 border-l-4 border-l-green-500 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-green-700 mb-1">CONFIRMÉES</div>
            <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.confirmed}</div>
          </div>
          <div className="bg-purple-50 border border-gray-200 border-l-4 border-l-purple-500 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-purple-700 mb-1">EN COURS</div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.inProgress}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client, ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            />
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="assigned">Assignées</option>
            <option value="confirmed">Confirmées</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminées</option>
            <option value="cancelled">Annulées</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="px-3 sm:px-6 lg:px-8 py-4 space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucune réservation trouvée
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const statusConfig = getStatusConfig(booking.status)
            const borderColor = booking.status === 'confirmed' ? 'border-l-green-500' :
                              booking.status === 'in_progress' ? 'border-l-purple-500' :
                              booking.status === 'assigned' ? 'border-l-blue-500' :
                              booking.status === 'pending' ? 'border-l-amber-500' : 'border-l-gray-300'
            
            return (
              <div
                key={booking.id}
                className={`bg-white rounded-lg border-l-4 ${borderColor} border-t border-r border-b border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => openBookingDetails(booking)}
              >
                {/* Header with avatar and name */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                      {getInitials(booking.customerName)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{booking.customerName}</h3>
                      <p className="text-xs text-gray-500">#{booking.id} • {statusConfig.label}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{formatTime(booking.scheduledDateTime)}</span>
                </div>

                {/* Route with icons */}
                <div className="space-y-2 mb-3 ml-13">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-blue-500 bg-white flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    </div>
                    <p className="text-sm text-gray-900">{booking.pickupAddress}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-red-500 bg-white flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    </div>
                    <p className="text-sm text-gray-900">{booking.dropoffAddress}</p>
                  </div>
                </div>

                {/* Driver info if assigned */}
                {booking.driver && (
                  <div className="flex items-center gap-2 mb-3 ml-13 bg-gray-50 rounded-lg p-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold text-xs">
                      {getInitials(booking.driver.name)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{booking.driver.name}</p>
                      {booking.vehicle && (
                        <p className="text-xs text-gray-500">{booking.vehicle.make} {booking.vehicle.model}</p>
                      )}
                    </div>
                    <button className="text-green-600 hover:text-green-700 p-1">
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Footer with price and actions */}
                <div className="flex items-center justify-between ml-13">
                  <button className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-300 rounded-lg font-medium">
                    Détails
                  </button>
                  <div className="text-lg font-bold text-gray-900">
                    {booking.price ? `${parseFloat(booking.price).toLocaleString('fr-FR', {maximumFractionDigits: 0})} F` : '—'}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

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
