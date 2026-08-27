"use client"

import { useState, useEffect } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toIntlLocale } from "@/lib/intl-locale"
import { ConfirmationModal } from "@/components/ui/ConfirmationModal"
import { StatusBadge } from "@/components/shared/StatusBadge"
import {
    X,
    MapPin,
    Calendar,
    Clock,
    Phone,
    Note,
    PencilSimple,
    CheckCircle,
    Car,
    Wallet,
    Info
} from "@phosphor-icons/react"

interface Booking {
    id: number
    customerName: string
    customerEmail: string
    customerPhone?: string
    pickupAddress: string
    dropoffAddress: string
    scheduledDateTime: string
    status: string
    price?: string
    notes?: string
    createdAt: string
    priceProposedAt?: string
    clientResponse?: string
    clientResponseAt?: string
    clientResponseMessage?: string
}

interface BookingDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    booking: Booking | null
    onSuccess: () => void
}

export function BookingDetailsModal({ isOpen, onClose, booking, onSuccess }: BookingDetailsModalProps) {
    const locale = useLocale()
    const intlLocale = toIntlLocale(locale)
    const t = useTranslations('client.bookingDetails')
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        pickupAddress: '',
        dropoffAddress: '',
        scheduledDateTime: '',
        customerPhone: '',
        notes: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorModal, setErrorModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' })
    const [successModal, setSuccessModal] = useState(false)

    useEffect(() => {
        if (booking && isOpen) {
            const dateTime = new Date(booking.scheduledDateTime)
            const localDateTime = new Date(dateTime.getTime() - dateTime.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16)

            setFormData({
                pickupAddress: booking.pickupAddress || '',
                dropoffAddress: booking.dropoffAddress || '',
                scheduledDateTime: localDateTime,
                customerPhone: booking.customerPhone || '',
                notes: booking.notes || ''
            })
            setIsEditing(false)
        }
    }, [booking, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!booking) return
        setIsSubmitting(true)

        try {
            const response = await fetch(`/api/client/bookings/${booking.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pickupAddress: formData.pickupAddress,
                    dropoffAddress: formData.dropoffAddress,
                    scheduledDateTime: new Date(formData.scheduledDateTime).toISOString(),
                    customerPhone: formData.customerPhone,
                    notes: formData.notes
                }),
            })

            const result = await response.json()
            if (result.success) {
                setIsSubmitting(false)
                setSuccessModal(true)
            } else {
                setIsSubmitting(false)
                setErrorModal({
                    open: true,
                    message: result.error || t('updateError')
                })
            }
        } catch (error) {
            console.error('Erreur:', error)
            setIsSubmitting(false)
            setErrorModal({ open: true, message: t('genericError') })
        }
    }

    if (!isOpen || !booking) return null

    const canEdit = !['confirmed', 'in_progress', 'completed', 'cancelled'].includes(booking.status)

    return (
        <>
            <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:py-12 flex items-center justify-center">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-4xl shadow-2xl transition-all animate-scaleIn flex flex-col max-h-[90vh]"
                    style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>

                    {/* Header */}
                    <div className="h-32 w-full relative overflow-hidden shrink-0" style={{ background: 'linear-gradient(135deg, var(--color-client-accent-bg) 0%, transparent 100%)' }}>
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full transition-all z-10"
                            style={{ backgroundColor: 'var(--color-client-surface)', color: 'var(--color-client-text-secondary)' }}
                        >
                            <X size={20} weight="bold" />
                        </button>

                        <div className="absolute bottom-6 left-8 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-accent)' }}>
                                <Car size={28} weight="duotone" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold leading-tight" style={{ color: 'var(--color-client-text-primary)' }}>
                                    {t('bookingNumber')} <span style={{ color: 'var(--color-client-accent)' }}>#{booking.id}</span>
                                </h3>
                                <div className="mt-1">
                                    <StatusBadge domain="booking" value={booking.status} audience="client" live={booking.status === 'in_progress'} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 pt-6">
                        {!isEditing ? (
                            <div className="space-y-8 animate-fadeIn">

                                {/* Route Visualization */}
                                <div className="relative grid grid-cols-1 gap-6">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center gap-1 shrink-0">
                                            <div className="w-5 h-5 rounded-full border-4 z-10" style={{ borderColor: 'var(--color-client-accent)', backgroundColor: 'var(--color-client-card)' }} />
                                            <div className="w-0.5 flex-1" style={{ background: 'linear-gradient(to bottom, var(--color-client-accent), transparent)' }} />
                                            <div className="w-5 h-5 rounded-full border-4 z-10" style={{ borderColor: 'var(--color-client-accent)', backgroundColor: 'var(--color-client-card)' }} />
                                        </div>
                                        <div className="flex flex-col justify-between py-0.5 gap-8">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-client-accent)' }}>{t('departure')}</p>
                                                <p className="text-base font-medium" style={{ color: 'var(--color-client-text-primary)' }}>{booking.pickupAddress}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-client-accent)' }}>{t('destination')}</p>
                                                <p className="text-base font-medium" style={{ color: 'var(--color-client-text-primary)' }}>{booking.dropoffAddress}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl space-y-1" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                                        <div className="flex items-center gap-2" style={{ color: 'var(--color-client-accent)' }}>
                                            <Calendar size={18} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{t('date')}</span>
                                        </div>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>
                                            {new Date(booking.scheduledDateTime).toLocaleDateString(intlLocale, { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl space-y-1" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                                        <div className="flex items-center gap-2" style={{ color: 'var(--color-client-accent)' }}>
                                            <Clock size={18} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{t('time')}</span>
                                        </div>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>
                                            {new Date(booking.scheduledDateTime).toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Additional Details */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--color-client-text-secondary)' }}>
                                        <Info size={14} /> {t('additionalInfo')}
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {booking.price && (
                                            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-client-accent-bg)', border: '1px solid var(--color-client-accent-border)' }}>
                                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-card)', color: 'var(--color-client-accent)' }}>
                                                    <Wallet size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70" style={{ color: 'var(--color-client-accent)' }}>{t('fare')}</p>
                                                    <p className="text-lg font-bold" style={{ color: 'var(--color-client-text-primary)', fontFamily: 'var(--font-mono)' }}>
                                                        {parseFloat(booking.price).toLocaleString(intlLocale)} FCFA
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-card)', color: 'var(--color-client-text-secondary)' }}>
                                                <Phone size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-client-text-secondary)' }}>{t('contact')}</p>
                                                <p className="text-sm font-medium" style={{ color: 'var(--color-client-text-primary)' }}>{booking.customerPhone || t('notPresent')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {booking.notes && (
                                        <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                                            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--color-client-text-secondary)' }}>
                                                <Note size={18} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{t('notesLabel')}</span>
                                            </div>
                                            <p className="text-sm leading-relaxed italic" style={{ color: 'var(--color-client-text-secondary)' }}>
                                                &ldquo;{booking.notes}&rdquo;
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Status Messages */}
                                {booking.status === 'pending' && (
                                    <div className="p-4 rounded-2xl flex gap-4" style={{ backgroundColor: 'var(--color-client-accent-bg)', border: '1px solid var(--color-client-accent-border)' }}>
                                        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-card)', color: 'var(--color-client-accent)' }}>
                                            <Info size={18} weight="fill" />
                                        </div>
                                        <div>
                                            <p className="text-sm leading-snug" style={{ color: 'var(--color-client-text-secondary)' }}>
                                                {t('pendingMessage')}
                                            </p>
                                            {canEdit && (
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="mt-3 text-xs font-bold flex items-center gap-1 transition-colors"
                                                    style={{ color: 'var(--color-client-accent)' }}
                                                >
                                                    <PencilSimple size={14} /> {t('editInfo')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--color-client-accent)' }}>{t('editDepartureLabel')}</label>
                                        <div className="relative group">
                                            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--color-client-text-secondary)' }} />
                                            <input
                                                type="text"
                                                value={formData.pickupAddress}
                                                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all"
                                                style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                                                placeholder={t('editDeparturePlaceholder')}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--color-client-accent)' }}>{t('editDestinationLabel')}</label>
                                        <div className="relative group">
                                            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--color-client-text-secondary)' }} />
                                            <input
                                                type="text"
                                                value={formData.dropoffAddress}
                                                onChange={(e) => setFormData({ ...formData, dropoffAddress: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all"
                                                style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                                                placeholder={t('editDestinationPlaceholder')}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('editDateTimeLabel')}</label>
                                            <input
                                                type="datetime-local"
                                                value={formData.scheduledDateTime}
                                                onChange={(e) => setFormData({ ...formData, scheduledDateTime: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                                                style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('editContactLabel')}</label>
                                            <input
                                                type="tel"
                                                value={formData.customerPhone}
                                                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                                                style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                                                placeholder={t('editContactPlaceholder')}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('editNotesLabel')}</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl outline-none transition-all min-h-[100px] resize-none"
                                            style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                                            placeholder={t('editNotesPlaceholder')}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 px-6 py-3.5 rounded-xl font-semibold transition-all text-sm"
                                        style={{ border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-[1.5] px-6 py-3.5 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 text-sm"
                                        style={{ backgroundColor: 'var(--color-client-accent)', color: '#fff' }}
                                    >
                                        {isSubmitting ? (
                                            <Clock size={20} className="animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle size={20} weight="bold" /> {t('save')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {!isEditing && (
                        <div className="p-6 sm:p-8 pt-4 shrink-0" style={{ backgroundColor: 'var(--color-client-surface)', borderTop: '1px solid var(--color-client-border)' }}>
                            <div className="flex items-center justify-between gap-4">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 rounded-xl font-semibold transition-all text-sm"
                                    style={{ border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-secondary)' }}
                                >
                                    {t('close')}
                                </button>
                                {canEdit && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 text-sm"
                                        style={{ backgroundColor: 'var(--color-client-accent)', color: '#fff' }}
                                    >
                                        <PencilSimple size={18} /> {t('modify')}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Success Modal */}
            <ConfirmationModal
                isOpen={successModal}
                onClose={() => {
                    setSuccessModal(false)
                    onSuccess()
                    onClose()
                }}
                title={t('updateSuccessTitle')}
                message={t('updateSuccessMessage')}
                type="success"
                confirmText={t('confirmPerfect')}
                onConfirm={() => {
                    setSuccessModal(false)
                    onSuccess()
                    onClose()
                }}
            />

            {/* Error Modal */}
            <ConfirmationModal
                isOpen={errorModal.open}
                onClose={() => setErrorModal({ open: false, message: '' })}
                title={t('errorTitle')}
                message={errorModal.message}
                type="error"
                confirmText={t('retry')}
                onConfirm={() => setErrorModal({ open: false, message: '' })}
            />
        </>
    )
}
