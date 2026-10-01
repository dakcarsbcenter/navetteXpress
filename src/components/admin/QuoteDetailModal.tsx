"use client"

import React, { useCallback, useEffect, useState } from "react"
import {
    X,
    User,
    Envelope,
    Phone,
    Calendar,
    CurrencyDollar as DollarSign,
    PaperPlaneRight as Send,
    Clock,
    Tag,
    CheckCircle,
    CarProfile,
    AirplaneTilt,
    Binoculars,
    Crown,
    Confetti,
    Buildings,
    Path,
    MapPin,
    Users,
    Suitcase,
    FilePdf,
    Eye,
    DownloadSimple,
    Plus,
    Trash,
    Receipt,
    Lock
} from "@phosphor-icons/react"
import { useNotification } from "@/hooks/useNotification"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { QUOTE_SERVICES, getQuoteServiceLabel, MAX_QUOTE_TRIPS } from "@/lib/quote-services"
import { DEFAULT_TAX_RATE, TAX_RATE_CHOICES } from "@/lib/pdf/brand"
import {
    QUOTE_PIPELINE,
    QUOTE_STATUS_LABELS,
    canTransition,
    type QuoteStatus
} from "@/lib/quote-workflow"

/** Ligne de trajet d'un devis multi-trajets (table quote_trips). */
export interface QuoteTripView {
    id: number
    position: number
    service: string
    departure: string
    destination: string
    scheduledDateTime: string | null
    passengers: number
    luggage: number
    note: string | null
    estimatedPrice: string | null
    /** Renseigné dès que le trajet a été converti en réservation : il est alors figé. */
    bookingId?: number | null
}

interface Quote {
    id: number
    customerName: string
    customerEmail: string
    customerPhone: string | null
    service: string
    preferredDate: string | null
    message: string
    status: QuoteStatus
    adminNotes: string | null
    estimatedPrice: string | null
    assignedTo: string | null
    passengerName?: string | null
    passengerPhone?: string | null
    /** Absent sur les devis anterieurs a la table quote_trips. */
    trips?: QuoteTripView[]
    /** Champs du document officiel. `reference` est fige des la premiere generation du PDF. */
    reference?: string | null
    validUntil?: string | null
    documentObject?: string | null
    customerAddress?: string | null
    customerNinea?: string | null
    /** Taux de TVA du devis, repris par la facture (18 % ou 0 % si exonéré). */
    taxRate?: string | null
    createdAt: string
    updatedAt: string
}

/** Ligne de trajet en cours d'édition. `id` absent = ligne pas encore enregistrée. */
interface TripDraft {
    key: string
    id?: number
    service: string
    departure: string
    destination: string
    scheduledDateTime: string
    passengers: string
    luggage: string
    note: string
    estimatedPrice: string
    bookingId: number | null
}

interface LinkedInvoice {
    id: number
    invoiceNumber: string
    totalAmount: string
    taxRate: string
    dueDate: string
}

/** Objet par defaut du devis, aligne sur DEFAULT_QUOTE_OBJECT cote serveur. */
const DEFAULT_QUOTE_OBJECT = 'Transferts chauffeur privé'

/** Valeur par defaut du champ "valable jusqu'au" : aujourd'hui + 30 jours. */
function defaultValidUntil(): string {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString().slice(0, 10)
}

/** `datetime-local` attend "YYYY-MM-DDTHH:mm" en heure locale. */
function toLocalInput(value: string | null): string {
    if (!value) return ''
    const date = new Date(value)
    if (isNaN(date.getTime())) return ''
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function toDraft(trip: QuoteTripView): TripDraft {
    return {
        key: `trip-${trip.id}`,
        id: trip.id,
        service: trip.service,
        departure: trip.departure,
        destination: trip.destination,
        scheduledDateTime: toLocalInput(trip.scheduledDateTime),
        passengers: String(trip.passengers ?? 1),
        luggage: String(trip.luggage ?? 0),
        note: trip.note || '',
        estimatedPrice: trip.estimatedPrice || '',
        bookingId: trip.bookingId ?? null,
    }
}

interface QuoteDetailModalProps {
    isOpen: boolean
    onClose: () => void
    quote: Quote | null
    onUpdate: () => void
}

const fieldLabel: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1F5245', marginBottom: '8px',
}
const smallLabel: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--font-mono)', fontSize: '8.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E6A63', marginBottom: '4px',
}
const smallInput: React.CSSProperties = {
    width: '100%', height: '34px', padding: '0 10px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '12.5px', color: '#12100E',
}

export function QuoteDetailModal({ isOpen, onClose, quote, onUpdate }: QuoteDetailModalProps) {
    const { notifications, showSuccess, showWarning, showError, removeNotification } = useNotification()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [estimatedPrice, setEstimatedPrice] = useState("")
    const [adminNotes, setAdminNotes] = useState("")
    const [status, setStatus] = useState<QuoteStatus>('pending')
    // Prix ligne par ligne : le client demande explicitement le tarif de chaque
    // trajet. Le total du devis suit la somme des lignes tant que l'admin n'a
    // pas saisi lui-meme un montant global (remise, forfait sejour).
    const [trips, setTrips] = useState<TripDraft[]>([])
    const [priceTouched, setPriceTouched] = useState(false)
    // Champs qui n'existent que sur le document officiel : ils ne sont pas
    // demandes au client dans le formulaire public.
    const [documentObject, setDocumentObject] = useState("")
    const [validUntil, setValidUntil] = useState("")
    const [customerAddress, setCustomerAddress] = useState("")
    const [customerNinea, setCustomerNinea] = useState("")
    const [taxRate, setTaxRate] = useState(String(DEFAULT_TAX_RATE))

    // Facture : une seule par devis, émise explicitement par l'admin.
    const [invoice, setInvoice] = useState<LinkedInvoice | null>(null)
    const [showInvoiceForm, setShowInvoiceForm] = useState(false)
    const [invoiceTaxRate, setInvoiceTaxRate] = useState(String(DEFAULT_TAX_RATE))
    const [invoiceDueDays, setInvoiceDueDays] = useState('30')
    const [invoiceNotes, setInvoiceNotes] = useState('')

    const loadInvoice = useCallback(async (quoteId: number) => {
        try {
            const response = await fetch(`/api/quotes/${quoteId}/invoice`, { cache: 'no-store' })
            if (!response.ok) return
            const data = await response.json()
            setInvoice(data.invoice ?? null)
        } catch {
            // L'absence d'information sur la facture ne doit pas bloquer le chiffrage.
        }
    }, [])

    useEffect(() => {
        if (quote) {
            const rate = quote.taxRate ? String(parseFloat(quote.taxRate)) : String(DEFAULT_TAX_RATE)
            setEstimatedPrice(quote.estimatedPrice || "")
            setAdminNotes(quote.adminNotes || "")
            setStatus(quote.status)
            setPriceTouched(false)
            setTrips((quote.trips ?? []).map(toDraft))
            setDocumentObject(quote.documentObject || DEFAULT_QUOTE_OBJECT)
            setValidUntil(quote.validUntil ? quote.validUntil.slice(0, 10) : defaultValidUntil())
            setCustomerAddress(quote.customerAddress || "")
            setCustomerNinea(quote.customerNinea || "")
            setTaxRate(rate)
            setInvoiceTaxRate(rate)
            setInvoiceDueDays('30')
            setInvoiceNotes('')
            setShowInvoiceForm(false)
            setInvoice(null)
            loadInvoice(quote.id)
        }
    }, [quote, loadInvoice])

    const tripsTotal = trips.reduce((sum, trip) => {
        const value = parseFloat(trip.estimatedPrice || "")
        return Number.isNaN(value) ? sum : sum + value
    }, 0)

    // Montant effectivement envoye au client : la somme des lignes prime tant
    // que le champ global n'a pas ete modifie a la main.
    const effectivePrice = trips.length > 0 && !priceTouched
        ? (tripsTotal > 0 ? String(tripsTotal) : "")
        : estimatedPrice

    const rateValue = parseFloat(taxRate) || 0
    const subtotal = parseFloat(effectivePrice || '0') || 0
    const taxAmount = (subtotal * rateValue) / 100

    if (!isOpen || !quote) return null

    // Une facture émise fige la prestation : ses lignes y sont recopiées et des
    // réservations en découlent déjà.
    const tripsLocked = Boolean(invoice)

    const patchTrip = (key: string, changes: Partial<TripDraft>) =>
        setTrips((prev) => prev.map((trip) => (trip.key === key ? { ...trip, ...changes } : trip)))

    const addTrip = () => {
        if (trips.length >= MAX_QUOTE_TRIPS) {
            showWarning(`Un devis ne peut pas dépasser ${MAX_QUOTE_TRIPS} trajets.`, 'Limite atteinte', { showModal: true })
            return
        }
        const last = trips[trips.length - 1]
        setTrips((prev) => [...prev, {
            key: `new-${Date.now()}-${prev.length}`,
            service: last?.service || quote.service,
            // Enchaînement naturel d'un séjour : on repart d'où le trajet précédent s'arrête.
            departure: last?.destination || '',
            destination: '',
            scheduledDateTime: '',
            passengers: last?.passengers || '1',
            luggage: last?.luggage || '0',
            note: '',
            estimatedPrice: '',
            bookingId: null,
        }])
    }

    const removeTrip = (key: string) => {
        const trip = trips.find((t) => t.key === key)
        if (trip?.bookingId) {
            showWarning('Ce trajet a déjà été converti en réservation : il ne peut plus être retiré du devis.', 'Trajet figé', { showModal: true })
            return
        }
        setTrips((prev) => prev.filter((t) => t.key !== key))
    }

    /** Enregistre sans fermer : le PDF est généré côté serveur depuis la base,
     *  il faut donc que les champs saisis y soient avant de le demander. */
    const persist = async (newStatus?: QuoteStatus): Promise<boolean> => {
        const incomplete = trips.find((trip) => !trip.departure.trim() || !trip.destination.trim())
        if (incomplete) {
            showWarning('Chaque trajet doit avoir un départ et une destination.', 'Trajet incomplet', { showModal: true })
            return false
        }

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/quotes/${quote.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Sans surcharge manuelle, on laisse l'API recalculer le total
                    // a partir des lignes (elle ne le fait que si estimatedPrice
                    // est absent de la requete).
                    ...(trips.length > 0 && !priceTouched ? {} : { estimatedPrice }),
                    // Les trajets ne repartent que s'ils sont encore modifiables :
                    // l'API refuse la liste dès qu'une facture existe.
                    ...(trips.length > 0 && !tripsLocked
                        ? {
                            trips: trips.map((trip) => ({
                                id: trip.id,
                                service: trip.service,
                                departure: trip.departure.trim(),
                                destination: trip.destination.trim(),
                                scheduledDateTime: trip.scheduledDateTime ? new Date(trip.scheduledDateTime).toISOString() : null,
                                passengers: trip.passengers,
                                luggage: trip.luggage,
                                note: trip.note,
                                estimatedPrice: trip.estimatedPrice || null,
                            }))
                        }
                        : {}),
                    adminNotes,
                    status: newStatus || status,
                    taxRate: rateValue,
                    documentObject,
                    validUntil: validUntil || null,
                    customerAddress,
                    customerNinea
                })
            })

            const data = await response.json().catch(() => null)

            if (response.ok) {
                if (newStatus) setStatus(newStatus)
                onUpdate()
                return true
            }
            showError(data?.error || "Erreur lors de la mise à jour", "Erreur", { showModal: true })
            return false
        } catch (error) {
            console.error(error)
            showError("Erreur technique survenue", "Erreur technique", { showModal: true })
            return false
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdate = async (newStatus?: QuoteStatus) => {
        if (await persist(newStatus)) onClose()
    }

    /** Changement d'étape sans fermer le modal : l'admin enchaîne souvent. */
    const handleStep = async (next: QuoteStatus) => {
        if (next === status) return
        if (!canTransition(status, next)) return
        if (next === 'sent' && !effectivePrice) {
            showWarning("Veuillez définir un prix avant d'envoyer au client.", "Prix manquant", { showModal: true })
            return
        }
        if (await persist(next)) {
            showSuccess(`Devis passé à « ${QUOTE_STATUS_LABELS[next]} ».`, 'Étape mise à jour')
        }
    }

    const handleSendToClient = () => {
        if (!effectivePrice) {
            showWarning("Veuillez définir un prix avant d'envoyer au client.", "Prix manquant", { showModal: true })
            return
        }
        handleUpdate('sent')
    }

    /** Ouvre le devis officiel, après avoir enregistré les champs du document. */
    const handleOpenDocument = async (download: boolean) => {
        if (!effectivePrice) {
            showWarning("Veuillez définir un prix avant de générer le devis.", "Prix manquant", { showModal: true })
            return
        }
        if (!(await persist())) return
        const suffix = download ? '?download=1' : ''
        window.open(`/api/quotes/${quote.id}/pdf${suffix}`, '_blank')
    }

    /** Émet la facture du devis accepté : accord conclu au téléphone compris. */
    const handleGenerateInvoice = async () => {
        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/quotes/${quote.id}/invoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taxRate: parseFloat(invoiceTaxRate) || 0,
                    dueDays: parseInt(invoiceDueDays, 10) || 30,
                    notes: invoiceNotes || null,
                })
            })
            const data = await response.json().catch(() => null)

            if (response.ok && data?.invoice) {
                setInvoice(data.invoice)
                setShowInvoiceForm(false)
                showSuccess(data.message || 'Facture émise.', 'Facture')
                onUpdate()
                return
            }
            if (data?.invoice) setInvoice(data.invoice)
            showError(data?.error || "Erreur lors de l'émission de la facture", 'Erreur', { showModal: true })
        } catch (error) {
            console.error(error)
            showError('Erreur technique survenue', 'Erreur technique', { showModal: true })
        } finally {
            setIsSubmitting(false)
        }
    }

    const getServiceIcon = (service: string) => {
        const icons: Record<string, React.ReactNode> = {
            transport: <CarProfile weight="fill" />,
            tour: <Binoculars weight="fill" />,
            airport: <AirplaneTilt weight="fill" />,
            vip: <Crown weight="fill" />,
            rental: <User weight="fill" />,
            event: <Confetti weight="fill" />,
            convention: <Buildings weight="fill" />
        }
        return icons[service] || <CarProfile weight="fill" />
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Non définie'
        const date = new Date(dateString)
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    }

    const formatAmount = (value: number) => `${Math.round(value).toLocaleString('fr-FR')} FCFA`

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(18,16,14,.55)' }} onClick={onClose} />

            <NotificationCenter notifications={notifications} onRemove={removeNotification} />

            <div className="relative w-full max-w-4xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', overflow: 'hidden' }}>
                {/* Header */}
                <div className="flex items-center justify-between" style={{ padding: '20px 24px', borderBottom: '1px solid #E2DACD' }}>
                    <div className="flex items-center gap-3">
                        <div style={{ width: '40px', height: '40px', borderRadius: '3px', backgroundColor: 'rgba(31,82,69,.08)', display: 'grid', placeItems: 'center', color: '#1F5245' }}>
                            {getServiceIcon(quote.service)}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#12100E' }}>Détails du devis</h2>
                            <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E6A63' }}>
                                #{quote.id.toString().padStart(4, '0')}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ display: 'grid', placeItems: 'center', width: '36px', height: '36px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63' }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Étapes du pipeline : seules les transitions autorisées sont cliquables. */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2DACD', backgroundColor: '#F7F3EC' }}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            {QUOTE_PIPELINE.map((step, index) => {
                                const isCurrent = step === status
                                const reachable = canTransition(status, step)
                                const isDone = QUOTE_PIPELINE.indexOf(status) > index
                                return (
                                    <React.Fragment key={step}>
                                        {index > 0 && <span style={{ color: '#C9C0B2', fontSize: '12px' }}>→</span>}
                                        <button
                                            type="button"
                                            onClick={() => handleStep(step)}
                                            disabled={isSubmitting || isCurrent || !reachable}
                                            title={reachable || isCurrent ? undefined : `Transition impossible depuis « ${QUOTE_STATUS_LABELS[status]} »`}
                                            style={{
                                                fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                                                padding: '8px 12px', borderRadius: '3px',
                                                backgroundColor: isCurrent ? '#1F5245' : isDone ? 'rgba(31,82,69,.10)' : '#FFFFFF',
                                                color: isCurrent ? '#FFFFFF' : reachable ? '#1F5245' : '#9a938a',
                                                border: `1px solid ${isCurrent ? '#1F5245' : '#E2DACD'}`,
                                                cursor: isCurrent || !reachable ? 'default' : 'pointer',
                                            }}
                                        >
                                            {QUOTE_STATUS_LABELS[step]}
                                        </button>
                                    </React.Fragment>
                                )
                            })}
                        </div>
                        <div className="flex items-center gap-2">
                            {(['rejected', 'expired'] as QuoteStatus[]).map((step) => (
                                canTransition(status, step) && step !== status ? (
                                    <button
                                        key={step}
                                        type="button"
                                        onClick={() => handleStep(step)}
                                        disabled={isSubmitting}
                                        style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 12px', borderRadius: '3px', backgroundColor: '#FFFFFF', border: '1px solid rgba(184,73,60,.3)', color: '#B8493C', cursor: 'pointer' }}
                                    >
                                        {QUOTE_STATUS_LABELS[step]}
                                    </button>
                                ) : null
                            ))}
                            <StatusBadge domain="quote" value={status} audience="admin" live={status === 'in_progress'} />
                        </div>
                    </div>
                </div>

                <div className="dash-scroll" style={{ maxHeight: '62vh', overflowY: 'auto', padding: '24px' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Client Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <section>
                                <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                                    <User size={16} style={{ color: '#1F5245' }} weight="bold" />
                                    <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#12100E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Client</h3>
                                </div>
                                <div style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div className="flex items-center gap-3">
                                        <div style={{ width: '28px', height: '28px', borderRadius: '3px', backgroundColor: 'rgba(31,82,69,.10)', display: 'grid', placeItems: 'center', fontSize: '11px', fontWeight: 600, color: '#1F5245' }}>
                                            {quote.customerName.charAt(0)}
                                        </div>
                                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#12100E' }}>{quote.customerName}</span>
                                    </div>
                                    <div className="flex items-center gap-3" style={{ color: '#6E6A63', fontSize: '13px' }}>
                                        <Envelope size={15} />
                                        <span>{quote.customerEmail || '— aucune adresse'}</span>
                                    </div>
                                    {quote.customerPhone && (
                                        <div className="flex items-center gap-3" style={{ color: '#6E6A63', fontSize: '13px' }}>
                                            <Phone size={15} />
                                            <span>{quote.customerPhone}</span>
                                        </div>
                                    )}
                                    {quote.passengerName && (
                                        <div className="flex items-start gap-3" style={{ color: '#B4643A', fontSize: '13px', paddingTop: '8px', borderTop: '1px solid #E2DACD' }}>
                                            <Users size={15} weight="fill" style={{ marginTop: '2px' }} />
                                            <span>
                                                Voyage pour un tiers : <strong style={{ color: '#12100E' }}>{quote.passengerName}</strong>
                                                {quote.passengerPhone ? ` (${quote.passengerPhone})` : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {trips.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                                        <div className="flex items-center gap-2">
                                            <Path size={16} style={{ color: '#1F5245' }} weight="bold" />
                                            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#12100E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                Trajets ({trips.length})
                                            </h3>
                                        </div>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#1F5245' }}>
                                            Total {tripsTotal.toLocaleString('fr-FR')} FCFA
                                        </span>
                                    </div>

                                    {tripsLocked && (
                                        <p className="flex items-center gap-2" style={{ margin: '0 0 10px', fontSize: '11.5px', color: '#B4643A' }}>
                                            <Lock size={13} weight="fill" />
                                            Facture {invoice?.invoiceNumber} émise : les trajets ne sont plus modifiables.
                                        </p>
                                    )}

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {trips.map((trip, index) => {
                                            const locked = tripsLocked || Boolean(trip.bookingId)
                                            return (
                                                <div key={trip.key} style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px', padding: '12px' }}>
                                                    <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
                                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E6A63' }}>
                                                            Trajet {index + 1}
                                                            {trip.bookingId ? ` · réservation #${trip.bookingId}` : ''}
                                                        </span>
                                                        {locked ? (
                                                            <Lock size={14} style={{ color: '#B4643A' }} weight="fill" />
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeTrip(trip.key)}
                                                                aria-label={`Supprimer le trajet ${index + 1}`}
                                                                style={{ display: 'grid', placeItems: 'center', width: '26px', height: '26px', border: '1px solid rgba(184,73,60,.25)', borderRadius: '3px', backgroundColor: '#FFFFFF', color: '#B8493C', cursor: 'pointer' }}
                                                            >
                                                                <Trash size={13} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {locked ? (
                                                        <>
                                                            <div className="flex items-center gap-2" style={{ fontSize: '12.5px', color: '#12100E', fontWeight: 600 }}>
                                                                <MapPin size={13} weight="fill" style={{ color: '#1F5245' }} />
                                                                {trip.departure}
                                                                <span style={{ color: '#6E6A63', fontWeight: 400 }}>&rarr;</span>
                                                                {trip.destination}
                                                            </div>
                                                            <div style={{ fontSize: '11.5px', color: '#6E6A63', marginTop: '4px' }}>
                                                                {getQuoteServiceLabel(trip.service)} · {trip.passengers} pass. · {trip.luggage} bag.
                                                                {trip.estimatedPrice ? ` · ${parseFloat(trip.estimatedPrice).toLocaleString('fr-FR')} FCFA` : ''}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <label style={smallLabel}>Départ</label>
                                                                    <input
                                                                        type="text"
                                                                        value={trip.departure}
                                                                        onChange={(e) => patchTrip(trip.key, { departure: e.target.value })}
                                                                        placeholder="Ex: AIBD"
                                                                        style={smallInput}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label style={smallLabel}>Destination</label>
                                                                    <input
                                                                        type="text"
                                                                        value={trip.destination}
                                                                        onChange={(e) => patchTrip(trip.key, { destination: e.target.value })}
                                                                        placeholder="Ex: Plateau"
                                                                        style={smallInput}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <label style={smallLabel}>Service</label>
                                                                    <select
                                                                        value={trip.service}
                                                                        onChange={(e) => patchTrip(trip.key, { service: e.target.value })}
                                                                        style={smallInput}
                                                                    >
                                                                        {QUOTE_SERVICES.map((s) => (
                                                                            <option key={s.id} value={s.id}>{s.label}</option>
                                                                        ))}
                                                                        {!QUOTE_SERVICES.some((s) => s.id === trip.service) && (
                                                                            <option value={trip.service}>{getQuoteServiceLabel(trip.service)}</option>
                                                                        )}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label style={smallLabel}>Prise en charge</label>
                                                                    <input
                                                                        type="datetime-local"
                                                                        value={trip.scheduledDateTime}
                                                                        onChange={(e) => patchTrip(trip.key, { scheduledDateTime: e.target.value })}
                                                                        style={{ ...smallInput, fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div>
                                                                    <label style={smallLabel}><Users size={10} style={{ display: 'inline', marginRight: '3px' }} />Passagers</label>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={trip.passengers}
                                                                        onChange={(e) => patchTrip(trip.key, { passengers: e.target.value })}
                                                                        style={{ ...smallInput, fontFamily: 'var(--font-mono)' }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label style={smallLabel}><Suitcase size={10} style={{ display: 'inline', marginRight: '3px' }} />Bagages</label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={trip.luggage}
                                                                        onChange={(e) => patchTrip(trip.key, { luggage: e.target.value })}
                                                                        style={{ ...smallInput, fontFamily: 'var(--font-mono)' }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label style={smallLabel}>Prix (FCFA)</label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={trip.estimatedPrice}
                                                                        onChange={(e) => patchTrip(trip.key, { estimatedPrice: e.target.value })}
                                                                        aria-label={`Prix du trajet ${index + 1}`}
                                                                        style={{ ...smallInput, fontFamily: 'var(--font-mono)' }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label style={smallLabel}>Note</label>
                                                                <input
                                                                    type="text"
                                                                    value={trip.note}
                                                                    onChange={(e) => patchTrip(trip.key, { note: e.target.value })}
                                                                    placeholder="Siège bébé, vol AF718..."
                                                                    style={smallInput}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {!tripsLocked && (
                                        <button
                                            type="button"
                                            onClick={addTrip}
                                            className="flex items-center justify-center gap-2"
                                            style={{ width: '100%', marginTop: '10px', height: '38px', backgroundColor: '#FFFFFF', border: '1px dashed #E2DACD', borderRadius: '3px', color: '#1F5245', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                                        >
                                            <Plus size={14} weight="bold" />
                                            Ajouter un trajet
                                        </button>
                                    )}
                                </section>
                            )}

                            <section>
                                <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                                    <Tag size={16} style={{ color: '#1F5245' }} weight="bold" />
                                    <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#12100E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prestation</h3>
                                </div>
                                <div style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div className="flex justify-between">
                                        <span style={{ fontSize: '12px', color: '#6E6A63' }}>Service</span>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#12100E' }}>{getQuoteServiceLabel(quote.service)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ fontSize: '12px', color: '#6E6A63' }}>Date souhaitée</span>
                                        <div className="flex items-center gap-1.5" style={{ fontSize: '12px', fontWeight: 600, color: '#1F5245' }}>
                                            <Calendar size={13} />
                                            {formatDate(quote.preferredDate)}
                                        </div>
                                    </div>
                                    <div style={{ paddingTop: '6px' }}>
                                        <span style={{ fontSize: '12px', color: '#6E6A63', display: 'block', marginBottom: '4px' }}>Message :</span>
                                        <p style={{ margin: 0, fontSize: '12.5px', color: '#3d3a35', fontStyle: 'italic', lineHeight: 1.5, backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', padding: '10px 12px', whiteSpace: 'pre-line' }}>
                                            &ldquo;{quote.message}&rdquo;
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Admin Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <section>
                                <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                                    <Clock size={16} style={{ color: '#1F5245' }} weight="bold" />
                                    <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#12100E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Chiffrage</h3>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label style={fieldLabel}>
                                                Prix HT (FCFA)
                                                {trips.length > 0 && !priceTouched && (
                                                    <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: '#6E6A63' }}> — somme des trajets</span>
                                                )}
                                            </label>
                                            <div style={{ position: 'relative' }}>
                                                <DollarSign size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1F5245' }} weight="bold" />
                                                <input
                                                    type="number"
                                                    value={effectivePrice}
                                                    onChange={(e) => { setPriceTouched(true); setEstimatedPrice(e.target.value) }}
                                                    placeholder="Ex: 25000"
                                                    style={{ width: '100%', height: '46px', padding: '0 14px 0 40px', border: '1px solid #E2DACD', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '15px', color: '#12100E' }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={fieldLabel}>Régime de TVA</label>
                                            <select
                                                value={taxRate}
                                                onChange={(e) => setTaxRate(e.target.value)}
                                                style={{ width: '100%', height: '46px', padding: '0 12px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13px', color: '#12100E', backgroundColor: '#FFFFFF' }}
                                            >
                                                {TAX_RATE_CHOICES.map((rate) => (
                                                    <option key={rate} value={String(rate)}>
                                                        {rate === 0 ? '0 % — exonéré' : `${rate} %`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Ce que verra le client sur le document. */}
                                    <div style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {[
                                            ['Sous-total HT', formatAmount(subtotal)],
                                            [`TVA (${rateValue} %)`, formatAmount(taxAmount)],
                                        ].map(([label, value]) => (
                                            <div key={label} className="flex justify-between" style={{ fontSize: '12px', color: '#6E6A63' }}>
                                                <span>{label}</span>
                                                <span style={{ fontFamily: 'var(--font-mono)', color: '#12100E' }}>{value}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between" style={{ paddingTop: '6px', borderTop: '1px solid #E2DACD', fontSize: '13px', fontWeight: 600, color: '#1F5245' }}>
                                            <span>{rateValue === 0 ? 'Total à payer' : 'Total TTC'}</span>
                                            <span style={{ fontFamily: 'var(--font-mono)' }}>{formatAmount(subtotal + taxAmount)}</span>
                                        </div>
                                        {rateValue === 0 && (
                                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#B4643A' }}>
                                                La mention « TVA non applicable » sera ajoutée au devis et à la facture.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label style={fieldLabel}>Notes administrateur</label>
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Détails du chiffrage, options incluses..."
                                            style={{ width: '100%', minHeight: '90px', padding: '12px 14px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13px', color: '#12100E', resize: 'none' }}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                                    <div className="flex items-center gap-2">
                                        <FilePdf size={16} style={{ color: '#1F5245' }} weight="bold" />
                                        <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#12100E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Devis officiel</h3>
                                    </div>
                                    {quote.reference && (
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#1F5245' }}>{quote.reference}</span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label style={fieldLabel}>Objet</label>
                                            <input
                                                type="text"
                                                value={documentObject}
                                                onChange={(e) => setDocumentObject(e.target.value)}
                                                placeholder="Transferts chauffeur privé"
                                                style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13px', color: '#12100E' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={fieldLabel}>Valable jusqu&apos;au</label>
                                            <input
                                                type="date"
                                                value={validUntil}
                                                onChange={(e) => setValidUntil(e.target.value)}
                                                style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #E2DACD', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#12100E' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label style={fieldLabel}>Adresse client</label>
                                            <input
                                                type="text"
                                                value={customerAddress}
                                                onChange={(e) => setCustomerAddress(e.target.value)}
                                                placeholder="Dakar, Sénégal"
                                                style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13px', color: '#12100E' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={fieldLabel}>NINEA (société)</label>
                                            <input
                                                type="text"
                                                value={customerNinea}
                                                onChange={(e) => setCustomerNinea(e.target.value)}
                                                placeholder="Facultatif"
                                                style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #E2DACD', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#12100E' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenDocument(false)}
                                            disabled={isSubmitting}
                                            className="flex items-center justify-center gap-2"
                                            style={{ flex: 1, height: '40px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', color: '#12100E', fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
                                        >
                                            <Eye size={16} />
                                            Aperçu
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenDocument(true)}
                                            disabled={isSubmitting}
                                            className="flex items-center justify-center gap-2"
                                            style={{ flex: 1, height: '40px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', color: '#12100E', fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
                                        >
                                            <DownloadSimple size={16} />
                                            Télécharger
                                        </button>
                                    </div>

                                    <p style={{ margin: 0, fontSize: '11.5px', color: '#6E6A63', lineHeight: 1.5 }}>
                                        Le numéro de devis et la date d&apos;émission sont attribués à la première génération, puis ne changent plus.
                                    </p>
                                </div>
                            </section>

                            {/* Facture : visible dès que le devis est accepté. */}
                            <section>
                                <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                                    <div className="flex items-center gap-2">
                                        <Receipt size={16} style={{ color: '#1F5245' }} weight="bold" />
                                        <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#12100E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Facture</h3>
                                    </div>
                                    {invoice && (
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#1F5245' }}>{invoice.invoiceNumber}</span>
                                    )}
                                </div>

                                {invoice ? (
                                    <div style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div className="flex justify-between" style={{ fontSize: '12px', color: '#6E6A63' }}>
                                            <span>Montant {parseFloat(invoice.taxRate) === 0 ? 'à payer' : 'TTC'}</span>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#12100E' }}>
                                                {parseFloat(invoice.totalAmount).toLocaleString('fr-FR')} FCFA
                                            </span>
                                        </div>
                                        <div className="flex justify-between" style={{ fontSize: '12px', color: '#6E6A63' }}>
                                            <span>TVA appliquée</span>
                                            <span style={{ fontFamily: 'var(--font-mono)', color: '#12100E' }}>{parseFloat(invoice.taxRate)} %</span>
                                        </div>
                                        <a
                                            href={`/api/invoices/${invoice.id}/pdf`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2"
                                            style={{ height: '38px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', color: '#12100E', fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                                        >
                                            <FilePdf size={15} weight="bold" />
                                            Ouvrir la facture
                                        </a>
                                    </div>
                                ) : status !== 'accepted' ? (
                                    <p style={{ margin: 0, fontSize: '11.5px', color: '#6E6A63', lineHeight: 1.5 }}>
                                        La facture s&apos;émet une fois le devis accepté — par le client depuis son espace, ou ici après un accord conclu de vive voix.
                                    </p>
                                ) : showInvoiceForm ? (
                                    <div style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label style={smallLabel}>TVA</label>
                                                <select
                                                    value={invoiceTaxRate}
                                                    onChange={(e) => setInvoiceTaxRate(e.target.value)}
                                                    style={smallInput}
                                                >
                                                    {TAX_RATE_CHOICES.map((rate) => (
                                                        <option key={rate} value={String(rate)}>
                                                            {rate === 0 ? '0 % — exonéré' : `${rate} %`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={smallLabel}>Échéance (jours)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="365"
                                                    value={invoiceDueDays}
                                                    onChange={(e) => setInvoiceDueDays(e.target.value)}
                                                    style={{ ...smallInput, fontFamily: 'var(--font-mono)' }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={smallLabel}>Note sur la facture</label>
                                            <input
                                                type="text"
                                                value={invoiceNotes}
                                                onChange={(e) => setInvoiceNotes(e.target.value)}
                                                placeholder="Facultatif, imprimé sur le document"
                                                style={smallInput}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowInvoiceForm(false)}
                                                style={{ flex: 1, height: '38px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleGenerateInvoice}
                                                disabled={isSubmitting}
                                                className="flex items-center justify-center gap-2"
                                                style={{ flex: 2, height: '38px', backgroundColor: '#1F5245', border: 'none', borderRadius: '3px', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
                                            >
                                                <Receipt size={15} weight="fill" />
                                                Émettre
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowInvoiceForm(true)}
                                        disabled={isSubmitting}
                                        className="flex items-center justify-center gap-2"
                                        style={{ width: '100%', height: '40px', backgroundColor: 'rgba(31,82,69,.08)', border: '1px solid rgba(31,82,69,.3)', borderRadius: '3px', color: '#1F5245', fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
                                    >
                                        <Receipt size={16} weight="fill" />
                                        Générer la facture
                                    </button>
                                )}
                            </section>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row gap-3" style={{ padding: '20px 24px', borderTop: '1px solid #E2DACD' }}>
                    <button
                        type="button"
                        onClick={() => handleUpdate()}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2"
                        style={{ flex: 1, height: '48px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', color: '#12100E', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
                    >
                        {isSubmitting ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor: '#E2DACD', borderTopColor: '#1F5245' }} />
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                Sauvegarder
                            </>
                        )}
                    </button>

                    {canTransition(status, 'sent') && (
                        <button
                            type="button"
                            onClick={handleSendToClient}
                            disabled={isSubmitting}
                            className="flex items-center justify-center gap-2"
                            style={{ flex: 1.5, height: '48px', backgroundColor: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
                        >
                            {isSubmitting ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor: 'rgba(255,255,255,.35)', borderTopColor: '#FFFFFF' }} />
                            ) : (
                                <>
                                    <Send size={18} weight="fill" />
                                    Définir prix &amp; envoyer au client
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
