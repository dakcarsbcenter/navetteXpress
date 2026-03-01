"use client"

import React, { useState, useEffect } from "react"
import {
    X,
    User,
    Envelope,
    Phone,
    Calendar,
    ChatCircleText,
    CurrencyDollar as DollarSign,
    PaperPlaneRight as Send,
    Warning as AlertTriangle,
    Clock,
    Tag,
    Note,
    CheckCircle,
    CarProfile,
    AirplaneTilt,
    Binoculars,
    Crown,
    Confetti,
    Download
} from "@phosphor-icons/react"
import { useNotification } from "@/hooks/useNotification"
import { NotificationCenter } from "@/components/ui/NotificationCenter"

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

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; color: string; bg: string }> = {
            pending: { label: 'En attente', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            in_progress: { label: 'Traitement', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            sent: { label: 'Envoyé', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
            accepted: { label: 'Confirmé', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            rejected: { label: 'Refusé', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
            expired: { label: 'Expiré', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' }
        }
        return configs[status] || configs.pending
    }

    const statusConfig = getStatusConfig(quote.status)

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-[#09090B]/90 backdrop-blur-md"
                onClick={onClose}
            />

            <NotificationCenter
                notifications={notifications}
                onRemove={removeNotification}
            />

            <div className="relative w-full max-w-2xl bg-[#12121A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shadow-lg shadow-gold/5">
                            {getServiceIcon(quote.service)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-none">Détails du Devis</h2>
                            <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-widest">#{quote.id.toString().padStart(4, '0')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all hover:bg-white/10"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto p-6 scrollbar-hide">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Client Info */}
                        <div className="space-y-6">
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <User size={18} className="text-gold" weight="bold" />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Client</h3>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-xs font-bold text-gold">
                                            {quote.customerName.charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium text-white">{quote.customerName}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400 text-sm">
                                        <Envelope size={16} />
                                        <span>{quote.customerEmail}</span>
                                    </div>
                                    {quote.customerPhone && (
                                        <div className="flex items-center gap-3 text-slate-400 text-sm">
                                            <Phone size={16} />
                                            <span>{quote.customerPhone}</span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Tag size={18} className="text-gold" weight="bold" />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Prestation</h3>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">Service</span>
                                        <span className="text-xs font-bold text-white">{quote.service}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">Date souhaitée</span>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gold">
                                            <Calendar size={14} />
                                            {formatDate(quote.preferredDate)}
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-xs text-slate-500 mb-1 block">Message :</span>
                                        <p className="text-xs text-slate-300 italic leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                                            "{quote.message}"
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Admin Actions */}
                        <div className="space-y-6">
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Clock size={18} className="text-gold" weight="bold" />
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Statut & Prix</h3>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusConfig.bg} ${statusConfig.color}`}>
                                        {statusConfig.label}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">
                                            Prix proposé (FCFA)
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gold group-focus-within:scale-110 transition-transform">
                                                <DollarSign size={20} weight="bold" />
                                            </div>
                                            <input
                                                type="number"
                                                value={estimatedPrice}
                                                onChange={(e) => setEstimatedPrice(e.target.value)}
                                                placeholder="Ex: 25000"
                                                className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-lg font-mono focus:border-gold/50 outline-none transition-all placeholder:text-slate-700 shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">
                                            Notes Administrateur
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                value={adminNotes}
                                                onChange={(e) => setAdminNotes(e.target.value)}
                                                placeholder="Détails du chiffrage, options incluses..."
                                                className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-gold/50 outline-none transition-all placeholder:text-slate-700 min-h-[120px] resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => handleUpdate()}
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                Sauvegarder
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleSendToClient}
                        disabled={isSubmitting}
                        className="flex-[1.5] px-6 py-4 rounded-2xl bg-gold text-black text-sm font-bold uppercase tracking-widest hover:bg-gold/90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-gold/20 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                        ) : (
                            <>
                                <Send size={20} weight="fill" />
                                Définir prix & Envoyer au client
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
