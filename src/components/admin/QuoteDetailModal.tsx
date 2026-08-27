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
    Confetti
} from "@phosphor-icons/react"
import { useNotification } from "@/hooks/useNotification"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { StatusBadge } from "@/components/shared/StatusBadge"

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

    useEffect(() => {
        if (quote) {
            setEstimatedPrice(quote.estimatedPrice || "")
            setAdminNotes(quote.adminNotes || "")
            setStatus(quote.status)
        }
    }, [quote])

    if (!isOpen || !quote) return null

    const handleUpdate = async (newStatus?: Quote['status']) => {
        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/quotes/${quote.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    estimatedPrice,
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
        if (!estimatedPrice) {
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
            event: <Confetti weight="fill" />
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
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                                    <Tag size={16} style={{ color: '#1F5245' }} weight="bold" />
                                    <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#12100E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prestation</h3>
                                </div>
                                <div style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div className="flex justify-between">
                                        <span style={{ fontSize: '12px', color: '#6E6A63' }}>Service</span>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#12100E' }}>{quote.service}</span>
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
                                        <label style={fieldLabel}>Prix proposé (FCFA)</label>
                                        <div style={{ position: 'relative' }}>
                                            <DollarSign size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1F5245' }} weight="bold" />
                                            <input
                                                type="number"
                                                value={estimatedPrice}
                                                onChange={(e) => setEstimatedPrice(e.target.value)}
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
