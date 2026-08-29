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
  FloppyDisk,
  PencilSimple,
  X,
  MapPinLine,
  Airplane,
  ArrowSquareOut
} from "@phosphor-icons/react"
import { StatusBadge } from "@/components/shared/StatusBadge"

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
  flightNumber?: string | null
  airline?: string | null
  flightStatus?: string | null
  flightLastCheckedAt?: string | null
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

const panelStyle: React.CSSProperties = { backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '4px', padding: '18px' }
const fieldWrap: React.CSSProperties = { backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', padding: '12px' }
const fieldLabel: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E6A63', marginBottom: '6px', display: 'block' }
const selectStyle: React.CSSProperties = { width: '100%', height: '42px', padding: '0 12px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13px', color: '#12100E', backgroundColor: '#FFFFFF' }

function SectionTitle({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number; weight?: 'fill'; style?: React.CSSProperties }>; label: string }) {
  return (
    <h3 className="flex items-center gap-2" style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 600, color: '#12100E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      <div style={{ width: '26px', height: '26px', borderRadius: '3px', backgroundColor: 'rgba(31,82,69,.08)', display: 'grid', placeItems: 'center' }}>
        <Icon size={14} weight="fill" style={{ color: '#1F5245' } as React.CSSProperties} />
      </div>
      {label}
    </h3>
  )
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
          oldStatus: booking.status,
          driverId: editedBooking.driverId,
          vehicleId: editedBooking.vehicleId,
          price: editedBooking.price,
          notes: editedBooking.notes,
          cancellationReason: editedBooking.status === 'cancelled' ? editedBooking.cancellationReason : undefined,
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(18,16,14,.55)' }} />

      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4" style={{ padding: '20px 24px', borderBottom: '1px solid #E2DACD' }}>
          <div className="flex-1">
            <div className="flex items-center gap-3" style={{ marginBottom: '6px' }}>
              <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 600, color: '#12100E' }}>
                Réservation <span style={{ color: '#1F5245' }}>#{booking.id}</span>
              </h2>
              <StatusBadge domain="booking" value={editedBooking.status} audience="admin" live={editedBooking.status === 'in_progress'} />
            </div>
            <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E6A63' }}>
              Créée le {new Date(booking.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                  style={{ height: '40px', padding: '0 16px', backgroundColor: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', opacity: isLoading ? 0.6 : 1 }}
                >
                  <FloppyDisk size={15} weight="fill" />
                  {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditedBooking({ ...booking }); setIsEditing(false) }}
                  style={{ height: '40px', padding: '0 16px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', color: '#6E6A63', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Annuler
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
                style={{ height: '40px', padding: '0 16px', backgroundColor: 'rgba(31,82,69,.08)', border: '1px solid rgba(31,82,69,.3)', borderRadius: '4px', color: '#1F5245', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                <PencilSimple size={15} weight="fill" />
                Modifier
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{ display: 'grid', placeItems: 'center', width: '40px', height: '40px', border: '1px solid #E2DACD', borderRadius: '4px', color: '#6E6A63' }}
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="dash-scroll" style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 100px)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* COLONNE GAUCHE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Informations Client */}
              <div style={panelStyle}>
                <SectionTitle icon={User} label="Informations client" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="flex items-start gap-3">
                    <div style={{ width: '38px', height: '38px', borderRadius: '3px', backgroundColor: 'rgba(31,82,69,.10)', display: 'grid', placeItems: 'center', fontSize: '15px', fontWeight: 600, color: '#1F5245', flexShrink: 0 }}>
                      {booking.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={fieldLabel}>Nom complet</p>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#12100E' }} className="truncate">{booking.customerName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3" style={fieldWrap}>
                    <Envelope size={16} style={{ color: '#1F5245' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={fieldLabel}>Email</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#12100E' }} className="truncate">{booking.customerEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3" style={fieldWrap}>
                    <Phone size={16} style={{ color: '#1F5245' }} />
                    <div style={{ flex: 1 }}>
                      <p style={fieldLabel}>Téléphone</p>
                      <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#12100E' }}>{booking.customerPhone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Détails du Trajet */}
              <div style={panelStyle}>
                <SectionTitle icon={MapPinLine} label="Détails du trajet" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div className="flex items-start gap-3" style={{ marginBottom: '10px' }}>
                      <div className="flex flex-col items-center gap-1" style={{ paddingTop: '4px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#1F5245' }} />
                        <div style={{ width: '1.5px', height: '28px', backgroundColor: '#E2DACD' }} />
                      </div>
                      <div style={{ flex: 1, ...fieldWrap }}>
                        <p style={fieldLabel}>Départ</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#12100E' }}>{booking.pickupAddress}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center" style={{ paddingTop: '4px' }}>
                        <MapPin size={11} weight="fill" style={{ color: '#B8493C' }} />
                      </div>
                      <div style={{ flex: 1, ...fieldWrap }}>
                        <p style={fieldLabel}>Destination</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#12100E' }}>{booking.dropoffAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3" style={fieldWrap}>
                    <CalendarDots size={18} weight="fill" style={{ color: '#1F5245' }} />
                    <div style={{ flex: 1 }}>
                      <p style={fieldLabel}>Date programmée</p>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#12100E' }}>
                        {new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#1F5245' }}>
                        {new Date(booking.scheduledDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div style={fieldWrap}>
                      <div className="flex items-center gap-2" style={{ marginBottom: '6px' }}>
                        <UsersThree size={15} weight="fill" style={{ color: '#1F5245' }} />
                        <p style={{ ...fieldLabel, marginBottom: 0 }}>Passagers</p>
                      </div>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#12100E' }}>{booking.passengers || 1}</p>
                    </div>

                    <div style={fieldWrap}>
                      <div className="flex items-center gap-2" style={{ marginBottom: '6px' }}>
                        <Suitcase size={15} weight="fill" style={{ color: '#B4643A' }} />
                        <p style={{ ...fieldLabel, marginBottom: 0 }}>Bagages</p>
                      </div>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#12100E' }}>{booking.luggage || 1}</p>
                    </div>
                  </div>

                  {booking.flightNumber && (
                    <div style={fieldWrap}>
                      <div className="flex items-center justify-between gap-2" style={{ marginBottom: '6px' }}>
                        <div className="flex items-center gap-2">
                          <Airplane size={15} weight="fill" style={{ color: '#1F5245' }} />
                          <p style={{ ...fieldLabel, marginBottom: 0 }}>Vol (lecture seule)</p>
                        </div>
                        <StatusBadge domain="flight" value={booking.flightStatus || 'unknown'} audience="admin" live={booking.flightStatus === 'active'} />
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#12100E' }}>
                        {booking.flightNumber}{booking.airline ? ` · ${booking.airline}` : ''}
                      </p>
                      <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#6E6A63' }}>
                        {booking.flightLastCheckedAt
                          ? `Dernière vérification: ${new Date(booking.flightLastCheckedAt).toLocaleString('fr-FR')}`
                          : 'Statut jamais vérifié'}
                      </p>
                      <a
                        href="https://www.skyscanner.fr/vols/arrivees-departs/dss/blaise-diagne-international-arrivees-departs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1"
                        style={{ marginTop: '8px', fontSize: '11px', fontWeight: 600, color: '#1F5245' }}
                      >
                        Voir les vols en direct <ArrowSquareOut size={12} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLONNE DROITE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Gestion */}
              <div style={panelStyle}>
                <SectionTitle icon={NotePencil} label="Gestion opérationnelle" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={fieldLabel}>Statut de la réservation</label>
                    {isEditing ? (
                      <select
                        value={editedBooking.status}
                        onChange={(e) => setEditedBooking(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                        style={selectStyle}
                      >
                        <option value="pending">En attente</option>
                        <option value="assigned">Assignée</option>
                        <option value="confirmed">Confirmée</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminée</option>
                        <option value="cancelled">Annulée</option>
                      </select>
                    ) : (
                      <StatusBadge domain="booking" value={booking.status} audience="admin" live={booking.status === 'in_progress'} />
                    )}
                  </div>

                  {isEditing && editedBooking.status === 'cancelled' && booking.status !== 'cancelled' && (
                    <div>
                      <label style={fieldLabel}>Motif d&apos;annulation (envoyé au client)</label>
                      <textarea
                        value={editedBooking.cancellationReason || ''}
                        onChange={(e) => setEditedBooking(prev => prev ? { ...prev, cancellationReason: e.target.value } : null)}
                        placeholder="Ex: Véhicule indisponible, précisez le motif..."
                        rows={3}
                        style={{ ...selectStyle, height: 'auto', padding: '10px 12px', resize: 'none' }}
                      />
                      <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#B8493C' }}>
                        Le client recevra un email l&apos;informant de cette annulation définitive.
                      </p>
                    </div>
                  )}

                  <div>
                    <label style={fieldLabel}>Chauffeur assigné</label>
                    {isEditing ? (
                      <select
                        value={editedBooking.driverId || ''}
                        onChange={(e) => setEditedBooking(prev => prev ? { ...prev, driverId: e.target.value || null } : null)}
                        style={selectStyle}
                      >
                        <option value="">Non assigné</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>{driver.name} - {driver.email}</option>
                        ))}
                      </select>
                    ) : booking.driver ? (
                      <div className="flex items-center gap-3" style={fieldWrap}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '3px', backgroundColor: 'rgba(31,82,69,.10)', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 600, color: '#1F5245' }}>
                          {booking.driver.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#12100E' }} className="truncate">{booking.driver.name}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#6E6A63' }} className="truncate">{booking.driver.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p style={{ ...fieldWrap, margin: 0, fontSize: '13px', color: '#9a938a', fontStyle: 'italic' }}>Non assigné</p>
                    )}
                  </div>

                  <div>
                    <label style={fieldLabel}>Véhicule assigné</label>
                    {isEditing ? (
                      <select
                        value={editedBooking.vehicleId || ''}
                        onChange={(e) => setEditedBooking(prev => prev ? { ...prev, vehicleId: e.target.value ? Number(e.target.value) : null } : null)}
                        style={selectStyle}
                      >
                        <option value="">Non assigné</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} - {vehicle.plateNumber}</option>
                        ))}
                      </select>
                    ) : booking.vehicle ? (
                      <div className="flex items-center gap-3" style={fieldWrap}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '3px', backgroundColor: 'rgba(31,82,69,.10)', display: 'grid', placeItems: 'center' }}>
                          <CarSimple size={16} weight="fill" style={{ color: '#1F5245' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#12100E' }} className="truncate">{booking.vehicle.make} {booking.vehicle.model}</p>
                          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#1F5245' }}>{booking.vehicle.plateNumber}</p>
                        </div>
                      </div>
                    ) : (
                      <p style={{ ...fieldWrap, margin: 0, fontSize: '13px', color: '#9a938a', fontStyle: 'italic' }}>Non assigné</p>
                    )}
                  </div>

                  <div>
                    <label style={fieldLabel}>Prix (FCFA)</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedBooking.price || ''}
                        onChange={(e) => setEditedBooking(prev => prev ? { ...prev, price: e.target.value } : null)}
                        placeholder="Ex: 15000"
                        style={{ ...selectStyle, fontFamily: 'var(--font-mono)' }}
                      />
                    ) : (
                      <div className="flex items-center gap-3" style={fieldWrap}>
                        <CurrencyDollar size={18} weight="fill" style={{ color: '#1F5245' }} />
                        {booking.price ? (
                          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600, color: '#12100E' }}>
                            {parseFloat(booking.price).toLocaleString('fr-FR')} F
                          </p>
                        ) : (
                          <p style={{ margin: 0, fontSize: '13px', color: '#9a938a', fontStyle: 'italic' }}>Non défini</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div style={panelStyle}>
                <SectionTitle icon={NotePencil} label="Notes & remarques" />
                {isEditing ? (
                  <textarea
                    value={editedBooking.notes || ''}
                    onChange={(e) => setEditedBooking(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    placeholder="Ajouter des notes sur cette réservation..."
                    rows={4}
                    style={{ ...selectStyle, height: 'auto', padding: '10px 12px', resize: 'none' }}
                  />
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: '#3d3a35', lineHeight: 1.6 }}>
                    {booking.notes ? (
                      <span className="whitespace-pre-wrap">{booking.notes}</span>
                    ) : (
                      <span style={{ color: '#9a938a', fontStyle: 'italic' }}>Aucune note</span>
                    )}
                  </p>
                )}
              </div>

              {/* Informations d'annulation */}
              {booking.status === 'cancelled' && booking.cancellationReason && (
                <div style={{ backgroundColor: 'rgba(184,73,60,.06)', border: '1px solid rgba(184,73,60,.25)', borderRadius: '4px', padding: '18px' }}>
                  <h3 className="flex items-center gap-2" style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 600, color: '#B8493C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '3px', backgroundColor: 'rgba(184,73,60,.12)', display: 'grid', placeItems: 'center' }}>
                      <Warning size={14} weight="fill" style={{ color: '#B8493C' }} />
                    </div>
                    Informations d&apos;annulation
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={fieldWrap}>
                      <p style={fieldLabel}>Motif</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#12100E' }}>{booking.cancellationReason}</p>
                    </div>
                    {booking.cancelledByUser && (
                      <div style={fieldWrap}>
                        <p style={fieldLabel}>Annulée par</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#12100E' }}>
                          <span style={{ fontWeight: 600 }}>{booking.cancelledByUser.name}</span>
                          <span style={{ color: '#6E6A63', marginLeft: '8px' }}>
                            ({booking.cancelledByUser.role === 'driver' ? 'Chauffeur' : booking.cancelledByUser.role === 'admin' ? 'Administrateur' : 'Client'})
                          </span>
                        </p>
                      </div>
                    )}
                    {booking.cancelledAt && (
                      <div style={fieldWrap}>
                        <p style={fieldLabel}>Date d&apos;annulation</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#12100E' }}>
                          {new Date(booking.cancelledAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
