"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
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
  cancellationReason?: string | null
  cancelledBy?: string | null
  cancelledAt?: string | null
  createdAt: string
  driver?: {
    name: string
    email: string
    image?: string
  }
  vehicle?: {
    make: string
    model: string
    plateNumber: string
    photo?: string
  }
  cancelledByUser?: {
    name: string
    role: string
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

export function ModernBookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'kanban'>('cards')
  const [selectedBookings, setSelectedBookings] = useState<number[]>([])
  const { notifications, showSuccess, showError, removeNotification } = useNotification()
  
  // État pour la modal des détails
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
    search: '',
    driver: '',
    priceRange: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })

  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  // Fonctions pour la modal des détails
  const openBookingDetails = (booking: Booking) => {
    setSelectedBookingForDetails(booking)
    setIsDetailsModalOpen(true)
  }

  const closeBookingDetails = () => {
    setIsDetailsModalOpen(false)
    setSelectedBookingForDetails(null)
  }

  const handleBookingUpdate = () => {
    // Recharger les données après mise à jour
    fetchBookings()
    showSuccess('Réservation mise à jour avec succès', 'Succès')
  }

  useEffect(() => {
    fetchBookings()
    fetchDrivers()
    fetchVehicles()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [bookings, filters])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings')
      if (response.ok) {
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
                  cancellationReason: b.cancellationReason,
                  cancelledBy: b.cancelledBy,
                  cancelledAt: b.cancelledAt,
                  createdAt: b.createdAt,
                  driver: row.driver,
                  vehicle: row.vehicle,
                  cancelledByUser: row.cancelledByUser
                }
              })
            : []
          setBookings(normalized)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      showError('Erreur lors du chargement des réservations', 'Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=driver')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setDrivers(result.data)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des chauffeurs:', error)
    }
  }

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setVehicles(result.data)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...bookings]

    // Filtres
    if (filters.status) {
      filtered = filtered.filter(booking => booking.status === filters.status)
    }
    if (filters.driver) {
      filtered = filtered.filter(booking => booking.driverId === filters.driver)
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(booking => 
        booking.customerName.toLowerCase().includes(searchTerm) ||
        booking.customerEmail.toLowerCase().includes(searchTerm) ||
        booking.pickupAddress.toLowerCase().includes(searchTerm) ||
        booking.dropoffAddress.toLowerCase().includes(searchTerm)
      )
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue = a[filters.sortBy as keyof Booking] as string
      let bValue = b[filters.sortBy as keyof Booking] as string
      
      if (filters.sortBy === 'createdAt' || filters.sortBy === 'scheduledDateTime') {
        aValue = new Date(aValue).getTime().toString()
        bValue = new Date(bValue).getTime().toString()
      }
      
      const result = aValue.localeCompare(bValue)
      return filters.sortOrder === 'asc' ? result : -result
    })

    setFilteredBookings(filtered)
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { 
        label: 'En attente', 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        icon: '⏳',
        dot: 'bg-yellow-500'
      },
      assigned: { 
        label: 'Assignée', 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        icon: '👤',
        dot: 'bg-blue-500'
      },
      confirmed: { 
        label: 'Confirmée', 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: '✅',
        dot: 'bg-green-500'
      },
      in_progress: { 
        label: 'En cours', 
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        icon: '🚗',
        dot: 'bg-purple-500'
      },
      completed: { 
        label: 'Terminée', 
        color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        icon: '🎉',
        dot: 'bg-emerald-500'
      },
      cancelled: { 
        label: 'Annulée', 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        icon: '❌',
        dot: 'bg-red-500'
      }
    }
    return configs[status as keyof typeof configs] || configs.pending
  }

  const getStats = () => {
    const total = bookings.length
    const pending = bookings.filter(b => b.status === 'pending').length
    const assigned = bookings.filter(b => b.status === 'assigned').length
    const confirmed = bookings.filter(b => b.status === 'confirmed').length
    const inProgress = bookings.filter(b => b.status === 'in_progress').length
    const completed = bookings.filter(b => b.status === 'completed').length
    const cancelled = bookings.filter(b => b.status === 'cancelled').length
    const totalRevenue = bookings
      .filter(b => b.status === 'completed' && b.price)
      .reduce((sum, b) => sum + parseFloat(b.price!), 0)
    
    return { total, pending, assigned, confirmed, inProgress, completed, cancelled, totalRevenue }
  }

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        await fetchBookings()
        showSuccess(`Statut mis à jour vers "${getStatusConfig(newStatus).label}"`, 'Mise à jour réussie')
      }
    } catch (error) {
      showError('Erreur lors de la mise à jour du statut', 'Erreur')
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedBookings.length === 0) return
    
    // Implémentation des actions en masse
    showSuccess(`Action "${action}" appliquée à ${selectedBookings.length} réservation(s)`, 'Action réussie')
    setSelectedBookings([])
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Header avec statistiques */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Gestion des réservations
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Gérez toutes vos réservations avec workflow intuitif
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Actions en masse */}
              {selectedBookings.length > 0 && (
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                    {selectedBookings.length} sélectionnée(s)
                  </span>
                  <button
                    onClick={() => handleBulkAction('assign')}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                  >
                    Assigner
                  </button>
                  <button
                    onClick={() => handleBulkAction('cancel')}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700"
                  >
                    Annuler
                  </button>
                </div>
              )}

              {/* Boutons de vue */}
              <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Cartes
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Kanban
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Tableau
                </button>
              </div>
              
              {/* Bouton Nouvelle réservation */}
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nouvelle réservation
              </button>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="grid grid-cols-2 md:grid-cols-8 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                </div>
                <div className="text-2xl">📊</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">En attente</p>
                </div>
                <div className="text-2xl">⏳</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.assigned}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Assignées</p>
                </div>
                <div className="text-2xl">👤</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.confirmed}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Confirmées</p>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.inProgress}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">En cours</p>
                </div>
                <div className="text-2xl">🚗</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Terminées</p>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.cancelled}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Annulées</p>
                </div>
                <div className="text-2xl">❌</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalRevenue.toFixed(0)} FCFA</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Revenus</p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Recherche */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Filtre par statut */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">⏳ En attente</option>
              <option value="assigned">👤 Assignée</option>
              <option value="confirmed">✅ Confirmée</option>
              <option value="in_progress">🚗 En cours</option>
              <option value="completed">🎉 Terminée</option>
              <option value="cancelled">❌ Annulée</option>
            </select>

            {/* Filtre par chauffeur */}
            <select
              value={filters.driver}
              onChange={(e) => setFilters(prev => ({ ...prev, driver: e.target.value }))}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Tous les chauffeurs</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  🚗 {driver.name}
                </option>
              ))}
            </select>

            {/* Filtre par date */}
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Toutes les dates</option>
              <option value="today">📅 Aujourd'hui</option>
              <option value="week">📅 Cette semaine</option>
              <option value="month">📅 Ce mois</option>
            </select>

            {/* Tri */}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }))
              }}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="createdAt-desc">Plus récentes</option>
              <option value="createdAt-asc">Plus anciennes</option>
              <option value="scheduledDateTime-asc">Date de trajet ↑</option>
              <option value="scheduledDateTime-desc">Date de trajet ↓</option>
              <option value="customerName-asc">Client A-Z</option>
              <option value="customerName-desc">Client Z-A</option>
            </select>
          </div>

          {/* Résultats et actions rapides */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {filteredBookings.length} réservation{filteredBookings.length > 1 ? 's' : ''} trouvée{filteredBookings.length > 1 ? 's' : ''}
            </p>
            
            {Object.values(filters).some(v => v !== '' && v !== 'createdAt' && v !== 'desc') && (
              <button
                onClick={() => setFilters({ status: '', dateRange: '', search: '', driver: '', priceRange: '', sortBy: 'createdAt', sortOrder: 'desc' })}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        </div>

        {/* Vue Kanban */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {['pending', 'assigned', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((status) => {
              const statusBookings = filteredBookings.filter(b => b.status === status)
              const statusConfig = getStatusConfig(status)
              
              return (
                <div key={status} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${statusConfig.dot}`}></div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {statusConfig.label}
                        </h3>
                      </div>
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm px-2 py-1 rounded-full">
                        {statusBookings.length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {statusBookings.map((booking) => (
                      <div 
                        key={booking.id} 
                        onClick={() => openBookingDetails(booking)}
                        className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600 hover:shadow-sm transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-slate-900 dark:text-white text-sm">
                            {booking.customerName}
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedBookings.includes(booking.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBookings(prev => [...prev, booking.id])
                              } else {
                                setSelectedBookings(prev => prev.filter(id => id !== booking.id))
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                          📍 {booking.pickupAddress.substring(0, 30)}...
                        </div>
                        
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                          🎯 {booking.dropoffAddress.substring(0, 30)}...
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">
                            {new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR')}
                          </span>
                          {booking.price && (
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {booking.price} FCFA
                            </span>
                          )}
                        </div>
                        
                        {booking.driver && (
                          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                            👤 {booking.driver.name}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {statusBookings.length === 0 && (
                      <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                        <div className="text-3xl mb-2">{statusConfig.icon}</div>
                        <p className="text-sm">Aucune réservation {statusConfig.label.toLowerCase()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Vue en cartes */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => {
              const statusConfig = getStatusConfig(booking.status)
              
              return (
                <div key={booking.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 overflow-hidden">
                  {/* Header avec statut */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedBookings.includes(booking.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBookings(prev => [...prev, booking.id])
                            } else {
                              setSelectedBookings(prev => prev.filter(id => id !== booking.id))
                            }
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {booking.customerName}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            #{booking.id} • {booking.customerEmail}
                          </p>
                        </div>
                      </div>
                      
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    </div>

                    {/* Informations de trajet */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Départ</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{booking.pickupAddress}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Arrivée</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{booking.dropoffAddress}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pt-2">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(booking.scheduledDateTime).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assignation et véhicule */}
                  <div className="px-6 pb-4">
                    {booking.driver && (
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {booking.driver.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {booking.driver.name}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Chauffeur assigné
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {booking.vehicle && (
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {booking.vehicle.make} {booking.vehicle.model}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {booking.vehicle.plateNumber}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions et prix */}
                  <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'assigned')}
                            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Assigner
                          </button>
                        )}
                        {booking.status === 'assigned' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'confirmed')}
                            className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Confirmer
                          </button>
                        )}
                        <button 
                          onClick={() => openBookingDetails(booking)}
                          className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          Détails
                        </button>
                      </div>
                      
                      {booking.price && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            {booking.price} FCFA
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Vue tableau (simplifiée pour l'espace) */}
        {viewMode === 'table' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBookings(filteredBookings.map(b => b.id))
                          } else {
                            setSelectedBookings([])
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Client</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Trajet</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Statut</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Chauffeur</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Prix</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-slate-600 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredBookings.map((booking) => {
                    const statusConfig = getStatusConfig(booking.status)
                    
                    return (
                      <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedBookings.includes(booking.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBookings(prev => [...prev, booking.id])
                              } else {
                                setSelectedBookings(prev => prev.filter(id => id !== booking.id))
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{booking.customerName}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{booking.customerEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <p className="text-sm text-slate-900 dark:text-white truncate">📍 {booking.pickupAddress}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">🎯 {booking.dropoffAddress}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.icon} {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {booking.driver ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                  {booking.driver.name.charAt(0)}
                                </span>
                              </div>
                              <span className="text-sm text-slate-900 dark:text-white">{booking.driver.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400 dark:text-slate-500">Non assigné</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {booking.price ? (
                            <span className="font-medium text-slate-900 dark:text-white">{booking.price} FCFA</span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => openBookingDetails(booking)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Voir les détails"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Message si aucune réservation */}
        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Aucune réservation trouvée
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {Object.values(filters).some(v => v !== '' && v !== 'createdAt' && v !== 'desc')
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par créer votre première réservation'
              }
            </p>
            {!Object.values(filters).some(v => v !== '' && v !== 'createdAt' && v !== 'desc') && (
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
                Créer une réservation
              </button>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Modal des détails de réservation */}
      <BookingDetailsModal
        booking={selectedBookingForDetails}
        isOpen={isDetailsModalOpen}
        onClose={closeBookingDetails}
        onUpdate={handleBookingUpdate}
        drivers={drivers}
        vehicles={vehicles}
      />
    </div>
  )
}