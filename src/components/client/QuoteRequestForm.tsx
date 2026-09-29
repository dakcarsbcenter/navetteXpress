'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useNotification } from '@/hooks/useNotification'
import { fetchPublicApi } from '@/lib/apiClient'
import { NotificationCenter } from '@/components/ui/NotificationCenter'
import {
  SealCheck,
  ArrowRight,
  Info,
  CircleNotch,
  X,
  Tag,
  Plus,
  Copy,
} from '@phosphor-icons/react'
import {
  QUOTE_SERVICES,
  MAX_QUOTE_TRIPS,
  buildMultiTripQuoteMessage,
  type QuoteTripInput,
} from '@/lib/quote-services'
import { resolvePrice, type PricingSegmentLike } from '@/lib/pricing'
import { trackQuoteSubmitted } from '@/lib/analytics'

interface LocationOption {
  id: number
  name: string
}

/** Une ligne du tableau de trajets, côté formulaire. */
interface TripRow {
  key: string
  service: string
  departure: string
  destination: string
  scheduledDateTime: string
  passengers: string
  luggage: string
  note: string
  /** Secteur tarifaire retenu quand plusieurs segments admin couvrent le trajet. */
  pricingSegmentId: number | null
}

interface TripErrors {
  service?: string
  departure?: string
  destination?: string
}

interface QuoteRequestFormProps {
  onClose?: () => void
}

let tripKeySeed = 0
const nextTripKey = () => `trip-${++tripKeySeed}`

/** Service pré-sélectionné : le transfert aéroport est la demande la plus courante. */
const DEFAULT_SERVICE: string = QUOTE_SERVICES[0].id

const emptyTrip = (overrides: Partial<TripRow> = {}): TripRow => ({
  key: nextTripKey(),
  service: DEFAULT_SERVICE,
  departure: '',
  destination: '',
  scheduledDateTime: '',
  passengers: '1',
  luggage: '0',
  note: '',
  pricingSegmentId: null,
  ...overrides,
})

export function QuoteRequestForm({ onClose }: QuoteRequestFormProps = {}) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { notifications, showSuccess, showError, removeNotification } = useNotification()

  // Anti-bot : champ piège invisible et horodatage de montage du formulaire.
  // Un robot remplit tous les champs et poste instantanément.
  const [companyWebsite, setCompanyWebsite] = useState('')
  const formStartedAtRef = useRef(Date.now())

  const user = session?.user as unknown as { id?: string; name?: string; email?: string; phone?: string } | undefined

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    paymentMode: '',
    description: ''
  })

  // Réservation pour un tiers : même mécanique que /reservation (bookingFor),
  // pour que le chauffeur sache qui il vient chercher.
  const [bookingFor, setBookingFor] = useState<'self' | 'other'>('self')
  const [passengerName, setPassengerName] = useState('')
  const [passengerPhone, setPassengerPhone] = useState('')
  const [passengerNameError, setPassengerNameError] = useState<string | null>(null)

  const [trips, setTrips] = useState<TripRow[]>([emptyTrip()])
  const [tripErrors, setTripErrors] = useState<Record<string, TripErrors>>({})

  const [locations, setLocations] = useState<LocationOption[]>([])
  const [pricingSegments, setPricingSegments] = useState<PricingSegmentLike[]>([])

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
        const response = await fetchPublicApi('/api/locations')
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

  // Load pricing segments defined in the admin dashboard (/admin/dashboard?tab=pricing),
  // used to auto-display an indicative price once departure and destination are chosen
  useEffect(() => {
    const fetchPricingSegments = async () => {
      try {
        const response = await fetchPublicApi('/api/pricing-segments')
        const result = await response.json()
        if (result.success) {
          setPricingSegments(result.data || [])
        }
      } catch (error) {
        console.error('Erreur chargement des tarifs:', error)
      }
    }
    fetchPricingSegments()
  }, [])

  // Tarif : résolu par la fonction partagée (src/lib/pricing.ts) à partir des segments
  // paramétrés dans /admin/dashboard?tab=pricing, comme le fait /reservation et comme le
  // back-office le refait quand l'admin corrige un trajet. Certains couples (ex:
  // DAKAR<->AIBD) ont un tarif par secteur : tant que le client n'a pas indiqué le sien,
  // aucun montant n'est annoncé — afficher celui d'un autre secteur serait un faux prix.
  const tripPricing = trips.map((trip) => {
    const departure = trip.departure.trim()
    const destination = trip.destination.trim()
    const resolved = resolvePrice(pricingSegments, departure, destination, 'berline', trip.pricingSegmentId)
    const zones = resolved.alternatives
    const needsZoneChoice = zones.length > 1
    const zoneChosen = !needsZoneChoice || zones.some((zone) => zone.segment.id === trip.pricingSegmentId)
    // Un trajet complet qu'aucun segment admin ne couvre n'a pas de prix public :
    // il est annoncé "Sur devis" plutôt que laissé sans indication.
    const isQuoteOnly = Boolean(departure && destination) && resolved.segment === null
    return {
      zones,
      needsZoneChoice,
      zoneChosen,
      isQuoteOnly,
      price: zoneChosen ? resolved.price : null,
    }
  })
  const pricedCount = tripPricing.filter((t) => t.price !== null).length
  const estimatedTotal = tripPricing.reduce((sum, t) => sum + (t.price ?? 0), 0)

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateTrip = (key: string, field: keyof TripRow, value: string) => {
    setTrips(prev => prev.map(trip => {
      if (trip.key !== key) return trip
      // Changer de lieu change les secteurs proposés : celui déjà retenu ne vaut plus.
      const resetZone = field === 'departure' || field === 'destination'
      return { ...trip, [field]: value, ...(resetZone ? { pricingSegmentId: null } : {}) }
    }))
    // L'erreur disparaît dès que le champ est corrigé.
    setTripErrors(prev => {
      const current = prev[key]
      if (!current || !(field in current)) return prev
      const { [field as keyof TripErrors]: _removed, ...rest } = current
      return { ...prev, [key]: rest }
    })
  }

  const setTripZone = (key: string, segmentId: number | null) => {
    setTrips(prev => prev.map(trip => (trip.key === key ? { ...trip, pricingSegmentId: segmentId } : trip)))
  }

  // Étape suivante d'un séjour : on repart d'où le trajet précédent s'arrête.
  const addTrip = () => {
    setTrips(prev => {
      if (prev.length >= MAX_QUOTE_TRIPS) return prev
      const last = prev[prev.length - 1]
      return [...prev, emptyTrip({
        service: last.service,
        departure: last.destination,
        passengers: last.passengers,
        luggage: last.luggage,
      })]
    })
  }

  // Aller-retour ou circuit : on recopie la dernière étape, sans sa date.
  const duplicateLastTrip = () => {
    setTrips(prev => {
      if (prev.length >= MAX_QUOTE_TRIPS) return prev
      const last = prev[prev.length - 1]
      return [...prev, { ...last, key: nextTripKey(), scheduledDateTime: '' }]
    })
  }

  const removeTrip = (key: string) => {
    setTrips(prev => (prev.length <= 1 ? prev : prev.filter(trip => trip.key !== key)))
  }

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      paymentMode: '',
      description: ''
    })
    setBookingFor('self')
    setPassengerName('')
    setPassengerPhone('')
    setPassengerNameError(null)
    setTrips([emptyTrip()])
    setTripErrors({})
  }

  const handleCancel = () => {
    if (onClose) {
      onClose()
    } else {
      // Même raison que pour la sortie après envoi : /client/** est protégé.
      router.push(user ? '/client/dashboard?tab=quotes' : '/')
    }
  }

  /** Renseigne tripErrors / passengerNameError et renvoie les lignes prêtes à envoyer. */
  const validate = (): QuoteTripInput[] | null => {
    const errors: Record<string, TripErrors> = {}

    const payload = trips.map((trip) => {
      const departure = trip.departure.trim()
      const destination = trip.destination.trim()
      const tripError: TripErrors = {}

      if (!trip.service) tripError.service = 'Choisissez un type de service'
      if (!departure) tripError.departure = 'Indiquez le lieu de départ'
      if (!destination) tripError.destination = 'Indiquez la destination'
      else if (departure && departure.toLowerCase() === destination.toLowerCase()) {
        tripError.destination = 'La destination doit différer du départ'
      }

      if (Object.keys(tripError).length > 0) errors[trip.key] = tripError

      return {
        service: trip.service,
        departure,
        destination,
        scheduledDateTime: trip.scheduledDateTime || null,
        passengers: Math.max(1, parseInt(trip.passengers, 10) || 1),
        luggage: Math.max(0, parseInt(trip.luggage, 10) || 0),
        note: trip.note.trim() || null,
      }
    })

    setTripErrors(errors)

    const missingPassenger = bookingFor === 'other' && passengerName.trim().length < 2
    setPassengerNameError(missingPassenger ? 'Indiquez le nom du passager' : null)

    if (Object.keys(errors).length > 0 || missingPassenger) return null
    return payload
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
      showError('Veuillez remplir vos informations de contact', 'Formulaire incomplet')
      return
    }

    const tripsPayload = validate()
    if (!tripsPayload) {
      showError('Vérifiez les trajets signalés en rouge', 'Formulaire incomplet')
      return
    }

    setIsSubmitting(true)

    try {
      // If user updated their phone number, sync it to their profile
      if (user && formData.customerPhone && formData.customerPhone !== user.phone) {
        try {
          const updateResponse = await fetch('/api/user/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: formData.customerPhone })
          })
          if (!updateResponse.ok) {
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
        // `service` et `preferredDate` restent des colonnes du devis (factures,
        // e-mails, filtres admin) : on y recopie celles du premier trajet.
        service: tripsPayload[0].service,
        preferredDate: tripsPayload[0].scheduledDateTime || null,
        trips: tripsPayload,
        passengerName: bookingFor === 'other' ? passengerName.trim() : null,
        passengerPhone: bookingFor === 'other' ? (passengerPhone.trim() || null) : null,
        // Trace lisible du devis, affichée dans la fiche admin et les e-mails.
        message: buildMultiTripQuoteMessage({
          trips: tripsPayload,
          paymentMode: formData.paymentMode,
          description: formData.description,
          passengerName: bookingFor === 'other' ? passengerName.trim() : null,
          passengerPhone: bookingFor === 'other' ? passengerPhone.trim() : null,
        }),
        // Estimation indicative : seulement si tous les trajets ont un tarif
        // connu, sinon le total induirait le client en erreur.
        estimatedPrice: pricedCount === trips.length && pricedCount > 0 ? estimatedTotal : null,
        // Champs anti-bot : honeypot invisible + horodatage de montage du
        // formulaire (voir src/lib/security/publicFormGuard.ts)
        companyWebsite,
        formStartedAt: formStartedAtRef.current
      }

      const response = await fetchPublicApi('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      })

      if (response.ok) {
        // Conversion : devis reellement enregistre cote API.
        trackQuoteSubmitted(quoteData.service)

        showSuccess('Votre demande de devis a été envoyée avec succès ! Nous vous répondrons dans les plus brefs délais.', 'Demande envoyée')
        resetForm()
        formStartedAtRef.current = Date.now()

        // Le dashboard client est derrière l'authentification : y envoyer un
        // visiteur anonyme l'amènerait sur l'écran de connexion juste après
        // avoir envoyé sa demande. On lui affiche un état de succès à la place.
        if (onClose) {
          setTimeout(() => onClose(), 1500)
        } else if (user) {
          setTimeout(() => router.push('/client/dashboard?tab=quotes'), 1500)
        } else {
          setIsSubmitted(true)
        }
      } else {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Erreur lors de l\'envoi de la demande')
      }
    } catch (error) {
      console.error('Erreur envoi demande de devis:', error)
      showError(
        error instanceof Error ? error.message : 'Erreur lors de l\'envoi de votre demande. Veuillez réessayer.',
        'Erreur'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Shared input class helpers — champs compacts, alignés en colonnes dans le tableau de trajets.
  const inputBase =
    'w-full px-3 py-2.5 rounded border border-border bg-white text-foreground placeholder-[#a8a199] text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent'
  const inputReadOnly = 'bg-[#F7F3EC] cursor-not-allowed text-[#6E6A63]'
  const inputError = 'border-[#B8493C] focus:ring-[#B8493C] focus:border-[#B8493C]'
  const labelBase =
    'block text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase'
  const sectionTitle =
    'text-[11px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.16em] text-[#12100E] uppercase'
  // Une seule grille pour l'en-tête de colonnes et pour chaque ligne de trajet.
  const tripGrid =
    'grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_78px_78px_40px] lg:gap-3'

  if (isSubmitted) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 font-archivo">
        <div className="bg-white border border-border rounded p-8 sm:p-10 text-center">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#F7F3EC] text-accent mb-5">
            <SealCheck size={28} weight="fill" />
          </span>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Demande envoyée
          </h1>
          <p className="mt-3 text-[#3d3a35] leading-relaxed max-w-md mx-auto">
            Nous avons bien reçu votre demande de devis. Un conseiller vous répond sous 24 h ouvrées,
            et vous recevez dès maintenant un accusé de réception par email.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => { setIsSubmitted(false); formStartedAtRef.current = Date.now() }}
              className="inline-flex items-center justify-center px-6 py-3 rounded border border-[#12100E] bg-white text-[#12100E] text-sm font-medium hover:bg-[#12100E] hover:text-white transition-colors min-h-[44px]"
            >
              Envoyer une autre demande
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors min-h-[44px]"
            >
              Retour à l&apos;accueil
              <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 font-archivo">
      <NotificationCenter notifications={notifications} onRemove={removeNotification} />

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-[26px] font-bold text-foreground tracking-tight">
          Demande de devis
        </h1>
        <p className="mt-1 text-sm text-[#6E6A63]">
          Ajoutez un ou plusieurs trajets : un prix sera indiqué pour chaque ligne.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Honeypot : invisible pour un visiteur, rempli par les robots qui
            complètent tous les champs du DOM (voir publicFormGuard.ts) */}
        <div aria-hidden="true" className="absolute w-px h-px -left-[9999px] overflow-hidden">
          <label htmlFor="companyWebsite">Site web de votre société</label>
          <input
            id="companyWebsite"
            name="companyWebsite"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
          />
        </div>

        {/* ── Section 1 : Vos informations ── */}
        <section className="bg-white rounded border border-border overflow-hidden">
          <div className="px-4 sm:px-6 py-3.5 border-b border-border">
            <h2 className={sectionTitle}>Vos informations</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
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
                <label className={labelBase}>
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => handleFormChange('customerName', e.target.value)}
                  readOnly={!!user}
                  className={`${inputBase} ${user ? inputReadOnly : ''}`}
                  placeholder="Votre nom et prénom"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className={labelBase}>
                  Adresse e-mail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.customerEmail}
                  onChange={(e) => handleFormChange('customerEmail', e.target.value)}
                  readOnly={!!user}
                  className={`${inputBase} ${user ? inputReadOnly : ''}`}
                  placeholder="votre@email.com"
                />
              </div>

              {/* Téléphone */}
              <div className="space-y-1.5">
                <label className={labelBase}>
                  Téléphone <span className="text-red-500">*</span>
                  {user && user.phone && formData.customerPhone !== user.phone && (
                    <span className="ml-2 normal-case text-[#B4643A] font-normal">
                      (modifié)
                    </span>
                  )}
                </label>
                <input
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => handleFormChange('customerPhone', e.target.value)}
                  className={inputBase}
                  placeholder="+221 XX XXX XX XX"
                />
              </div>

              {/* Mode de paiement */}
              <div className="space-y-1.5">
                <label className={labelBase}>Mode de paiement préféré</label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => handleFormChange('paymentMode', e.target.value)}
                  className={inputBase}
                >
                  <option value="">Sélectionner</option>
                  <option value="cash">Espèce</option>
                  <option value="mobile">Mobile Money</option>
                </select>
              </div>
            </div>

            {/* Réservation pour un tiers : le chauffeur doit savoir qui il vient chercher. */}
            <div className="pt-1">
              <label className="inline-flex items-center gap-2.5 text-sm text-[#3d3a35] cursor-pointer">
                <input
                  type="checkbox"
                  checked={bookingFor === 'other'}
                  onChange={(e) => {
                    setBookingFor(e.target.checked ? 'other' : 'self')
                    setPassengerNameError(null)
                  }}
                  className="w-4 h-4 rounded border-border accent-accent"
                />
                Je réserve pour un tiers
              </label>

              {bookingFor === 'other' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                  <div className="space-y-1.5">
                    <label className={labelBase}>
                      Nom du passager <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={passengerName}
                      onChange={(e) => { setPassengerName(e.target.value); setPassengerNameError(null) }}
                      className={`${inputBase} ${passengerNameError ? inputError : ''}`}
                      placeholder="Nom et prénom du voyageur"
                    />
                    {passengerNameError && (
                      <p className="text-xs text-[#B8493C]">{passengerNameError}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelBase}>Téléphone du passager</label>
                    <input
                      type="tel"
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      className={inputBase}
                      placeholder="Pour que le chauffeur le joigne sur place"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Section 2 : Vos trajets (une ligne = une étape) ── */}
        <section className="bg-white rounded border border-border overflow-hidden">
          <div className="px-4 sm:px-6 py-3.5 border-b border-border">
            <h2 className={sectionTitle}>
              Vos trajets <span className="text-red-500">*</span>
            </h2>
          </div>

          <div className="p-4 sm:p-6">
            {/* En-tête de colonnes : seulement sur grand écran, les lignes
                repassent en champs étiquetés en dessous. */}
            <div className={`${tripGrid} hidden lg:grid pb-2`}>
              <span className={labelBase}>Type de service</span>
              <span className={labelBase}>Départ</span>
              <span className={labelBase}>Destination</span>
              <span className={labelBase}>Prise en charge (date &amp; heure)</span>
              <span className={labelBase}>Passagers</span>
              <span className={labelBase}>Bagages</span>
              <span className="sr-only">Supprimer</span>
            </div>

            <div className="space-y-3 lg:space-y-2">
              {trips.map((trip, index) => {
                const errors = tripErrors[trip.key] || {}
                const pricing = tripPricing[index]
                return (
                  <div
                    key={trip.key}
                    className="rounded border border-border p-3 lg:rounded-none lg:border-0 lg:p-0"
                  >
                    {/* Repère de ligne : inutile sur desktop où les colonnes parlent d'elles-mêmes */}
                    <div className="flex items-center justify-between mb-2 lg:hidden">
                      <span className={labelBase}>Trajet {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeTrip(trip.key)}
                        disabled={trips.length <= 1}
                        aria-label={`Supprimer le trajet ${index + 1}`}
                        className="p-1.5 rounded text-[#6E6A63] hover:text-[#B8493C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className={tripGrid}>
                      {/* Service */}
                      <div className="space-y-1.5">
                        <label className={`${labelBase} lg:hidden`}>
                          Type de service <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={trip.service}
                          onChange={(e) => updateTrip(trip.key, 'service', e.target.value)}
                          className={`${inputBase} ${errors.service ? inputError : ''}`}
                        >
                          {QUOTE_SERVICES.map((service) => (
                            <option key={service.id} value={service.id}>{service.label}</option>
                          ))}
                        </select>
                        {errors.service && <p className="text-xs text-[#B8493C]">{errors.service}</p>}
                      </div>

                      {/* Départ */}
                      <div className="space-y-1.5">
                        <label className={`${labelBase} lg:hidden`}>
                          Départ <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={trip.departure}
                          onChange={(e) => updateTrip(trip.key, 'departure', e.target.value)}
                          className={`${inputBase} ${errors.departure ? inputError : ''}`}
                        >
                          <option value="">Sélectionner un lieu</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.name}>{loc.name}</option>
                          ))}
                        </select>
                        {errors.departure && <p className="text-xs text-[#B8493C]">{errors.departure}</p>}
                      </div>

                      {/* Destination */}
                      <div className="space-y-1.5">
                        <label className={`${labelBase} lg:hidden`}>
                          Destination <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={trip.destination}
                          onChange={(e) => updateTrip(trip.key, 'destination', e.target.value)}
                          className={`${inputBase} ${errors.destination ? inputError : ''}`}
                        >
                          <option value="">Sélectionner un lieu</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.name}>{loc.name}</option>
                          ))}
                        </select>
                        {errors.destination && <p className="text-xs text-[#B8493C]">{errors.destination}</p>}
                      </div>

                      {/* Prise en charge */}
                      <div className="space-y-1.5">
                        <label className={`${labelBase} lg:hidden`}>Prise en charge (date &amp; heure)</label>
                        <input
                          type="datetime-local"
                          value={trip.scheduledDateTime}
                          onChange={(e) => updateTrip(trip.key, 'scheduledDateTime', e.target.value)}
                          className={inputBase}
                        />
                      </div>

                      {/* Passagers */}
                      <div className="space-y-1.5">
                        <label className={`${labelBase} lg:hidden`}>Passagers</label>
                        <input
                          type="number"
                          min="1"
                          max="200"
                          value={trip.passengers}
                          onChange={(e) => updateTrip(trip.key, 'passengers', e.target.value)}
                          className={inputBase}
                        />
                      </div>

                      {/* Bagages */}
                      <div className="space-y-1.5">
                        <label className={`${labelBase} lg:hidden`}>Bagages</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={trip.luggage}
                          onChange={(e) => updateTrip(trip.key, 'luggage', e.target.value)}
                          className={inputBase}
                        />
                      </div>

                      {/* Suppression de la ligne (desktop) */}
                      <div className="hidden lg:flex items-start justify-center">
                        <button
                          type="button"
                          onClick={() => removeTrip(trip.key)}
                          disabled={trips.length <= 1}
                          aria-label={`Supprimer le trajet ${index + 1}`}
                          className="flex items-center justify-center w-10 h-[42px] rounded border border-border text-[#6E6A63] hover:text-[#B8493C] hover:border-[#B8493C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Secteur : demandé seulement quand plusieurs tarifs admin couvrent le trajet */}
                    {pricing.needsZoneChoice && (
                      <div className="mt-2 space-y-1.5 lg:max-w-xs">
                        <label className={labelBase}>Secteur (pour un tarif ferme)</label>
                        <select
                          value={trip.pricingSegmentId ?? ''}
                          onChange={(e) => setTripZone(trip.key, e.target.value ? Number(e.target.value) : null)}
                          className={inputBase}
                        >
                          <option value="">Sélectionner un secteur</option>
                          {pricing.zones.map((zone) => (
                            <option key={zone.segment.id} value={zone.segment.id}>
                              {zone.label} — {zone.price.toLocaleString('fr-FR')} FCFA
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Prix de la ligne, tel que paramétré dans l'admin des tarifs.
                        Hors de ces segments, le trajet est chiffré à la main : "Sur devis". */}
                    {(pricing.price !== null || pricing.isQuoteOnly) && (
                      <p className="mt-1.5 text-xs text-[#6E6A63] lg:text-right">
                        Trajet {index + 1} :{' '}
                        <span className="font-semibold text-foreground">
                          {pricing.price !== null
                            ? `${pricing.price.toLocaleString('fr-FR')} FCFA`
                            : 'Sur devis'}
                        </span>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                type="button"
                onClick={addTrip}
                disabled={trips.length >= MAX_QUOTE_TRIPS}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded border border-dashed border-[#12100E]/30 text-sm text-[#3d3a35] hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
              >
                <Plus size={15} weight="bold" />
                {trips.length >= MAX_QUOTE_TRIPS
                  ? `Maximum ${MAX_QUOTE_TRIPS} trajets`
                  : 'Ajouter un trajet'}
              </button>
              <button
                type="button"
                onClick={duplicateLastTrip}
                disabled={trips.length >= MAX_QUOTE_TRIPS}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded border border-dashed border-[#12100E]/30 text-sm text-[#3d3a35] hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
              >
                <Copy size={15} />
                Dupliquer le dernier
              </button>
            </div>

            <p className="mt-2 text-xs text-[#6E6A63]">
              Astuce : pour un aller-retour ou un circuit, ajoutez une ligne par étape.
            </p>

            {/* Estimation indicative, calculée depuis les segments tarifaires admin */}
            {pricedCount > 0 && (
              <div className="flex items-start gap-3 px-4 py-3 mt-4 rounded bg-[#F7F3EC] border border-border">
                <Tag size={18} weight="fill" className="mt-0.5 shrink-0 text-accent" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Estimation indicative : {estimatedTotal.toLocaleString('fr-FR')} FCFA
                    <span className="font-normal text-[#6E6A63]"> (berline)</span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#6E6A63] leading-snug">
                    {pricedCount} trajet{pricedCount > 1 ? 's' : ''} tarifé{pricedCount > 1 ? 's' : ''} sur {trips.length}
                    {pricedCount < trips.length ? ' : les autres sont sur devis' : ''}.
                    Le tarif définitif de chaque trajet vous sera confirmé dans votre devis.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 3 : Description ── */}
        <section className="bg-white rounded border border-border overflow-hidden">
          <div className="px-4 sm:px-6 py-3.5 border-b border-border">
            <h2 className={sectionTitle}>Description</h2>
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-1.5">
              <label className={labelBase}>
                Demandes spécifiques ou informations utiles
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className={`${inputBase} resize-none`}
                placeholder="Préférences, informations importantes pour votre demande de devis..."
              />
            </div>
          </div>
        </section>

        {/* ── Action buttons ── */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pb-6">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded border border-border bg-white text-[#12100E] text-sm font-medium hover:bg-[#12100E] hover:text-white hover:border-[#12100E] transition-colors min-h-[44px]"
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
              'Envoyer ma demande de devis'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
