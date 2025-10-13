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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-slate-600 dark:text-slate-400">Chargement de vos devis...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec design amélioré */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 rounded-2xl p-8 text-white shadow-2xl">
        {/* Effet de fond animé */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="7"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <span className="text-2xl">📋</span>
                </div>
                <h1 className="text-3xl font-bold">
                  Mes devis
                </h1>
              </div>
              <p className="text-blue-100 text-lg">
                Gérez vos demandes de devis en toute simplicité
              </p>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-6">
                <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="text-3xl font-bold mb-1">
                    {quotes.length}
                  </div>
                  <div className="text-sm text-blue-100">
                    Total
                  </div>
                </div>
                <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="text-3xl font-bold mb-1 text-green-300">
                    {quotes.filter(q => q.status === 'accepted').length}
                  </div>
                  <div className="text-sm text-blue-100">
                    Acceptés
                  </div>
                </div>
                <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="text-3xl font-bold mb-1 text-yellow-300">
                    {quotes.filter(q => q.status === 'sent').length}
                  </div>
                  <div className="text-sm text-blue-100">
                    En attente
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques mobiles */}
          <div className="md:hidden grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="text-xl font-bold mb-1">
                {quotes.length}
              </div>
              <div className="text-xs text-blue-100">
                Total
              </div>
            </div>
            <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="text-xl font-bold mb-1 text-green-300">
                {quotes.filter(q => q.status === 'accepted').length}
              </div>
              <div className="text-xs text-blue-100">
                Acceptés
              </div>
            </div>
            <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="text-xl font-bold mb-1 text-yellow-300">
                {quotes.filter(q => q.status === 'sent').length}
              </div>
              <div className="text-xs text-blue-100">
                En attente
              </div>
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
            <div key={quote.id} className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              {/* Effet de bordure animé pour les devis "sent" */}
              {quote.status === 'sent' && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-[2px] bg-white dark:bg-slate-800 rounded-2xl"></div>
                </div>
              )}
              
              <div className="relative p-6 z-10">
                {/* Header de la carte avec design amélioré */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white shadow-lg">
                      <span className="text-lg">📋</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                        Devis #{quote.id}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <span>🚗</span> {quote.service}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(quote.status)}`}>
                    {getStatusIcon(quote.status)} {getStatusLabel(quote.status)}
                  </span>
                </div>

                {/* Contenu de la demande */}
                <div className="mb-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                    {quote.message.split('\n')[0]}
                  </p>
                </div>

                {/* Informations complémentaires avec design amélioré */}
                <div className="space-y-3 mb-4">
                  {quote.preferredDate && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">📅</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Date souhaitée</span>
                      </div>
                      <span className="text-sm text-slate-900 dark:text-white font-medium">
                        {new Date(quote.preferredDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                  {quote.estimatedPrice && (
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">💰</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Prix estimé</span>
                      </div>
                      <span className="text-sm text-green-600 dark:text-green-400 font-bold">
                        {quote.estimatedPrice} FCFA
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-l-4 border-purple-500">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-500">⏰</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">Demandé le</span>
                    </div>
                    <span className="text-sm text-slate-900 dark:text-white font-medium">
                      {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {/* Actions avec design amélioré */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  {quote.status === 'sent' ? (
                    <div className="space-y-3">
                      <div className="text-center p-2 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                        <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">
                          ⏰ Devis prêt - Action requise
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={() => openQuoteDetails(quote)}
                          className="w-full text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                        >
                          <span>📄</span> Voir détails complets
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => openActionModal('accept', quote.id)}
                            disabled={isProcessing}
                            className="text-sm bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-2 rounded-xl hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 flex items-center justify-center gap-1 shadow-md"
                          >
                            <span>✅</span> Accepter
                          </button>
                          <button 
                            onClick={() => openActionModal('reject', quote.id)}
                            disabled={isProcessing}
                            className="text-sm bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-2 rounded-xl hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 flex items-center justify-center gap-1 shadow-md"
                          >
                            <span>❌</span> Rejeter
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openQuoteDetails(quote)}
                      className="w-full text-sm bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-3 rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                    >
                      <span>📄</span> Voir détails
                    </button>
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
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 space-y-4">
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
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
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
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                      : pendingAction.action === 'reject'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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