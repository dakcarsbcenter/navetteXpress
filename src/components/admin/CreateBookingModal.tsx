"use client"

import React, { useEffect, useMemo, useState } from 'react'
import {
  User,
  MapPinLine,
  CurrencyDollar,
  Airplane,
  CarSimple,
  Warning,
  FloppyDisk,
  X,
  Plus,
  ArrowsLeftRight,
  Trash,
  MagnifyingGlass as Search,
} from "@phosphor-icons/react"
import { serviceTypes, additionalServices } from '@/lib/services'
import { isRouteCombinationAllowed } from '@/lib/pricing'
import { MAX_BOOKING_TRIPS } from '@/lib/booking-trips'
import { parseBookingNotesFields } from '@/lib/booking-notes'
import { LocationSelect, isCustomLocation, type LocationOption } from './LocationSelect'

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
  // Chauffeur rattaché au véhicule (vehicles.driver_id), renvoyé par /api/vehicles.
  driverId?: string | null
}

interface CustomerAccount {
  id: string
  name: string
  email: string
  phone?: string | null
}

interface PricingQuote {
  price: number | null
  segment: { id: number; route: string } | null
  alternatives: { segmentId: number; label: string; route: string; price: number }[]
}

/**
 * Réservation existante recopiée dans le formulaire (bouton « Dupliquer »). Les
 * champs sans colonne dédiée (service, options, demandes) sont relus depuis `notes`.
 */
export interface BookingDuplicationSource {
  customerName: string
  customerEmail?: string | null
  customerPhone: string
  userId?: string | null
  passengerName?: string | null
  passengerPhone?: string | null
  pickupAddress: string
  dropoffAddress: string
  requestedVehicleType?: string | null
  passengers?: number | null
  luggage?: number | null
  price?: string | number | null
  flightNumber?: string | null
  airline?: string | null
  notes?: string | null
}

interface CreateBookingModalProps {
  isOpen: boolean
  onClose: () => void
  /**
   * Appelé après création réussie. `status` permet à la liste d'afficher le filtre
   * où la nouvelle demande se trouve (« assignées » si le chauffeur a été retenu).
   */
  onCreated: (
    message: string,
    status: string,
    warning?: string,
    availabilityWarning?: string,
  ) => void
  drivers: Driver[]
  vehicles: Vehicle[]
  /** Course à recopier à l'ouverture : duplication plutôt que saisie vierge. */
  initialBooking?: BookingDuplicationSource | null
}

const panelStyle: React.CSSProperties = { backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '4px', padding: '18px' }
const fieldLabel: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E6A63', marginBottom: '6px', display: 'block' }
const selectStyle: React.CSSProperties = { width: '100%', height: '42px', padding: '0 12px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13px', color: '#12100E', backgroundColor: '#FFFFFF' }
const secondaryButton: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 12px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '12px', fontWeight: 600, color: '#12100E', cursor: 'pointer' }

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

/**
 * Ce qui est propre à un trajet. Une demande en porte un ou plusieurs (aller-retour,
 * séjour) et chacun devient une réservation à part entière, comme pour le formulaire
 * public : le modèle impose de toute façon un chauffeur et un prix par course.
 */
interface AdminTripRow {
  /** Clé React stable : l'index changerait à chaque suppression de trajet. */
  key: string
  pickupAddress: string
  dropoffAddress: string
  scheduledDateTime: string
  requestedVehicleType: 'berline' | 'suv'
  passengers: number
  luggage: number
  serviceType: string
  flightNumber: string
  airline: string
  price: string
}

let tripCounter = 0
const nextTripKey = () => `trip-${++tripCounter}`

const emptyTrip = (): AdminTripRow => ({
  key: nextTripKey(),
  pickupAddress: '',
  dropoffAddress: '',
  scheduledDateTime: '',
  requestedVehicleType: 'berline',
  passengers: 1,
  luggage: 1,
  serviceType: serviceTypes[0]?.id ?? 'autres',
  flightNumber: '',
  airline: '',
  price: '',
})

/** Ce qui reste commun à la demande, quel que soit le nombre de trajets. */
const emptyForm = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  userId: '',
  passengerName: null as string | null,
  passengerPhone: '',
  additionalServices: [] as string[],
  specialRequests: '',
  driverId: '',
  vehicleId: null as number | null,
  notifyClient: false,
  notifyDriver: true,
}

/**
 * Saisie d'une demande de réservation par l'admin pour le compte d'un client qui ne
 * peut pas la remplir lui-même (client analphabète appelant par téléphone, client
 * sans smartphone). L'email est optionnel et le chauffeur peut être assigné
 * directement, sans repasser par la file d'assignation du tableau de bord.
 */
export function CreateBookingModal({ isOpen, onClose, onCreated, drivers, vehicles, initialBooking }: CreateBookingModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [trips, setTrips] = useState<AdminTripRow[]>(() => [emptyTrip()])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [customers, setCustomers] = useState<CustomerAccount[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const patch = (changes: Partial<typeof emptyForm>) => setForm((prev) => ({ ...prev, ...changes }))
  const patchTrip = (key: string, changes: Partial<AdminTripRow>) =>
    setTrips((prev) => prev.map((trip) => (trip.key === key ? { ...trip, ...changes } : trip)))

  // Réinitialisation à chaque ouverture : une demande saisie ne doit pas laisser de
  // résidus dans la suivante (l'admin en enchaîne souvent plusieurs au téléphone).
  // Sur duplication, le formulaire repart au contraire de la course recopiée.
  useEffect(() => {
    if (!isOpen) return
    if (initialBooking) {
      const parsed = parseBookingNotesFields(initialBooking.notes)
      setForm({
        ...emptyForm,
        customerName: initialBooking.customerName || '',
        customerEmail: initialBooking.customerEmail || '',
        customerPhone: initialBooking.customerPhone || '',
        userId: initialBooking.userId || '',
        passengerName: initialBooking.passengerName || null,
        passengerPhone: initialBooking.passengerPhone || '',
        additionalServices: parsed.additionalServices,
        specialRequests: parsed.specialRequests,
        // Chauffeur volontairement non repris : la nouvelle course repasse par la
        // file d'assignation, celui d'alors n'est pas forcément libre ce jour-là.
      })
      const rawPrice = Number(initialBooking.price ?? 0)
      setTrips([{
        ...emptyTrip(),
        pickupAddress: initialBooking.pickupAddress || '',
        dropoffAddress: initialBooking.dropoffAddress || '',
        // Date volontairement vide : un clic de trop ne doit pas recréer la même
        // course à la même heure.
        scheduledDateTime: '',
        requestedVehicleType: initialBooking.requestedVehicleType === 'suv' ? 'suv' : 'berline',
        passengers: initialBooking.passengers || 1,
        luggage: typeof initialBooking.luggage === 'number' ? initialBooking.luggage : 1,
        serviceType: parsed.serviceType || serviceTypes[0]?.id || 'autres',
        flightNumber: initialBooking.flightNumber || '',
        airline: initialBooking.airline || '',
        price: Number.isFinite(rawPrice) && rawPrice > 0 ? String(rawPrice) : '',
      }])
    } else {
      setForm(emptyForm)
      setTrips([emptyTrip()])
    }
    setCustomerSearch('')
    setError(null)
  }, [isOpen, initialBooking])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    fetch('/api/locations?all=true')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json?.success && Array.isArray(json.data)) {
          setLocations(json.data.map((l: { id: number; name: string }) => ({ id: l.id, name: l.name })))
        }
      })
      .catch(() => { /* les lieux restent saisissables en texte libre */ })

    fetch('/api/admin/users?role=customer', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json?.success && Array.isArray(json.data)) setCustomers(json.data)
      })
      .catch(() => { /* le rattachement à un compte reste optionnel */ })

    return () => { cancelled = true }
  }, [isOpen])

  const customerMatches = useMemo(() => {
    const term = customerSearch.trim().toLowerCase()
    if (term.length < 2) return []
    return customers
      .filter((c) =>
        c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        (c.phone || '').toLowerCase().includes(term)
      )
      .slice(0, 6)
  }, [customers, customerSearch])

  const attachCustomer = (customer: CustomerAccount) => {
    patch({
      userId: customer.id,
      customerName: customer.name || '',
      customerEmail: customer.email || '',
      customerPhone: customer.phone || '',
    })
    setCustomerSearch('')
  }

  const attachedCustomer = customers.find((c) => c.id === form.userId)

  // Chaque chauffeur roule avec son véhicule (vehicles.driver_id) : choisir l'un
  // pré-remplit l'autre, comme dans la fiche de réservation. /api/vehicles ne
  // renvoyant que les véhicules actifs, un chauffeur dont la voiture est
  // désactivée ne pré-remplit rien.
  const vehicleForDriver = (driverId: string) =>
    driverId ? vehicles.find((v) => v.driverId === driverId) ?? null : null
  const driverHasNoVehicle = Boolean(form.driverId) && !vehicleForDriver(form.driverId)

  const canAddTrip = trips.length < MAX_BOOKING_TRIPS

  // Nouveau trajet enchaîné : on repart du point d'arrivée précédent et on reprend
  // les choix déjà faits, mais jamais la date — c'est le seul champ toujours différent.
  const addTrip = () => {
    if (!canAddTrip) return
    const last = trips[trips.length - 1]
    setTrips((prev) => [...prev, {
      ...emptyTrip(),
      pickupAddress: last.dropoffAddress,
      dropoffAddress: '',
      requestedVehicleType: last.requestedVehicleType,
      passengers: last.passengers,
      luggage: last.luggage,
      serviceType: last.serviceType,
    }])
  }

  const addReturnTrip = () => {
    if (!canAddTrip) return
    const last = trips[trips.length - 1]
    setTrips((prev) => [...prev, {
      ...emptyTrip(),
      pickupAddress: last.dropoffAddress,
      dropoffAddress: last.pickupAddress,
      requestedVehicleType: last.requestedVehicleType,
      passengers: last.passengers,
      luggage: last.luggage,
      serviceType: last.serviceType,
    }])
  }

  const removeTrip = (key: string) =>
    setTrips((prev) => (prev.length <= 1 ? prev : prev.filter((trip) => trip.key !== key)))

  const estimatedTotal = trips.reduce((sum, trip) => {
    const value = Number(trip.price)
    return sum + (Number.isFinite(value) ? value : 0)
  }, 0)

  if (!isOpen) return null

  const validate = (): string | null => {
    if (form.customerName.trim().length < 2) return 'Renseignez le nom du client.'
    if (form.customerPhone.trim().length < 6) return 'Renseignez le téléphone du client — c\'est le seul canal pour le joindre.'
    if (form.passengerName !== null && form.passengerName.trim().length < 2) {
      return 'Nom du passager trop court — saisissez-le ou repassez sur « Le client lui-même ».'
    }
    for (let i = 0; i < trips.length; i++) {
      const trip = trips[i]
      const suffix = trips.length > 1 ? ` (trajet ${i + 1})` : ''
      if (!trip.pickupAddress.trim()) return `Renseignez le lieu de départ${suffix}.`
      if (!trip.dropoffAddress.trim()) return `Renseignez la destination${suffix}.`
      if (!trip.scheduledDateTime) return `Renseignez la date et l'heure de prise en charge${suffix}.`
    }
    return null
  }

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim(),
          customerPhone: form.customerPhone.trim(),
          userId: form.userId || undefined,
          additionalServices: form.additionalServices,
          specialRequests: form.specialRequests.trim(),
          passengerName: form.passengerName ? form.passengerName.trim() : undefined,
          passengerPhone: form.passengerName ? form.passengerPhone.trim() : undefined,
          driverId: form.driverId || undefined,
          vehicleId: form.vehicleId,
          notifyClient: form.notifyClient,
          notifyDriver: form.notifyDriver,
          trips: trips.map((trip) => {
            const priceValue = trip.price.trim() === '' ? null : Number(trip.price)
            return {
              serviceType: trip.serviceType,
              pickupAddress: trip.pickupAddress.trim(),
              destinationAddress: trip.dropoffAddress.trim(),
              // Envoyé en ISO pour éviter toute ambiguïté de fuseau côté serveur.
              scheduledDateTime: new Date(trip.scheduledDateTime).toISOString(),
              vehicleType: trip.requestedVehicleType,
              passengers: trip.passengers,
              luggage: trip.luggage,
              flightNumber: trip.flightNumber.trim() || undefined,
              airline: trip.airline.trim() || undefined,
              price: priceValue !== null && Number.isFinite(priceValue) ? priceValue : null,
            }
          }),
        }),
      })

      const json = await response.json().catch(() => null)

      if (response.ok && json?.success) {
        onCreated(
          json.message || 'Réservation créée',
          json.data?.status || 'pending',
          json.assignmentWarning,
          json.availabilityWarning,
        )
        onClose()
        return
      }

      const details = json?.details
        ? Object.values(json.details as Record<string, string[]>).flat().join(' · ')
        : null
      setError(details || json?.error || 'Erreur lors de la création de la réservation')
    } catch (submitError) {
      console.error('Erreur:', submitError)
      setError("Erreur réseau : la réservation n'a pas pu être créée")
    } finally {
      setIsSaving(false)
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
            <h2 style={{ margin: '0 0 6px', fontSize: '19px', fontWeight: 600, color: '#12100E' }}>
              {initialBooking ? 'Demande dupliquée' : 'Nouvelle demande'}{' '}
              <span style={{ color: '#1F5245' }}>au nom d&apos;un client</span>
            </h2>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#6E6A63' }}>
              {initialBooking
                ? 'Course recopiée : la date et le chauffeur sont à ressaisir. Rien n’est créé tant que vous ne validez pas.'
                : 'Pour un client joint par téléphone qui ne peut pas remplir le formulaire lui-même. L’email est optionnel.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2"
              style={{ height: '40px', padding: '0 16px', backgroundColor: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', opacity: isSaving ? 0.6 : 1 }}
            >
              <FloppyDisk size={15} weight="fill" />
              {isSaving ? 'Création...' : trips.length > 1 ? `Créer les ${trips.length} courses` : 'Créer la demande'}
            </button>
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
          {error && (
            <div style={{ marginBottom: '20px', padding: '12px 14px', backgroundColor: 'rgba(184,73,60,.06)', border: '1px solid rgba(184,73,60,.3)', borderRadius: '4px' }}>
              <p className="flex items-center gap-2" style={{ margin: 0, fontSize: '12.5px', color: '#B8493C' }}>
                <Warning size={15} weight="fill" />
                {error}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* COLONNE GAUCHE : ce qui vaut pour toute la demande */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div style={panelStyle}>
                <SectionTitle icon={User} label="Client" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Rattachement optionnel à un compte existant : la course apparaît
                      alors dans l'espace client, utile quand un proche suit le dossier. */}
                  <div>
                    <label style={fieldLabel}>Compte client existant (optionnel)</label>
                    {attachedCustomer ? (
                      <div className="flex items-center justify-between gap-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(31,82,69,.3)', borderRadius: '3px', padding: '10px 12px' }}>
                        <span style={{ fontSize: '12.5px', color: '#12100E' }}>
                          {attachedCustomer.name} · <span style={{ color: '#6E6A63' }}>{attachedCustomer.email}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => patch({ userId: '' })}
                          style={{ fontSize: '11.5px', color: '#B8493C', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Détacher
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ position: 'relative' }}>
                          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6E6A63' }} />
                          <input
                            type="text"
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            placeholder="Nom, téléphone ou email du client déjà inscrit"
                            style={{ ...selectStyle, padding: '0 12px 0 34px' }}
                          />
                        </div>
                        {customerMatches.length > 0 && (
                          <div style={{ marginTop: '6px', border: '1px solid #E2DACD', borderRadius: '3px', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
                            {customerMatches.map((customer) => (
                              <button
                                key={customer.id}
                                type="button"
                                onClick={() => attachCustomer(customer)}
                                className="w-full text-left"
                                style={{ padding: '9px 12px', borderBottom: '1px solid #F0EAE0', fontSize: '12.5px', color: '#12100E', background: 'none', cursor: 'pointer' }}
                              >
                                {customer.name}
                                <span style={{ color: '#6E6A63' }}> · {customer.phone || customer.email}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <label style={fieldLabel}>Nom complet du client *</label>
                    <input
                      type="text"
                      value={form.customerName}
                      onChange={(e) => patch({ customerName: e.target.value })}
                      placeholder="Prénom et nom"
                      style={selectStyle}
                    />
                  </div>

                  <div>
                    <label style={fieldLabel}>Téléphone *</label>
                    <input
                      type="tel"
                      value={form.customerPhone}
                      onChange={(e) => patch({ customerPhone: e.target.value })}
                      placeholder="+221 77 000 00 00"
                      style={{ ...selectStyle, fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <div>
                    <label style={fieldLabel}>Email (optionnel)</label>
                    <input
                      type="email"
                      value={form.customerEmail}
                      onChange={(e) => patch({ customerEmail: e.target.value })}
                      placeholder="Laisser vide si le client n'en a pas"
                      style={selectStyle}
                    />
                    <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#6E6A63' }}>
                      Sans email, le client ne reçoit rien par mail : le suivi se fait par téléphone et WhatsApp.
                    </p>
                  </div>

                  <div>
                    <label style={fieldLabel}>Réservation pour</label>
                    <select
                      value={form.passengerName === null ? 'self' : 'other'}
                      onChange={(e) => patch(e.target.value === 'other'
                        ? { passengerName: '' }
                        : { passengerName: null, passengerPhone: '' })}
                      style={selectStyle}
                    >
                      <option value="self">Le client lui-même</option>
                      <option value="other">Un tiers</option>
                    </select>
                  </div>

                  {form.passengerName !== null && (
                    <>
                      <div>
                        <label style={fieldLabel}>Nom du passager</label>
                        <input
                          type="text"
                          value={form.passengerName}
                          onChange={(e) => patch({ passengerName: e.target.value })}
                          placeholder="Prénom et nom"
                          style={selectStyle}
                        />
                      </div>
                      <div>
                        <label style={fieldLabel}>Téléphone du passager (optionnel)</label>
                        <input
                          type="tel"
                          value={form.passengerPhone}
                          onChange={(e) => patch({ passengerPhone: e.target.value })}
                          style={{ ...selectStyle, fontFamily: 'var(--font-mono)' }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div style={panelStyle}>
                <SectionTitle icon={Airplane} label="Options de la demande" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={fieldLabel}>Services additionnels</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {additionalServices.map((extra) => {
                        const checked = form.additionalServices.includes(extra.id)
                        return (
                          <label
                            key={extra.id}
                            className="flex items-center gap-2"
                            style={{ padding: '7px 10px', backgroundColor: '#FFFFFF', border: `1px solid ${checked ? 'rgba(31,82,69,.4)' : '#E2DACD'}`, borderRadius: '3px', fontSize: '12px', color: '#12100E', cursor: 'pointer' }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => patch({
                                additionalServices: checked
                                  ? form.additionalServices.filter((id) => id !== extra.id)
                                  : [...form.additionalServices, extra.id],
                              })}
                              style={{ width: '14px', height: '14px', accentColor: '#1F5245' }}
                            />
                            {extra.translations.fr.name}
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label style={fieldLabel}>Demandes particulières dictées par le client</label>
                    <textarea
                      value={form.specialRequests}
                      onChange={(e) => patch({ specialRequests: e.target.value })}
                      rows={3}
                      placeholder="Ce que le client a précisé au téléphone"
                      style={{ ...selectStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }}
                    />
                  </div>

                  <p style={{ margin: 0, fontSize: '11px', color: '#6E6A63' }}>
                    Ces options valent pour toute la demande, trajets compris.
                  </p>
                </div>
              </div>

              <div style={panelStyle}>
                <SectionTitle icon={CarSimple} label="Chauffeur" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={fieldLabel}>Assigner dès la création (optionnel)</label>
                    <select
                      value={form.driverId}
                      onChange={(e) => {
                        const driverId = e.target.value
                        const vehicle = vehicleForDriver(driverId)
                        patch({ driverId, vehicleId: vehicle ? Number(vehicle.id) : null })
                      }}
                      style={selectStyle}
                    >
                      <option value="">Laisser dans la file d&apos;assignation</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                    </select>
                    <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#6E6A63' }}>
                      {trips.length > 1
                        ? `Le chauffeur retenu prend les ${trips.length} courses de la demande.`
                        : 'La demande part directement en « assignée » et le chauffeur est prévenu.'}
                      {' '}S&apos;il n&apos;a pas déclaré ce créneau, un simple avertissement s&apos;affiche.
                    </p>
                  </div>

                  <div>
                    <label style={fieldLabel}>Véhicule assigné (optionnel)</label>
                    <select
                      value={form.vehicleId ?? ''}
                      onChange={(e) => {
                        const vehicleId = e.target.value ? Number(e.target.value) : null
                        const vehicle = vehicles.find((v) => Number(v.id) === vehicleId)
                        patch({
                          vehicleId,
                          // Le véhicule désigne son chauffeur : on ne laisse pas les
                          // deux champs se contredire.
                          driverId: vehicle?.driverId || form.driverId,
                        })
                      }}
                      style={selectStyle}
                    >
                      <option value="">Aucun véhicule</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} {vehicle.model} - {vehicle.plateNumber}
                        </option>
                      ))}
                    </select>
                    {driverHasNoVehicle && (
                      <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#6E6A63' }}>
                        Aucun véhicule actif associé à ce chauffeur — sélectionnez-le manuellement.
                      </p>
                    )}
                  </div>

                  <label className="flex items-start gap-2" style={{ fontSize: '12.5px', color: '#12100E', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.notifyClient}
                      onChange={(e) => patch({ notifyClient: e.target.checked })}
                      style={{ width: '15px', height: '15px', accentColor: '#1F5245', marginTop: '2px' }}
                    />
                    <span>
                      Notifier le client (accusé de réception WhatsApp)
                      <span style={{ display: 'block', fontSize: '11px', color: '#6E6A63' }}>
                        À laisser décoché pour un client qui ne lit pas : c&apos;est l&apos;admin qui le rappelle.
                      </span>
                    </span>
                  </label>

                  <label
                    className="flex items-start gap-2"
                    style={{ fontSize: '12.5px', color: '#12100E', cursor: form.driverId ? 'pointer' : 'not-allowed', opacity: form.driverId ? 1 : 0.5 }}
                  >
                    <input
                      type="checkbox"
                      checked={form.notifyDriver && Boolean(form.driverId)}
                      disabled={!form.driverId}
                      onChange={(e) => patch({ notifyDriver: e.target.checked })}
                      style={{ width: '15px', height: '15px', accentColor: '#1F5245', marginTop: '2px' }}
                    />
                    <span>
                      Notifier le chauffeur (message d&apos;assignation)
                      <span style={{ display: 'block', fontSize: '11px', color: '#6E6A63' }}>
                        {form.driverId
                          ? 'Décochez pour l’assigner sans lui envoyer de message.'
                          : 'Disponible une fois un chauffeur choisi.'}
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* COLONNE DROITE : un bloc par trajet */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {trips.map((trip, index) => (
                <TripPanel
                  key={trip.key}
                  trip={trip}
                  index={index}
                  total={trips.length}
                  locations={locations}
                  onPatch={(changes) => patchTrip(trip.key, changes)}
                  onRemove={trips.length > 1 ? () => removeTrip(trip.key) : undefined}
                />
              ))}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button type="button" onClick={addTrip} disabled={!canAddTrip} style={{ ...secondaryButton, opacity: canAddTrip ? 1 : 0.5 }}>
                    <Plus size={14} weight="bold" />
                    Ajouter un trajet
                  </button>
                  <button type="button" onClick={addReturnTrip} disabled={!canAddTrip} style={{ ...secondaryButton, opacity: canAddTrip ? 1 : 0.5 }}>
                    <ArrowsLeftRight size={14} weight="bold" />
                    Ajouter le retour
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#6E6A63' }}>
                  {canAddTrip
                    ? 'Un aller-retour ou un séjour se saisit en une seule demande : les coordonnées du client ne sont saisies qu’une fois.'
                    : `Maximum ${MAX_BOOKING_TRIPS} trajets par demande.`}
                </p>

                {trips.length > 1 && (
                  <div className="flex items-center justify-between gap-3" style={{ backgroundColor: 'rgba(31,82,69,.06)', border: '1px solid rgba(31,82,69,.25)', borderRadius: '3px', padding: '12px' }}>
                    <span style={{ ...fieldLabel, marginBottom: 0 }}>Total annoncé au client</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600, color: '#1F5245' }}>
                      {estimatedTotal.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface TripPanelProps {
  trip: AdminTripRow
  index: number
  total: number
  locations: LocationOption[]
  onPatch: (changes: Partial<AdminTripRow>) => void
  onRemove?: () => void
}

/**
 * Un trajet de la demande, avec son tarif. Le devis est interrogé par trajet :
 * deux courses d'un même séjour n'ont ni le même itinéraire ni le même prix.
 */
function TripPanel({ trip, index, total, locations, onPatch, onRemove }: TripPanelProps) {
  const [quote, setQuote] = useState<PricingQuote | null>(null)
  const [isQuoting, setIsQuoting] = useState(false)

  const isCustomPickup = isCustomLocation(trip.pickupAddress, locations)
  const isCustomDropoff = isCustomLocation(trip.dropoffAddress, locations)
  const routeIsUnusual = Boolean(
    trip.pickupAddress && trip.dropoffAddress && !isCustomPickup && !isCustomDropoff &&
    !isRouteCombinationAllowed(trip.pickupAddress, trip.dropoffAddress)
  )

  // Tarif paramétré (/tarifs) pour le trajet saisi, via la même logique que le
  // formulaire public et la modale d'édition.
  useEffect(() => {
    if (!trip.pickupAddress || !trip.dropoffAddress) {
      setQuote(null)
      return
    }
    let cancelled = false
    setIsQuoting(true)
    const params = new URLSearchParams({
      pickup: trip.pickupAddress,
      dropoff: trip.dropoffAddress,
      vehicleType: trip.requestedVehicleType,
    })
    fetch(`/api/admin/pricing/quote?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => { if (!cancelled) setQuote(json?.success ? json.data : null) })
      .catch(() => { if (!cancelled) setQuote(null) })
      .finally(() => { if (!cancelled) setIsQuoting(false) })
    return () => { cancelled = true }
  }, [trip.pickupAddress, trip.dropoffAddress, trip.requestedVehicleType])

  return (
    <div style={panelStyle}>
      <div className="flex items-start justify-between gap-3">
        <SectionTitle icon={MapPinLine} label={total > 1 ? `Trajet ${index + 1} sur ${total}` : 'Trajet'} />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            title="Retirer ce trajet"
            style={{ display: 'grid', placeItems: 'center', width: '28px', height: '28px', border: '1px solid #E2DACD', borderRadius: '3px', backgroundColor: '#FFFFFF', color: '#B8493C', cursor: 'pointer' }}
          >
            <Trash size={14} weight="fill" />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={fieldLabel}>Type de service</label>
          <select
            value={trip.serviceType}
            onChange={(e) => onPatch({ serviceType: e.target.value })}
            style={selectStyle}
          >
            {serviceTypes.map((service) => (
              <option key={service.id} value={service.id}>{service.translations.fr.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={fieldLabel}>Départ *</label>
          <LocationSelect
            value={trip.pickupAddress}
            onChange={(value) => onPatch({ pickupAddress: value })}
            locations={locations}
            placeholder="Adresse de départ"
            style={selectStyle}
          />
        </div>

        <div>
          <label style={fieldLabel}>Destination *</label>
          <LocationSelect
            value={trip.dropoffAddress}
            onChange={(value) => onPatch({ dropoffAddress: value })}
            locations={locations}
            placeholder="Adresse de destination"
            style={selectStyle}
          />
        </div>

        {routeIsUnusual && (
          <p style={{ margin: 0, fontSize: '11.5px', color: '#B4643A' }}>
            Ce couple départ/destination ne fait pas partie des trajets tarifés : le prix devra être saisi à la main.
          </p>
        )}

        <div>
          <label style={fieldLabel}>Date et heure de prise en charge *</label>
          <input
            type="datetime-local"
            value={trip.scheduledDateTime}
            onChange={(e) => onPatch({ scheduledDateTime: e.target.value })}
            style={selectStyle}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label style={fieldLabel}>Véhicule</label>
            <select
              value={trip.requestedVehicleType}
              onChange={(e) => onPatch({ requestedVehicleType: e.target.value === 'suv' ? 'suv' : 'berline' })}
              style={selectStyle}
            >
              <option value="berline">Berline</option>
              <option value="suv">SUV</option>
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Passagers</label>
            <input
              type="number"
              min={1}
              max={50}
              value={trip.passengers}
              onChange={(e) => onPatch({ passengers: Math.max(1, parseInt(e.target.value) || 1) })}
              style={selectStyle}
            />
          </div>
          <div>
            <label style={fieldLabel}>Bagages</label>
            <input
              type="number"
              min={0}
              max={50}
              value={trip.luggage}
              onChange={(e) => onPatch({ luggage: Math.max(0, parseInt(e.target.value) || 0) })}
              style={selectStyle}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={fieldLabel}>N° de vol</label>
            <input
              type="text"
              value={trip.flightNumber}
              onChange={(e) => onPatch({ flightNumber: e.target.value })}
              placeholder="Ex: AF718"
              style={selectStyle}
            />
          </div>
          <div>
            <label style={fieldLabel}>Compagnie</label>
            <input
              type="text"
              value={trip.airline}
              onChange={(e) => onPatch({ airline: e.target.value })}
              placeholder="Ex: Air France"
              style={selectStyle}
            />
          </div>
        </div>

        <div style={{ borderTop: '1px solid #E2DACD', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SectionTitle icon={CurrencyDollar} label="Tarif" />

          <div>
            <label style={fieldLabel}>Prix annoncé au client (FCFA)</label>
            <input
              type="number"
              min={0}
              value={trip.price}
              onChange={(e) => onPatch({ price: e.target.value })}
              placeholder="0 = à fixer plus tard"
              style={{ ...selectStyle, fontFamily: 'var(--font-mono)' }}
            />
          </div>

          {isQuoting ? (
            <p style={{ margin: 0, fontSize: '11.5px', color: '#6E6A63' }}>Recherche du tarif paramétré…</p>
          ) : quote && quote.price !== null ? (
            <div style={{ backgroundColor: 'rgba(31,82,69,.06)', border: '1px solid rgba(31,82,69,.25)', borderRadius: '3px', padding: '12px' }}>
              <p style={{ ...fieldLabel, marginBottom: '8px' }}>Tarif paramétré pour ce trajet</p>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600, color: '#1F5245' }}>
                    {quote.price.toLocaleString('fr-FR')} FCFA
                  </p>
                  {quote.segment && (
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6E6A63' }}>{quote.segment.route}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onPatch({ price: String(quote.price) })}
                  style={{ height: '34px', padding: '0 14px', backgroundColor: '#1F5245', border: 'none', borderRadius: '3px', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Appliquer
                </button>
              </div>

              {quote.alternatives.length > 1 && (
                <div style={{ marginTop: '10px' }}>
                  <p style={{ ...fieldLabel, marginBottom: '6px' }}>Autres secteurs tarifés</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {quote.alternatives.map((alt) => (
                      <button
                        key={alt.segmentId}
                        type="button"
                        onClick={() => onPatch({ price: String(alt.price) })}
                        style={{ padding: '6px 10px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '11.5px', color: '#12100E', cursor: 'pointer' }}
                      >
                        {alt.label} — {alt.price.toLocaleString('fr-FR')} F
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '11.5px', color: '#6E6A63' }}>
              Aucun tarif paramétré pour ce trajet — prix à saisir manuellement.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
