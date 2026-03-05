"use client"

import { useState, useEffect } from "react"
import { ConfirmationModal } from "@/components/ui/ConfirmationModal"
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
    User,
    Wallet,
    ArrowRight,
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
                    message: result.error || 'Erreur lors de la mise à jour'
                })
            }
        } catch (error) {
            console.error('Erreur:', error)
            setIsSubmitting(false)
            setErrorModal({ open: true, message: 'Une erreur est survenue.' })
        }
    }

    if (!isOpen || !booking) return null

    const canEdit = !['confirmed', 'in_progress', 'completed', 'cancelled'].includes(booking.status)

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'var(--color-status-pending)'
            case 'confirmed': return 'var(--color-status-confirmed)'
            case 'in_progress': return 'var(--color-status-inprogress)'
            case 'completed': return 'var(--color-status-completed)'
            case 'cancelled': return 'var(--color-status-cancelled)'
            default: return 'var(--color-text-secondary)'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'En attente'
            case 'confirmed': return 'Confirmée'
            case 'in_progress': return 'En cours'
            case 'completed': return 'Terminée'
            case 'cancelled': return 'Annulée'
            default: return status
        }
    }

    return (
        <>
            <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:py-12 flex items-center justify-center">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-[#000]/80 backdrop-blur-sm transition-opacity animate-fadeIn"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-[2rem] bg-slate-900 border border-white/10 shadow-2xl transition-all animate-scaleIn flex flex-col max-h-[90vh]">

                    {/* Header Image/Pattern */}
                    <div className="h-32 w-full relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 bg-linear-to-br from-red-500/20 to-transparent" />
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23EF4444' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full bg-black/20 text-white/70 hover:text-white hover:bg-black/40 transition-all z-10"
                        >
                            <X size={20} weight="bold" />
                        </button>

                        <div className="absolute bottom-6 left-8 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-red-500">
                                <Car size={28} weight="duotone" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white leading-tight">
                                    Réservation <span className="text-red-500">#{booking.id}</span>
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getStatusColor(booking.status) }} />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                                        {getStatusLabel(booking.status)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-6">
                        {!isEditing ? (
                            <div className="space-y-8 animate-fadeIn">

                                {/* Route Visualization */}
                                <div className="relative grid grid-cols-1 gap-6">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center gap-1 shrink-0">
                                            <div className="w-5 h-5 rounded-full border-4 border-red-500 bg-slate-900 z-10" />
                                            <div className="w-0.5 flex-1 bg-linear-to-b from-red-500 to-red-500/50 border-dashed border-l border-white/20" />
                                            <div className="w-5 h-5 rounded-full border-4 border-red-500 bg-slate-900 z-10" />
                                        </div>
                                        <div className="flex flex-col justify-between py-0.5 gap-8">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Départ</p>
                                                <p className="text-base text-white/90 font-medium">{booking.pickupAddress}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Destination</p>
                                                <p className="text-base text-white/90 font-medium">{booking.dropoffAddress}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                        <div className="flex items-center gap-2 text-red-500">
                                            <Calendar size={18} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Date</span>
                                        </div>
                                        <p className="text-sm font-semibold text-white">
                                            {new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                        <div className="flex items-center gap-2 text-red-500">
                                            <Clock size={18} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Heure</span>
                                        </div>
                                        <p className="text-sm font-semibold text-white">
                                            {new Date(booking.scheduledDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Additional Details */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                                        <Info size={14} /> Informations complémentaires
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {booking.price && (
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                                                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500">
                                                    <Wallet size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 opacity-70">Tarif</p>
                                                    <p className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-mono)' }}>
                                                        {parseFloat(booking.price).toLocaleString('fr-FR')} FCFA
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white/70">
                                                <Phone size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Contact</p>
                                                <p className="text-sm font-medium text-white">{booking.customerPhone || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {booking.notes && (
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-2 mb-2 text-white/40">
                                                <Note size={18} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Notes & Demandes</span>
                                            </div>
                                            <p className="text-sm text-white/70 leading-relaxed italic">
                                                "{booking.notes}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Status Messages */}
                                {booking.status === 'pending' && (
                                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-4">
                                        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                            <Info size={18} weight="fill" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-200/90 leading-snug">
                                                Cette réservation est en attente de traitement. Vous recevrez une notification dès qu'un chauffeur vous sera assigné.
                                            </p>
                                            {canEdit && (
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="mt-3 text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                                                >
                                                    <PencilSimple size={14} /> Modifier mes informations
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
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-red-500 ml-1">Adresse de départ</label>
                                        <div className="relative group">
                                            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-red-500 transition-colors" />
                                            <input
                                                type="text"
                                                value={formData.pickupAddress}
                                                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-red-500/50 focus:bg-white/[0.08] transition-all"
                                                placeholder="Lieu de départ..."
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-red-500 ml-1">Destination</label>
                                        <div className="relative group">
                                            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-red-500 transition-colors" />
                                            <input
                                                type="text"
                                                value={formData.dropoffAddress}
                                                onChange={(e) => setFormData({ ...formData, dropoffAddress: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-red-500/50 focus:bg-white/[0.08] transition-all"
                                                placeholder="Lieu de destination..."
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Date & Heure</label>
                                            <input
                                                type="datetime-local"
                                                value={formData.scheduledDateTime}
                                                onChange={(e) => setFormData({ ...formData, scheduledDateTime: e.target.value })}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-red-500/50 focus:bg-white/[0.08] transition-all [color-scheme:dark]"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Contact</label>
                                            <input
                                                type="tel"
                                                value={formData.customerPhone}
                                                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-red-500/50 focus:bg-white/[0.08] transition-all"
                                                placeholder="Ex: 77 000 00 00"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Notes spécifiques</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-red-500/50 focus:bg-white/[0.08] transition-all min-h-[100px] resize-none"
                                            placeholder="Une précision à apporter ?"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 px-6 py-3.5 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all text-sm"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-[1.5] px-6 py-3.5 rounded-xl bg-red-600 text-white font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 text-sm shadow-lg shadow-red-500/20"
                                    >
                                        {isSubmitting ? (
                                            <Clock size={20} className="animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle size={20} weight="bold" /> Enregistrer les modifications
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {!isEditing && (
                        <div className="p-8 pt-4 pb-8 shrink-0 bg-white/[0.02] border-t border-white/5">
                            <div className="flex items-center justify-between gap-4">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 rounded-xl border border-white/10 text-white/70 font-semibold hover:text-white hover:bg-white/5 transition-all text-sm"
                                >
                                    Fermer
                                </button>
                                {canEdit && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all flex items-center gap-2 text-sm border border-white/10"
                                    >
                                        <PencilSimple size={18} /> Modifier
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
                title="Mise à jour réussie !"
                message="Vos modifications ont été enregistrées avec succès."
                type="success"
                confirmText="Parfait"
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
                title="Oups !"
                message={errorModal.message}
                type="error"
                confirmText="Réessayer"
                onConfirm={() => setErrorModal({ open: false, message: '' })}
            />
        </>
    )
}
