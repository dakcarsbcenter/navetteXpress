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

  // Générer les heures de 0 à 23
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Obtenir la position d'un booking dans la grille
  const getBookingPosition = (booking: Booking) => {
    const [hours, minutes] = booking.time.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes
    const topPosition = (totalMinutes / 60) * 60 // 60px par heure
    return topPosition
  }

  // Obtenir la hauteur d'un booking (on considère 30 min par défaut)
  const getBookingHeight = (duration: string) => {
    const minutes = parseInt(duration)
    return (minutes / 60) * 60 // 60px par heure
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setSelectedDate(newDate)
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="flex-none border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              Today
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <h2 className="text-xl font-normal text-gray-900">
              {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(selectedDate)}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <option>Week</option>
              <option>Month</option>
              <option>Year</option>
            </select>
          </div>
        </div>

        {/* En-têtes des jours */}
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-2 text-right pr-4">
            <span className="text-xs text-gray-500">GMT+00</span>
          </div>
          {getDaysOfWeek().map((day, index) => (
            <div key={index} className="p-2 text-center border-l border-gray-200">
              <div className="text-xs text-gray-500 uppercase">
                {new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day)}
              </div>
              <div className={`text-2xl font-normal mt-1 ${
                isToday(day) 
                  ? 'w-10 h-10 bg-blue-600 text-white rounded-full mx-auto flex items-center justify-center' 
                  : 'text-gray-900'
              }`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grille du calendrier avec scroll */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8" style={{ minHeight: '1440px' }}> {/* 24h * 60px */}
          {/* Colonne des heures */}
          <div className="relative border-r border-gray-200">
            {hours.map((hour) => (
              <div key={hour} className="h-[60px] border-b border-gray-200 relative">
                <span className="absolute -top-2 right-2 text-xs text-gray-500">
                  {hour.toString().padStart(2, '0')} AM
                </span>
              </div>
            ))}
          </div>

          {/* Colonnes des jours */}
          {getDaysOfWeek().map((day, dayIndex) => {
            const dayBookings = getBookingsForDate(day)
            return (
              <div key={dayIndex} className="relative border-l border-gray-200">
                {/* Lignes horaires */}
                {hours.map((hour) => (
                  <div key={hour} className="h-[60px] border-b border-gray-100"></div>
                ))}
                
                {/* Bookings positionnés absolument */}
                {dayBookings.map((booking) => {
                  const top = getBookingPosition(booking)
                  const height = getBookingHeight(booking.duration)
                  const statusColors = {
                    confirmed: 'bg-green-500',
                    assigned: 'bg-orange-500',
                    in_progress: 'bg-blue-500',
                    completed: 'bg-purple-500',
                    cancelled: 'bg-red-500',
                    pending: 'bg-gray-500'
                  }
                  
                  return (
                    <div
                      key={booking.id}
                      className={`absolute left-1 right-1 ${statusColors[booking.status]} text-white rounded p-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}
                      style={{ 
                        top: `${top}px`, 
                        height: `${height}px`,
                        zIndex: 10
                      }}
                      title={`${booking.client} - ${booking.pickup} → ${booking.destination}`}
                    >
                      <div className="text-xs font-medium truncate">{booking.client}</div>
                      <div className="text-xs truncate">{booking.time}</div>
                      <div className="text-xs truncate opacity-90">{booking.pickup}</div>
                    </div>
                  )
                })}
                
                {/* Ligne d'heure actuelle (si c'est aujourd'hui) */}
                {isToday(day) && (
                  <div 
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-20"
                    style={{ 
                      top: `${(new Date().getHours() * 60 + new Date().getMinutes()) / 60 * 60}px` 
                    }}
                  >
                    <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
