"use client"

import { useState, useEffect } from "react"

interface AdminStats {
  totalUsers: number
  totalVehicles: number
  totalBookings: number
  totalQuotes: number
  totalReviews: number
  activeSessions: number
  recentBookings: Array<{
    id: string;
    customerName: string;
    status: string;
    createdAt: string;
    pickupAddress: string;
    dropoffAddress: string;
  }>
  recentQuotes: Array<{
    id: string;
    customerName: string;
    status: string;
    createdAt: string;
    service: string;
  }>
  topVehicles: Array<{
    id: string;
    make: string;
    model: string;
    year: number;
    capacity: number;
    bookingsCount: number;
  }>
}

export function AdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error('Erreur HTTP:', response.status)
        setStats(null)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      setStats(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Erreur lors du chargement des statistiques
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Utilisateurs',
      value: stats.totalUsers,
      icon: '👥',
      color: 'blue',
      description: 'Total des utilisateurs'
    },
    {
      title: 'Véhicules',
      value: stats.totalVehicles,
      icon: '🚗',
      color: 'green',
      description: 'Véhicules disponibles'
    },
    {
      title: 'Réservations',
      value: stats.totalBookings,
      icon: '📅',
      color: 'purple',
      description: 'Réservations totales'
    },
    {
      title: 'Demandes de devis',
      value: stats.totalQuotes,
      icon: '💰',
      color: 'orange',
      description: 'Devis en attente'
    },
    {
      title: 'Avis',
      value: stats.totalReviews,
      icon: '⭐',
      color: 'yellow',
      description: 'Avis clients'
    },
    {
      title: 'Sessions actives',
      value: stats.activeSessions,
      icon: '🔑',
      color: 'indigo',
      description: 'Sessions en cours'
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Tableau de bord administrateur
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Vue d&apos;ensemble de votre plateforme Navette Xpress
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {card.description}
                </p>
              </div>
              <div className="text-4xl opacity-80">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Réservations récentes et Demandes de devis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📅 Réservations récentes
          </h3>
          <div className="space-y-3">
            {stats.recentBookings.length > 0 ? (
              stats.recentBookings.map((booking, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {booking.customerName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {booking.pickupAddress} → {booking.dropoffAddress}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Aucune réservation récente
              </p>
            )}
          </div>
        </div>

        {/* Demandes de devis récentes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            💰 Demandes de devis récentes
          </h3>
          <div className="space-y-3">
            {stats.recentQuotes && stats.recentQuotes.length > 0 ? (
              stats.recentQuotes.map((quote, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {quote.customerName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {quote.service}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {quote.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Aucune demande de devis récente
              </p>
            )}
          </div>
        </div>

        {/* Véhicules populaires */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🚗 Véhicules populaires
          </h3>
          <div className="space-y-3">
            {stats.topVehicles.length > 0 ? (
              stats.topVehicles.map((vehicle, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {vehicle.year} • {vehicle.capacity} places
                    </p>
                  </div>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {vehicle.bookingsCount} réservations
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Aucun véhicule disponible
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}