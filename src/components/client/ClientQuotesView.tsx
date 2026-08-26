'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { toIntlLocale } from '@/lib/intl-locale'
import { useNotification } from '@/hooks/useNotification'
import { NotificationCenter } from '@/components/ui/NotificationCenter'
import { FileText, Calendar, Clock, CheckCircle, XCircle, ChatCircle, Eye, Plus, CaretRight, Tag, ClipboardText, X, MagnifyingGlass } from "@phosphor-icons/react"
import { QuoteRequestForm } from '@/components/client/QuoteRequestForm'

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
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)
  const t = useTranslations('client.quotes')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewQuoteForm, setShowNewQuoteForm] = useState(false)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const fetchQuotes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/quotes/client?email=${encodeURIComponent(session?.user?.email || '')}`)
      const result = await response.json()

      if (result.success) {
        setQuotes(result.data)
      } else {
        showError(t('loadError'))
      }
    } catch (error) {
      showError(t('connectionError'))
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: t('status.pending'), color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={12} /> }
      case 'in_progress':
        return { label: t('status.inProgress'), color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: <MagnifyingGlass size={12} /> }
      case 'sent':
        return { label: t('status.sent'), color: 'var(--color-client-accent)', bg: 'var(--color-client-accent-bg)', icon: <Tag size={12} /> }
      case 'accepted':
        return { label: t('status.accepted'), color: 'var(--color-client-accent)', bg: 'var(--color-client-accent-bg)', icon: <CheckCircle size={12} /> }
      case 'rejected':
        return { label: t('status.rejected'), color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: <XCircle size={12} /> }
      case 'expired':
        return { label: t('status.expired'), color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: <Clock size={12} /> }
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

        const actionLabels: Record<string, string> = {
          accept: t('actionAccepted'),
          reject: t('actionRejected'),
          negotiate: t('actionNegotiated'),
        }
        showSuccess(t('actionSuccess', { action: actionLabels[action] }))
        setShowActionModal(false)
        setActionMessage('')
        setPendingAction(null)
      } else {
        showError(result.error || t('actionError'))
      }
    } catch (error) {
      showError(t('connectionError'))
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
        <p className="text-sm font-medium" style={{ color: 'var(--color-client-text-secondary)' }}>{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Premium */}
      <div className="client-card-enter relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--color-client-accent-bg) 0%, var(--color-client-card) 60%)', border: '1px solid var(--color-client-accent-border)' }}>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, var(--color-client-accent), transparent)' }} />
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0" style={{ backgroundColor: 'var(--color-client-accent-bg)', border: '1px solid var(--color-client-accent-glow)' }}>
                <FileText size={24} weight="duotone" style={{ color: 'var(--color-client-accent)' }} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 truncate" style={{ color: 'var(--color-client-text-primary)' }}>{t('title')}</h1>
                <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--color-client-text-secondary)' }}>
                  {t('subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div className="text-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
                <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-client-text-primary)' }}>{quotes.length}</div>
                <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-client-text-secondary)' }}>{t('total')}</div>
              </div>
              <div className="text-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl" style={{ backgroundColor: 'var(--color-client-accent-bg)', border: '1px solid var(--color-client-accent-glow)' }}>
                <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-client-accent)' }}>{quotes.filter(q => q.status === 'accepted').length}</div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-client-accent)' }}>{t('accepted')}</div>
              </div>
              <button
                onClick={() => setShowNewQuoteForm(true)}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110 min-h-[44px]"
                style={{ backgroundColor: 'var(--color-client-accent)', color: '#fff' }}>
                <Plus size={16} weight="bold" /> {t('newRequest')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des devis */}
      {quotes.length === 0 ? (
        <div className="client-card-enter text-center py-20 px-6 rounded-2xl"
          style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
            <FileText size={40} weight="light" style={{ color: 'var(--color-client-text-secondary)' }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-client-text-primary)' }}>{t('noQuoteYet')}</h3>
          <p className="text-sm font-medium max-w-sm mx-auto mb-8" style={{ color: 'var(--color-client-text-secondary)' }}>
            {t('noQuoteDescription')}
          </p>
          <button
            onClick={() => setShowNewQuoteForm(true)}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all"
            style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)', border: '1px solid var(--color-client-accent-glow)' }}>
            {t('requestQuote')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quotes.map((quote) => {
            const config = getStatusConfig(quote.status)
            return (
              <div key={quote.id} className="client-card-enter group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>

                <div className="px-3 py-3 sm:px-6 sm:py-4">
                  <div className="flex items-start justify-between mb-4 sm:mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-client-surface)', color: 'var(--color-client-text-primary)', border: '1px solid var(--color-client-border)' }}>
                        <ClipboardText size={24} weight="duotone" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg" style={{ color: 'var(--color-client-text-primary)' }}>
                          {t('quoteNumber')} <span style={{ fontFamily: 'var(--font-mono)' }}>#{quote.id}</span>
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
                    <div className="p-3.5 rounded-xl" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('preferredDate')}</p>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} style={{ color: 'var(--color-client-accent)' }} />
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>
                          {quote.preferredDate ? new Date(quote.preferredDate).toLocaleDateString(intlLocale, { day: '2-digit', month: 'short', year: 'numeric' }) : t('toBeDefined')}
                        </span>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('estimatedPrice')}</p>
                      <div className="flex items-center gap-2">
                        <Tag size={14} style={{ color: 'var(--color-client-accent)' }} />
                        <span className="text-sm font-bold" style={{ color: quote.estimatedPrice ? 'var(--color-client-text-primary)' : 'var(--color-client-text-secondary)' }}>
                          {quote.estimatedPrice ? `${parseFloat(quote.estimatedPrice).toLocaleString(intlLocale)} FCFA` : t('awaiting')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-client-text-secondary)' }}>{t('requestDetails')}</p>
                    <p className="text-sm font-medium leading-relaxed line-clamp-2" style={{ color: 'var(--color-client-text-secondary)' }}>
                      {quote.message}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => { setSelectedQuote(quote); setShowDetails(true) }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all shadow-md group-hover:brightness-110 min-h-[44px]"
                      style={{ backgroundColor: 'var(--color-client-surface)', color: 'var(--color-client-text-primary)', border: '1px solid var(--color-client-border)' }}
                    >
                      <Eye size={16} /> {t('viewDetails')}
                    </button>

                    {quote.status === 'sent' && (
                      <button
                        onClick={() => openActionModal('accept', quote.id)}
                        disabled={isProcessing}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg min-h-[44px]"
                        style={{ backgroundColor: 'var(--color-client-accent)', color: '#fff' }}
                      >
                        {t('accept')} <CaretRight size={14} weight="bold" />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="rounded-3xl shadow-2xl w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden animate-scaleIn"
            style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>

            {/* Modal Header */}
            <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-client-border)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-accent-bg)', border: '1px solid var(--color-client-accent-glow)' }}>
                  <FileText size={24} style={{ color: 'var(--color-client-accent)' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--color-client-text-primary)' }}>
                    {t('detailsModalTitle')} <span style={{ fontFamily: 'var(--font-mono)' }}>#{selectedQuote.id}</span>
                  </h2>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-client-text-secondary)' }}>{t('updatedOn')} {new Date(selectedQuote.updatedAt).toLocaleDateString(intlLocale)}</p>
                </div>
              </div>
              <button onClick={() => setShowDetails(false)} className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ color: 'var(--color-client-text-secondary)' }}>
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(90vh-100px)] custom-scrollbar">
              <div className="space-y-8">
                {/* Status and Price Highlight */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl"
                  style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-client-text-secondary)' }}>{t('currentStatus')}</span>
                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                      style={{ backgroundColor: getStatusConfig(selectedQuote.status).bg, color: getStatusConfig(selectedQuote.status).color }}>
                      {getStatusConfig(selectedQuote.status).icon}
                      {getStatusConfig(selectedQuote.status).label}
                    </span>
                  </div>
                  {selectedQuote.estimatedPrice && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-client-text-secondary)' }}>{t('proposedPrice')}</span>
                      <span className="text-xl font-black italic" style={{ color: 'var(--color-client-accent)', fontFamily: 'var(--font-mono)' }}>
                        {parseFloat(selectedQuote.estimatedPrice).toLocaleString(intlLocale)} FCFA
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-client-accent)' }}>
                      <Tag size={12} weight="fill" /> {t('serviceRequested')}
                    </h3>
                    <p className="text-sm font-semibold p-4 rounded-xl" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}>
                      {selectedQuote.service}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-client-accent)' }}>
                      <Calendar size={12} weight="fill" /> {t('serviceDate')}
                    </h3>
                    <div className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                      <Calendar size={20} style={{ color: 'var(--color-client-accent)' }} />
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>
                        {selectedQuote.preferredDate ? new Date(selectedQuote.preferredDate).toLocaleDateString(intlLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : t('notSpecified')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-client-accent)' }}>
                    <ChatCircle size={12} weight="fill" /> {t('requestDetails')}
                  </h3>
                  <div className="p-6 rounded-2xl leading-relaxed text-sm font-medium"
                    style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-secondary)' }}>
                    {selectedQuote.message}
                  </div>
                </div>

                {selectedQuote.adminNotes && (
                  <div className="p-6 rounded-2xl" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-2" style={{ color: '#3B82F6' }}>
                      <Tag size={12} weight="fill" /> {t('adminNote')}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-client-text-secondary)' }}>
                      {selectedQuote.adminNotes}
                    </p>
                  </div>
                )}

                {/* Quick Actions Panel */}
                {selectedQuote.status === 'sent' && (
                  <div className="p-8 rounded-3xl space-y-6" style={{ background: 'linear-gradient(to bottom right, var(--color-client-accent-bg), transparent)', border: '1px solid var(--color-client-accent-border)' }}>
                    <h4 className="font-bold text-center text-sm" style={{ color: 'var(--color-client-text-primary)' }}>
                      {t('doesThisWorkForYou')}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button onClick={() => openActionModal('accept', selectedQuote.id)} className="group flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border border-transparent hover:border-[var(--color-client-accent-glow)]" style={{ backgroundColor: 'transparent' }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)' }}>
                          <CheckCircle size={28} weight="fill" />
                        </div>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-client-text-primary)' }}>{t('accept')}</span>
                      </button>
                      <button onClick={() => openActionModal('negotiate', selectedQuote.id)} className="group flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border border-transparent hover:border-blue-500/20">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                          <ChatCircle size={28} weight="fill" />
                        </div>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-client-text-primary)' }}>{t('negotiate')}</span>
                      </button>
                      <button onClick={() => openActionModal('reject', selectedQuote.id)} className="group flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border border-transparent hover:border-red-500/20">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                          <XCircle size={28} weight="fill" />
                        </div>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-client-text-primary)' }}>{t('reject')}</span>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[70] p-4">
          <div className="rounded-3xl w-[95vw] max-w-md p-4 sm:p-6 lg:p-8 shadow-2xl animate-scaleIn"
            style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
            <div className="text-center mb-8">
              <div className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg"
                style={{
                  backgroundColor: pendingAction.action === 'accept' ? 'var(--color-client-accent-bg)' : pendingAction.action === 'reject' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                  color: pendingAction.action === 'accept' ? 'var(--color-client-accent)' : pendingAction.action === 'reject' ? '#EF4444' : '#3B82F6',
                  border: `1px solid ${pendingAction.action === 'accept' ? 'var(--color-client-accent-border)' : pendingAction.action === 'reject' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`
                }}>
                {pendingAction.action === 'accept' && <CheckCircle size={40} weight="duotone" />}
                {pendingAction.action === 'reject' && <XCircle size={40} weight="duotone" />}
                {pendingAction.action === 'negotiate' && <ChatCircle size={40} weight="duotone" />}
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-client-text-primary)' }}>
                {pendingAction.action === 'accept' && t('confirmAccept')}
                {pendingAction.action === 'reject' && t('confirmReject')}
                {pendingAction.action === 'negotiate' && t('negotiateRequest')}
              </h3>
              <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--color-client-text-secondary)' }}>
                {pendingAction.action === 'accept' && t('acceptDescription')}
                {pendingAction.action === 'reject' && t('rejectDescription')}
                {pendingAction.action === 'negotiate' && t('negotiateDescription')}
              </p>
            </div>

            <div className="mb-8">
              <label className="block text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: 'var(--color-client-text-secondary)' }}>
                {pendingAction.action === 'accept' ? t('optionalNote') : t('yourMessage')}
              </label>
              <textarea
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                placeholder={t('messagePlaceholder')}
                className="w-full px-5 py-4 border rounded-2xl text-sm italic focus:ring-2 focus:ring-[var(--color-client-accent)] focus:border-transparent outline-none transition-all"
                style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <button onClick={() => { setShowActionModal(false); setPendingAction(null) }}
                className="flex-1 py-4 rounded-2xl text-sm font-bold transition-all"
                style={{ color: 'var(--color-client-text-secondary)', border: '1px solid var(--color-client-border)' }}>
                {t('cancel')}
              </button>
              <button onClick={confirmAction} disabled={isProcessing}
                className="flex-1 py-4 rounded-2xl text-sm font-bold transition-all shadow-lg hover:brightness-110 disabled:opacity-50"
                style={{
                  backgroundColor: pendingAction.action === 'accept' ? 'var(--color-client-accent)' : pendingAction.action === 'reject' ? '#EF4444' : '#3B82F6',
                  color: '#fff'
                }}>
                {isProcessing ? t('sending') : t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal formulaire nouveau devis */}
      {showNewQuoteForm && (
        <div className="fixed inset-0 z-[80] flex flex-col" style={{ backgroundColor: 'var(--color-client-bg)' }}>
          <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--color-client-border)', backgroundColor: 'var(--color-client-card)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)' }}>
                <FileText size={16} weight="duotone" />
              </div>
              <h2 className="text-base font-bold" style={{ color: 'var(--color-client-text-primary)' }}>{t('newQuoteModalTitle')}</h2>
            </div>
            <button
              onClick={() => setShowNewQuoteForm(false)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-black/5"
              style={{ color: 'var(--color-client-text-secondary)' }}
            >
              <X size={18} weight="bold" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <QuoteRequestForm onClose={() => { setShowNewQuoteForm(false); fetchQuotes() }} />
          </div>
        </div>
      )}

      <NotificationCenter notifications={notifications} onRemove={removeNotification} />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-client-border); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-client-accent); }
      `}</style>
    </div>
  )
}
