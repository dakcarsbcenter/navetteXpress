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
  MagnifyingGlass as Search,
} from "@phosphor-icons/react"
import { serviceTypes, additionalServices } from '@/lib/services'
import { isRouteCombinationAllowed } from '@/lib/pricing'

interface Driver {
  id: string
  name: string
  email: string
  phone?: string
}

interface CustomerAccount {
  id: string
  name: string
  email: string
  phone?: string | null
}

interface LocationOption {
  id: number
  name: string
}

interface PricingQuote {
  price: number | null
  segment: { id: number; route: string } | null
  alternatives: { segmentId: number; label: string; route: string; price: number }[]
}

interface CreateBookingModalProps {
  isOpen: boolean
  onClose: () => void
  /**
   * Appelé après création réussie. `status` permet à la liste d'afficher le filtre
   * où la nouvelle demande se trouve (« assignées » si le chauffeur a été retenu).
   */
  onCreated: (message: string, status: string, warning?: string) => void
  drivers: Driver[]
}

const panelStyle: React.CSSProperties = { backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '4px', padding: '18px' }
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

const emptyForm = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  userId: '',
  passengerName: null as string | null,
  passengerPhone: '',
  pickupAddress: '',
  dropoffAddress: '',
  scheduledDateTime: '',
  requestedVehicleType: 'berline' as 'berline' | 'suv',
  passengers: 1,
  luggage: 1,
  serviceType: serviceTypes[0]?.id ?? 'autres',
  additionalServices: [] as string[],
  specialRequests: '',
  flightNumber: '',
  airline: '',
  price: '',
  driverId: '',
  notifyClient: false,
}

/**
 * Saisie d'une demande de réservation par l'admin pour le compte d'un client qui ne
 * peut pas la remplir lui-même (client analphabète appelant par téléphone, client
 * sans smartphone). L'email est optionnel et le chauffeur peut être assigné
 * directement, sans repasser par la file d'assignation du tableau de bord.
 */
export function CreateBookingModal({ isOpen, onClose, onCreated, drivers }: CreateBookingModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [customers, setCustomers] = useState<CustomerAccount[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [quote, setQuote] = useState<PricingQuote | null>(null)
  const [isQuoting, setIsQuoting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const patch = (changes: Partial<typeof emptyForm>) => setForm((prev) => ({ ...prev, ...changes }))

  // Réinitialisation à chaque ouverture : une demande saisie ne doit pas laisser de
  // résidus dans la suivante (l'admin en enchaîne souvent plusieurs au téléphone).
  useEffect(() => {
    if (!isOpen) return
    setForm(emptyForm)
    setCustomerSearch('')
    setQuote(null)
    setError(null)
  }, [isOpen])

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

  // Tarif paramétré (/tarifs) pour le trajet saisi, via la même logique que le
  // formulaire public et la modale d'édition.
  useEffect(() => {
    if (!isOpen || !form.pickupAddress || !form.dropoffAddress) {
      setQuote(null)
      return
    }
    let cancelled = false
    setIsQuoting(true)
    const params = new URLSearchParams({
      pickup: form.pickupAddress,
      dropoff: form.dropoffAddress,
      vehicleType: form.requestedVehicleType,
    })
    fetch(`/api/admin/pricing/quote?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => { if (!cancelled) setQuote(json?.success ? json.data : null) })
      .catch(() => { if (!cancelled) setQuote(null) })
      .finally(() => { if (!cancelled) setIsQuoting(false) })
    return () => { cancelled = true }
  }, [isOpen, form.pickupAddress, form.dropoffAddress, form.requestedVehicleType])

  const locationNames = useMemo(() => locations.map((l) => l.name), [locations])
  const isCustomPickup = Boolean(form.pickupAddress) && !locationNames.includes(form.pickupAddress)
  const isCustomDropoff = Boolean(form.dropoffAddress) && !locationNames.includes(form.dropoffAddress)
  const routeIsUnusual = Boolean(
    form.pickupAddress && form.dropoffAddress && !isCustomPickup && !isCustomDropoff &&
    !isRouteCombinationAllowed(form.pickupAddress, form.dropoffAddress)
  )

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

  if (!isOpen) return null

  const validate = (): string | null => {
    if (form.customerName.trim().length < 2) return 'Renseignez le nom du client.'
    if (form.customerPhone.trim().length < 6) return 'Renseignez le téléphone du client — c\'est le seul canal pour le joindre.'
    if (!form.pickupAddress.trim()) return 'Renseignez le lieu de départ.'
    if (!form.dropoffAddress.trim()) return 'Renseignez la destination.'
    if (!form.scheduledDateTime) return 'Renseignez la date et l\'heure de prise en charge.'
    if (form.passengerName !== null && form.passengerName.trim().length < 2) {
      return 'Nom du passager trop court — saisissez-le ou repassez sur « Le client lui-même ».'
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
      const priceValue = form.price.trim() === '' ? null : Number(form.price)

      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim(),
          customerPhone: form.customerPhone.trim(),
          userId: form.userId || undefined,
          pickupAddress: form.pickupAddress.trim(),
          dropoffAddress: form.dropoffAddress.trim(),
          // Envoyé en ISO pour éviter toute ambiguïté de fuseau côté serveur.
          scheduledDateTime: new Date(form.scheduledDateTime).toISOString(),
          requestedVehicleType: form.requestedVehicleType,
          passengers: form.passengers,
          luggage: form.luggage,
          serviceType: form.serviceType,
          additionalServices: form.additionalServices,
          specialRequests: form.specialRequests.trim(),
          passengerName: form.passengerName ? form.passengerName.trim() : undefined,
          passengerPhone: form.passengerName ? form.passengerPhone.trim() : undefined,
          flightNumber: form.flightNumber.trim(),
          airline: form.airline.trim(),
          price: priceValue !== null && Number.isFinite(priceValue) ? priceValue : null,
          driverId: form.driverId || undefined,
          notifyClient: form.notifyClient,
        }),
      })

      const json = await response.json().catch(() => null)

      if (response.ok && json?.success) {
        onCreated(json.message || 'Réservation créée', json.data?.status || 'pending', json.assignmentWarning)
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
              Nouvelle demande <span style={{ color: '#1F5245' }}>au nom d&apos;un client</span>
            </h2>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#6E6A63' }}>
              Pour un client joint par téléphone qui ne peut pas remplir le formulaire lui-même. L&apos;email est optionnel.
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
              {isSaving ? 'Création...' : 'Créer la demande'}
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

            {/* COLONNE GAUCHE */}
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
                <SectionTitle icon={Airplane} label="Service et vol" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={fieldLabel}>Type de service</label>
                    <select
                      value={form.serviceType}
                      onChange={(e) => patch({ serviceType: e.target.value })}
                      style={selectStyle}
                    >
                      {serviceTypes.map((service) => (
                        <option key={service.id} value={service.id}>{service.translations.fr.name}</option>
                      ))}
                    </select>
                  </div>

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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={fieldLabel}>N° de vol</label>
                      <input
                        type="text"
                        value={form.flightNumber}
                        onChange={(e) => patch({ flightNumber: e.target.value })}
                        placeholder="Ex: AF718"
                        style={selectStyle}
                      />
                    </div>
                    <div>
                      <label style={fieldLabel}>Compagnie</label>
                      <input
                        type="text"
                        value={form.airline}
                        onChange={(e) => patch({ airline: e.target.value })}
                        placeholder="Ex: Air France"
                        style={selectStyle}
                      />
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
                </div>
              </div>
            </div>

            {/* COLONNE DROITE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div style={panelStyle}>
                <SectionTitle icon={MapPinLine} label="Trajet" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={fieldLabel}>Départ *</label>
                    <select
                      value={isCustomPickup ? '__custom__' : form.pickupAddress}
                      onChange={(e) => patch({ pickupAddress: e.target.value === '__custom__' ? '' : e.target.value })}
                      style={selectStyle}
                    >
                      <option value="">Choisir un lieu…</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                      <option value="__custom__">Autre lieu (saisie libre)…</option>
                    </select>
                    {isCustomPickup && (
                      <input
                        type="text"
                        value={form.pickupAddress}
                        onChange={(e) => patch({ pickupAddress: e.target.value })}
                        placeholder="Adresse de départ"
                        style={{ ...selectStyle, marginTop: '8px' }}
                      />
                    )}
                  </div>

                  <div>
                    <label style={fieldLabel}>Destination *</label>
                    <select
                      value={isCustomDropoff ? '__custom__' : form.dropoffAddress}
                      onChange={(e) => patch({ dropoffAddress: e.target.value === '__custom__' ? '' : e.target.value })}
                      style={selectStyle}
                    >
                      <option value="">Choisir un lieu…</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                      <option value="__custom__">Autre lieu (saisie libre)…</option>
                    </select>
                    {isCustomDropoff && (
                      <input
                        type="text"
                        value={form.dropoffAddress}
                        onChange={(e) => patch({ dropoffAddress: e.target.value })}
                        placeholder="Adresse de destination"
                        style={{ ...selectStyle, marginTop: '8px' }}
                      />
                    )}
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
                      value={form.scheduledDateTime}
                      onChange={(e) => patch({ scheduledDateTime: e.target.value })}
                      style={selectStyle}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label style={fieldLabel}>Véhicule</label>
                      <select
                        value={form.requestedVehicleType}
                        onChange={(e) => patch({ requestedVehicleType: e.target.value === 'suv' ? 'suv' : 'berline' })}
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
                        value={form.passengers}
                        onChange={(e) => patch({ passengers: Math.max(1, parseInt(e.target.value) || 1) })}
                        style={selectStyle}
                      />
                    </div>
                    <div>
                      <label style={fieldLabel}>Bagages</label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={form.luggage}
                        onChange={(e) => patch({ luggage: Math.max(0, parseInt(e.target.value) || 0) })}
                        style={selectStyle}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={panelStyle}>
                <SectionTitle icon={CurrencyDollar} label="Tarif" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={fieldLabel}>Prix annoncé au client (FCFA)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={(e) => patch({ price: e.target.value })}
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
                          onClick={() => patch({ price: String(quote.price) })}
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
                                onClick={() => patch({ price: String(alt.price) })}
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

              <div style={panelStyle}>
                <SectionTitle icon={CarSimple} label="Chauffeur" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={fieldLabel}>Assigner dès la création (optionnel)</label>
                    <select
                      value={form.driverId}
                      onChange={(e) => patch({ driverId: e.target.value })}
                      style={selectStyle}
                    >
                      <option value="">Laisser dans la file d&apos;assignation</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                    </select>
                    <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#6E6A63' }}>
                      La disponibilité du chauffeur est vérifiée à l&apos;enregistrement. S&apos;il n&apos;est pas libre,
                      la demande est tout de même créée et reste en attente d&apos;assignation.
                    </p>
                  </div>

                  <label className="flex items-start gap-2" style={{ fontSize: '12.5px', color: '#12100E', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.notifyClient}
                      onChange={(e) => patch({ notifyClient: e.target.checked })}
                      style={{ width: '15px', height: '15px', accentColor: '#1F5245', marginTop: '2px' }}
                    />
                    <span>
                      Envoyer l&apos;accusé de réception WhatsApp au client
                      <span style={{ display: 'block', fontSize: '11px', color: '#6E6A63' }}>
                        À décocher pour un client qui ne lit pas : c&apos;est l&apos;admin qui le rappelle.
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
