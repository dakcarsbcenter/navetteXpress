"use client"

import React, { useState, useEffect } from 'react'
import {
  User,
  Envelope,
  Phone,
  MapPin,
  CarSimple,
  CalendarDots,
  UsersThree,
  Suitcase,
  CurrencyDollar,
  NotePencil,
  Warning,
  Clock,
  CheckCircle,
  XCircle,
  FloppyDisk,
  PencilSimple,
  X,
  MapPinLine
} from "@phosphor-icons/react"

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
  passengers?: number | null
  luggage?: number | null
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
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.2)',
        icon: <Clock size={16} weight="fill" />
      },
      assigned: { 
        label: 'Assignée', 
        color: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.2)',
        icon: <User size={16} weight="fill" />
      },
      confirmed: { 
        label: 'Confirmée', 
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.2)',
        icon: <CheckCircle size={16} weight="fill" />
      },
      in_progress: { 
        label: 'En cours', 
        color: '#8B5CF6',
        bgColor: 'rgba(139, 92, 246, 0.1)',
        borderColor: 'rgba(139, 92, 246, 0.2)',
        icon: <CarSimple size={16} weight="fill" />
      },
      completed: { 
        label: 'Terminée', 
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.2)',
        icon: <CheckCircle size={16} weight="fill" />
      },
      cancelled: { 
        label: 'Annulée', 
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.2)',
        icon: <XCircle size={16} weight="fill" />
      },
      approved: { 
        label: 'Approuvée', 
        color: '#14B8A6',
        bgColor: 'rgba(20, 184, 166, 0.1)',
        borderColor: 'rgba(20, 184, 166, 0.2)',
        icon: <CheckCircle size={16} weight="fill" />
      },
      rejected: { 
        label: 'Rejetée', 
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.2)',
        icon: <XCircle size={16} weight="fill" />
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
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border animate-slideUp"
        style={{ 
          backgroundColor: 'var(--color-dash-card)',
          borderColor: 'rgba(255,255,255,0.1)'
        }}
      >
        {/* Header avec gradient gold */}
        <div 
          className="relative p-6 border-b overflow-hidden"
          style={{ 
            borderColor: 'rgba(255,255,255,0.05)',
            background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, transparent 100%)'
          }}
        >
          {/* Ambient glow */}
          <div 
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.03] pointer-events-none"
            style={{ background: 'radial-gradient(circle, var(--color-gold) 0%, transparent 70%)' }}
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl font-bold text-white">
                  Réservation <span style={{ color: 'var(--color-gold)' }}>#{booking.id}</span>
                </h2>
                <div 
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm border"
                  style={{ 
                    backgroundColor: statusConfig.bgColor,
                    color: statusConfig.color,
                    borderColor: statusConfig.borderColor
                  }}
                >
                  {statusConfig.icon}
                  {statusConfig.label}
                </div>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest">
                Créée le {new Date(booking.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: '#10B981',
                      color: '#000'
                    }}
                  >
                    <FloppyDisk size={16} weight="fill" />
                    {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                  <button
                    onClick={() => {
                      setEditedBooking({ ...booking })
                      setIsEditing(false)
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-white/10"
                    style={{ color: 'var(--color-gold)', border: '1px solid rgba(201,168,76,0.3)' }}
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                  style={{
                    backgroundColor: 'rgba(201,168,76,0.15)',
                    color: 'var(--color-gold)',
                    border: '1px solid rgba(201,168,76,0.3)'
                  }}
                >
                  <PencilSimple size={16} weight="fill" />
                  Modifier
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2.5 text-slate-400 hover:text-white transition-all rounded-xl hover:bg-white/5"
              >
                <X size={24} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        {/* Content avec scroll moderne */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] dash-scroll">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* COLONNE GAUCHE - Informations Client & Trajet */}
            <div className="space-y-6">
              
              {/* Informations Client */}
              <div 
                className="rounded-2xl p-5 border"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.05)'
                }}
              >
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}
                  >
                    <User size={16} weight="fill" style={{ color: '#3B82F6' }} />
                  </div>
                  <span className="text-[11px] text-slate-500">Informations Client</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                      style={{ 
                        backgroundColor: 'var(--color-gold)',
                        color: '#000'
                      }}
                    >
                      {booking.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Nom complet</p>
                      <p className="text-white font-bold truncate">{booking.customerName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/2 border border-white/5">
                    <Envelope size={16} style={{ color: 'var(--color-gold)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Email</p>
                      <p className="text-white text-sm truncate">{booking.customerEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/2 border border-white/5">
                    <Phone size={16} style={{ color: 'var(--color-gold)' }} />
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Téléphone</p>
                      <p className="text-white text-sm font-mono">{booking.customerPhone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Détails du Trajet */}
              <div 
                className="rounded-2xl p-5 border"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.05)'
                }}
              >
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}
                  >
                    <MapPinLine size={16} weight="fill" style={{ color: '#8B5CF6' }} />
                  </div>
                  <span className="text-[11px] text-slate-500">Détails du Trajet</span>
                </h3>
                
                <div className="space-y-4">
                  {/* Itinéraire */}
                  <div className="relative">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--color-gold)' }} />
                        <div className="w-0.5 h-8 bg-white/10" />
                      </div>
                      <div className="flex-1 p-3 rounded-xl border" style={{ backgroundColor: 'rgba(201,168,76,0.05)', borderColor: 'rgba(201,168,76,0.2)' }}>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Départ</p>
                        <p className="text-white text-sm">{booking.pickupAddress}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <MapPin size={12} weight="fill" style={{ color: '#EF4444' }} />
                      </div>
                      <div className="flex-1 p-3 rounded-xl border" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Destination</p>
                        <p className="text-white text-sm">{booking.dropoffAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Date et heure */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/2 border border-white/5">
                    <CalendarDots size={20} weight="fill" style={{ color: 'var(--color-gold)' }} />
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Date programmée</p>
                      <p className="text-white text-sm font-medium">
                        {new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-gold)' }}>
                        {new Date(booking.scheduledDateTime).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Passagers et bagages */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <UsersThree size={16} weight="fill" style={{ color: '#10B981' }} />
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Passagers</p>
                      </div>
                      <p className="text-white font-bold text-lg">{booking.passengers || 1}</p>
                    </div>

                    <div className="p-3 rounded-xl border" style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Suitcase size={16} weight="fill" style={{ color: '#F59E0B' }} />
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Bagages</p>
                      </div>
                      <p className="text-white font-bold text-lg">{booking.luggage || 1}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLONNE DROITE - Gestion & Notes */}
            <div className="space-y-6">
              
              {/* Gestion */}
              <div 
                className="rounded-2xl p-5 border"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.05)'
                }}
              >
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(201, 168, 76, 0.15)' }}
                  >
                    <NotePencil size={16} weight="fill" style={{ color: 'var(--color-gold)' }} />
                  </div>
                  <span className="text-[11px] text-slate-500">Gestion Opérationnelle</span>
                </h3>
                
                <div className="space-y-4">
                  {/* Statut */}
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                      Statut de la réservation
                    </label>
                    {isEditing ? (
                      <select
                        value={editedBooking.status}
                        onChange={(e) => setEditedBooking(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                        className="w-full p-3 rounded-xl border bg-white/5 text-white text-sm focus:outline-none focus:border-gold/50 transition-colors"
                        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <option value="pending" className="bg-slate-800">En attente</option>
                        <option value="assigned" className="bg-slate-800">Assignée</option>
                        <option value="confirmed" className="bg-slate-800">Confirmée</option>
                        <option value="in_progress" className="bg-slate-800">En cours</option>
                        <option value="completed" className="bg-slate-800">Terminée</option>
                        <option value="cancelled" className="bg-slate-800">Annulée</option>
                      </select>
                    ) : (
                      <div 
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border"
                        style={{ 
                          backgroundColor: statusConfig.bgColor,
                          color: statusConfig.color,
                          borderColor: statusConfig.borderColor
                        }}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </div>
                    )}
                  </div>

                  {/* Chauffeur */}
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                      Chauffeur assigné
                    </label>
                    {isEditing ? (
                      <select
                        value={editedBooking.driverId || ''}
                        onChange={(e) => setEditedBooking(prev => prev ? { ...prev, driverId: e.target.value || null } : null)}
                        className="w-full p-3 rounded-xl border bg-white/5 text-white text-sm focus:outline-none focus:border-gold/50 transition-colors"
                        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <option value="" className="bg-slate-800">Non assigné</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id} className="bg-slate-800">
                            {driver.name} - {driver.email}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div>
                        {booking.driver ? (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/2 border border-white/5">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                              style={{ backgroundColor: '#3B82F6', color: '#fff' }}
                            >
                              {booking.driver.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{booking.driver.name}</p>
                              <p className="text-xs text-slate-500 truncate">{booking.driver.email}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-500 text-sm italic p-3 rounded-xl bg-white/2 border border-white/5">
                            Non assigné
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Véhicule */}
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                      Véhicule assigné
                    </label>
                    {isEditing ? (
                      <select
                        value={editedBooking.vehicleId || ''}
                        onChange={(e) => setEditedBooking(prev => prev ? { ...prev, vehicleId: e.target.value ? Number(e.target.value) : null } : null)}
                        className="w-full p-3 rounded-xl border bg-white/5 text-white text-sm focus:outline-none focus:border-gold/50 transition-colors"
                        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <option value="" className="bg-slate-800">Non assigné</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id} className="bg-slate-800">
                            {vehicle.make} {vehicle.model} - {vehicle.plateNumber}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div>
                        {booking.vehicle ? (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/2 border border-white/5">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
                            >
                              <CarSimple size={20} weight="fill" style={{ color: '#10B981' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">
                                {booking.vehicle.make} {booking.vehicle.model}
                              </p>
                              <p className="text-xs font-mono" style={{ color: 'var(--color-gold)' }}>
                                {booking.vehicle.plateNumber}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-500 text-sm italic p-3 rounded-xl bg-white/2 border border-white/5">
                            Non assigné
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Prix */}
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                      Prix (FCFA)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedBooking.price || ''}
                        onChange={(e) => setEditedBooking(prev => prev ? { ...prev, price: e.target.value } : null)}
                        placeholder="Ex: 15000"
                        className="w-full p-3 rounded-xl border bg-white/5 text-white text-sm focus:outline-none focus:border-gold/50 transition-colors font-mono"
                        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/2 border border-white/5">
                        <CurrencyDollar size={20} weight="fill" style={{ color: 'var(--color-gold)' }} />
                        <p className="text-white font-bold text-lg font-mono">
                          {booking.price ? `${parseFloat(booking.price).toLocaleString('fr-FR')} F` : (
                            <span className="text-slate-500 text-sm italic font-sans">Non défini</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div 
                className="rounded-2xl p-5 border"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.05)'
                }}
              >
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}
                  >
                    <NotePencil size={16} weight="fill" style={{ color: '#F59E0B' }} />
                  </div>
                  <span className="text-[11px] text-slate-500">Notes & Remarques</span>
                </h3>
                {isEditing ? (
                  <textarea
                    value={editedBooking.notes || ''}
                    onChange={(e) => setEditedBooking(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    placeholder="Ajouter des notes sur cette réservation..."
                    rows={4}
                    className="w-full p-3 rounded-xl border bg-white/5 text-white text-sm focus:outline-none focus:border-gold/50 transition-colors resize-none"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                  />
                ) : (
                  <p className="text-white text-sm leading-relaxed">
                    {booking.notes ? (
                      <span className="whitespace-pre-wrap">{booking.notes}</span>
                    ) : (
                      <span className="text-slate-500 italic">Aucune note</span>
                    )}
                  </p>
                )}
              </div>

              {/* Informations d'annulation */}
              {booking.status === 'cancelled' && booking.cancellationReason && (
                <div 
                  className="rounded-2xl p-5 border"
                  style={{ 
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    borderColor: 'rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-widest" style={{ color: '#EF4444' }}>
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
                    >
                      <Warning size={16} weight="fill" style={{ color: '#EF4444' }} />
                    </div>
                    <span className="text-[11px]">Informations d'Annulation</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-white/2 border border-white/5">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Motif</p>
                      <p className="text-white text-sm">{booking.cancellationReason}</p>
                    </div>
                    {booking.cancelledByUser && (
                      <div className="p-3 rounded-xl bg-white/2 border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Annulée par</p>
                        <p className="text-white text-sm">
                          <span className="font-medium">{booking.cancelledByUser.name}</span>
                          <span className="text-slate-500 ml-2">
                            ({booking.cancelledByUser.role === 'driver' ? 'Chauffeur' : 
                              booking.cancelledByUser.role === 'admin' ? 'Administrateur' : 'Client'})
                          </span>
                        </p>
                      </div>
                    )}
                    {booking.cancelledAt && (
                      <div className="p-3 rounded-xl bg-white/2 border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Date d'annulation</p>
                        <p className="text-white text-sm">
                          {new Date(booking.cancelledAt).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
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
