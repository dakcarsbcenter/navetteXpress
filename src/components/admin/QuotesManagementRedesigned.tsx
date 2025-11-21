"use client"

import React, { useState, useEffect } from "react"
import { Search, Plus, FileText, TrendingUp, DollarSign, Calendar, MoreVertical, Grid, List } from "lucide-react"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { useNotification } from "@/hooks/useNotification"

interface Quote {
  id: number
  customerName: string
  customerEmail: string
  customerPhone: string | null
  service: string
  preferredDate: string | null
  message: string
  status: 'new' | 'in_progress' | 'sent' | 'accepted' | 'rejected'
  adminNotes: string | null
  estimatedPrice: string | null
  assignedTo: string | null
  createdAt: string
  updatedAt: string
}

export function QuotesManagementRedesigned() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { notifications, showSuccess, showError, removeNotification } = useNotification()
  
  const [filters, setFilters] = useState({
    search: ''
  })

  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const result = await response.json()
      
      if (result.success) {
        setQuotes(result.data || [])
      } else {
        showError(result.error || 'Erreur lors du chargement', 'Erreur')
      }
    } catch (error) {
      console.error('Erreur chargement devis:', error)
      showError('Erreur lors du chargement des devis', 'Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatsData = () => {
    const total = quotes.length
    const pending = quotes.filter(q => q.status === 'new').length
    const conversion = total > 0 ? Math.round((quotes.filter(q => q.status === 'accepted').length / total) * 100) : 0
    const totalValue = quotes
      .filter(q => q.status === 'accepted' && q.estimatedPrice)
      .reduce((sum, q) => sum + parseFloat(q.estimatedPrice || '0'), 0)
    
    return { total, pending, conversion, totalValue }
  }

  const getQuotesByStatus = (status: string) => {
    const statusMap: Record<string, string[]> = {
      new: ['new'],
      in_progress: ['in_progress'],
      sent: ['sent'],
      accepted: ['accepted']
    }
    
    return quotes.filter(q => statusMap[status]?.includes(q.status))
  }

  const getServiceIcon = (service: string) => {
    const icons: Record<string, string> = {
      transport: '🚗',
      tour: '🎯',
      airport: '✈️',
      vip: '👑',
      rental: '🤵',
      event: '🎉'
    }
    return icons[service] || '🚗'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '—'
    return `${parseFloat(amount).toLocaleString('fr-FR')} FCFA`
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string }> = {
      new: { label: 'Nouveau', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
      in_progress: { label: 'Traitement', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
      sent: { label: 'Envoyé', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
      accepted: { label: 'Gagné', color: 'text-green-700', bg: 'bg-green-50 border-green-200' }
    }
    return configs[status] || configs.new
  }

  const handleUpdateStatus = async (quoteId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        showSuccess('Statut mis à jour', 'Succès')
        fetchQuotes()
      } else {
        showError('Erreur lors de la mise à jour', 'Erreur')
      }
    } catch (error) {
      showError('Erreur technique', 'Erreur')
    }
  }

  const stats = getStatsData()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationCenter
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Devis</h1>
            <p className="text-sm text-gray-500 mt-1">Suivez le pipeline commercial et les conversions.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouveau devis
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">TOTAL DEVIS</div>
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-orange-700 mb-1">EN ATTENTE</div>
                <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-700 mb-1">CONVERTIS (MOIS)</div>
                <div className="text-3xl font-bold text-green-600">{stats.conversion}%</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-yellow-700 mb-1">PIPELINE VALEUR</div>
                <div className="text-3xl font-bold text-yellow-600">{(stats.totalValue / 1000000).toFixed(1)}M</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par client, ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid className="w-4 h-4 inline mr-1" />
              Kanban
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4 inline mr-1" />
              Liste
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="p-8">
          <div className="grid grid-cols-4 gap-6">
            {/* Nouveau */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <h3 className="font-semibold text-gray-900">Nouveau</h3>
                  </div>
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {getQuotesByStatus('new').length}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                {getQuotesByStatus('new').length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Aucun devis nouveau
                  </div>
                ) : (
                  getQuotesByStatus('new').map((quote) => (
                    <div key={quote.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">N° {quote.id.toString().padStart(4, '0')}</span>
                            <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full font-medium">URGENT</span>
                          </div>
                          <h4 className="font-semibold text-gray-900">{quote.customerName}</h4>
                          <p className="text-xs text-gray-500">{quote.service || 'Mise à dispo (3 jours)'}</p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          {getServiceIcon(quote.service)} {quote.service}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(quote.estimatedPrice)}
                          </span>
                        </div>
                      </div>

                      {quote.message && (
                        <div className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                          <span>Il y a 2h</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Traitement */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <h3 className="font-semibold text-gray-900">Traitement</h3>
                  </div>
                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {getQuotesByStatus('in_progress').length}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                {getQuotesByStatus('in_progress').length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Aucun devis en préparation
                  </div>
                ) : (
                  getQuotesByStatus('in_progress').map((quote) => (
                    <div key={quote.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">N° {quote.id.toString().padStart(4, '0')}</span>
                          </div>
                          <h4 className="font-semibold text-gray-900">{quote.customerName}</h4>
                          <p className="text-xs text-gray-500">{quote.service}</p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          {getServiceIcon(quote.service)} Transfert AIBD (VW)
                        </span>
                      </div>

                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(quote.estimatedPrice)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button className="flex-1 text-xs px-3 py-1.5 bg-orange-50 text-orange-600 rounded hover:bg-orange-100 transition-colors">
                          Calculer
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Envoyé */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <h3 className="font-semibold text-gray-900">Envoyé</h3>
                  </div>
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {getQuotesByStatus('sent').length}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                {getQuotesByStatus('sent').length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Aucun devis en attente client
                  </div>
                ) : (
                  getQuotesByStatus('sent').map((quote) => (
                    <div key={quote.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">N° {quote.id.toString().padStart(4, '0')}</span>
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900">{quote.customerName}</h4>
                          <p className="text-xs text-gray-500">{quote.service}</p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          {getServiceIcon(quote.service)} Circuit Touristique
                        </span>
                      </div>

                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(quote.estimatedPrice)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button className="flex-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                          Relancer
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Gagné */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <h3 className="font-semibold text-gray-900">Gagné</h3>
                  </div>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {getQuotesByStatus('accepted').length}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                {getQuotesByStatus('accepted').length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Aucun devis accepté
                  </div>
                ) : (
                  getQuotesByStatus('accepted').map((quote) => (
                    <div key={quote.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">N° {quote.id.toString().padStart(4, '0')}</span>
                            <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Signé
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900">{quote.customerName}</h4>
                          <p className="text-xs text-gray-500">{quote.service}</p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          {getServiceIcon(quote.service)} Navette Event
                        </span>
                      </div>

                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(quote.estimatedPrice)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        <span>20 Nov</span>
                      </div>

                      <div className="mt-3">
                        <button className="w-full text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                          Voir Rés→
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="p-8">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase">Client</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase">Service</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase">Statut</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase">Montant</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quotes.map((quote) => {
                  const statusBadge = getStatusBadge(quote.status)
                  
                  return (
                    <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{quote.customerName}</div>
                        <div className="text-sm text-gray-500">{quote.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{getServiceIcon(quote.service)} {quote.service}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusBadge.bg} ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(quote.estimatedPrice)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{formatDate(quote.createdAt)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
