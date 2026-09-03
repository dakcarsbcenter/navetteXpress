'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useNotification } from '@/hooks/useNotification'
import { NotificationCenter } from '@/components/ui/NotificationCenter'
import {
  User,
  EnvelopeSimple,
  Phone,
  Users,
  SealCheck,
  CalendarBlank,
  MapPin,
  ArrowRight,
  CreditCard,
  TextAlignLeft,
  Info,
  CircleNotch,
  X,
  PaperPlaneTilt,
} from '@phosphor-icons/react'

const availableServices = [
  { id: 'transport', name: 'Transport standard', icon: '🚗', description: 'Service de transport classique' },
  { id: 'tour', name: 'Tour & Excursion', icon: '🎯', description: 'Visites guidées et excursions' },
  { id: 'airport', name: 'Transfert aéroport', icon: '✈️', description: 'Navette vers/depuis l\'aéroport' },
  { id: 'vip', name: 'Transport VIP', icon: '👑', description: 'Service premium avec véhicule de luxe' },
  { id: 'rental', name: 'Location avec chauffeur', icon: '🤵', description: 'Location longue durée avec chauffeur' },
  { id: 'event', name: 'Transport événementiel', icon: '🎉', description: 'Transport pour événements spéciaux' }
]

const OTHER_LOCATION_VALUE = '__other__'

interface LocationOption {
  id: number
  name: string
}

interface QuoteRequestFormProps {
  onClose?: () => void
}

export function QuoteRequestForm({ onClose }: QuoteRequestFormProps = {}) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { notifications, showSuccess, showError, removeNotification } = useNotification()

  const user = session?.user as unknown as { id?: string; name?: string; email?: string; phone?: string } | undefined

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    numberOfPeople: '',
    services: [] as string[],
    duration: '',
    startDate: '',
    departure: '',
    departureCustom: '',
    destination: '',
    destinationCustom: '',
    paymentMode: '',
    description: ''
  })

  const [locations, setLocations] = useState<LocationOption[]>([])

  // Pre-fill fields from connected user session
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || prev.customerName,
        customerEmail: user.email || prev.customerEmail,
        customerPhone: user.phone || prev.customerPhone
      }))
    }
  }, [user])

  // Load locations defined in the admin dashboard (/admin/dashboard?tab=locations)
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations')
        const result = await response.json()
        if (result.success) {
          setLocations(result.data || [])
        }
      } catch (error) {
        console.error('Erreur chargement des lieux:', error)
      }
    }
    fetchLocations()
  }, [])

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      services: checked
        ? [...prev.services, serviceId]
        : prev.services.filter(s => s !== serviceId)
    }))
  }

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      numberOfPeople: '',
      services: [],
      duration: '',
      startDate: '',
      departure: '',
      departureCustom: '',
      destination: '',
      destinationCustom: '',
      paymentMode: '',
      description: ''
    })
  }

  const handleCancel = () => {
    if (onClose) {
      onClose()
    } else {
      router.push('/client/dashboard?tab=quotes')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const departureValue = formData.departure === OTHER_LOCATION_VALUE ? formData.departureCustom.trim() : formData.departure
    const destinationValue = formData.destination === OTHER_LOCATION_VALUE ? formData.destinationCustom.trim() : formData.destination

    if (!formData.customerName || !formData.customerEmail ||
        !formData.numberOfPeople || formData.services.length === 0 ||
        !formData.duration || !departureValue || !destinationValue) {
      showError('Veuillez remplir tous les champs obligatoires', 'Formulaire incomplet')
      return
    }

    setIsSubmitting(true)

    try {
      // If user updated their phone number, sync it to their profile
      if (user && formData.customerPhone && formData.customerPhone !== user.phone) {
        console.log('Mise à jour du téléphone utilisateur:', formData.customerPhone)
        try {
          const updateResponse = await fetch('/api/user/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: formData.customerPhone })
          })

          if (updateResponse.ok) {
            console.log('Téléphone mis à jour avec succès')
          } else {
            console.warn('Impossible de mettre à jour le téléphone')
          }
        } catch (updateError) {
          console.warn('Erreur lors de la mise à jour du téléphone:', updateError)
          // Continue even if the profile update fails
        }
      }

      const quoteData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone || null,
        service: formData.services.join(', '),
        preferredDate: formData.startDate || null,
        message: `Demande de devis pour ${formData.numberOfPeople} personne(s).
Services: ${formData.services.join(', ')}
Durée: ${formData.duration} jour(s)
Départ: ${departureValue}
Destination: ${destinationValue}
Mode de paiement souhaité: ${formData.paymentMode || 'Non spécifié'}

Description: ${formData.description}`,
        status: 'pending'
      }

      console.log('Envoi de la demande de devis:', quoteData)

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      })

      console.log('Réponse API status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('Demande de devis envoyée avec succès:', result)

        showSuccess('Votre demande de devis a été envoyée avec succès ! Nous vous répondrons dans les plus brefs délais.', 'Demande envoyée')
        resetForm()

        setTimeout(() => {
          if (onClose) {
            onClose()
          } else {
            router.push('/client/dashboard?tab=quotes')
          }
        }, 1500)
      } else {
        const errorData = await response.text()
        console.error('Erreur API response:', errorData)
        throw new Error('Erreur lors de l\'envoi de la demande')
      }
    } catch (error) {
      console.error('Erreur envoi demande de devis:', error)
      showError('Erreur lors de l\'envoi de votre demande. Veuillez réessayer.', 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Shared input class helpers
  const inputBase =
    'w-full px-4 py-3 rounded border border-border bg-white text-foreground placeholder-[#a8a199] text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent'
  const inputReadOnly =
    'bg-[#F7F3EC] cursor-not-allowed text-[#6E6A63]'

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 font-archivo">
      <NotificationCenter notifications={notifications} onRemove={removeNotification} />

      {/* Page header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Demander un devis
        </h1>
        <p className="mt-2 text-[#3d3a35]">
          Remplissez ce formulaire pour recevoir une offre personnalisée adaptée à vos besoins
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Section 1 : Vos informations ── */}
        <section className="bg-white rounded border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-border">
            <span className="flex items-center justify-center w-8 h-8 rounded bg-[#F7F3EC] text-accent">
              <User size={18} weight="bold" />
            </span>
            <h2 className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase">
              Vos informations
            </h2>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {user && (
              <div className="flex items-start gap-3 px-4 py-3 rounded bg-[#F7F3EC] border border-border">
                <Info size={18} weight="regular" className="mt-0.5 shrink-0 text-accent" />
                <p className="text-sm text-[#3d3a35] leading-snug">
                  Vos informations sont automatiquement pré-remplies depuis votre compte. Seul le numéro de téléphone est modifiable.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nom complet */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6A63] pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => handleFormChange('customerName', e.target.value)}
                    readOnly={!!user}
                    className={`${inputBase} pl-10 ${user ? inputReadOnly : ''}`}
                    placeholder="Votre nom et prénom"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase">
                  Adresse e-mail <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <EnvelopeSimple size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6A63] pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={formData.customerEmail}
                    onChange={(e) => handleFormChange('customerEmail', e.target.value)}
                    readOnly={!!user}
                    className={`${inputBase} pl-10 ${user ? inputReadOnly : ''}`}
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase">
                  Téléphone <span className="text-red-500">*</span>
                  {user && user.phone && formData.customerPhone !== user.phone && (
                    <span className="ml-2 normal-case text-[#B4643A] font-normal">
                      (modifié)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6A63] pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => handleFormChange('customerPhone', e.target.value)}
                    className={`${inputBase} pl-10`}
                    placeholder="+221 XX XXX XX XX"
                  />
                </div>
              </div>

              {/* Nombre de personnes */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase">
                  Nombre de voyageurs <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6A63] pointer-events-none" />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={formData.numberOfPeople}
                    onChange={(e) => handleFormChange('numberOfPeople', e.target.value)}
                    className={`${inputBase} pl-10`}
                    placeholder="Ex: 2"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 2 : Services souhaités ── */}
        <section className="bg-white rounded border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-border">
            <span className="flex items-center justify-center w-8 h-8 rounded bg-[#F7F3EC] text-accent">
              <SealCheck size={18} weight="bold" />
            </span>
            <h2 className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase">
              Services souhaités <span className="text-red-500">*</span>
            </h2>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableServices.map((service) => {
                const isSelected = formData.services.includes(service.id)
                return (
                  <label
                    key={service.id}
                    className={`relative flex flex-col gap-1 p-4 rounded border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-accent bg-[#F7F3EC]'
                        : 'border-border bg-white hover:border-accent/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleServiceChange(service.id, e.target.checked)}
                      className="sr-only"
                    />
                    {/* Custom check badge */}
                    <span className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-accent border-accent'
                        : 'border-[#c9c3b8]'
                    }`}>
                      {isSelected && (
                        <svg viewBox="0 0 10 8" className="w-3 h-3 fill-white">
                          <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>

                    <span className="text-2xl leading-none">{service.icon}</span>
                    <span className={`text-sm font-semibold mt-1 ${isSelected ? 'text-accent' : 'text-foreground'}`}>
                      {service.name}
                    </span>
                    <span className="text-xs text-[#6E6A63] leading-snug">
                      {service.description}
                    </span>
                  </label>
                )
              })}
            </div>
            {formData.services.length === 0 && (
              <p className="mt-3 text-xs text-[#6E6A63]">
                Sélectionnez au moins un service pour continuer.
              </p>
            )}
          </div>
        </section>

        {/* ── Section 3 : Planning et durée ── */}
        <section className="bg-white rounded border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-border">
            <span className="flex items-center justify-center w-8 h-8 rounded bg-[#F7F3EC] text-accent">
              <CalendarBlank size={18} weight="bold" />
            </span>
            <h2 className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase">
              Planning et durée <span className="text-red-500">*</span>
            </h2>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Durée */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase">
                  Durée du voyage <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.duration}
                  onChange={(e) => handleFormChange('duration', e.target.value)}
                  className={`${inputBase} appearance-none`}
                >
                  <option value="">Sélectionner la durée</option>
                  <option value="1">1 jour</option>
                  <option value="2">2 jours</option>
                  <option value="3">3 jours</option>
                  <option value="4">4 jours</option>
                  <option value="5">5 jours</option>
                  <option value="7">1 semaine</option>
                  <option value="14">2 semaines</option>
                  <option value="21">3 semaines</option>
                  <option value="30">1 mois</option>
                </select>
              </div>

              {/* Date de début */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase">
                  Date de début souhaitée
                </label>
                <div className="relative">
                  <CalendarBlank size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6A63] pointer-events-none" />
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFormChange('startDate', e.target.value)}
                    className={`${inputBase} pl-10`}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 4 : Itinéraire ── */}
        <section className="bg-white rounded border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-border">
            <span className="flex items-center justify-center w-8 h-8 rounded bg-[#F7F3EC] text-accent">
              <MapPin size={18} weight="bold" />
            </span>
            <h2 className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase">
              Itinéraire <span className="text-red-500">*</span>
            </h2>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Départ */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase">
                  Lieu de départ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin size={16} weight="fill" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent pointer-events-none" />
                  <select
                    required
                    value={formData.departure}
                    onChange={(e) => handleFormChange('departure', e.target.value)}
                    className={`${inputBase} pl-10 appearance-none`}
                  >
                    <option value="">Sélectionner un lieu</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                    <option value={OTHER_LOCATION_VALUE}>Autre lieu…</option>
                  </select>
                </div>
                {formData.departure === OTHER_LOCATION_VALUE && (
                  <input
                    type="text"
                    required
                    value={formData.departureCustom}
                    onChange={(e) => handleFormChange('departureCustom', e.target.value)}
                    className={`${inputBase} mt-2`}
                    placeholder="Précisez l'adresse ou la ville de départ"
                  />
                )}
              </div>

              {/* Destination */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase">
                  Destination <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin size={16} weight="fill" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B4643A] pointer-events-none" />
                  <select
                    required
                    value={formData.destination}
                    onChange={(e) => handleFormChange('destination', e.target.value)}
                    className={`${inputBase} pl-10 appearance-none`}
                  >
                    <option value="">Sélectionner un lieu</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                    <option value={OTHER_LOCATION_VALUE}>Autre lieu…</option>
                  </select>
                </div>
                {formData.destination === OTHER_LOCATION_VALUE && (
                  <input
                    type="text"
                    required
                    value={formData.destinationCustom}
                    onChange={(e) => handleFormChange('destinationCustom', e.target.value)}
                    className={`${inputBase} mt-2`}
                    placeholder="Précisez l'adresse ou la ville de destination"
                  />
                )}
              </div>
            </div>

            {/* Visual route indicator */}
            {(formData.departure || formData.destination) && (
              <div className="mt-4 flex items-center gap-2 text-xs text-[#6E6A63]">
                <span className="font-medium text-foreground truncate max-w-[160px]">
                  {(formData.departure === OTHER_LOCATION_VALUE ? formData.departureCustom : formData.departure) || '—'}
                </span>
                <ArrowRight size={14} className="shrink-0 text-[#6E6A63]" />
                <span className="font-medium text-foreground truncate max-w-[160px]">
                  {(formData.destination === OTHER_LOCATION_VALUE ? formData.destinationCustom : formData.destination) || '—'}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 5 : Informations complémentaires ── */}
        <section className="bg-white rounded border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-border">
            <span className="flex items-center justify-center w-8 h-8 rounded bg-[#F7F3EC] text-accent">
              <CreditCard size={18} weight="bold" />
            </span>
            <h2 className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase">
              Informations complémentaires
            </h2>
          </div>

          <div className="p-4 sm:p-6">
            <div className="max-w-sm space-y-1.5">
              <label className="block text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase">
                Mode de paiement préféré
              </label>
              <div className="relative">
                <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6A63] pointer-events-none" />
                <select
                  value={formData.paymentMode}
                  onChange={(e) => handleFormChange('paymentMode', e.target.value)}
                  className={`${inputBase} pl-10 appearance-none`}
                >
                  <option value="">Sélectionner</option>
                  <option value="cash">Espèce</option>
                  <option value="mobile">Mobile Money</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 6 : Description ── */}
        <section className="bg-white rounded border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-border">
            <span className="flex items-center justify-center w-8 h-8 rounded bg-[#F7F3EC] text-accent">
              <TextAlignLeft size={18} weight="bold" />
            </span>
            <h2 className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase">
              Description
            </h2>
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase">
                Demandes spécifiques ou informations utiles
              </label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className={`${inputBase} resize-none`}
                placeholder="Décrivez vos besoins spécifiques, préférences, ou toute information importante pour votre demande de devis..."
              />
            </div>
          </div>
        </section>

        {/* ── Action buttons ── */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 pb-6">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded border border-[#12100E] bg-white text-[#12100E] text-sm font-medium hover:bg-[#12100E] hover:text-white transition-colors min-h-[44px]"
          >
            <X size={16} />
            Annuler
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold transition-colors disabled:cursor-not-allowed min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <CircleNotch size={16} className="animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <PaperPlaneTilt size={16} weight="fill" />
                Envoyer ma demande de devis
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
