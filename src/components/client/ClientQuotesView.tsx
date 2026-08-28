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

const cardStyle = { backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px' }
const surfaceStyle = { backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px' }

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
        return { label: t('status.pending'), color: '#B4643A', bg: 'rgba(180,100,58,.10)', icon: <Clock size={12} /> }
      case 'in_progress':
        return { label: t('status.inProgress'), color: '#3B82F6', bg: 'rgba(59,130,246,.10)', icon: <MagnifyingGlass size={12} /> }
      case 'sent':
        return { label: t('status.sent'), color: '#1F5245', bg: 'rgba(31,82,69,.10)', icon: <Tag size={12} /> }
      case 'accepted':
        return { label: t('status.accepted'), color: '#1F5245', bg: 'rgba(31,82,69,.10)', icon: <CheckCircle size={12} /> }
      case 'rejected':
        return { label: t('status.rejected'), color: '#B8493C', bg: 'rgba(184,73,60,.10)', icon: <XCircle size={12} /> }
      case 'expired':
        return { label: t('status.expired'), color: '#6E6A63', bg: 'rgba(110,106,99,.10)', icon: <Clock size={12} /> }
      default:
        return { label: status, color: '#6E6A63', bg: 'rgba(110,106,99,.10)', icon: <Clock size={12} /> }
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
        <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#1F5245] animate-spin mb-4" />
        <p className="text-sm font-medium" style={{ color: '#6E6A63' }}>{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ padding: '18px 24px', borderBottom: '1px solid #E2DACD' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#12100E' }}>{t('title')}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6E6A63' }}>{t('subtitle')}</p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <div className="text-center px-3 py-2" style={{ ...surfaceStyle }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#12100E' }}>{quotes.length}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6E6A63' }}>{t('total')}</div>
            </div>
            <div className="text-center px-3 py-2" style={{ backgroundColor: 'rgba(31,82,69,.08)', border: '1px solid rgba(31,82,69,.2)', borderRadius: '3px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1F5245' }}>{quotes.filter(q => q.status === 'accepted').length}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1F5245' }}>{t('accepted')}</div>
            </div>
            <button
              type="button"
              onClick={() => setShowNewQuoteForm(true)}
              className="flex items-center gap-2"
              style={{ height: '40px', padding: '0 16px', background: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={14} weight="bold" /> {t('newRequest')}
            </button>
          </div>
        </div>

        {/* Liste des devis */}
        {quotes.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '4px' }}>
              <FileText size={28} weight="light" style={{ color: '#6E6A63' }} />
            </div>
            <h4 className="text-base font-semibold mb-1" style={{ color: '#12100E' }}>{t('noQuoteYet')}</h4>
            <p className="text-sm max-w-xs mx-auto mb-6" style={{ color: '#6E6A63' }}>
              {t('noQuoteDescription')}
            </p>
            <button
              type="button"
              onClick={() => setShowNewQuoteForm(true)}
              className="inline-flex items-center gap-2"
              style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #1F5245', borderRadius: '4px', color: '#1F5245', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              {t('requestQuote')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-6">
            {quotes.map((quote) => {
              const config = getStatusConfig(quote.status)
              return (
                <div key={quote.id} style={cardStyle}>
                  <div className="px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px' }}>
                          <ClipboardText size={20} weight="duotone" style={{ color: '#12100E' }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base" style={{ color: '#12100E' }}>
                            {t('quoteNumber')} <span style={{ fontFamily: 'var(--font-mono)' }}>#{quote.id}</span>
                          </h3>
                          <p className="text-xs font-medium uppercase tracking-wider mt-0.5" style={{ color: '#1F5245' }}>
                            {quote.service}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shrink-0"
                        style={{ backgroundColor: config.bg, color: config.color, borderRadius: '2px' }}>
                        {config.icon}
                        {config.label}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3" style={surfaceStyle}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6A63' }}>{t('preferredDate')}</p>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} style={{ color: '#1F5245' }} />
                          <span className="text-sm font-semibold" style={{ color: '#12100E' }}>
                            {quote.preferredDate ? new Date(quote.preferredDate).toLocaleDateString(intlLocale, { day: '2-digit', month: 'short', year: 'numeric' }) : t('toBeDefined')}
                          </span>
                        </div>
                      </div>
                      <div className="p-3" style={surfaceStyle}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6A63' }}>{t('estimatedPrice')}</p>
                        <div className="flex items-center gap-2">
                          <Tag size={14} style={{ color: '#1F5245' }} />
                          <span className="text-sm font-bold" style={{ color: quote.estimatedPrice ? '#12100E' : '#6E6A63' }}>
                            {quote.estimatedPrice ? `${parseFloat(quote.estimatedPrice).toLocaleString(intlLocale)} FCFA` : t('awaiting')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#6E6A63' }}>{t('requestDetails')}</p>
                      <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#6E6A63' }}>
                        {quote.message}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => { setSelectedQuote(quote); setShowDetails(true) }}
                        className="flex-1 flex items-center justify-center gap-2 min-h-[40px]"
                        style={{ backgroundColor: '#F7F3EC', color: '#12100E', border: '1px solid #E2DACD', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}
                      >
                        <Eye size={16} /> {t('viewDetails')}
                      </button>

                      {quote.status === 'sent' && (
                        <button
                          type="button"
                          onClick={() => openActionModal('accept', quote.id)}
                          disabled={isProcessing}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[40px]"
                          style={{ padding: '0 20px', background: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
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
      </div>

      {/* Modal Détails */}
      {showDetails && selectedQuote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ ...cardStyle, borderRadius: '6px' }}>

            <div className="p-4 sm:p-6 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid #E2DACD' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px' }}>
                  <FileText size={20} style={{ color: '#1F5245' }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: '#12100E' }}>
                    {t('detailsModalTitle')} <span style={{ fontFamily: 'var(--font-mono)' }}>#{selectedQuote.id}</span>
                  </h2>
                  <p className="text-xs font-medium" style={{ color: '#6E6A63' }}>{t('updatedOn')} {new Date(selectedQuote.updatedAt).toLocaleDateString(intlLocale)}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowDetails(false)} className="w-9 h-9 flex items-center justify-center" style={{ color: '#6E6A63' }}>
                <X size={20} weight="bold" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Statut et prix */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4" style={surfaceStyle}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6E6A63' }}>{t('currentStatus')}</span>
                    <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
                      style={{ backgroundColor: getStatusConfig(selectedQuote.status).bg, color: getStatusConfig(selectedQuote.status).color, borderRadius: '2px' }}>
                      {getStatusConfig(selectedQuote.status).icon}
                      {getStatusConfig(selectedQuote.status).label}
                    </span>
                  </div>
                  {selectedQuote.estimatedPrice && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6E6A63' }}>{t('proposedPrice')}</span>
                      <span className="text-lg font-bold" style={{ color: '#1F5245', fontFamily: 'var(--font-mono)' }}>
                        {parseFloat(selectedQuote.estimatedPrice).toLocaleString(intlLocale)} FCFA
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2" style={{ color: '#1F5245' }}>
                      <Tag size={12} weight="fill" /> {t('serviceRequested')}
                    </h3>
                    <p className="text-sm font-semibold p-3" style={{ ...surfaceStyle, color: '#12100E' }}>
                      {selectedQuote.service}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2" style={{ color: '#1F5245' }}>
                      <Calendar size={12} weight="fill" /> {t('serviceDate')}
                    </h3>
                    <div className="p-3 flex items-center gap-3" style={surfaceStyle}>
                      <Calendar size={18} style={{ color: '#1F5245' }} />
                      <span className="text-sm font-semibold" style={{ color: '#12100E' }}>
                        {selectedQuote.preferredDate ? new Date(selectedQuote.preferredDate).toLocaleDateString(intlLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : t('notSpecified')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2" style={{ color: '#1F5245' }}>
                    <ChatCircle size={12} weight="fill" /> {t('requestDetails')}
                  </h3>
                  <div className="p-4 leading-relaxed text-sm" style={{ ...surfaceStyle, color: '#6E6A63' }}>
                    {selectedQuote.message}
                  </div>
                </div>

                {selectedQuote.adminNotes && (
                  <div className="p-4" style={{ backgroundColor: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: '3px' }}>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2" style={{ color: '#3B82F6' }}>
                      <Tag size={12} weight="fill" /> {t('adminNote')}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#6E6A63' }}>
                      {selectedQuote.adminNotes}
                    </p>
                  </div>
                )}

                {/* Actions rapides */}
                {selectedQuote.status === 'sent' && (
                  <div className="p-5 space-y-4" style={{ backgroundColor: 'rgba(31,82,69,.05)', border: '1px solid rgba(31,82,69,.15)', borderRadius: '4px' }}>
                    <h4 className="font-semibold text-center text-sm" style={{ color: '#12100E' }}>
                      {t('doesThisWorkForYou')}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button type="button" onClick={() => openActionModal('accept', selectedQuote.id)} className="flex flex-col items-center gap-2 p-3" style={{ backgroundColor: 'transparent', border: '1px solid transparent', borderRadius: '4px' }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(31,82,69,.10)', color: '#1F5245' }}>
                          <CheckCircle size={22} weight="fill" />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: '#12100E' }}>{t('accept')}</span>
                      </button>
                      <button type="button" onClick={() => openActionModal('negotiate', selectedQuote.id)} className="flex flex-col items-center gap-2 p-3" style={{ borderRadius: '4px' }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(59,130,246,.10)', color: '#3B82F6' }}>
                          <ChatCircle size={22} weight="fill" />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: '#12100E' }}>{t('negotiate')}</span>
                      </button>
                      <button type="button" onClick={() => openActionModal('reject', selectedQuote.id)} className="flex flex-col items-center gap-2 p-3" style={{ borderRadius: '4px' }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(184,73,60,.10)', color: '#B8493C' }}>
                          <XCircle size={22} weight="fill" />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: '#12100E' }}>{t('reject')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {showActionModal && pendingAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="w-[95vw] max-w-md p-4 sm:p-6" style={{ ...cardStyle, borderRadius: '6px' }}>
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 flex items-center justify-center mb-4"
                style={{
                  backgroundColor: pendingAction.action === 'accept' ? 'rgba(31,82,69,.10)' : pendingAction.action === 'reject' ? 'rgba(184,73,60,.10)' : 'rgba(59,130,246,.10)',
                  color: pendingAction.action === 'accept' ? '#1F5245' : pendingAction.action === 'reject' ? '#B8493C' : '#3B82F6',
                  borderRadius: '4px'
                }}>
                {pendingAction.action === 'accept' && <CheckCircle size={32} weight="duotone" />}
                {pendingAction.action === 'reject' && <XCircle size={32} weight="duotone" />}
                {pendingAction.action === 'negotiate' && <ChatCircle size={32} weight="duotone" />}
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#12100E' }}>
                {pendingAction.action === 'accept' && t('confirmAccept')}
                {pendingAction.action === 'reject' && t('confirmReject')}
                {pendingAction.action === 'negotiate' && t('negotiateRequest')}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#6E6A63' }}>
                {pendingAction.action === 'accept' && t('acceptDescription')}
                {pendingAction.action === 'reject' && t('rejectDescription')}
                {pendingAction.action === 'negotiate' && t('negotiateDescription')}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: '#6E6A63' }}>
                {pendingAction.action === 'accept' ? t('optionalNote') : t('yourMessage')}
              </label>
              <textarea
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                placeholder={t('messagePlaceholder')}
                className="w-full px-4 py-3 outline-none text-sm"
                style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px', color: '#12100E' }}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowActionModal(false); setPendingAction(null) }}
                className="flex-1 py-3"
                style={{ color: '#6E6A63', border: '1px solid #E2DACD', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>
                {t('cancel')}
              </button>
              <button type="button" onClick={confirmAction} disabled={isProcessing}
                className="flex-1 py-3 disabled:opacity-50"
                style={{
                  backgroundColor: pendingAction.action === 'accept' ? '#1F5245' : pendingAction.action === 'reject' ? '#B8493C' : '#3B82F6',
                  color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 600
                }}>
                {isProcessing ? t('sending') : t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal formulaire nouveau devis */}
      {showNewQuoteForm && (
        <div className="fixed inset-0 z-[80] flex flex-col" style={{ backgroundColor: '#F7F3EC' }}>
          <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #E2DACD', backgroundColor: '#FFFFFF' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center" style={{ backgroundColor: 'rgba(31,82,69,.10)', color: '#1F5245', borderRadius: '3px' }}>
                <FileText size={16} weight="duotone" />
              </div>
              <h2 className="text-base font-semibold" style={{ color: '#12100E' }}>{t('newQuoteModalTitle')}</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowNewQuoteForm(false)}
              className="w-9 h-9 flex items-center justify-center"
              style={{ color: '#6E6A63' }}
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
    </div>
  )
}
