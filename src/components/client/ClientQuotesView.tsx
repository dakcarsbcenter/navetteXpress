'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useNotification } from '@/hooks/useNotification'
import { NotificationCenter } from '@/components/ui/NotificationCenter'
import { FileText, Calendar, Clock, CurrencyDollar, CheckCircle, XCircle, ChatCircle, Eye, MagnifyingGlass, Plus, CaretRight, Tag, ClipboardText } from "@phosphor-icons/react"
import Link from 'next/link'

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
  clientNotes: string | null
  estimatedPrice: string | null
  assignedTo: string | null
  createdAt: string
  updatedAt: string
}

export function ClientQuotesView() {
  const { data: session } = useSession()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [showActionModal, setShowActionModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ action: string, quoteId: number } | null>(null)
  const { notifications, showError, showSuccess, removeNotification } = useNotification()

  useEffect(() => {
    if (session?.user?.email) {
      fetchQuotes()
    }
  }, [session])

  const fetchQuotes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/quotes/client?email=${encodeURIComponent(session?.user?.email || '')}`)
      const result = await response.json()

      if (result.success) {
        setQuotes(result.data)
      } else {
        showError('Erreur lors du chargement de vos devis')
      }
    } catch (error) {
      showError('Erreur de connexion lors du chargement des devis')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'En attente', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={12} /> }
      case 'in_progress':
        return { label: 'En traitement', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: <MagnifyingGlass size={12} /> }
      case 'sent':
        return { label: 'Proposition reçue', color: 'var(--color-client-accent)', bg: 'rgba(16,185,129,0.1)', icon: <Tag size={12} /> }
      case 'accepted':
        return { label: 'Accepté', color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle size={12} /> }
      case 'rejected':
        return { label: 'Refusé', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: <XCircle size={12} /> }
      case 'expired':
        return { label: 'Expiré', color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: <Clock size={12} /> }
      default:
        return { label: status, color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: <Clock size={12} /> }
    }
  }

  const handleQuoteAction = async (action: string, quoteId: number, message: string = '') => {
    try {
      setIsProcessing(true)
      const response = await fetch('/api/quotes/client/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId, action, message })
      })

      const result = await response.json()

      if (result.success) {
        setQuotes(prev => prev.map(quote =>
          quote.id === quoteId ? { ...quote, status: result.newStatus as any } : quote
        ))

        if (selectedQuote?.id === quoteId) {
          setSelectedQuote(prev => prev ? { ...prev, status: result.newStatus as any } : null)
        }

        const actionLabels = { accept: 'accepté', reject: 'rejeté', negotiate: 'marqué pour négociation' }
        showSuccess(`Devis ${actionLabels[action as keyof typeof actionLabels]} avec succès`)
        setShowActionModal(false)
        setActionMessage('')
        setPendingAction(null)
      } else {
        showError(result.error || 'Erreur lors de l\'action')
      }
    } catch (error) {
      showError('Erreur de connexion')
    } finally {
      setIsProcessing(false)
    }
  }

  const openActionModal = (action: string, quoteId: number) => {
    setPendingAction({ action, quoteId })
    setShowActionModal(true)
    setActionMessage('')
  }

  const confirmAction = () => {
    if (pendingAction) {
      handleQuoteAction(pendingAction.action, pendingAction.quoteId, actionMessage)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-[var(--color-client-accent)] animate-spin mb-4" />
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Chargement de vos devis...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Premium */}
      <div className="client-card-enter relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #111E1A 0%, var(--color-client-card) 60%)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, var(--color-client-accent), transparent)' }} />
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-[var(--color-client-accent-bg)] rounded-2xl flex items-center justify-center shadow-lg border border-[var(--color-client-accent-glow)]">
                <FileText size={28} weight="duotone" style={{ color: 'var(--color-client-accent)' }} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#ffffff' }}>Mes Devis</h1>
                <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Gérez vos demandes de transport personnalisé et suivez vos propositions de prix.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center px-6 py-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>{quotes.length}</div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>Total</div>
              </div>
              <div className="text-center px-6 py-3 bg-[var(--color-client-accent-bg)] rounded-xl border border-[var(--color-client-accent-glow)]">
                <div className="text-2xl font-bold" style={{ color: 'var(--color-client-accent)' }}>{quotes.filter(q => q.status === 'accepted').length}</div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-client-accent)' }}>Acceptés</div>
              </div>
              <div className="text-center px-6 py-3 bg-[var(--color-client-accent-bg)] rounded-xl border border-[var(--color-client-accent-glow)]">
                <div className="text-2xl font-bold" style={{ color: 'var(--color-client-accent)' }}>{quotes.filter(q => q.status === 'accepted').length}</div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-client-accent)' }}>Acceptés</div>
              </div>
              <Link href="/quote-request"
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                style={{ backgroundColor: 'var(--color-client-accent)', color: '#000' }}>
                <Plus size={16} weight="bold" /> Nouvelle demande
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des devis */}
      {quotes.length === 0 ? (
        <div className="client-card-enter text-center py-20 px-6 rounded-2xl"
          style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-client-border)' }}>
            <FileText size={40} weight="light" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: '#ffffff' }}>Aucun devis pour le moment</h3>
          <p className="text-sm font-medium max-w-sm mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Dès que vous effectuerez une demande de devis personnalisé, elle apparaîtra ici avec son statut en temps réel.
          </p>
          <Link href="/quote-request"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all"
            style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)', border: '1px solid var(--color-client-accent-glow)' }}>
            Demander un devis
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quotes.map((quote) => {
            const config = getStatusConfig(quote.status)
            return (
              <div key={quote.id} className="client-card-enter group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border border-white/[0.05]"
                        style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--color-text-primary)' }}>
                        <ClipboardText size={24} weight="duotone" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg" style={{ color: '#ffffff' }}>
                          Devis <span style={{ fontFamily: 'var(--font-mono)' }}>#{quote.id}</span>
                        </h3>
                        <p className="text-xs font-medium uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-client-accent)' }}>
                          {quote.service}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: config.bg, color: config.color, border: `1px solid ${config.color}20` }}>
                      {config.icon}
                      {config.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3.5 rounded-xl border border-white/[0.03]" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Date souhaitée</p>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} style={{ color: 'var(--color-client-accent)' }} />
                          <span className="text-sm font-semibold" style={{ color: '#ffffff' }}>
                          {quote.preferredDate ? new Date(quote.preferredDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'À définir'}
                        </span>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-white/[0.03]" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Prix estimé</p>
                        <div className="flex items-center gap-2">
                          <Tag size={14} style={{ color: 'var(--color-client-accent)' }} />
                          <span className="text-sm font-bold" style={{ color: quote.estimatedPrice ? '#ffffff' : 'rgba(255,255,255,0.45)' }}>
                          {quote.estimatedPrice ? `${parseFloat(quote.estimatedPrice).toLocaleString('fr-FR')} FCFA` : 'En attente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Détails de la demande</p>
                    <p className="text-sm font-medium leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {quote.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setSelectedQuote(quote); setShowDetails(true) }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all shadow-md group-hover:brightness-110"
                      style={{ backgroundColor: 'var(--color-client-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-client-border)' }}
                    >
                      <Eye size={16} /> Voir les détails
                    </button>

                    {quote.status === 'sent' && (
                      <button
                        onClick={() => openActionModal('accept', quote.id)}
                        disabled={isProcessing}
                        className="px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-[var(--color-client-accent-glow)]"
                        style={{ backgroundColor: 'var(--color-client-accent)', color: '#000' }}
                      >
                        Accepter <CaretRight size={14} weight="bold" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Détails Premium */}
      {showDetails && selectedQuote && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scaleIn"
            style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>

            {/* Modal Header */}
            <div className="p-6 sm:p-8 flex items-center justify-between border-b border-white/[0.05]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-client-accent-bg)] flex items-center justify-center border border-[var(--color-client-accent-glow)]">
                  <FileText size={24} style={{ color: 'var(--color-client-accent)' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    Détails du Devis <span style={{ fontFamily: 'var(--font-mono)' }}>#{selectedQuote.id}</span>
                  </h2>
                  <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Mise à jour le {new Date(selectedQuote.updatedAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <button onClick={() => setShowDetails(false)} className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/[0.05]" style={{ color: 'var(--color-text-secondary)' }}>
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-100px)] custom-scrollbar">
              <div className="space-y-8">
                {/* Status and Price Highlight */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-client-border)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.65)' }}>Statut actuel :</span>
                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                      style={{ backgroundColor: getStatusConfig(selectedQuote.status).bg, color: getStatusConfig(selectedQuote.status).color }}>
                      {getStatusConfig(selectedQuote.status).icon}
                      {getStatusConfig(selectedQuote.status).label}
                    </span>
                  </div>
                  {selectedQuote.estimatedPrice && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.65)' }}>Prix proposé :</span>
                      <span className="text-xl font-black italic" style={{ color: 'var(--color-client-accent)', fontFamily: 'var(--font-mono)' }}>
                        {parseFloat(selectedQuote.estimatedPrice).toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-client-accent)' }}>
                      <Tag size={12} weight="fill" /> Service Demandé
                    </h3>
                    <p className="text-sm font-semibold p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)', color: 'var(--color-text-primary)' }}>
                      {selectedQuote.service}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-client-accent)' }}>
                      <Calendar size={12} weight="fill" /> Date de prestation
                    </h3>
                    <div className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <Calendar size={20} style={{ color: 'var(--color-client-accent)' }} />
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {selectedQuote.preferredDate ? new Date(selectedQuote.preferredDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Non précisé'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-client-accent)' }}>
                    <ChatCircle size={12} weight="fill" /> Détails de la demande
                  </h3>
                  <div className="p-6 rounded-2xl leading-relaxed text-sm font-medium"
                    style={{ backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.8)' }}>
                    {selectedQuote.message}
                  </div>
                </div>

                {selectedQuote.adminNotes && (
                  <div className="p-6 rounded-2xl" style={{ backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)' }}>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-2 text-blue-400">
                      <Tag size={12} weight="fill" /> Note de l'administration
                    </h3>
                    <p className="text-sm leading-relaxed text-blue-100/80">
                      {selectedQuote.adminNotes}
                    </p>
                  </div>
                )}

                {/* Quick Actions Panel */}
                {selectedQuote.status === 'sent' && (
                  <div className="p-8 rounded-3xl space-y-6" style={{ background: 'linear-gradient(to bottom right, rgba(16,185,129,0.05), rgba(16,185,129,0.02))', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <h4 className="font-bold text-center text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      Cette proposition vous convient-elle ?
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button onClick={() => openActionModal('accept', selectedQuote.id)} className="group flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:bg-[var(--color-client-accent-glow)] border border-transparent hover:border-[var(--color-client-accent-glow)]">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                          <CheckCircle size={28} weight="fill" />
                        </div>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Accepter</span>
                      </button>
                      <button onClick={() => openActionModal('negotiate', selectedQuote.id)} className="group flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                          <ChatCircle size={28} weight="fill" />
                        </div>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Négocier</span>
                      </button>
                      <button onClick={() => openActionModal('reject', selectedQuote.id)} className="group flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:bg-red-500/10 border border-transparent hover:border-red-500/20">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                          <XCircle size={28} weight="fill" />
                        </div>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Refuser</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showActionModal && pendingAction && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[70] p-4">
          <div className="rounded-3xl max-w-md w-full p-8 shadow-2xl animate-scaleIn"
            style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
            <div className="text-center mb-8">
              <div className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg"
                style={{
                  backgroundColor: pendingAction.action === 'accept' ? 'rgba(16,185,129,0.1)' : pendingAction.action === 'reject' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                  color: pendingAction.action === 'accept' ? 'var(--color-client-accent)' : pendingAction.action === 'reject' ? '#EF4444' : '#3B82F6',
                  border: `1px solid ${pendingAction.action === 'accept' ? 'var(--color-client-accent-glow)' : pendingAction.action === 'reject' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`
                }}>
                {pendingAction.action === 'accept' && <CheckCircle size={40} weight="duotone" />}
                {pendingAction.action === 'reject' && <XCircle size={40} weight="duotone" />}
                {pendingAction.action === 'negotiate' && <ChatCircle size={40} weight="duotone" />}
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                {pendingAction.action === 'accept' && 'Confirmer l\'acceptation'}
                {pendingAction.action === 'reject' && 'Confirmer le rejet'}
                {pendingAction.action === 'negotiate' && 'Demande de négociation'}
              </h3>
              <p className="text-sm font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {pendingAction.action === 'accept' && 'En confirmant, vous acceptez le prix proposé et les termes du devis.'}
                {pendingAction.action === 'reject' && 'Attention, cette action marquera ce devis comme refusé de votre part.'}
                {pendingAction.action === 'negotiate' && 'Précisez ci-dessous vos attentes ou votre contre-proposition.'}
              </p>
            </div>

            <div className="mb-8">
              <label className="block text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {pendingAction.action === 'accept' ? 'Laissez un petit mot (optionnel)' : 'Votre message'}
              </label>
              <textarea
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                placeholder="Votre message ici..."
                className="w-full px-5 py-4 border rounded-2xl text-sm italic focus:ring-2 focus:ring-[var(--color-client-accent)] focus:border-transparent outline-none transition-all"
                style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-text-primary)' }}
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <button onClick={() => { setShowActionModal(false); setPendingAction(null) }}
                className="flex-1 py-4 rounded-2xl text-sm font-bold transition-all hover:bg-white/[0.05]"
                style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-client-border)' }}>
                Annuler
              </button>
              <button onClick={confirmAction} disabled={isProcessing}
                className="flex-1 py-4 rounded-2xl text-sm font-bold transition-all shadow-lg hover:brightness-110 disabled:opacity-50"
                style={{
                  backgroundColor: pendingAction.action === 'accept' ? 'var(--color-client-accent)' : pendingAction.action === 'reject' ? '#EF4444' : '#3B82F6',
                  color: pendingAction.action === 'accept' ? '#000' : '#FFF'
                }}>
                {isProcessing ? 'Envoi...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationCenter notifications={notifications} onRemove={removeNotification} />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-client-accent); }
      `}</style>
    </div>
  )
}
