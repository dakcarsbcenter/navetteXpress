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
    XCircle,
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

const cardStyle = { backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px' }
const surfaceStyle = { backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '4px' }
const inputStyle = { backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '4px', color: '#12100E' }

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
    const [isCancelling, setIsCancelling] = useState(false)
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
    const [cancelSuccessOpen, setCancelSuccessOpen] = useState(false)

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

    const handleCancelBooking = async () => {
        if (!booking) return
        setIsCancelling(true)

        try {
            const response = await fetch(`/api/client/bookings/${booking.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' }),
            })

            const result = await response.json()
            setIsCancelling(false)
            setCancelConfirmOpen(false)

            if (result.success) {
                setCancelSuccessOpen(true)
            } else {
                setErrorModal({
                    open: true,
                    message: result.error || t('genericError')
                })
            }
        } catch (error) {
            console.error('Erreur:', error)
            setIsCancelling(false)
            setCancelConfirmOpen(false)
            setErrorModal({ open: true, message: t('genericError') })
        }
    }

    if (!isOpen || !booking) return null

    const canEdit = !['confirmed', 'in_progress', 'completed', 'cancelled'].includes(booking.status)
    const hoursUntilDeparture = (new Date(booking.scheduledDateTime).getTime() - Date.now()) / (1000 * 60 * 60)
    const canCancelBooking = !['cancelled', 'completed', 'in_progress'].includes(booking.status) && hoursUntilDeparture >= 24

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ ...cardStyle, borderRadius: '6px' }}>

                    {/* Header */}
                    <div className="p-4 sm:p-6 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid #E2DACD' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 flex items-center justify-center" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px', color: '#1F5245' }}>
                                <Car size={22} weight="duotone" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold leading-tight" style={{ color: '#12100E' }}>
                                    {t('bookingNumber')} <span style={{ color: '#1F5245' }}>#{booking.id}</span>
                                </h3>
                                <div className="mt-1">
                                    <StatusBadge domain="booking" value={booking.status} audience="client" live={booking.status === 'in_progress'} />
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center"
                            style={{ color: '#6E6A63' }}
                        >
                            <X size={20} weight="bold" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                        {!isEditing ? (
                            <div className="space-y-6">

                                {/* Route Visualization */}
                                <div className="relative grid grid-cols-1 gap-6">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center gap-1 shrink-0">
                                            <div className="w-3 h-3 rounded-full border-2 z-10" style={{ borderColor: '#1F5245', backgroundColor: '#FFFFFF' }} />
                                            <div className="w-0.5 flex-1" style={{ backgroundColor: '#E2DACD' }} />
                                            <div className="w-3 h-3 rounded-full border-2 z-10" style={{ borderColor: '#1F5245', backgroundColor: '#FFFFFF' }} />
                                        </div>
                                        <div className="flex flex-col justify-between py-0.5 gap-8">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#1F5245' }}>{t('departure')}</p>
                                                <p className="text-base font-medium" style={{ color: '#12100E' }}>{booking.pickupAddress}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#1F5245' }}>{t('destination')}</p>
                                                <p className="text-base font-medium" style={{ color: '#12100E' }}>{booking.dropoffAddress}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 space-y-1" style={surfaceStyle}>
                                        <div className="flex items-center gap-2" style={{ color: '#1F5245' }}>
                                            <Calendar size={18} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{t('date')}</span>
                                        </div>
                                        <p className="text-sm font-semibold" style={{ color: '#12100E' }}>
                                            {new Date(booking.scheduledDateTime).toLocaleDateString(intlLocale, { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                    </div>
                                    <div className="p-4 space-y-1" style={surfaceStyle}>
                                        <div className="flex items-center gap-2" style={{ color: '#1F5245' }}>
                                            <Clock size={18} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{t('time')}</span>
                                        </div>
                                        <p className="text-sm font-semibold" style={{ color: '#12100E' }}>
                                            {new Date(booking.scheduledDateTime).toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Additional Details */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: '#6E6A63' }}>
                                        <Info size={14} /> {t('additionalInfo')}
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {booking.price && (
                                            <div className="flex items-center gap-3 p-3" style={{ backgroundColor: 'rgba(31,82,69,.06)', border: '1px solid rgba(31,82,69,.2)', borderRadius: '3px' }}>
                                                <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: '#FFFFFF', color: '#1F5245', borderRadius: '3px' }}>
                                                    <Wallet size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#1F5245' }}>{t('fare')}</p>
                                                    <p className="text-lg font-bold" style={{ color: '#12100E', fontFamily: 'var(--font-mono)' }}>
                                                        {parseFloat(booking.price).toLocaleString(intlLocale)} FCFA
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 p-3" style={surfaceStyle}>
                                            <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: '#FFFFFF', color: '#6E6A63', borderRadius: '3px' }}>
                                                <Phone size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6E6A63' }}>{t('contact')}</p>
                                                <p className="text-sm font-medium" style={{ color: '#12100E' }}>{booking.customerPhone || t('notPresent')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {booking.notes && (
                                        <div className="p-4" style={surfaceStyle}>
                                            <div className="flex items-center gap-2 mb-2" style={{ color: '#6E6A63' }}>
                                                <Note size={18} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{t('notesLabel')}</span>
                                            </div>
                                            <p className="text-sm leading-relaxed italic" style={{ color: '#6E6A63' }}>
                                                &ldquo;{booking.notes}&rdquo;
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Status Messages */}
                                {booking.status === 'pending' && (
                                    <div className="p-4 flex gap-4" style={{ backgroundColor: 'rgba(31,82,69,.06)', border: '1px solid rgba(31,82,69,.2)', borderRadius: '4px' }}>
                                        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFFFFF', color: '#1F5245' }}>
                                            <Info size={18} weight="fill" />
                                        </div>
                                        <div>
                                            <p className="text-sm leading-snug" style={{ color: '#6E6A63' }}>
                                                {t('pendingMessage')}
                                            </p>
                                            {canEdit && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(true)}
                                                    className="mt-3 text-xs font-bold flex items-center gap-1"
                                                    style={{ color: '#1F5245' }}
                                                >
                                                    <PencilSimple size={14} /> {t('editInfo')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#1F5245' }}>{t('editDepartureLabel')}</label>
                                        <div className="relative">
                                            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#6E6A63' }} />
                                            <input
                                                type="text"
                                                value={formData.pickupAddress}
                                                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 outline-none transition-all"
                                                style={inputStyle}
                                                placeholder={t('editDeparturePlaceholder')}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#1F5245' }}>{t('editDestinationLabel')}</label>
                                        <div className="relative">
                                            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#6E6A63' }} />
                                            <input
                                                type="text"
                                                value={formData.dropoffAddress}
                                                onChange={(e) => setFormData({ ...formData, dropoffAddress: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 outline-none transition-all"
                                                style={inputStyle}
                                                placeholder={t('editDestinationPlaceholder')}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#6E6A63' }}>{t('editDateTimeLabel')}</label>
                                            <input
                                                type="datetime-local"
                                                value={formData.scheduledDateTime}
                                                onChange={(e) => setFormData({ ...formData, scheduledDateTime: e.target.value })}
                                                className="w-full px-4 py-3 outline-none transition-all"
                                                style={inputStyle}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#6E6A63' }}>{t('editContactLabel')}</label>
                                            <input
                                                type="tel"
                                                value={formData.customerPhone}
                                                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                                className="w-full px-4 py-3 outline-none transition-all"
                                                style={inputStyle}
                                                placeholder={t('editContactPlaceholder')}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#6E6A63' }}>{t('editNotesLabel')}</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full px-4 py-3 outline-none transition-all min-h-[100px] resize-none"
                                            style={inputStyle}
                                            placeholder={t('editNotesPlaceholder')}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 px-6 py-3 font-semibold transition-all text-sm"
                                        style={{ border: '1px solid #E2DACD', color: '#12100E', borderRadius: '4px' }}
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-[1.5] px-6 py-3 font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                        style={{ backgroundColor: '#1F5245', color: '#fff', border: 'none', borderRadius: '4px' }}
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
                        <div className="p-4 sm:p-6 shrink-0" style={{ backgroundColor: '#F7F3EC', borderTop: '1px solid #E2DACD' }}>
                            <div className="flex items-center justify-between gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 font-semibold transition-all text-sm"
                                    style={{ border: '1px solid #E2DACD', color: '#6E6A63', borderRadius: '4px' }}
                                >
                                    {t('close')}
                                </button>
                                <div className="flex items-center gap-3">
                                    {canCancelBooking && (
                                        <button
                                            type="button"
                                            onClick={() => setCancelConfirmOpen(true)}
                                            className="px-6 py-3 font-semibold transition-all flex items-center gap-2 text-sm"
                                            style={{ border: '1px solid #B8493C', color: '#B8493C', borderRadius: '4px' }}
                                        >
                                            <XCircle size={18} /> {t('cancelBooking')}
                                        </button>
                                    )}
                                    {canEdit && (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(true)}
                                            className="px-6 py-3 font-semibold transition-all flex items-center gap-2 text-sm"
                                            style={{ backgroundColor: '#1F5245', color: '#fff', border: 'none', borderRadius: '4px' }}
                                        >
                                            <PencilSimple size={18} /> {t('modify')}
                                        </button>
                                    )}
                                </div>
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

            {/* Cancel Confirmation Modal */}
            <ConfirmationModal
                isOpen={cancelConfirmOpen}
                onClose={() => !isCancelling && setCancelConfirmOpen(false)}
                title={t('cancelConfirmTitle')}
                message={t('cancelConfirmMessage')}
                type="warning"
                confirmText={isCancelling ? t('cancelling') : t('cancelConfirmYes')}
                onConfirm={handleCancelBooking}
                showCancel={!isCancelling}
                cancelText={t('cancelConfirmNo')}
            />

            {/* Cancel Success Modal */}
            <ConfirmationModal
                isOpen={cancelSuccessOpen}
                onClose={() => {
                    setCancelSuccessOpen(false)
                    onSuccess()
                    onClose()
                }}
                title={t('cancelSuccessTitle')}
                message={t('cancelSuccessMessage')}
                type="success"
                confirmText={t('confirmPerfect')}
                onConfirm={() => {
                    setCancelSuccessOpen(false)
                    onSuccess()
                    onClose()
                }}
            />
        </>
    )
}
