"use client"

import React, { useState, useEffect } from 'react'

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
  cancellationReason?: string | null
  cancelledBy?: string | null
  cancelledAt?: string | null
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
  cancelledByUser?: {
    name: string
    role: string
  }
}

interface Driver {
  id: string
  name: string
  email: string
  phone?: string
}

interface Vehicle {
  id: string
  make: string
  model: string
  plateNumber: string
}

interface BookingDetailsModalProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  drivers: Driver[]
  vehicles: Vehicle[]
}

export function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onUpdate,
  drivers,
  vehicles
}: BookingDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedBooking, setEditedBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (booking) {
      setEditedBooking({ ...booking })
      setIsEditing(false)
    }
  }, [booking])

  if (!isOpen || !booking || !editedBooking) return null

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { 
        label: 'En attente', 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        icon: '⏳',
        dot: 'bg-yellow-500'
      },
      assigned: { 
        label: 'Assignée', 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        icon: '👤',
        dot: 'bg-blue-500'
      },
      confirmed: { 
        label: 'Confirmée', 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: '✅',
        dot: 'bg-green-500'
      },
      in_progress: { 
        label: 'En cours', 
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        icon: '🚗',
        dot: 'bg-purple-500'
      },
      completed: { 
        label: 'Terminée', 
        color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        icon: '🎉',
        dot: 'bg-emerald-500'
      },
      cancelled: { 
        label: 'Annulée', 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        icon: '❌',
        dot: 'bg-red-500'
      },
      approved: { 
        label: 'Approuvée', 
        color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
        icon: '👍',
        dot: 'bg-teal-500'
      },
      rejected: { 
        label: 'Rejetée', 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        icon: '👎',
        dot: 'bg-red-500'
      }
    }
    return configs[status as keyof typeof configs] || configs.pending
  }

  const handleSave = async () => {
    if (!editedBooking) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/bookings/${editedBooking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: editedBooking.status,
          driverId: editedBooking.driverId,
          vehicleId: editedBooking.vehicleId,
          price: editedBooking.price,
          notes: editedBooking.notes,
        }),
      })

      if (response.ok) {
        setIsEditing(false)
        onUpdate()
      } else {
        console.error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const statusConfig = getStatusConfig(editedBooking.status)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Réservation #{booking.id}
            </h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
              {statusConfig.icon} {statusConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button
                  onClick={() => {
                    setEditedBooking({ ...booking })
                    setIsEditing(false)
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                ✏️ Modifier
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informations Client */}
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  👤 Informations Client
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Nom complet
                    </label>
                    <p className="text-slate-900 dark:text-white font-medium">{booking.customerName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Email
                    </label>
                    <p className="text-slate-900 dark:text-white">{booking.customerEmail}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Téléphone
                    </label>
                    <p className="text-slate-900 dark:text-white">{booking.customerPhone}</p>
                  </div>
                </div>
              </div>

              {/* Détails du Trajet */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  🛣️ Détails du Trajet
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      📍 Adresse de départ
                    </label>
                    <p className="text-slate-900 dark:text-white bg-white dark:bg-slate-600 p-3 rounded-lg border">
                      {booking.pickupAddress}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      🎯 Adresse de destination
                    </label>
                    <p className="text-slate-900 dark:text-white bg-white dark:bg-slate-600 p-3 rounded-lg border">
                      {booking.dropoffAddress}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      📅 Date et heure programmées
                    </label>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      🕒 Créée le
                    </label>
                    <p className="text-slate-600 dark:text-slate-400">
                      {new Date(booking.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations Opérationnelles */}
            <div className="space-y-6">
              {/* Statut et Assignation */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  ⚙️ Gestion
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Statut
                    </label>
                    {isEditing ? (
                      <select
                        value={editedBooking.status}
                        onChange={(e) => setEditedBooking(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-white"
                      >
                        <option value="pending">En attente</option>
                        <option value="assigned">Assignée</option>
                        <option value="confirmed">Confirmée</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminée</option>
                        <option value="cancelled">Annulée</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Chauffeur assigné
                    </label>
                    {isEditing ? (
                      <select
                        value={editedBooking.driverId || ''}
                        onChange={(e) => setEditedBooking(prev => prev ? { ...prev, driverId: e.target.value || null } : null)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-white"
                      >
                        <option value="">Non assigné</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name} - {driver.email}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-slate-900 dark:text-white">
                        {booking.driver ? (
                          <span className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                {booking.driver.name.charAt(0)}
                              </span>
                            </div>
                            {booking.driver.name} ({booking.driver.email})
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Non assigné</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Véhicule assigné
                    </label>
                    {isEditing ? (
                      <select
                        value={editedBooking.vehicleId || ''}
                        onChange={(e) => setEditedBooking(prev => prev ? { ...prev, vehicleId: e.target.value ? Number(e.target.value) : null } : null)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-white"
                      >
                        <option value="">Non assigné</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.make} {vehicle.model} - {vehicle.plateNumber}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-slate-900 dark:text-white">
                        {booking.vehicle ? (
                          <span className="flex items-center gap-2">
                            🚗 {booking.vehicle.make} {booking.vehicle.model} ({booking.vehicle.plateNumber})
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Non assigné</span>
                        )}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Prix (FCFA)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedBooking.price || ''}
                        onChange={(e) => setEditedBooking(prev => prev ? { ...prev, price: e.target.value } : null)}
                        placeholder="Exemple: 15000"
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-slate-900 dark:text-white font-medium">
                        {booking.price ? `${booking.price} FCFA` : (
                          <span className="text-slate-400 dark:text-slate-500">Non défini</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  📝 Notes
                </h3>
                {isEditing ? (
                  <textarea
                    value={editedBooking.notes || ''}
                    onChange={(e) => setEditedBooking(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    placeholder="Ajouter des notes sur cette réservation..."
                    rows={4}
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-white resize-none"
                  />
                ) : (
                  <p className="text-slate-900 dark:text-white">
                    {booking.notes ? (
                      <span className="whitespace-pre-wrap">{booking.notes}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">Aucune note</span>
                    )}
                  </p>
                )}
              </div>

              {/* Informations d'annulation (si applicable) */}
              {booking.status === 'cancelled' && booking.cancellationReason && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-4 flex items-center gap-2">
                    🚫 Informations d'Annulation
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                        Motif d'annulation
                      </label>
                      <p className="text-red-900 dark:text-red-100 bg-white dark:bg-red-800/20 p-3 rounded-lg border">
                        {booking.cancellationReason}
                      </p>
                    </div>
                    {booking.cancelledByUser && (
                      <div>
                        <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                          Annulée par
                        </label>
                        <p className="text-red-900 dark:text-red-100">
                          <span className="font-medium">{booking.cancelledByUser.name}</span>
                          <span className="text-red-600 dark:text-red-400 ml-2">
                            ({booking.cancelledByUser.role === 'driver' ? 'Chauffeur' : 
                              booking.cancelledByUser.role === 'admin' ? 'Administrateur' : 'Client'})
                          </span>
                        </p>
                      </div>
                    )}
                    {booking.cancelledAt && (
                      <div>
                        <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                          Date d'annulation
                        </label>
                        <p className="text-red-900 dark:text-red-100">
                          {new Date(booking.cancelledAt).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}