"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { FilterBar } from "@/components/ui/FilterBar"
import { useNotification } from "@/hooks/useNotification"
import { formatPrice } from "@/lib/utils"
import { usePermissions } from "@/hooks/usePermissions"
import { ConfirmationModal } from "@/components/ui/ConfirmationModal"

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
}

export function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [drivers, setDrivers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
  }>>([])
  const [vehicles, setVehicles] = useState<Array<{
    id: string;
    make: string;
    model: string;
    year: number;
    plateNumber: string;
  }>>([])
  const { notifications, showSuccess, showError, removeNotification } = useNotification()
  const { canDelete } = usePermissions()
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [paginatedBookings, setPaginatedBookings] = useState<Booking[]>([])
  
  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  
  const [filters, setFilters] = useState({
    status: '',
    driver: '',
    search: ''
  })
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    pickupAddress: '',
    dropoffAddress: '',
    scheduledDateTime: '',
    status: 'pending' as 'pending' | 'assigned' | 'approved' | 'rejected' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
    driverId: '',
    vehicleId: '',
    price: '',
    notes: ''
  })

  useEffect(() => {
    fetchBookings()
    fetchDrivers()
    fetchVehicles()
  }, [])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, filters])
  
  useEffect(() => {
    // Apply pagination to filtered bookings
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedBookings(filteredBookings.slice(startIndex, endIndex))
  }, [filteredBookings, currentPage, itemsPerPage])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (target && !target.closest('[data-dropdown-container]')) {
        setOpenDropdownId(null)
      }
    }

    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdownId])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // L'API renvoie { booking, driver, vehicle } - on normalise vers Booking
          const normalized: Booking[] = Array.isArray(result.data)
            ? result.data.map((row: {
                booking: {
                  id: string;
                  customerName: string;
                  customerEmail: string;
                  customerPhone: string;
                  pickupAddress: string;
                  dropoffAddress: string;
                  scheduledDateTime: string;
                  status: string;
                  driverId: string;
                  vehicleId: string;
                  price: string;
                  notes: string;
                  createdAt: string;
                };
                driver?: { name: string; email: string };
                vehicle?: { make: string; model: string };
              }) => {
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
                  createdAt: b.createdAt,
                  driver: row.driver ? { name: row.driver.name, email: row.driver.email } : undefined,
                  vehicle: row.vehicle ? { make: row.vehicle.make, model: row.vehicle.model } : undefined,
                }
              })
            : []
          setBookings(normalized)
        } else {
          console.error('Erreur lors du chargement des réservations:', result.error)
          setBookings([]) // Set empty array as fallback
        }
      } else {
        console.error('Erreur HTTP:', response.status)
        setBookings([]) // Set empty array as fallback
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error)
      setBookings([]) // Set empty array as fallback
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=chauffeur')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setDrivers(result.data)
        } else {
          console.error('Erreur lors du chargement des chauffeurs:', result.error)
          setDrivers([])
        }
      } else {
        console.error('Erreur HTTP:', response.status)
        setDrivers([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des chauffeurs:', error)
      setDrivers([])
    }
  }

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/admin/vehicles')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setVehicles(result.data)
        } else {
          console.error('Erreur lors du chargement des véhicules:', result.error)
          setVehicles([])
        }
      } else {
        console.error('Erreur HTTP:', response.status)
        setVehicles([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error)
      setVehicles([])
    }
  }

  const applyFilters = () => {
    let filtered = [...bookings]

    // Filtre par statut
    if (filters.status) {
      filtered = filtered.filter(booking => booking.status === filters.status)
    }

    // Filtre par chauffeur
    if (filters.driver) {
      filtered = filtered.filter(booking => booking.driverId === filters.driver)
    }

    // Filtre par recherche
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(booking => 
        booking.customerName.toLowerCase().includes(searchTerm) ||
        booking.customerEmail.toLowerCase().includes(searchTerm) ||
        booking.pickupAddress.toLowerCase().includes(searchTerm) ||
        booking.dropoffAddress.toLowerCase().includes(searchTerm)
      )
    }

    setFilteredBookings(filtered)
    // Reset to first page when filters change
    setCurrentPage(1)
  }

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      status: '',
      driver: '',
      search: ''
    })
  }

  const getFilterCounts = () => {
    const statusCounts = {
      pending: bookings.filter(b => b.status === 'pending').length,
      assigned: bookings.filter(b => b.status === 'assigned').length,
      approved: bookings.filter(b => b.status === 'approved').length,
      rejected: bookings.filter(b => b.status === 'rejected').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      in_progress: bookings.filter(b => b.status === 'in_progress').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length
    }

    return { statusCounts }
  }

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null
        })
      })
      
      if (response.ok) {
        await fetchBookings()
        setIsModalOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error)
    }
  }

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBooking) return
    
    try {
      const response = await fetch(`/api/admin/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null
        })
      })
      
      if (response.ok) {
        await fetchBookings()
        setIsModalOpen(false)
        setEditingBooking(null)
        resetForm()
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  const openDeleteConfirm = (bookingId: number) => {
    setDeleteTargetId(bookingId)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteBooking = async () => {
    if (deleteTargetId == null) return
    try {
      const response = await fetch(`/api/admin/bookings/${deleteTargetId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await fetchBookings()
        showSuccess('Réservation supprimée avec succès', 'Suppression réussie')
      } else {
        const err = await response.json().catch(() => null)
        showError(err?.error || 'Échec de la suppression de la réservation')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      showError('Une erreur est survenue lors de la suppression')
    } finally {
      setDeleteConfirmOpen(false)
      setDeleteTargetId(null)
    }
  }

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      pickupAddress: '',
      dropoffAddress: '',
      scheduledDateTime: '',
      status: 'pending',
      driverId: '',
      vehicleId: '',
      price: '',
      notes: ''
    })
  }

  const openEditModal = (booking: Booking) => {
    setEditingBooking(booking)
    setFormData({
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      pickupAddress: booking.pickupAddress,
      dropoffAddress: booking.dropoffAddress,
      scheduledDateTime: new Date(booking.scheduledDateTime).toISOString().slice(0, 16),
      status: booking.status,
      driverId: booking.driverId || '',
      vehicleId: booking.vehicleId?.toString() || '',
      price: booking.price?.toString() || '',
      notes: booking.notes || ''
    })
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingBooking(null)
    resetForm()
    setIsModalOpen(true)
  }

  const openDetailsModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsDetailsModalOpen(true)
  }

  const parseBookingNotes = (notes: string | null | undefined) => {
    if (!notes) return {}
    
    const data: { [key: string]: string } = {}
    const lines = notes.split('\n')
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split(': ')
      if (key && valueParts.length > 0) {
        data[key.trim()] = valueParts.join(': ').trim()
      }
    })
    
    return data
  }

  const toggleDropdown = (bookingId: number, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('Toggling dropdown for booking:', bookingId, 'Current open:', openDropdownId)
    setOpenDropdownId(prevId => prevId === bookingId ? null : bookingId)
  }

  const handleAssignBooking = async (bookingId: number, driverId: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId })
      })
      
      if (response.ok) {
        await fetchBookings()
        showSuccess('La réservation a été assignée avec succès au chauffeur', 'Assignation réussie')
      } else {
        const error = await response.json()
        showError(`Erreur: ${error.error}`, 'Échec de l\'assignation')
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error)
      showError('Une erreur est survenue lors de l\'assignation de la réservation', 'Erreur technique')
    }
  }

  const getStatusColor = (status: string | undefined | null) => {
    switch (status ?? 'pending') {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
      case 'assigned': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string | undefined | null) => {
    switch (status ?? 'pending') {
      case 'pending': return '⏳'
      case 'assigned': return '📋'
      case 'approved': return '✅'
      case 'rejected': return '❌'
      case 'confirmed': return '✅'
      case 'in_progress': return '🚗'
      case 'completed': return '🏁'
      case 'cancelled': return '❌'
      default: return '❓'
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  console.log('Current openDropdownId:', openDropdownId, 'Bookings count:', paginatedBookings.length)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestion des réservations
        </h2>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Nouvelle réservation
        </button>
      </div>

      {/* Barre de filtres */}
      <FilterBar
        filters={{
          status: {
            label: 'Statut',
            options: [
              { value: '', label: 'Tous les statuts' },
              { value: 'pending', label: '⏳ En attente', count: getFilterCounts().statusCounts.pending },
              { value: 'assigned', label: '📋 Assignée', count: getFilterCounts().statusCounts.assigned },
              { value: 'approved', label: '✅ Approuvée', count: getFilterCounts().statusCounts.approved },
              { value: 'rejected', label: '❌ Rejetée', count: getFilterCounts().statusCounts.rejected },
              { value: 'confirmed', label: '✅ Confirmée', count: getFilterCounts().statusCounts.confirmed },
              { value: 'in_progress', label: '🚗 En cours', count: getFilterCounts().statusCounts.in_progress },
              { value: 'completed', label: '🏁 Terminée', count: getFilterCounts().statusCounts.completed },
              { value: 'cancelled', label: '❌ Annulée', count: getFilterCounts().statusCounts.cancelled }
            ],
            value: filters.status,
            onChange: (value) => handleFilterChange('status', value)
          },
          driver: {
            label: 'Chauffeur',
            options: [
              { value: '', label: 'Tous les chauffeurs' },
              ...drivers.map(driver => ({
                value: driver.id,
                label: `👤 ${driver.name}`
              }))
            ],
            value: filters.driver,
            onChange: (value) => handleFilterChange('driver', value)
          },
          search: {
            label: 'Recherche',
            type: 'search',
            placeholder: 'Client, adresse...',
            value: filters.search,
            onChange: (value) => handleFilterChange('search', value)
          }
        }}
        onClearAll={clearAllFilters}
        activeFiltersCount={Object.values(filters).filter(v => v !== '').length}
      />

      {/* Information utilisateur */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>💡 <strong>Astuce :</strong> Cliquez sur une ligne pour voir les détails complets de la réservation, ou utilisez le menu Actions pour plus d'options.</span>
        </div>
      </div>

      {/* Tableau des réservations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="w-1/4 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Trajet
                </th>
                <th className="w-1/8 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date/Heure
                </th>
                <th className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="w-1/8 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Chauffeur
                </th>
                <th className="w-1/8 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Véhicule
                </th>
                <th className="w-32 px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedBookings.map((booking) => (
                <tr 
                  key={booking.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                  onClick={(e) => {
                    // Éviter d'ouvrir le modal si on clique sur le menu Actions
                    const target = e.target as HTMLElement
                    if (target.closest('[data-dropdown-container]') || target.closest('button')) {
                      return
                    }
                    openDetailsModal(booking)
                  }}
                >
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">
                        {booking.customerName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
                        {booking.customerEmail}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {booking.customerPhone}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-xs text-gray-900 dark:text-white">
                      <div className="font-medium truncate max-w-40" title={booking.pickupAddress}>📍 {booking.pickupAddress}</div>
                      <div className="text-gray-500 dark:text-gray-400">↓</div>
                      <div className="font-medium truncate max-w-40" title={booking.dropoffAddress}>🎯 {booking.dropoffAddress}</div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                    <div>{new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR')}</div>
                    <div className="text-gray-500">{new Date(booking.scheduledDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 h-6 w-6">
                        {booking.driver?.image ? (
                          <div className="relative h-6 w-6 rounded-full overflow-hidden">
                            <Image
                              fill
                              className="object-cover"
                              src={booking.driver.image}
                              alt={`Photo de ${booking.driver.name}`}
                              sizes="24px"
                            />
                          </div>
                        ) : null}
                        <div className={`h-6 w-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-medium ${booking.driver?.image ? 'hidden' : ''}`}>
                          {booking.driver?.name ? booking.driver.name.charAt(0).toUpperCase() : '?'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-900 dark:text-white min-w-0 flex-1">
                        <div className="font-medium truncate" title={booking.driver?.name || 'Non assigné'}>
                          {booking.driver?.name || 'Non assigné'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 h-6 w-6">
                        {booking.vehicle?.photo ? (
                          <div className="relative h-6 w-6 rounded overflow-hidden">
                            <Image
                              fill
                              className="object-cover"
                              src={booking.vehicle.photo}
                              alt={`Photo de ${booking.vehicle.make} ${booking.vehicle.model}`}
                              sizes="24px"
                            />
                          </div>
                        ) : null}
                        <div className={`h-6 w-6 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-medium ${booking.vehicle?.photo ? 'hidden' : ''}`}>
                          🚗
                        </div>
                      </div>
                      <div className="text-xs text-gray-900 dark:text-white min-w-0 flex-1">
                        <div className="font-medium truncate" title={`${booking.vehicle?.make} ${booking.vehicle?.model}`}>
                          {booking.vehicle?.make} {booking.vehicle?.model}
                        </div>
                        {booking.price && (
                          <div className="text-green-600 dark:text-green-400 font-medium">
                            💰 {formatPrice(booking.price)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="relative flex justify-end" data-dropdown-container>
                      <button
                        onClick={(e) => toggleDropdown(booking.id, e)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        type="button"
                      >
                        Actions...
                        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Menu déroulant */}
                      {openDropdownId === booking.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                          <div className="py-1">
                            {/* Option Voir détails */}
                            <button
                              onClick={() => {
                                console.log('Voir détails clicked for booking:', booking.id)
                                openDetailsModal(booking)
                                setOpenDropdownId(null)
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 w-full text-left transition-colors duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Voir détails
                            </button>

                            {/* Option Modifier */}
                            <button
                              onClick={() => {
                                console.log('Modifier clicked for booking:', booking.id)
                                openEditModal(booking)
                                setOpenDropdownId(null)
                              }}
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 w-full text-left transition-colors duration-200"
                            >
                              Modifier
                            </button>

                            {/* Options d'assignation (si en attente) */}
                            {booking.status === 'pending' && drivers.length > 0 && (
                              <>
                                <div className="border-t border-gray-200 dark:border-gray-600"></div>
                                {drivers.slice(0, 4).map((driver) => (
                                  <button
                                    key={driver.id}
                                    onClick={() => {
                                      console.log('Assign to driver clicked:', driver.name, 'for booking:', booking.id)
                                      handleAssignBooking(booking.id, driver.id)
                                      setOpenDropdownId(null)
                                    }}
                                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 w-full text-left transition-colors duration-200"
                                  >
                                    Assigner à {driver.name}
                                  </button>
                                ))}
                                {drivers.length > 4 && (
                                  <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                                    +{drivers.length - 4} autres chauffeurs...
                                  </div>
                                )}
                              </>
                            )}

                            {/* Option Supprimer - Seulement si autorisé */}
                            {canDelete('bookings') && (
                              <>
                                <div className="border-t border-gray-200 dark:border-gray-600"></div>
                                <button
                                  onClick={() => {
                                    console.log('Delete clicked for booking:', booking.id)
                                    openDeleteConfirm(booking.id)
                                    setOpenDropdownId(null)
                                  }}
                                  className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors duration-200"
                                >
                                  Supprimer
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredBookings.length > 0 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredBookings.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(filteredBookings.length / itemsPerPage)}
                  className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
              
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Affichage de{' '}
                    <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>
                    {' '}à{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredBookings.length)}
                    </span>
                    {' '}sur{' '}
                    <span className="font-medium">{filteredBookings.length}</span>
                    {' '}réservations
                  </p>
                </div>
                
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Page précédente</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Pages numbers */}
                    {Array.from({ length: Math.ceil(filteredBookings.length / itemsPerPage) }, (_, i) => i + 1).map((page) => {
                      const isCurrentPage = page === currentPage
                      const showPage = (
                        page === 1 || 
                        page === Math.ceil(filteredBookings.length / itemsPerPage) ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      
                      if (!showPage) {
                        if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                              ...
                            </span>
                          )
                        }
                        return null
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            isCurrentPage
                              ? 'z-10 bg-blue-50 dark:bg-blue-900/50 border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredBookings.length / itemsPerPage)))}
                      disabled={currentPage === Math.ceil(filteredBookings.length / itemsPerPage)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Page suivante</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingBooking ? 'Modifier la réservation' : 'Nouvelle réservation'}
            </h3>
            
            <form onSubmit={editingBooking ? handleUpdateBooking : handleCreateBooking} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom du client
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email du client
                  </label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Téléphone du client
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresse de prise en charge
                </label>
                <input
                  type="text"
                  value={formData.pickupAddress}
                  onChange={(e) => setFormData({...formData, pickupAddress: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresse de destination
                </label>
                <input
                  type="text"
                  value={formData.dropoffAddress}
                  onChange={(e) => setFormData({...formData, dropoffAddress: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date et heure
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledDateTime}
                    onChange={(e) => setFormData({...formData, scheduledDateTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="pending">⏳ En attente</option>
                    <option value="confirmed">✅ Confirmée</option>
                    <option value="in_progress">🚗 En cours</option>
                    <option value="completed">🏁 Terminée</option>
                    <option value="cancelled">❌ Annulée</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Chauffeur
                  </label>
                  <select
                    value={formData.driverId}
                    onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Sélectionner un chauffeur</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} ({driver.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Véhicule
                  </label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Sélectionner un véhicule</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.plateNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prix (FCFA)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                >
                  {editingBooking ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de détails de la réservation */}
      {isDetailsModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50" onClick={() => setIsDetailsModalOpen(false)}>
          <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div 
                className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white dark:bg-gray-900 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          📋 Détails de la réservation #{selectedBooking.id}
                        </h3>
                        <button
                          onClick={() => setIsDetailsModalOpen(false)}
                          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Status Badge */}
                      <div className="mb-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          selectedBooking.status === 'assigned' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                          selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          selectedBooking.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400' :
                          selectedBooking.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' :
                          selectedBooking.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {selectedBooking.status === 'pending' ? '⏳ En attente' :
                           selectedBooking.status === 'assigned' ? '👨‍✈️ Assigné' :
                           selectedBooking.status === 'confirmed' ? '✅ Confirmé' :
                           selectedBooking.status === 'in_progress' ? '🚗 En cours' :
                           selectedBooking.status === 'completed' ? '✅ Terminé' :
                           selectedBooking.status === 'cancelled' ? '❌ Annulé' :
                           selectedBooking.status}
                        </span>
                      </div>

                      {/* Content Grid */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Informations Client */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            👤 Informations Client
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom:</span>
                              <p className="text-gray-900 dark:text-white">{selectedBooking.customerName}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email:</span>
                              <p className="text-gray-900 dark:text-white">{selectedBooking.customerEmail}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone:</span>
                              <p className="text-gray-900 dark:text-white">{selectedBooking.customerPhone}</p>
                            </div>
                          </div>
                        </div>

                        {/* Informations Trajet */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            🗺️ Informations Trajet
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Départ:</span>
                              <p className="text-gray-900 dark:text-white">{selectedBooking.pickupAddress}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Destination:</span>
                              <p className="text-gray-900 dark:text-white">{selectedBooking.dropoffAddress}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Date et heure:</span>
                              <p className="text-gray-900 dark:text-white">
                                {new Date(selectedBooking.scheduledDateTime).toLocaleString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Détails du Service */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            🚖 Détails du Service
                          </h4>
                          <div className="space-y-3">
                            {(() => {
                              const parsedNotes = parseBookingNotes(selectedBooking.notes)
                              return (
                                <>
                                  <div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Type de service:</span>
                                    <p className="text-gray-900 dark:text-white">{parsedNotes.Service || 'Non spécifié'}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre de passagers:</span>
                                    <p className="text-gray-900 dark:text-white">{parsedNotes.Passagers || 'Non spécifié'}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre de valises:</span>
                                    <p className="text-gray-900 dark:text-white">{parsedNotes.Valises || 'Non spécifié'}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Durée:</span>
                                    <p className="text-gray-900 dark:text-white">{parsedNotes.Durée || 'Non spécifiée'}</p>
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                        </div>

                        {/* Assignation et Prix */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            💼 Assignation & Tarification
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Chauffeur:</span>
                              <p className="text-gray-900 dark:text-white">
                                {selectedBooking.driver?.name || 'Non assigné'}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Véhicule:</span>
                              <p className="text-gray-900 dark:text-white">
                                {selectedBooking.vehicle ? 
                                  `${selectedBooking.vehicle.make} ${selectedBooking.vehicle.model}` : 
                                  'Non assigné'
                                }
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Prix:</span>
                              <p className="text-gray-900 dark:text-white font-bold text-lg">
                                {selectedBooking.price ? `${formatPrice(selectedBooking.price)}` : 'Non défini'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Services additionnels et demandes spéciales */}
                      {(() => {
                        const parsedNotes = parseBookingNotes(selectedBooking.notes)
                        const hasAdditionalInfo = parsedNotes['Services additionnels'] || parsedNotes['Demandes spéciales']
                        
                        if (hasAdditionalInfo) {
                          return (
                            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                ✨ Informations Supplémentaires
                              </h4>
                              <div className="space-y-3">
                                {parsedNotes['Services additionnels'] && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Services additionnels:</span>
                                    <p className="text-gray-900 dark:text-white">{parsedNotes['Services additionnels']}</p>
                                  </div>
                                )}
                                {parsedNotes['Demandes spéciales'] && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Demandes spéciales:</span>
                                    <p className="text-gray-900 dark:text-white">{parsedNotes['Demandes spéciales']}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        }
                        return null
                      })()}

                      {/* Informations système */}
                      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                          <span>Créée le: {new Date(selectedBooking.createdAt).toLocaleString('fr-FR')}</span>
                          <span>ID: #{selectedBooking.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions Footer */}
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                    onClick={() => {
                      setIsDetailsModalOpen(false)
                      openEditModal(selectedBooking)
                    }}
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto"
                    onClick={() => setIsDetailsModalOpen(false)}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centre de notifications */}
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setDeleteTargetId(null) }}
        title="Supprimer la réservation"
        message="Cette action est irréversible. La réservation sera définitivement supprimée. Voulez-vous continuer ?"
        type="error"
        confirmText="Supprimer définitivement"
        onConfirm={handleDeleteBooking}
        showCancel={true}
        cancelText="Annuler"
      />
    </div>
  )
}
