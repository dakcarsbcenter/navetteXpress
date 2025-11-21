"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Session } from 'next-auth'
import { CancelBookingModal } from './CancelBookingModal'

interface Stats {
  weeklyRides: number
  hoursWorked: number
  earnings: number
  rating: number
  ridesGrowth: number
  hoursGrowth: number
  earningsGrowth: number
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
  cancellationReason?: string
  cancelledBy?: string
  cancelledAt?: string
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

interface DriverDashboardHomeProps {
  onNavigate: (view: 'planning' | 'vehicle-report' | 'stats' | 'profile') => void
  hasPermission?: (resource: string, action: string) => boolean
  permissionsLoading?: boolean
}

export function DriverDashboardHome({ onNavigate, hasPermission, permissionsLoading }: DriverDashboardHomeProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  // Configuration des actions avec permissions
  const allActions = [
    {
      key: 'planning',
      title: 'Planning',
      description: 'Consultez votre planning de la semaine',
      icon: '📅',
      color: 'from-blue-500 to-blue-600',
      resource: 'bookings',
      action: 'read'
    },
    {
      key: 'vehicle-report',
      title: 'Véhicule',
      description: 'Signaler un problème véhicule',
      icon: '🔧',
      color: 'from-orange-500 to-orange-600',
      resource: 'vehicles',
      action: 'manage'
    },
    {
      key: 'stats',
      title: 'Statistiques',
      description: 'Analysez vos performances',
      icon: '📊',
      color: 'from-purple-500 to-purple-600',
      resource: 'reports',
      action: 'read'
    },
    {
      key: 'profile',
      title: 'Mon Profil',
      description: 'Gérez vos informations personnelles',
      icon: '👤',
      color: 'from-green-500 to-green-600',
      resource: 'profile',
      action: 'manage'
    }
  ]

  // Filtrer les actions selon les permissions
  const availableActions = allActions.filter(actionItem => {
    // Si pas de fonction hasPermission, afficher toutes les actions (fallback)
    if (!hasPermission) return true
    
    // Vérifier la permission pour cette action
    return hasPermission(actionItem.resource, actionItem.action)
  })
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // États pour la modal d'annulation
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<BookingData | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  
  // États pour le filtrage
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('assigned')
  
  const [stats, setStats] = useState<Stats>({
    weeklyRides: 0,
    hoursWorked: 0,
    earnings: 0,
    rating: 4.9,
    ridesGrowth: 0,
    hoursGrowth: 0,
    earningsGrowth: 0,
  })

  // Récupérer les réservations du chauffeur
  useEffect(() => {
    if (session?.user && 'role' in session.user && session.user.role === 'driver') {
      fetchDriverBookings()
    }
  }, [session])

  const fetchDriverBookings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/driver/bookings')
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des réservations')
      }

      const data: APIResponse = await response.json()
      
      if (data.success && data.data) {
        // Transformer les données pour l'affichage
        const transformedBookings: BookingData[] = data.data.map(item => ({
          id: item.booking.id,
          customerName: item.booking.customerName,
          customerPhone: item.booking.customerPhone,
          pickupAddress: item.booking.pickupAddress,
          dropoffAddress: item.booking.dropoffAddress,
          scheduledDateTime: item.booking.scheduledDateTime,
          status: item.booking.status,
          price: item.booking.price || 0,
          vehicle: item.vehicle ? {
            make: item.vehicle.make,
            model: item.vehicle.model,
            licensePlate: item.vehicle.licensePlate,
            color: item.vehicle.color,
          } : undefined
        }))
        
        setBookings(transformedBookings)
        
        // Calculer les statistiques basées sur les données réelles
        const totalEarnings = transformedBookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (typeof b.price === 'string' ? parseFloat(b.price) : b.price), 0)
        
        setStats(prev => ({
          ...prev,
          weeklyRides: transformedBookings.length,
          earnings: totalEarnings,
        }))
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations:', error)
    } finally {
      setIsLoading(false)
    }
  }



  // Fonction pour formater la date/heure
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'assigned': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'completed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      // 'pending' est exclu car c'est un statut réservé aux administrateurs
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return 'En cours'
      case 'confirmed': return 'Confirmé'
      case 'assigned': return 'Assigné'
      case 'completed': return 'Terminé'
      case 'cancelled': return 'Annulé'
      // 'pending' est exclu car c'est un statut réservé aux administrateurs
      default: return status
    }
  }

  // Fonction de filtrage par date
  const filterByDate = (booking: BookingData) => {
    const bookingDate = new Date(booking.scheduledDateTime)
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    switch (dateFilter) {
      case 'today':
        return bookingDate >= startOfDay && bookingDate < new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
      case 'week':
        return bookingDate >= startOfWeek
      case 'month':
        return bookingDate >= startOfMonth
      case 'all':
      default:
        return true
    }
  }

  // Fonction de filtrage par statut
  const filterByStatus = (booking: BookingData) => {
    if (statusFilter === 'all') return true
    return booking.status === statusFilter
  }

  // Appliquer les filtres
  const filteredBookings = bookings.filter(booking => 
    filterByDate(booking) && filterByStatus(booking)
  )

  // Utiliser les réservations filtrées pour l'affichage
  const displayedBookings = filteredBookings.slice(0, 10) // Afficher jusqu'à 10 réservations

  // Fonction pour mettre à jour le statut d'une réservation
  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/driver/bookings/${bookingId}`, {
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
          booking.id === bookingId 
            ? { ...booking, status: newStatus }
            : booking
        )
      )

      // Fermer la modal si elle est ouverte
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus })
      }

      return { success: true }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
    }
  }

  // Fonction pour mettre à jour le statut avec motif d'annulation
  const updateBookingStatusWithReason = async (bookingId: number, newStatus: string, cancellationReason?: string) => {
    try {
      const response = await fetch(`/api/driver/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          cancellationReason: cancellationReason 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour')
      }

      // Mettre à jour l'état local
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus, cancellationReason }
            : booking
        )
      )

      // Fermer la modal si elle est ouverte
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus, cancellationReason })
      }

      return { success: true }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
    }
  }

  const handleViewDetails = (ride: BookingData) => {
    console.log("handleViewDetails called with:", ride)
    setSelectedBooking(ride)
    setIsModalOpen(true)
  }

  const handleCallClient = (phone: string) => {
    console.log("handleCallClient called with phone:", phone)
    window.location.href = `tel:${phone}`
  }

  // Fonctions pour la modal d'annulation
  const openCancelModal = (booking: BookingData) => {
    setBookingToCancel(booking)
    setIsCancelModalOpen(true)
  }

  const closeCancelModal = () => {
    setIsCancelModalOpen(false)
    setBookingToCancel(null)
  }

  const handleCancelConfirm = async (reason: string) => {
    if (!bookingToCancel) return

    setIsCancelling(true)
    try {
      const result = await updateBookingStatusWithReason(bookingToCancel.id, 'cancelled', reason)
      if (result.success) {
        // Fermer les modals et réinitialiser les états
        closeCancelModal()
        if (selectedBooking && selectedBooking.id === bookingToCancel.id) {
          setIsModalOpen(false)
          setSelectedBooking(null)
        }
      } else {
        alert('Erreur: ' + result.error)
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error)
      alert('Erreur lors de l\'annulation de la réservation')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="space-y-8 p-6">
        {/* Header moderne avec salutation dynamique */}
        <div className="mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Bonjour, {session?.user?.name || "Chauffeur"} 👋
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  {new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
                  Tableau de bord chauffeur - Navette Xpress
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {new Date().toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-500">
                  Heure locale
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Message de chargement */}
      {isLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-700 dark:text-blue-300">Chargement de vos réservations...</p>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Courses cette semaine</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.weeklyRides}</p>
            </div>
            <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-white text-2xl">🚗</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Heures conduites</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.hoursWorked}h</p>
            </div>
            <div className="w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
              <span className="text-white text-2xl">⏱️</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Revenus</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.earnings} FCFA</p>
            </div>
            <div className="w-16 h-16 bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <span className="text-white text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Note moyenne</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.rating}/5</p>
            </div>
            <div className="w-16 h-16 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white text-2xl">⭐</span>
            </div>
          </div>
        </div>
      </div>

      {/* Système de filtrage */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-blue-500">🔍</span>
          Filtrer les réservations
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtre par date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Période
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as 'today' | 'week' | 'month' | 'all')}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>

          {/* Filtre par statut */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="all">Tous les statuts</option>
              <option value="assigned">Assigné</option>
              <option value="confirmed">Confirmé</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
        </div>

        {/* Boutons de filtres rapides */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setDateFilter('today')
              setStatusFilter('assigned')
            }}
            className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            Courses d'aujourd'hui
          </button>
          <button
            onClick={() => {
              setDateFilter('all')
              setStatusFilter('in_progress')
            }}
            className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            En cours
          </button>
          <button
            onClick={() => {
              setDateFilter('week')
              setStatusFilter('completed')
            }}
            className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
          >
            Terminées cette semaine
          </button>
          <button
            onClick={() => {
              setDateFilter('all')
              setStatusFilter('all')
            }}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Réinitialiser
          </button>
        </div>

        {/* Compteur de résultats */}
        <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          <span className="font-medium">{filteredBookings.length}</span> réservation(s) trouvée(s)
          {filteredBookings.length !== bookings.length && (
            <span className="text-slate-500 dark:text-slate-500"> sur {bookings.length} au total</span>
          )}
        </div>
      </div>

      {/* Courses assignées */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Réservations
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Résultats filtrés
              </p>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {displayedBookings.length} affichée(s)
            </div>
          </div>
        </div>

        <div className="p-6">
          {displayedBookings && displayedBookings.length > 0 ? (
            <div className="space-y-4">
              {displayedBookings.map((ride) => (
                <div key={ride.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-linear-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {ride.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {ride.customerName}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDateTime(ride.scheduledDateTime)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                      {getStatusLabel(ride.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Départ</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {ride.pickupAddress}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Arrivée</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {ride.dropoffAddress}
                      </p>
                    </div>
                  </div>

                  {ride.vehicle && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Véhicule</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {ride.vehicle.make} {ride.vehicle.model} - {ride.vehicle.licensePlate}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {ride.price} FCFA
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {/* Bouton d'action principale selon le statut */}
                      {ride.status === 'assigned' && (
                        <button
                          onClick={async () => {
                            const result = await updateBookingStatus(ride.id, 'confirmed')
                            if (!result.success) {
                              alert('Erreur: ' + result.error)
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <span>✅</span>
                          Confirmer
                        </button>
                      )}
                      
                      {ride.status === 'confirmed' && (
                        <button
                          onClick={async () => {
                            const result = await updateBookingStatus(ride.id, 'in_progress')
                            if (!result.success) {
                              alert('Erreur: ' + result.error)
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <span>🚗</span>
                          Démarrer
                        </button>
                      )}
                      
                      {ride.status === 'in_progress' && (
                        <button
                          onClick={async () => {
                            const result = await updateBookingStatus(ride.id, 'completed')
                            if (!result.success) {
                              alert('Erreur: ' + result.error)
                            }
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <span>✅</span>
                          Terminer
                        </button>
                      )}

                      <button 
                        onClick={() => handleViewDetails(ride)}
                        className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        Détails
                      </button>
                      <button
                        onClick={() => handleCallClient(ride.customerPhone)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <span>📞</span>
                        Appeler
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">
                {bookings.length === 0 ? 
                  "Aucune réservation assignée pour le moment." : 
                  "Aucune réservation ne correspond aux filtres sélectionnés."
                }
              </p>
              {bookings.length > 0 && filteredBookings.length === 0 && (
                <button
                  onClick={() => {
                    setDateFilter('all')
                    setStatusFilter('all')
                  }}
                  className="mt-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions rapides */}
      {permissionsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl mx-auto mb-4"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid gap-6 ${
          availableActions.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
          availableActions.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
          availableActions.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {availableActions.map((actionItem) => (
            <button
              key={actionItem.key}
              onClick={() => onNavigate(actionItem.key as 'planning' | 'vehicle-report' | 'stats' | 'profile')}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300"
            >
              <div className={`w-16 h-16 bg-linear-to-br ${actionItem.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <span className="text-white text-2xl">{actionItem.icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{actionItem.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {actionItem.description}
              </p>
            </button>
          ))}
        </div>
      )}
      
      {/* Message si aucune action disponible */}
      {!permissionsLoading && availableActions.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl text-slate-400">�</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Aucune action disponible
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Contactez votre administrateur pour obtenir les permissions nécessaires.
          </p>
        </div>
      )}

      {/* Modal de détails */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* En-tête de la modal */}
            <div className="relative p-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
              >
                <span className="text-slate-600 dark:text-slate-400 text-xl">×</span>
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                  {selectedBooking.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Détails de la Course
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Réservation #{selectedBooking.id}
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                  {getStatusLabel(selectedBooking.status)}
                </span>
              </div>
            </div>

            {/* Contenu principal */}
            <div className="p-6 space-y-6">
              {/* Informations client */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-blue-500">👤</span>
                  Informations Client
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Nom</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{selectedBooking.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Téléphone</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white">{selectedBooking.customerPhone}</p>
                      <button
                        onClick={() => handleCallClient(selectedBooking.customerPhone)}
                        className="text-green-600 hover:text-green-700 transition-colors"
                      >
                        <span className="text-lg">📞</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itinéraire */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-green-500">🗺️</span>
                  Itinéraire
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Départ</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{selectedBooking.pickupAddress}</p>
                    </div>
                  </div>
                  <div className="ml-1.5 w-0.5 h-8 bg-slate-300 dark:bg-slate-600"></div>
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Arrivée</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{selectedBooking.dropoffAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Horaire et véhicule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-orange-500">⏰</span>
                    Horaire
                  </h3>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {formatDateTime(selectedBooking.scheduledDateTime)}
                    </p>
                  </div>
                </div>

                {selectedBooking.vehicle && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="text-purple-500">🚗</span>
                      Véhicule
                    </h3>
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {selectedBooking.vehicle.make} {selectedBooking.vehicle.model}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {selectedBooking.vehicle.licensePlate} • {selectedBooking.vehicle.color}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Prix */}
              <div className="bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 text-center border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400 mb-2">Prix total</p>
                <p className="text-4xl font-bold text-green-700 dark:text-green-300">
                  {selectedBooking.price} FCFA
                </p>
              </div>
            </div>

            {/* Informations d'annulation (si applicable) */}
            {selectedBooking.status === 'cancelled' && selectedBooking.cancellationReason && (
              <div className="p-6 pt-0">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                  <h4 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3 flex items-center gap-2">
                    🚫 Réservation Annulée
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                        Motif d'annulation :
                      </p>
                      <p className="text-red-900 dark:text-red-100 bg-white dark:bg-red-800/20 p-3 rounded-lg border">
                        {selectedBooking.cancellationReason}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions de statut */}
            {selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && (
              <div className="p-6 pt-0">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Actions disponibles
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {selectedBooking.status === 'assigned' && (
                    <>
                      <button
                        onClick={async () => {
                          const result = await updateBookingStatus(selectedBooking.id, 'confirmed')
                          if (!result.success) {
                            alert('Erreur: ' + result.error)
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <span>✅</span>
                        Confirmer
                      </button>
                      <button
                        onClick={() => openCancelModal(selectedBooking)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <span>❌</span>
                        Refuser
                      </button>
                    </>
                  )}
                  
                  {selectedBooking.status === 'confirmed' && (
                    <>
                      <button
                        onClick={async () => {
                          const result = await updateBookingStatus(selectedBooking.id, 'in_progress')
                          if (!result.success) {
                            alert('Erreur: ' + result.error)
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <span>🚗</span>
                        Démarrer
                      </button>
                      <button
                        onClick={() => openCancelModal(selectedBooking)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <span>❌</span>
                        Annuler
                      </button>
                    </>
                  )}
                  
                  {selectedBooking.status === 'in_progress' && (
                    <button
                      onClick={async () => {
                        const result = await updateBookingStatus(selectedBooking.id, 'completed')
                        if (!result.success) {
                          alert('Erreur: ' + result.error)
                        }
                      }}
                      className="col-span-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <span>✅</span>
                      Marquer comme terminé
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Actions générales */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => handleCallClient(selectedBooking.customerPhone)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <span>📞</span>
                Appeler le client
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 rounded-xl font-semibold bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'annulation améliorée */}
      <CancelBookingModal
        isOpen={isCancelModalOpen}
        onClose={closeCancelModal}
        onConfirm={handleCancelConfirm}
        bookingId={bookingToCancel?.id}
        customerName={bookingToCancel?.customerName}
        isLoading={isCancelling}
      />
      </div>
    </div>
  )
}
