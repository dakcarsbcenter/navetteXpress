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
    status: 'all',
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
        onRemoveNotification={removeNotification}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Réservations</h1>
            <p className="text-sm text-gray-500 mt-1">Gérez le dispatch et le suivi des courses</p>
          </div>
          <button
            onClick={() => {/* TODO: Open create modal */}}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvelle réservation
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">TOTAL</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="text-sm text-amber-700 mb-1">EN ATTENTE</div>
            <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-700 mb-1">ASSIGNÉES</div>
            <div className="text-3xl font-bold text-blue-600">{stats.assigned}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-700 mb-1">CONFIRMÉES</div>
            <div className="text-3xl font-bold text-green-600">{stats.confirmed}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-purple-700 mb-1">EN COURS</div>
            <div className="text-3xl font-bold text-purple-600">{stats.inProgress}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par ID, client ou lieu..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Tous les statuts</option>
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Tous les chauffeurs</option>
            {drivers.map(driver => (
              <option key={driver.id} value={driver.id}>{driver.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Grid */}
      <div className="p-8">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucune réservation trouvée
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredBookings.map((booking) => {
              const statusConfig = getStatusConfig(booking.status)
              
              return (
                <div
                  key={booking.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => openBookingDetails(booking)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold">
                        {getInitials(booking.customerName)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{booking.customerName}</h3>
                        <p className="text-sm text-gray-500">#{booking.id} • {booking.status === 'confirmed' ? 'Confirmée' : 'En route'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.color}`}>
                      {booking.status === 'pending' && '⏱️ En attente'}
                      {booking.status === 'confirmed' && '✓ Confirmée'}
                      {booking.status === 'in_progress' && '🚗 En cours'}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">Siège Entreprise</p>
                        <p className="text-sm font-medium text-gray-900">{booking.pickupAddress}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">Aéroport AIBD</p>
                        <p className="text-sm font-medium text-gray-900">{booking.dropoffAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(booking.scheduledDateTime)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(booking.scheduledDateTime)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{booking.passengers || 3} Pers.</span>
                    </div>
                    {booking.vehicle && (
                      <div className="flex items-center gap-1">
                        <span>🚗 {booking.vehicle.make}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    {booking.driver ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-green-700">
                            {getInitials(booking.driver.name)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Chauffeur</p>
                          <p className="text-sm font-medium text-gray-900">{booking.driver.name}</p>
                        </div>
                      </div>
                    ) : (
                      <button className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Assigner un chauffeur
                      </button>
                    )}
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {booking.price ? `${parseFloat(booking.price).toLocaleString('fr-FR')} F` : '—'}
                      </p>
                    </div>
                  </div>

                  <button className="w-full mt-4 text-sm text-gray-600 hover:text-gray-900 font-medium">
                    Voir détails →
                  </button>
                </div>
              )
            })}
          </div>
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
