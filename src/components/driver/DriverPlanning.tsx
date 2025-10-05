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
  status: 'confirmed' | 'pending' | 'in_progress' | 'completed' | 'cancelled'
  vehicle: string
  price: number
  duration: string
  notes?: string
}

export function DriverPlanning({ onBack }: PlanningProps) {
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekView, setWeekView] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 1,
      client: "M. Dubois",
      phone: "+33 6 12 34 56 78",
      pickup: "Aéroport Charles de Gaulle",
      destination: "Hotel Plaza Athénée, Dakar",
      date: "2024-09-25",
      time: "14:30",
      status: "confirmed",
      vehicle: "Mercedes Classe S",
      price: 180,
      duration: "45 min"
    },
    {
      id: 2,
      client: "Mme. Martin",
      phone: "+33 6 98 76 54 32",
      pickup: "16 Rue de la Paix, Dakar", 
      destination: "Gare du Nord",
      date: "2024-09-25",
      time: "16:00",
      status: "pending",
      vehicle: "BMW Série 7",
      price: 120,
      duration: "25 min"
    },
    {
      id: 3,
      client: "Dr. Rousseau",
      phone: "+33 6 45 67 89 12",
      pickup: "Hôpital Pitié-Salpêtrière",
      destination: "Aéroport Orly",
      date: "2024-09-26",
      time: "09:15",
      status: "confirmed",
      vehicle: "Audi A8",
      price: 150,
      duration: "40 min"
    },
    {
      id: 4,
      client: "Mme. Leroy",
      phone: "+33 6 11 22 33 44",
      pickup: "Gare de Lyon",
      destination: "La Défense",
      date: "2024-09-26",
      time: "11:30",
      status: "confirmed",
      vehicle: "Mercedes Classe S",
      price: 85,
      duration: "30 min"
    },
    {
      id: 5,
      client: "M. Bernard",
      phone: "+33 6 55 66 77 88",
      pickup: "Place Vendôme",
      destination: "Aéroport Charles de Gaulle",
      date: "2024-09-27",
      time: "07:45",
      status: "confirmed",
      vehicle: "BMW Série 7",
      price: 195,
      duration: "50 min"
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'completed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return '✅ Confirmé'
      case 'pending': return '⏳ En attente'
      case 'in_progress': return '🚗 En cours'
      case 'completed': return '✅ Terminé'
      case 'cancelled': return '❌ Annulé'
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
                            {dayBookings.reduce((sum, booking) => sum + booking.price, 0)}€
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
                              {booking.price}€
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
                      {booking.price}€
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {booking.phone}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                        Voir détails
                      </button>
                      <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
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
