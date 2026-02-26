"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { FilterBar } from "@/components/ui/FilterBar"
import { useNotification } from "@/hooks/useNotification"
import {
  ClipboardText,
  CheckCircle,
  X,
  Car,
  Flag,
  CurrencyDollar,
  MapPin,
  ArrowDown,
  CaretDown
} from "@phosphor-icons/react"

interface DriverBooking {
  id: number
  customerName: string
  customerEmail: string
  customerPhone: string
  pickupAddress: string
  dropoffAddress: string
  scheduledDateTime: string
  status: 'assigned' | 'approved' | 'rejected' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  vehicleId: number
  price?: number
  notes?: string
  createdAt: string
  vehicle?: {
    make: string
    model: string
    plateNumber: string
    photo?: string
  }
}

export function DriverBookings() {
  const [bookings, setBookings] = useState<DriverBooking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<DriverBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter] = useState<'all' | 'assigned' | 'approved' | 'rejected'>('all')
  const { notifications, showSuccess, showError, removeNotification } = useNotification()
  const [filters, setFilters] = useState({
    status: 'assigned',
    search: ''
  })

  useEffect(() => {
    fetchBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, filters])

  const fetchBookings = async () => {
    try {
      const url = filter === 'all' ? '/api/driver/bookings' : `/api/driver/bookings?status=${filter}`
      const response = await fetch(url)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setBookings(result.data)
        } else {
          console.error('Erreur lors du chargement des réservations:', result.error)
          setBookings([])
        }
      } else {
        console.error('Erreur HTTP:', response.status)
        setBookings([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error)
      setBookings([])
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...bookings]

    // Filtre par statut
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.status)
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
  }

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      status: 'assigned',
      search: ''
    })
  }

  const getFilterCounts = () => {
    const statusCounts = {
      assigned: bookings.filter(b => b.status === 'assigned').length,
      approved: bookings.filter(b => b.status === 'approved').length,
      rejected: bookings.filter(b => b.status === 'rejected').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      in_progress: bookings.filter(b => b.status === 'in_progress').length,
      completed: bookings.filter(b => b.status === 'completed').length
    }

    return { statusCounts }
  }

  const handleBookingResponse = async (bookingId: number, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/driver/bookings/${bookingId}/response`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        await fetchBookings()
        const actionText = action === 'approve' ? 'approuvée' : 'rejetée'
        showSuccess(`La réservation a été ${actionText} avec succès`, `Réservation ${actionText}`)
      } else {
        const error = await response.json()
        showError(`Erreur: ${error.error}`, 'Échec de l\'opération')
      }
    } catch (error) {
      console.error('Erreur lors de la réponse:', error)
      showError('Une erreur est survenue lors de la réponse à la réservation', 'Erreur technique')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <ClipboardText size={16} weight="bold" />
      case 'approved': return <CheckCircle size={16} weight="fill" />
      case 'rejected': return <X size={16} weight="bold" />
      case 'confirmed': return <CheckCircle size={16} weight="fill" />
      case 'in_progress': return <Car size={16} weight="bold" />
      case 'completed': return <Flag size={16} weight="bold" />
      case 'cancelled': return <X size={16} weight="bold" />
      default: return null
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Mes réservations
        </h2>
      </div>

      {/* Barre de filtres */}
      <FilterBar
        filters={{
          status: {
            label: 'Statut',
            options: [
              { value: 'all', label: 'Tous les statuts' },
              { value: 'assigned', label: <span className="flex items-center gap-2"><ClipboardText size={14} weight="bold" /> Assignées</span>, count: getFilterCounts().statusCounts.assigned },
              { value: 'approved', label: <span className="flex items-center gap-2"><CheckCircle size={14} weight="fill" /> Approuvées</span>, count: getFilterCounts().statusCounts.approved },
              { value: 'rejected', label: <span className="flex items-center gap-2"><X size={14} weight="bold" /> Rejetées</span>, count: getFilterCounts().statusCounts.rejected },
              { value: 'confirmed', label: <span className="flex items-center gap-2"><CheckCircle size={14} weight="fill" /> Confirmées</span>, count: getFilterCounts().statusCounts.confirmed },
              { value: 'in_progress', label: <span className="flex items-center gap-2"><Car size={14} weight="bold" /> En cours</span>, count: getFilterCounts().statusCounts.in_progress },
              { value: 'completed', label: <span className="flex items-center gap-2"><Flag size={14} weight="bold" /> Terminées</span>, count: getFilterCounts().statusCounts.completed }
            ],
            value: filters.status,
            onChange: (value) => handleFilterChange('status', value)
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
        activeFiltersCount={Object.values(filters).filter(v => v !== '' && v !== 'assigned').length}
      />

      {/* Tableau des réservations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Trajet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date/Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Photo Véhicule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Véhicule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {booking.customerName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {booking.customerEmail}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {booking.customerPhone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="font-medium flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <MapPin size={14} weight="fill" /> {booking.pickupAddress}
                      </div>
                      <div className="text-gray-400 ml-4 my-1">
                        <ArrowDown size={12} weight="bold" />
                      </div>
                      <div className="font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <MapPin size={14} weight="fill" /> {booking.dropoffAddress}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(booking.scheduledDateTime).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)} {booking.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="shrink-0 h-8 w-8">
                      {booking.vehicle?.photo ? (
                        <div className="relative h-8 w-8 rounded overflow-hidden">
                          <Image
                            fill
                            className="object-cover"
                            src={booking.vehicle.photo}
                            alt={`Photo de ${booking.vehicle.make} ${booking.vehicle.model}`}
                            sizes="32px"
                          />
                        </div>
                      ) : null}
                      <div className={`h-8 w-8 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-medium ${booking.vehicle?.photo ? 'hidden' : ''}`}>
                        <Car size={16} weight="fill" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="font-medium">{booking.vehicle?.make} {booking.vehicle?.model}</div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {booking.vehicle?.plateNumber}
                      </div>
                      {booking.price && (
                        <div className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1 mt-1">
                          <CurrencyDollar size={14} weight="bold" /> {booking.price.toLocaleString()} FCFA
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {booking.status === 'assigned' ? (
                      <div className="relative">
                        <select
                          onChange={(e) => {
                            const action = e.target.value
                            if (action === 'approve') {
                              handleBookingResponse(booking.id, 'approve')
                            } else if (action === 'reject') {
                              handleBookingResponse(booking.id, 'reject')
                            }
                            e.target.value = ''
                          }}
                          className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 dark:text-gray-300"
                        >
                          <option value="">Actions...</option>
                          <option value="approve" className="text-green-600">Approuver</option>
                          <option value="reject" className="text-red-600">Rejeter</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <CaretDown size={14} weight="bold" className="text-gray-400" />
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">
                        Aucune action disponible
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            Aucune réservation trouvée
          </div>
        </div>
      )}

      {/* Centre de notifications */}
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  )
}

