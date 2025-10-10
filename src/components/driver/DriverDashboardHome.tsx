"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface Stats {
  weeklyRides: number
  hoursWorked: number
  earnings: number
  rating: number
  ridesGrowth: number
  hoursGrowth: number
  earningsGrowth: number
  currentRides: Array<{
    id: string;
    customerName: string;
    pickupAddress: string;
    dropoffAddress: string;
    scheduledDateTime: string;
    status: string;
  }>
}

interface DriverDashboardHomeProps {
  onNavigate: (view: 'planning' | 'vehicle-report' | 'stats') => void
}

export function DriverDashboardHome({ onNavigate }: DriverDashboardHomeProps) {
  const { data: session } = useSession()
  const [stats] = useState<Stats>({
    weeklyRides: 28,
    hoursWorked: 156,
    earnings: 3420,
    rating: 4.9,
    ridesGrowth: 12,
    hoursGrowth: 8,
    earningsGrowth: 15,
    currentRides: []
  })
  const [currentRides] = useState([
    {
      id: 1,
      client: "M. Dubois",
      phone: "+33 6 12 34 56 78",
      pickup: "Aéroport Charles de Gaulle",
      destination: "Hotel Plaza Athénée, Dakar",
      time: "14:30",
      status: "En cours",
      vehicle: "Mercedes Classe S",
      price: 180
    },
    {
      id: 2,
      client: "Mme. Martin",
      phone: "+33 6 98 76 54 32", 
      pickup: "16 Rue de la Paix, Dakar",
      destination: "Gare du Nord",
      time: "16:00",
      status: "Confirmé",
      vehicle: "BMW Série 7",
      price: 120
    },
    {
      id: 3,
      client: "Dr. Rousseau",
      phone: "+33 6 45 67 89 12",
      pickup: "Hôpital Pitié-Salpêtrière",
      destination: "Aéroport Orly",
      time: "18:45",
      status: "À venir",
      vehicle: "Audi A8",
      price: 150
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'Confirmé': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'À venir': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'En cours': return '🚗'
      case 'Confirmé': return '✅'
      case 'À venir': return '⏰'
      default: return '📅'
    }
  }

  const currentDate = new Date()
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long'
    }).format(date)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">👋</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Tableau de Bord
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Bonjour, {session?.user?.name || 'Marie Martin'} 👋
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Aujourd&apos;hui</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatDate(currentDate)}
            </p>
          </div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Bienvenue dans votre espace personnel Navette Xpress. Gérez vos courses et suivez vos performances en temps réel.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Courses cette semaine */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400">📊</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Courses cette semaine</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.weeklyRides}</p>
            </div>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400">
            +{stats.ridesGrowth}% vs semaine dernière
          </p>
        </div>

        {/* Heures conduites */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400">⏰</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Heures conduites</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.hoursWorked}h</p>
            </div>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400">
            +{stats.hoursGrowth}% vs semaine dernière
          </p>
        </div>

        {/* Revenus */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
              <span className="text-orange-600 dark:text-orange-400">💰</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenus</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.earnings} FCFA</p>
            </div>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400">
            +{stats.earningsGrowth}% vs semaine dernière
          </p>
        </div>

        {/* Note moyenne */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400">⭐</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Note moyenne</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rating}/5</p>
            </div>
          </div>
          <p className="text-sm text-purple-600 dark:text-purple-400">Excellent</p>
        </div>
      </div>

      {/* Today's Rides */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400">📅</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Courses d&apos;aujourd&apos;hui
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentRides.length} courses programmées
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total estimé</p>
            <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              {currentRides.reduce((sum, ride) => sum + ride.price, 0)} FCFA
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {currentRides.map((ride) => (
            <div key={ride.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {ride.client.split('.')[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">{ride.client}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{ride.phone}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Départ</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{ride.pickup}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Arrivée</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{ride.destination}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{ride.time}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                      {getStatusIcon(ride.status)} {ride.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Véhicule</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{ride.vehicle}</span>
                  </div>
                  <div className="flex space-x-2">
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
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Planning */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Planning</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Consultez votre planning de la semaine
          </p>
          <button
            onClick={() => {
              console.log('Navigation vers Planning');
              onNavigate('planning');
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200"
          >
            Voir le Planning
          </button>
        </div>

        {/* Véhicule */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😞</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Véhicule</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Signaler un problème véhicule
          </p>
          <button
            onClick={() => {
              console.log('Navigation vers Rapport Véhicule');
              onNavigate('vehicle-report');
            }}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200"
          >
            Rapport Véhicule
          </button>
        </div>

        {/* Statistiques */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Statistiques</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Analysez vos performances
          </p>
          <button
            onClick={() => {
              console.log('Navigation vers Statistiques');
              onNavigate('stats');
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200"
          >
            Voir Stats
          </button>
        </div>
      </div>
    </div>
  )
}
