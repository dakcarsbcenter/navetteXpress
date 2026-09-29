"use client"

import React, { useState, useEffect } from "react"
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
    Suitcase
} from "@phosphor-icons/react"
import { useNotification } from "@/hooks/useNotification"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { getQuoteServiceLabel } from "@/lib/quote-services"

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
}

interface Quote {
    id: number
    customerName: string
    customerEmail: string
    customerPhone: string | null
    service: string
    preferredDate: string | null
    message: string
    status: 'pending' | 'in_progress' | 'sent' | 'accepted' | 'rejected' | 'expired'
    adminNotes: string | null
    estimatedPrice: string | null
    assignedTo: string | null
    passengerName?: string | null
    passengerPhone?: string | null
    /** Absent sur les devis anterieurs a la table quote_trips. */
    trips?: QuoteTripView[]
    createdAt: string
    updatedAt: string
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

export function QuoteDetailModal({ isOpen, onClose, quote, onUpdate }: QuoteDetailModalProps) {
    const { notifications, showWarning, showError, removeNotification } = useNotification()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [estimatedPrice, setEstimatedPrice] = useState("")
    const [adminNotes, setAdminNotes] = useState("")
    const [status, setStatus] = useState<Quote['status']>('pending')
    // Prix ligne par ligne : le client demande explicitement le tarif de chaque
    // trajet. Le total du devis suit la somme des lignes tant que l'admin n'a
    // pas saisi lui-meme un montant global (remise, forfait sejour).
    const [tripPrices, setTripPrices] = useState<Record<number, string>>({})
    const [priceTouched, setPriceTouched] = useState(false)

    const trips = quote?.trips ?? []

    useEffect(() => {
        if (quote) {
            setEstimatedPrice(quote.estimatedPrice || "")
            setAdminNotes(quote.adminNotes || "")
            setStatus(quote.status)
            setPriceTouched(false)
            setTripPrices(Object.fromEntries(
                (quote.trips ?? []).map((trip) => [trip.id, trip.estimatedPrice || ""])
            ))
        }
    }, [quote])

    const tripsTotal = trips.reduce((sum, trip) => {
        const value = parseFloat(tripPrices[trip.id] || "")
        return Number.isNaN(value) ? sum : sum + value
    }, 0)

    // Montant effectivement envoye au client : la somme des lignes prime tant
    // que le champ global n'a pas ete modifie a la main.
    const effectivePrice = trips.length > 0 && !priceTouched
        ? (tripsTotal > 0 ? String(tripsTotal) : "")
        : estimatedPrice

    if (!isOpen || !quote) return null

    const handleUpdate = async (newStatus?: Quote['status']) => {
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
                    ...(trips.length > 0
                        ? { trips: trips.map((trip) => ({ id: trip.id, estimatedPrice: tripPrices[trip.id] || null })) }
                        : {}),
                    adminNotes,
                    status: newStatus || status
                })
            })

            if (response.ok) {
                onUpdate()
                onClose()
            } else {
                showError("Erreur lors de la mise à jour", "Erreur", { showModal: true })
            }
        } catch (error) {
            console.error(error)
            showError("Erreur technique survenue", "Erreur technique", { showModal: true })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSendToClient = () => {
        if (!effectivePrice) {
            showWarning("Veuillez définir un prix avant d'envoyer au client.", "Prix manquant", { showModal: true })
            return
        }
        handleUpdate('sent')
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

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(18,16,14,.55)' }} onClick={onClose} />

            <NotificationCenter notifications={notifications} onRemove={removeNotification} />

            <div className="relative w-full max-w-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', overflow: 'hidden' }}>
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

                <div className="dash-scroll" style={{ maxHeight: '65vh', overflowY: 'auto', padding: '24px' }}>
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
                                        <span>{quote.customerEmail}</span>
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
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {trips.map((trip) => (
                                            <div key={trip.id} style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px', padding: '12px' }}>
                                                <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E6A63' }}>
                                                        Trajet {trip.position} - {getQuoteServiceLabel(trip.service)}
                                                    </span>
                                                    <span className="flex items-center gap-2" style={{ fontSize: '11px', color: '#6E6A63' }}>
                                                        <Users size={13} />{trip.passengers}
                                                        <Suitcase size={13} />{trip.luggage}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2" style={{ fontSize: '12.5px', color: '#12100E', fontWeight: 600 }}>
                                                    <MapPin size={13} weight="fill" style={{ color: '#1F5245' }} />
                                                    {trip.departure}
                                                    <span style={{ color: '#6E6A63', fontWeight: 400 }}>&rarr;</span>
                                                    {trip.destination}
                                                </div>
                                                <div style={{ fontSize: '11.5px', color: '#6E6A63', marginTop: '4px' }}>
                                                    <Calendar size={12} style={{ display: 'inline', marginRight: '5px', verticalAlign: '-1px' }} />
                                                    {trip.scheduledDateTime
                                                        ? new Date(trip.scheduledDateTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                        : 'Prise en charge a definir'}
                                                    {trip.note ? ` - ${trip.note}` : ''}
                                                </div>
                                                <div style={{ position: 'relative', marginTop: '10px' }}>
                                                    <DollarSign size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1F5245' }} weight="bold" />
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={tripPrices[trip.id] ?? ''}
                                                        onChange={(e) => setTripPrices((prev) => ({ ...prev, [trip.id]: e.target.value }))}
                                                        placeholder="Prix de ce trajet"
                                                        aria-label={`Prix du trajet ${trip.position}`}
                                                        style={{ width: '100%', height: '38px', padding: '0 12px 0 34px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#12100E' }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
                                        <p style={{ margin: 0, fontSize: '12.5px', color: '#3d3a35', fontStyle: 'italic', lineHeight: 1.5, backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', padding: '10px 12px' }}>
                                            &ldquo;{quote.message}&rdquo;
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Admin Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <section>
                                <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} style={{ color: '#1F5245' }} weight="bold" />
                                        <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#12100E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Statut &amp; prix</h3>
                                    </div>
                                    <StatusBadge domain="quote" value={quote.status} audience="admin" live={quote.status === 'in_progress'} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={fieldLabel}>
                                            Prix proposé (FCFA)
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
                                        <label style={fieldLabel}>Notes administrateur</label>
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Détails du chiffrage, options incluses..."
                                            style={{ width: '100%', minHeight: '120px', padding: '12px 14px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13px', color: '#12100E', resize: 'none' }}
                                        />
                                    </div>
                                </div>
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
                </div>
            </div>
        </div>
    )
}
