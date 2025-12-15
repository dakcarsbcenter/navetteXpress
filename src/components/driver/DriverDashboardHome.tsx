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

// Fonction pour formater la date
const formatGreeting = () => {
  const now = new Date()
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  
  const dayName = dayNames[now.getDay()]
  const day = now.getDate()
  const month = monthNames[now.getMonth()]
  const year = now.getFullYear()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  
  return {
    greeting: `${dayName} ${day} ${month} ${year}`,
    time: `${hours}:${minutes}`
  }
}

export function DriverDashboardHome({ onNavigate, hasPermission, permissionsLoading }: DriverDashboardHomeProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState(formatGreeting())

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
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  
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

  // Mettre à jour l'heure chaque minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(formatGreeting())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1700px] mx-auto p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Section principale */}
          <div className="flex-1 flex flex-col gap-8">
            <h1 className="text-xl font-bold text-blue-900 mb-4">Vue d'ensemble</h1>
            
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-2">
              <div className="bg-white rounded-xl p-6 shadow flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Revenus Hebdo</div>
                  <div className="text-2xl font-bold text-blue-900">{stats.earnings.toLocaleString()} FCFA</div>
                  <div className="text-xs text-green-600 mt-1">Include +12% cette semaine</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Courses Réalisées</div>
                  <div className="text-2xl font-bold text-blue-900">{stats.weeklyRides}</div>
                  <div className="text-xs text-green-600 mt-1">Include +12% cette semaine</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Note Moyenne</div>
                  <div className="text-2xl font-bold text-blue-900">{stats.rating}/5</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Prochaine Mission */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-gray-900">Prochaine Mission</h2>
              <button 
                onClick={() => onNavigate('planning')} 
                className="text-xs text-blue-700 font-semibold hover:underline cursor-pointer"
              >
                Voir tout
              </button>
            </div>
            <div className="bg-white rounded-xl shadow p-8 flex flex-col gap-4 mb-6">
              <div className="flex items-center gap-4 mb-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded font-semibold text-xs">NAVETTE ENTREPRISE</span>
                <span className="text-xl font-bold text-blue-900 ml-auto">15 000 FCFA</span>
              </div>
              <div className="flex gap-8">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">Départ</span>
                    <span className="text-xs text-gray-500">07:30</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">Sacré-Cœur 3, VDN</div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-bold">Arrivée</span>
                    <span className="text-xs text-gray-500">08:15 (EST)</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">Siège Orange, Almadies</div>
                </div>
                <div className="flex flex-col gap-2 ml-auto">
                  <button 
                    onClick={() => {
                      // Logique pour démarrer la mission
                      alert('Fonctionnalité de démarrage de mission en cours de développement');
                    }}
                    className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span className="text-lg">✈️</span> Démarrer
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs text-gray-500">Client: Orange Sénégal</div>
                <div className="text-xs text-gray-500">Contact: 77 000 00 00</div>
              </div>
            </div>

            {/* Cet après-midi */}
            <div className="text-xs font-bold text-gray-700 mb-2">CET APRÈS-MIDI</div>
            <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Transfert AIBD</div>
                <div className="text-xs text-gray-500">14:00 • Aéroport AIBD</div>
              </div>
            </div>
          </div>

          {/* Panneau latéral droit */}
          <div className="w-full lg:w-96 flex flex-col gap-6">
            <div className="bg-orange-50 rounded-xl shadow p-6 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-500 text-xl">⚠️</span>
                <span className="font-bold text-orange-700">Action Requise</span>
              </div>
              <div className="text-xs text-gray-700 mb-2">Votre assurance expire dans 5 jours. Veuillez mettre à jour le document.</div>
              <button className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold">METTRE À JOUR</button>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="font-bold text-gray-700 mb-2">Aujourd'hui</div>
              <div className="flex flex-col gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">08:00</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded font-semibold text-xs">Réservé - Navette</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">08:00</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded font-semibold text-xs">Réservé - Navette</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">08:00</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded font-semibold text-xs">Réservé - Navette</span>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('planning')}
                className="w-full mt-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 cursor-pointer transition-colors"
              >
                Voir Planning Complet
              </button>
            </div>
          </div>
        </div>
      </div>

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
  )
}
