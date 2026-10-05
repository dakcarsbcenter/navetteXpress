"use client"

import React, { useEffect, useMemo, useState } from 'react'
import {
  User,
  MapPinLine,
  CurrencyDollar,
  FileText,
  Warning,
  FloppyDisk,
  PaperPlaneTilt,
  X,
  MagnifyingGlass as Search,
  Plus,
  Trash,
  Path,
  Users,
} from "@phosphor-icons/react"
import { QUOTE_SERVICES, MAX_QUOTE_TRIPS, type QuoteTripInput } from '@/lib/quote-services'
import { isRouteCombinationAllowed } from '@/lib/pricing'
import { LocationSelect, isCustomLocation } from './LocationSelect'

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

interface CreateQuoteModalProps {
  isOpen: boolean
  onClose: () => void
  /** Appelé après création réussie. `warning` signale un envoi impossible (client sans email). */
  onCreated: (message: string, warning?: string) => void
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
  service: QUOTE_SERVICES[0].id as string,
  numberOfPeople: 1,
  duration: 1,
  preferredDate: '',
  departure: '',
  destination: '',
  paymentMode: '',
  description: '',
  estimatedPrice: '',
  adminNotes: '',
  passengerName: '',
  passengerPhone: '',
}

/**
 * Etape supplementaire d'un sejour (le trajet principal reste au-dessus, avec
 * sa recherche de tarif parametre). Le client peut demander plusieurs courses
 * dans une meme demande : on les saisit ici au lieu de creer N devis.
 */
interface ExtraLeg {
  key: string
  service: string
  departure: string
  destination: string
  scheduledDateTime: string
  passengers: number
  luggage: number
  note: string
}

let legKeySeed = 0

/**
 * Saisie d'un devis par l'admin pour le compte d'un client joint par téléphone.
 *
 * Même logique que CreateBookingModal : l'email reste optionnel, mais sans lui
 * le devis ne peut pas être envoyé — il est alors simplement enregistré, et
 * communiqué de vive voix.
 */
export function CreateQuoteModal({ isOpen, onClose, onCreated }: CreateQuoteModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [customers, setCustomers] = useState<CustomerAccount[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [quote, setQuote] = useState<PricingQuote | null>(null)
  const [isQuoting, setIsQuoting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extraLegs, setExtraLegs] = useState<ExtraLeg[]>([])

  const addExtraLeg = () => setExtraLegs((prev) => {
    if (prev.length + 1 >= MAX_QUOTE_TRIPS) return prev
    const last = prev[prev.length - 1]
    return [...prev, {
      key: `leg-${++legKeySeed}`,
      service: form.service,
      departure: last ? last.destination : form.destination,
      destination: '',
      scheduledDateTime: '',
      passengers: form.numberOfPeople,
      luggage: 0,
      note: '',
    }]
  })

  const patchLeg = (key: string, changes: Partial<ExtraLeg>) =>
    setExtraLegs((prev) => prev.map((leg) => (leg.key === key ? { ...leg, ...changes } : leg)))

  const removeLeg = (key: string) => setExtraLegs((prev) => prev.filter((leg) => leg.key !== key))

  const patch = (changes: Partial<typeof emptyForm>) => setForm((prev) => ({ ...prev, ...changes }))

  // Réinitialisation à chaque ouverture : l'admin enchaîne souvent plusieurs devis.
  useEffect(() => {
    if (!isOpen) return
    setForm(emptyForm)
    setExtraLegs([])
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

  // Tarif paramétré (/tarifs) pour le trajet saisi : même source que la
  // réservation, pour que le devis annoncé ne diverge pas de la grille.
  useEffect(() => {
    if (!isOpen || !form.departure || !form.destination) {
      setQuote(null)
      return
    }
    let cancelled = false
    setIsQuoting(true)
    const params = new URLSearchParams({
      pickup: form.departure,
      dropoff: form.destination,
      vehicleType: 'berline',
    })
    fetch(`/api/admin/pricing/quote?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => { if (!cancelled) setQuote(json?.success ? json.data : null) })
      .catch(() => { if (!cancelled) setQuote(null) })
      .finally(() => { if (!cancelled) setIsQuoting(false) })
    return () => { cancelled = true }
  }, [isOpen, form.departure, form.destination])

  const isCustomDeparture = isCustomLocation(form.departure, locations)
  const isCustomDestination = isCustomLocation(form.destination, locations)
  const routeIsUnusual = Boolean(
    form.departure && form.destination && !isCustomDeparture && !isCustomDestination &&
    !isRouteCombinationAllowed(form.departure, form.destination)
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
  // Le rattachement à un compte fournit une adresse même si le champ reste vide.
  const canSendToClient = Boolean(form.customerEmail.trim() || attachedCustomer?.email)

  if (!isOpen) return null

  const validate = (): string | null => {
    if (form.customerName.trim().length < 2) return 'Renseignez le nom du client.'
    if (form.customerPhone.trim().length < 6) return 'Renseignez le téléphone du client.'
    if (!form.departure.trim()) return 'Renseignez le lieu de départ.'
    if (!form.destination.trim()) return 'Renseignez la destination.'
    for (const [index, leg] of extraLegs.entries()) {
      if (!leg.departure.trim() || !leg.destination.trim()) {
        return `Completez le depart et la destination du trajet ${index + 2}.`
      }
    }
    return null
  }

  const submit = async (status: 'pending' | 'sent') => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const priceValue = form.estimatedPrice.trim() === '' ? null : Number(form.estimatedPrice)

      const response = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim(),
          customerPhone: form.customerPhone.trim(),
          userId: form.userId || undefined,
          service: form.service,
          preferredDate: form.preferredDate ? new Date(form.preferredDate).toISOString() : undefined,
          numberOfPeople: form.numberOfPeople,
          duration: form.duration,
          departure: form.departure.trim(),
          destination: form.destination.trim(),
          // Le trajet principal est toujours la ligne 1 : l'admin saisit donc
          // exactement la meme structure que le formulaire public.
          trips: [
            {
              service: form.service,
              departure: form.departure.trim(),
              destination: form.destination.trim(),
              scheduledDateTime: form.preferredDate ? new Date(form.preferredDate).toISOString() : undefined,
              passengers: form.numberOfPeople,
              luggage: 0,
              note: undefined,
            },
            ...extraLegs.map((leg) => ({
              service: leg.service,
              departure: leg.departure.trim(),
              destination: leg.destination.trim(),
              scheduledDateTime: leg.scheduledDateTime ? new Date(leg.scheduledDateTime).toISOString() : undefined,
              passengers: leg.passengers,
              luggage: leg.luggage,
              note: leg.note.trim() || undefined,
            })),
          ] satisfies Array<Omit<QuoteTripInput, 'scheduledDateTime' | 'note'> & { scheduledDateTime?: string; note?: string }>,
          passengerName: form.passengerName.trim() || undefined,
          passengerPhone: form.passengerPhone.trim() || undefined,
          paymentMode: form.paymentMode,
          description: form.description.trim(),
          estimatedPrice: priceValue !== null && Number.isFinite(priceValue) ? priceValue : null,
          adminNotes: form.adminNotes.trim(),
          status,
        }),
      })

      const json = await response.json().catch(() => null)

      if (response.ok && json?.success) {
        onCreated(json.message || 'Devis créé', json.sendWarning)
        onClose()
        return
      }

      const details = json?.details
        ? Object.values(json.details as Record<string, string[]>).flat().join(' · ')
        : null
      setError(details || json?.error || 'Erreur lors de la création du devis')
    } catch (submitError) {
      console.error('Erreur:', submitError)
      setError("Erreur réseau : le devis n'a pas pu être créé")
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
              Nouveau devis <span style={{ color: '#1F5245' }}>au nom d&apos;un client</span>
            </h2>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#6E6A63' }}>
              Pour un client joint par téléphone. L&apos;email est optionnel, mais il conditionne l&apos;envoi du devis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => submit('pending')}
              disabled={isSaving}
              className="flex items-center gap-2"
              style={{ height: '40px', padding: '0 16px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', color: '#12100E', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', opacity: isSaving ? 0.6 : 1 }}
            >
              <FloppyDisk size={15} weight="fill" />
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => submit('sent')}
              disabled={isSaving || !canSendToClient}
              title={canSendToClient ? undefined : "Le client n'a pas d'adresse email"}
              className="flex items-center gap-2"
              style={{ height: '40px', padding: '0 16px', backgroundColor: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '12.5px', fontWeight: 600, cursor: canSendToClient ? 'pointer' : 'not-allowed', opacity: isSaving || !canSendToClient ? 0.5 : 1 }}
            >
              <PaperPlaneTilt size={15} weight="fill" />
              Enregistrer et envoyer
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
                    <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#6E6A63' }}>
                      Rattaché à un compte, le devis apparaît dans l&apos;espace du client, qui peut l&apos;accepter lui-même.
                    </p>
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
                    {!canSendToClient && (
                      <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#B4643A' }}>
                        Sans email, le devis est enregistré mais non envoyé : à communiquer par téléphone ou WhatsApp.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div style={panelStyle}>
                <SectionTitle icon={FileText} label="Demande" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={fieldLabel}>Service</label>
                    <select
                      value={form.service}
                      onChange={(e) => patch({ service: e.target.value })}
                      style={selectStyle}
                    >
                      {QUOTE_SERVICES.map((service) => (
                        <option key={service.id} value={service.id}>{service.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={fieldLabel}>Nombre de personnes</label>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={form.numberOfPeople}
                        onChange={(e) => patch({ numberOfPeople: Math.max(1, parseInt(e.target.value) || 1) })}
                        style={selectStyle}
                      />
                    </div>
                    <div>
                      <label style={fieldLabel}>Durée (jours)</label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={form.duration}
                        onChange={(e) => patch({ duration: Math.max(1, parseInt(e.target.value) || 1) })}
                        style={selectStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={fieldLabel}>Date souhaitée (optionnel)</label>
                    <input
                      type="date"
                      value={form.preferredDate}
                      onChange={(e) => patch({ preferredDate: e.target.value })}
                      style={selectStyle}
                    />
                  </div>

                  <div>
                    <label style={fieldLabel}>Mode de paiement souhaité</label>
                    <select
                      value={form.paymentMode}
                      onChange={(e) => patch({ paymentMode: e.target.value })}
                      style={selectStyle}
                    >
                      <option value="">Non spécifié</option>
                      <option value="cash">Espèces</option>
                      <option value="mobile">Mobile money</option>
                    </select>
                  </div>

                  <div>
                    <label style={fieldLabel}>Description dictée par le client</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => patch({ description: e.target.value })}
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
                    <LocationSelect
                      value={form.departure}
                      onChange={(value) => patch({ departure: value })}
                      locations={locations}
                      placeholder="Lieu de départ"
                      style={selectStyle}
                    />
                  </div>

                  <div>
                    <label style={fieldLabel}>Destination *</label>
                    <LocationSelect
                      value={form.destination}
                      onChange={(value) => patch({ destination: value })}
                      locations={locations}
                      placeholder="Destination"
                      style={selectStyle}
                    />
                  </div>

                  {routeIsUnusual && (
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#B4643A' }}>
                      Ce couple départ/destination ne fait pas partie des trajets tarifés : le prix devra être saisi à la main.
                    </p>
                  )}
                </div>
              </div>

              <div style={panelStyle}>
                <SectionTitle icon={Path} label="Trajets supplémentaires" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {extraLegs.length === 0 && (
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#6E6A63' }}>
                      Le devis ne contient que le trajet ci-dessus. Ajoutez une étape si le client enchaîne plusieurs courses.
                    </p>
                  )}

                  {extraLegs.map((leg, index) => (
                    <div key={leg.key} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div className="flex items-center justify-between">
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E6A63' }}>
                          Trajet {index + 2}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLeg(leg.key)}
                          aria-label={`Supprimer le trajet ${index + 2}`}
                          style={{ display: 'grid', placeItems: 'center', width: '28px', height: '28px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#B8493C', backgroundColor: '#FFFFFF' }}
                        >
                          <Trash size={14} />
                        </button>
                      </div>

                      <select
                        value={leg.service}
                        onChange={(e) => patchLeg(leg.key, { service: e.target.value })}
                        aria-label={`Service du trajet ${index + 2}`}
                        style={selectStyle}
                      >
                        {QUOTE_SERVICES.map((service) => (
                          <option key={service.id} value={service.id}>{service.label}</option>
                        ))}
                      </select>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={leg.departure}
                          onChange={(e) => patchLeg(leg.key, { departure: e.target.value })}
                          placeholder="Départ"
                          aria-label={`Départ du trajet ${index + 2}`}
                          list="quote-locations"
                          style={selectStyle}
                        />
                        <input
                          type="text"
                          value={leg.destination}
                          onChange={(e) => patchLeg(leg.key, { destination: e.target.value })}
                          placeholder="Destination"
                          aria-label={`Destination du trajet ${index + 2}`}
                          list="quote-locations"
                          style={selectStyle}
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <input
                          type="datetime-local"
                          value={leg.scheduledDateTime}
                          onChange={(e) => patchLeg(leg.key, { scheduledDateTime: e.target.value })}
                          aria-label={`Prise en charge du trajet ${index + 2}`}
                          style={{ ...selectStyle, gridColumn: 'span 2' }}
                        />
                        <input
                          type="number"
                          min={1}
                          value={leg.passengers}
                          onChange={(e) => patchLeg(leg.key, { passengers: Math.max(1, parseInt(e.target.value) || 1) })}
                          aria-label={`Passagers du trajet ${index + 2}`}
                          style={selectStyle}
                        />
                        <input
                          type="number"
                          min={0}
                          value={leg.luggage}
                          onChange={(e) => patchLeg(leg.key, { luggage: Math.max(0, parseInt(e.target.value) || 0) })}
                          aria-label={`Bagages du trajet ${index + 2}`}
                          style={selectStyle}
                        />
                      </div>

                      <input
                        type="text"
                        value={leg.note}
                        onChange={(e) => patchLeg(leg.key, { note: e.target.value })}
                        placeholder="Note (n° de vol, arrêt intermédiaire…)"
                        aria-label={`Note du trajet ${index + 2}`}
                        style={selectStyle}
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addExtraLeg}
                    disabled={extraLegs.length + 1 >= MAX_QUOTE_TRIPS}
                    className="flex items-center justify-center gap-2"
                    style={{ height: '42px', border: '1px dashed #C9BFAE', borderRadius: '3px', backgroundColor: '#FFFFFF', fontSize: '12.5px', color: '#1F5245', opacity: extraLegs.length + 1 >= MAX_QUOTE_TRIPS ? 0.5 : 1 }}
                  >
                    <Plus size={14} weight="bold" />
                    Ajouter un trajet
                  </button>
                </div>

                <datalist id="quote-locations">
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name} />
                  ))}
                </datalist>
              </div>

              <div style={panelStyle}>
                <SectionTitle icon={Users} label="Passager" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label style={fieldLabel}>Nom du passager (si différent du client)</label>
                    <input
                      type="text"
                      value={form.passengerName}
                      onChange={(e) => patch({ passengerName: e.target.value })}
                      placeholder="Laisser vide si le client voyage lui-même"
                      style={selectStyle}
                    />
                  </div>
                  <div>
                    <label style={fieldLabel}>Téléphone du passager</label>
                    <input
                      type="tel"
                      value={form.passengerPhone}
                      onChange={(e) => patch({ passengerPhone: e.target.value })}
                      placeholder="Joignable sur place"
                      style={selectStyle}
                    />
                  </div>
                </div>
              </div>

              <div style={panelStyle}>
                <SectionTitle icon={CurrencyDollar} label="Tarif proposé" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={fieldLabel}>Prix du devis (FCFA)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.estimatedPrice}
                      onChange={(e) => patch({ estimatedPrice: e.target.value })}
                      placeholder="Laisser vide = à chiffrer plus tard"
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
                          onClick={() => patch({ estimatedPrice: String(quote.price) })}
                          style={{ height: '34px', padding: '0 14px', backgroundColor: '#1F5245', border: 'none', borderRadius: '3px', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Appliquer
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label style={fieldLabel}>Notes internes (non envoyées au client)</label>
                    <textarea
                      value={form.adminNotes}
                      onChange={(e) => patch({ adminNotes: e.target.value })}
                      rows={3}
                      placeholder="Contexte, remise accordée, interlocuteur…"
                      style={{ ...selectStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
