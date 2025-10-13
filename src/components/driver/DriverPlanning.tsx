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
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekView, setWeekView] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(false)

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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(date)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

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
            ? { ...booking, status: newStatus as 'confirmed' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'assigned' }
            : booking
        )
      )

      return { success: true }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Planning
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Votre planning de la semaine
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setWeekView(true)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  weekView
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setWeekView(false)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  !weekView
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Jour
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message de chargement */}
      {isLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-700 dark:text-blue-300">Chargement de votre planning...</p>
        </div>
      )}

      {weekView ? (
        /* Week View */
        <div className="space-y-6">
          {getDaysOfWeek().map((day, index) => {
            const dayBookings = getBookingsForDate(day)
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isToday(day) 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      <span className="font-bold">{day.getDate()}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatDate(day)}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {dayBookings.length} course{dayBookings.length !== 1 ? 's' : ''}
                        {dayBookings.length > 0 && (
                          <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                            {dayBookings.reduce((sum, booking) => sum + booking.price, 0)} FCFA
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {dayBookings.length > 0 ? (
                  <div className="space-y-3">
                    {dayBookings.map((booking) => (
                      <div key={booking.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-2 h-12 bg-blue-600 rounded-full"></div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-gray-900 dark:text-white">{booking.time}</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{booking.client}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                  {getStatusLabel(booking.status)}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">📍</span>
                                  <span className="text-sm text-gray-900 dark:text-white">{booking.pickup}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">🎯</span>
                                  <span className="text-sm text-gray-900 dark:text-white">{booking.destination}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              {booking.price} FCFA
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {booking.duration}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {booking.vehicle}
                            </div>
                            <div className="flex space-x-2 mt-2">
                              <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
                                Détails
                              </button>
                              <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors">
                                Appeler
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📅</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">Aucune course programmée ce jour</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Day View */
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate)
                  newDate.setDate(newDate.getDate() - 1)
                  setSelectedDate(newDate)
                }}
                className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatDate(selectedDate)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getBookingsForDate(selectedDate).length} course{getBookingsForDate(selectedDate).length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate)
                  newDate.setDate(newDate.getDate() + 1)
                  setSelectedDate(newDate)
                }}
                className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {getBookingsForDate(selectedDate).map((booking) => (
              <div key={booking.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {booking.time}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {booking.duration}
                      </div>
                    </div>
                    <div className="w-1 h-16 bg-blue-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">{booking.client}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-600 dark:text-gray-400">📍</span>
                          <span className="text-gray-900 dark:text-white font-medium">{booking.pickup}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-600 dark:text-gray-400">🎯</span>
                          <span className="text-gray-900 dark:text-white font-medium">{booking.destination}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-600 dark:text-gray-400">🚗</span>
                          <span className="text-gray-900 dark:text-white">{booking.vehicle}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {booking.price} FCFA
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {booking.phone}
                    </div>
                    <div className="flex flex-col space-y-2">
                      {/* Boutons d'action selon le statut */}
                      {booking.status === 'assigned' && (
                        <button 
                          onClick={async () => {
                            const result = await updateBookingStatus(booking.id, 'confirmed')
                            if (!result.success) {
                              alert('Erreur: ' + result.error)
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <span>✅</span>
                          Confirmer
                        </button>
                      )}
                      
                      {booking.status === 'confirmed' && (
                        <button 
                          onClick={async () => {
                            const result = await updateBookingStatus(booking.id, 'in_progress')
                            if (!result.success) {
                              alert('Erreur: ' + result.error)
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <span>🚗</span>
                          Démarrer
                        </button>
                      )}
                      
                      {booking.status === 'in_progress' && (
                        <button 
                          onClick={async () => {
                            const result = await updateBookingStatus(booking.id, 'completed')
                            if (!result.success) {
                              alert('Erreur: ' + result.error)
                            }
                          }}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <span>✅</span>
                          Terminer
                        </button>
                      )}

                      <button 
                        onClick={() => window.location.href = `tel:${booking.phone}`}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <span>📞</span>
                        Appeler client
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {getBookingsForDate(selectedDate).length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📅</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Aucune course programmée
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Profitez de votre journée libre !
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
