"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

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

    // Filtre par recherche (nom client ou téléphone)
    if (searchTerm) {
      result = result.filter(booking => 
        booking.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.phone.includes(searchTerm)
      )
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      result = result.filter(booking => booking.status === statusFilter)
    }

    // Filtre par date
    const today = new Date().toISOString().split('T')[0]
    if (dateFilter === 'today') {
      result = result.filter(booking => booking.date === today)
    } else if (dateFilter === 'upcoming') {
      result = result.filter(booking => booking.date >= today)
    } else if (dateFilter === 'past') {
      result = result.filter(booking => booking.date < today)
    }

    // Tri
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
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des réservations')
      }

      const data: APIResponse = await response.json()
      
      if (data.success && data.data) {
        // Transformer les données pour l'affichage dans le planning
        const transformedBookings: Booking[] = data.data.map(item => {
          const scheduledDate = new Date(item.booking.scheduledDateTime)
          return {
            id: item.booking.id,
            client: item.booking.customerName,
            phone: item.booking.customerPhone,
            pickup: item.booking.pickupAddress,
            destination: item.booking.dropoffAddress,
            date: scheduledDate.toISOString().split('T')[0], // Format YYYY-MM-DD
            time: scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            status: item.booking.status as 'confirmed' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'assigned',
            vehicle: item.vehicle ? `${item.vehicle.make} ${item.vehicle.model}` : 'Véhicule non assigné',
            price: typeof item.booking.price === 'string' ? parseFloat(item.booking.price) : item.booking.price,
            duration: "30 min" // Durée estimée par défaut, peut être calculée selon la distance
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'assigned': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'completed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      // 'pending' est exclu car c'est un statut réservé aux administrateurs
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return '✅ Confirmé'
      case 'assigned': return '📋 Assigné'
      case 'in_progress': return '🚗 En cours'
      case 'completed': return '✅ Terminé'
      case 'cancelled': return '❌ Annulé'
      // 'pending' est exclu car c'est un statut réservé aux administrateurs
      default: return '❓ Inconnu'
    }
  }

  const getDaysOfWeek = () => {
    const start = new Date(selectedDate)
    start.setDate(start.getDate() - start.getDay() + 1) // Start on Monday
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    return days
  }

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return bookings.filter(booking => booking.date === dateStr)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date)
  }

  const handleSort = (column: 'date' | 'client' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour')
      }

      // Mettre à jour l'état local
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === selectedBooking.id 
            ? { ...booking, status: newStatus as 'confirmed' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'assigned' }
            : booking
        )
      )

      showToast(
        action === 'confirm' 
          ? 'Réservation confirmée avec succès ✅' 
          : 'Réservation rejetée avec succès ❌',
        'success'
      )
      
      setIsModalOpen(false)
      setSelectedBooking(null)
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      showToast(
        error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
        'error'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">📅 Planning des Missions</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Gérez vos réservations assignées</p>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Recherche */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher client ou téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Filtre par statut */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="assigned">Assigné</option>
                <option value="confirmed">Confirmé</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>

              {/* Filtre par date */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="upcoming">À venir</option>
                <option value="past">Passées</option>
              </select>

              {/* Statistiques rapides */}
              <div className="flex items-center gap-2 text-sm">
                <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg font-semibold">
                  Total: {filteredBookings.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des réservations */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Aucune réservation</h3>
              <p className="text-slate-500 dark:text-slate-400">Aucune mission ne correspond à vos critères de recherche</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        Date & Heure
                        {sortBy === 'date' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('client')}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        Client
                        {sortBy === 'client' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Trajet</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredBookings.map((booking) => (
                    <tr 
                      key={booking.id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                    >
                      {/* Date & Heure */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {formatDate(booking.date)}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            ⏰ {booking.time}
                          </span>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                              {booking.client.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {booking.client}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a 
                          href={`tel:${booking.phone}`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          📞 {booking.phone}
                        </a>
                      </td>

                      {/* Trajet */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col max-w-xs">
                          <div className="flex items-start gap-2 mb-1">
                            <span className="text-green-600 dark:text-green-400 text-xs mt-0.5">📍</span>
                            <span className="text-sm text-slate-900 dark:text-white truncate">
                              {booking.pickup}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-red-600 dark:text-red-400 text-xs mt-0.5">🎯</span>
                            <span className="text-sm text-slate-900 dark:text-white truncate">
                              {booking.destination}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => openDetails(booking)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Voir détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer avec résumé */}
        {filteredBookings.length > 0 && (
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>
                Affichage de <strong className="text-slate-900 dark:text-white">{filteredBookings.length}</strong> réservation(s)
              </span>
              <span>
                Total estimé: <strong className="text-blue-600 dark:text-blue-400">
                  {filteredBookings.reduce((sum, b) => sum + b.price, 0).toLocaleString('fr-FR')} FCFA
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* En-tête de la modal */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 pb-4 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Détails de la réservation</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenu de la modal */}
            <div className="p-6 space-y-6">
              {/* Informations client */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Client</h4>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-shrink-0 h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-2xl">
                      {selectedBooking.client.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{selectedBooking.client}</p>
                    <a href={`tel:${selectedBooking.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                      📞 {selectedBooking.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Date et heure */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Date et heure</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Date</p>
                    <p className="text-base font-medium text-slate-900 dark:text-white">📅 {formatDate(selectedBooking.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Heure</p>
                    <p className="text-base font-medium text-slate-900 dark:text-white">⏰ {selectedBooking.time}</p>
                  </div>
                </div>
              </div>

              {/* Trajet */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Trajet</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">📍</span>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Départ</p>
                      <p className="text-base font-medium text-slate-900 dark:text-white">{selectedBooking.pickup}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">🎯</span>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Destination</p>
                      <p className="text-base font-medium text-slate-900 dark:text-white">{selectedBooking.destination}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Véhicule */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Véhicule assigné</h4>
                <p className="text-base font-medium text-slate-900 dark:text-white">🚗 {selectedBooking.vehicle}</p>
              </div>

              {/* Statut et prix */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Statut</h4>
                  <span className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                    {getStatusLabel(selectedBooking.status)}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Prix</h4>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedBooking.price.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              </div>

              {/* Notes si disponibles */}
              {selectedBooking.notes && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Notes</h4>
                  <p className="text-base text-slate-700 dark:text-slate-300">{selectedBooking.notes}</p>
                </div>
              )}
            </div>

            {/* Footer de la modal */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-6 pt-4">
              {selectedBooking.status === 'assigned' || selectedBooking.status === 'pending' ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleBookingAction('confirm')}
                    disabled={isUpdating}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    {isUpdating ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Traitement...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Confirmer</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleBookingAction('reject')}
                    disabled={isUpdating}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    {isUpdating ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Traitement...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Rejeter</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast de notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 ${
            toast.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
