'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useNotification } from '@/hooks/useNotification'
import { NotificationCenter } from '@/components/ui/NotificationCenter'

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
      console.log('🔍 Chargement des devis client...')
      
      const response = await fetch(`/api/quotes/client?email=${encodeURIComponent(session?.user?.email || '')}`)
      const result = await response.json()
      
      console.log('📊 API Response:', result)
      
      if (result.success) {
        console.log('✅ Devis client chargés:', result.data.length, 'devis trouvés')
        setQuotes(result.data)
      } else {
        console.error('❌ Erreur API:', result.error)
        showError('Erreur lors du chargement de vos devis', 'Erreur de chargement')
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error)
      showError('Erreur lors du chargement de vos devis', 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'sent':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente'
      case 'in_progress':
        return 'En traitement'
      case 'sent':
        return 'Devis envoyé'
      case 'accepted':
        return 'Accepté'
      case 'rejected':
        return 'Refusé'
      default:
        return 'Inconnu'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳'
      case 'in_progress':
        return '🔄'
      case 'sent':
        return '📧'
      case 'accepted':
        return '✅'
      case 'rejected':
        return '❌'
      default:
        return '❓'
    }
  }

  const openQuoteDetails = (quote: Quote) => {
    setSelectedQuote(quote)
    setShowDetails(true)
  }

  const handleQuoteAction = async (action: string, quoteId: number, message: string = '') => {
    try {
      setIsProcessing(true)
      
      const response = await fetch('/api/quotes/client/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId,
          action,
          message
        })
      })

      const result = await response.json()

      if (result.success) {
        // Mettre à jour le state local
        setQuotes(prev => prev.map(quote => 
          quote.id === quoteId 
            ? { ...quote, status: result.newStatus as any }
            : quote
        ))

        // Mettre à jour le devis sélectionné si nécessaire
        if (selectedQuote?.id === quoteId) {
          setSelectedQuote(prev => prev ? { ...prev, status: result.newStatus as any } : null)
        }

        const actionLabels = {
          accept: 'accepté',
          reject: 'rejeté',
          negotiate: 'marqué pour négociation'
        }

        showSuccess(`Devis ${actionLabels[action as keyof typeof actionLabels]} avec succès`)
        setShowActionModal(false)
        setActionMessage('')
        setPendingAction(null)
      } else {
        showError(result.error || 'Erreur lors de l\'action')
      }
    } catch (error) {
      console.error('Erreur:', error)
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
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-4">
  <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-pulse"
       style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>
    Navette Xpress
  </div>
</div>
          <span className="text-slate-600 dark:text-slate-400">Chargement de vos devis...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec gradient Bordeaux - Style capture */}
      <div className="relative overflow-hidden bg-linear-to-br from-[#A73B3C] via-[#8B3032] to-[#6B2428] rounded-2xl p-8 text-white shadow-xl">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Mes Devis</h1>
              <p className="text-white/90 text-base">
                Gérez vos demandes de devis en toute simplicité.<br />
                Consultez, acceptez ou refusez vos propositions.
              </p>
            </div>
          </div>
          
          {/* Stats badges - Style capture avec coins arrondis */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-center px-8 py-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
              <div className="text-4xl font-bold mb-1">{quotes.length}</div>
              <div className="text-xs text-white/80 uppercase tracking-wider">Total</div>
            </div>
            <div className="text-center px-8 py-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
              <div className="text-4xl font-bold mb-1">{quotes.filter(q => q.status === 'accepted').length}</div>
              <div className="text-xs text-white/80 uppercase tracking-wider">Acceptés</div>
            </div>
            <div className="text-center px-8 py-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
              <div className="text-4xl font-bold mb-1">{quotes.filter(q => ['pending', 'sent'].includes(q.status)).length}</div>
              <div className="text-xs text-white/80 uppercase tracking-wider">En attente</div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des devis */}
      {quotes.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 border border-slate-200 dark:border-slate-700 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Aucun devis pour le moment
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Vous n'avez pas encore fait de demande de devis. Commencez dès maintenant !
          </p>
          <button
            onClick={() => window.location.href = '/quote-request'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Demander un devis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotes.map((quote) => (
            <div key={quote.id} className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300">
              
              <div className="p-6">
                {/* Header de la carte - Style capture avec icône service */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${
                      quote.service.toLowerCase().includes('tourisme') || quote.service.toLowerCase().includes('tour') ? 'bg-red-500' :
                      quote.service.toLowerCase().includes('aéroport') || quote.service.toLowerCase().includes('aibd') || quote.service.toLowerCase().includes('airport') ? 'bg-yellow-600' :
                      quote.service.toLowerCase().includes('groupe') || quote.service.toLowerCase().includes('van') ? 'bg-purple-600' :
                      'bg-blue-600'
                    }`}>
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base mb-0.5">
                        Devis #{quote.id}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#E5C16C]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[#E5C16C] font-medium">{quote.service}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    quote.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    quote.status === 'sent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    quote.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {quote.status === 'sent' ? 'Accepté' : getStatusLabel(quote.status)}
                  </span>
                </div>

                {/* Demande - texte plus descriptif */}
                <div className="mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {quote.message.length > 100 ? quote.message.substring(0, 100) + '...' : quote.message}
                  </p>
                </div>

                {/* Informations - Style capture avec icônes et bordures */}
                <div className="space-y-2 mb-4">
                  {quote.preferredDate && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center gap-2.5">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Date souhaitée</span>
                      </div>
                      <span className="text-sm text-slate-900 dark:text-white font-semibold">
                        {new Date(quote.preferredDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {quote.estimatedPrice && (
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-600">
                      <div className="flex items-center gap-2.5">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Prix estimé</span>
                      </div>
                      <span className="text-sm text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        {parseFloat(quote.estimatedPrice).toLocaleString('fr-FR')}.000 FCFA
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border-l-4 border-[#A73B3C]">
                    <div className="flex items-center gap-2.5">
                      <svg className="w-5 h-5 text-[#A73B3C]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Demandé le</span>
                    </div>
                    <span className="text-sm text-slate-900 dark:text-white font-semibold">
                      {new Date(quote.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Bouton Voir détails - style capture avec coins arrondis */}
                <div className="pt-4">
                  <button
                    onClick={() => openQuoteDetails(quote)}
                    className="w-full bg-[#2C3E50] hover:bg-[#1C2833] dark:bg-slate-700 dark:hover:bg-slate-600 text-white py-3.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm shadow-md"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Voir détails
                  </button>
                  
                  {quote.status === 'sent' && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => openActionModal('accept', quote.id)}
                        disabled={isProcessing}
                        className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Accepter
                      </button>
                      <button 
                        onClick={() => openActionModal('reject', quote.id)}
                        disabled={isProcessing}
                        className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Refuser
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de détails */}
      {showDetails && selectedQuote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Détails du devis #{selectedQuote.id}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Statut */}
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedQuote.status)}`}>
                    {getStatusIcon(selectedQuote.status)} {getStatusLabel(selectedQuote.status)}
                  </span>
                  {selectedQuote.estimatedPrice && (
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {selectedQuote.estimatedPrice} FCFA
                    </span>
                  )}
                </div>

                {/* Services */}
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">Services demandés</h3>
                  <p className="text-slate-700 dark:text-slate-300">{selectedQuote.service}</p>
                </div>

                {/* Message complet */}
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">Détails de la demande</h3>
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                    <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {selectedQuote.message}
                    </pre>
                  </div>
                </div>

                {/* Notes admin */}
                {selectedQuote.adminNotes && (
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Notes de l'équipe</h3>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        {selectedQuote.adminNotes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Demande créée le</h4>
                    <p className="text-slate-900 dark:text-white">
                      {new Date(selectedQuote.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Dernière mise à jour</h4>
                    <p className="text-slate-900 dark:text-white">
                      {new Date(selectedQuote.updatedAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {selectedQuote.status === 'sent' && (
                  <div className="bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 space-y-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-center">
                      🎯 Actions disponibles pour ce devis
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button 
                        onClick={() => openActionModal('accept', selectedQuote.id)}
                        disabled={isProcessing}
                        className="group relative overflow-hidden px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                      >
                        <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        <div className="relative flex flex-col items-center gap-2">
                          <span className="text-2xl">✅</span>
                          <span className="font-semibold">Accepter</span>
                          <span className="text-xs opacity-90">Valider ce devis</span>
                        </div>
                      </button>
                      
                      <button 
                        onClick={() => openActionModal('negotiate', selectedQuote.id)}
                        disabled={isProcessing}
                        className="group relative overflow-hidden px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                      >
                        <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        <div className="relative flex flex-col items-center gap-2">
                          <span className="text-2xl">💬</span>
                          <span className="font-semibold">Négocier</span>
                          <span className="text-xs opacity-90">Discuter du prix</span>
                        </div>
                      </button>
                      
                      <button 
                        onClick={() => openActionModal('reject', selectedQuote.id)}
                        disabled={isProcessing}
                        className="group relative overflow-hidden px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                      >
                        <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        <div className="relative flex flex-col items-center gap-2">
                          <span className="text-2xl">❌</span>
                          <span className="font-semibold">Rejeter</span>
                          <span className="text-xs opacity-90">Décliner l'offre</span>
                        </div>
                      </button>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        💡 <strong>Conseil :</strong> Vous pouvez négocier les termes avant d'accepter ou de rejeter définitivement.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation d'action */}
      {showActionModal && pendingAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                  {pendingAction.action === 'accept' && <span className="text-3xl">✅</span>}
                  {pendingAction.action === 'reject' && <span className="text-3xl">❌</span>}
                  {pendingAction.action === 'negotiate' && <span className="text-3xl">💬</span>}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {pendingAction.action === 'accept' && 'Accepter ce devis ?'}
                  {pendingAction.action === 'reject' && 'Rejeter ce devis ?'}
                  {pendingAction.action === 'negotiate' && 'Négocier ce devis ?'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {pendingAction.action === 'accept' && 'En acceptant, vous confirmez votre accord avec les termes proposés.'}
                  {pendingAction.action === 'reject' && 'Le rejet est définitif. Vous pourrez expliquer vos raisons ci-dessous.'}
                  {pendingAction.action === 'negotiate' && 'Votre demande sera transmise à notre équipe pour discussion.'}
                </p>
              </div>

              {/* Zone de message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {pendingAction.action === 'accept' && '💌 Message de confirmation (optionnel)'}
                  {pendingAction.action === 'reject' && '💭 Raison du rejet (optionnel)'}
                  {pendingAction.action === 'negotiate' && '💬 Votre proposition de négociation'}
                </label>
                <textarea
                  value={actionMessage}
                  onChange={(e) => setActionMessage(e.target.value)}
                  placeholder={
                    pendingAction.action === 'accept' 
                      ? "Ex: Merci, ce devis me convient parfaitement !"
                      : pendingAction.action === 'reject'
                      ? "Ex: Le prix ne correspond pas à mon budget..."
                      : "Ex: Pourriez-vous revoir le prix à la baisse ?"
                  }
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowActionModal(false)
                    setPendingAction(null)
                    setActionMessage('')
                  }}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmAction}
                  disabled={isProcessing}
                  className={`flex-1 px-4 py-3 rounded-xl text-white font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 ${
                    pendingAction.action === 'accept' 
                      ? 'bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                      : pendingAction.action === 'reject'
                      ? 'bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                      : 'bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="flex flex-col items-center gap-4">
  <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-pulse"
       style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>
    Navette Xpress
  </div>
</div>
                      Traitement...
                    </>
                  ) : (
                    <>
                      {pendingAction.action === 'accept' && '✅ Accepter'}
                      {pendingAction.action === 'reject' && '❌ Rejeter'}
                      {pendingAction.action === 'negotiate' && '💬 Négocier'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  )
}
