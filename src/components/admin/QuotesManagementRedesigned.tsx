"use client"

import React, { useState, useEffect } from "react"
import {
  MagnifyingGlass as Search,
  Plus,
  FileText,
  TrendUp as TrendingUp,
  CurrencyDollar as DollarSign,
  Calendar,
  DotsThreeVertical as MoreVertical,
  SquaresFour as Grid,
  Grid,
  List,
  Trash,
  CarProfile,
  Binoculars,
  AirplaneTilt,
  Crown,
  User,
  Confetti
} from "@phosphor-icons/react"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { BulkDeleteModal } from "@/components/ui/BulkDeleteModal"
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

  const [selectedQuoteIds, setSelectedQuoteIds] = useState<Set<number>>(new Set())
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)

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
      new: { label: 'Nouveau', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
      in_progress: { label: 'Traitement', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
      sent: { label: 'Envoyé', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
      accepted: { label: 'Gagné', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
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

  const toggleSelectAll = () => {
    if (selectedQuoteIds.size === quotes.length && quotes.length > 0) {
      setSelectedQuoteIds(new Set())
    } else {
      setSelectedQuoteIds(new Set(quotes.map(q => q.id)))
    }
  }

  const toggleSelectQuote = (e: React.MouseEvent, quoteId: number) => {
    e.stopPropagation()
    setSelectedQuoteIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(quoteId)) {
        newSet.delete(quoteId)
      } else {
        newSet.add(quoteId)
      }
      return newSet
    })
  }

  const handleBulkDelete = async () => {
    try {
      const response = await fetch('/api/quotes/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedQuoteIds) })
      })

      const data = await response.json()

      if (response.ok) {
        showSuccess(data.message || 'Devis supprimés', 'Succès')
        setSelectedQuoteIds(new Set())
        fetchQuotes()
      } else {
        showError(data.error || 'Erreur lors de la suppression', 'Erreur')
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
    <div className="space-y-6 animate-fadeIn">
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Header */}
      <div className="p-6 rounded-2xl border border-white/5" style={{ backgroundColor: 'var(--color-dash-card)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Gestion des Devis</h1>
            <p className="text-xs text-slate-500 mt-1">Suivez le pipeline commercial et les conversions.</p>
          </div>
          <div className="flex gap-2">
            {selectedQuoteIds.size > 0 && (
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors"
              >
                <Trash className="w-5 h-5" />
                <span className="hidden sm:inline">Supprimer ({selectedQuoteIds.size})</span>
              </button>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-gold flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-gold/10 whitespace-nowrap"
            >
              <Plus weight="bold" className="w-4 h-4" />
              Nouveau devis
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "TOTAL DEVIS", value: stats.total, color: 'var(--color-gold)', icon: <FileText size={20} /> },
            { label: "EN ATTENTE", value: stats.pending, color: '#F59E0B', icon: <Calendar size={20} /> },
            { label: "CONVERTIS (MOIS)", value: `${stats.conversion}%`, color: '#10B981', icon: <TrendingUp size={20} /> },
            { label: "PIPELINE VALEUR", value: `${(stats.totalValue / 1000000).toFixed(1)}M`, color: '#3B82F6', icon: <DollarSign size={20} /> },
          ].map((stat, i) => (
            <div key={i} className="p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center"
              style={{ backgroundColor: 'var(--color-dash-card)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                {stat.icon}
              </div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white font-mono">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par client, ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-gold/50 transition-all placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${viewMode === 'kanban' ? 'bg-gold text-black shadow-lg shadow-gold/10' : 'text-slate-400 hover:text-white'
                }`}
            >
              <Grid className="w-4 h-4" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${viewMode === 'list' ? 'bg-gold text-black shadow-lg shadow-gold/10' : 'text-slate-400 hover:text-white'
                }`}
            >
              <List className="w-4 h-4" />
              Liste
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
          {['new', 'in_progress', 'sent', 'accepted'].map((status) => {
            const statusQuotes = getQuotesByStatus(status)
            const statusConfig = getStatusBadge(status)

            return (
              <div key={status} className="flex-1 min-w-[300px] flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status === 'accepted' ? 'bg-emerald-400' :
                      status === 'sent' ? 'bg-purple-400' :
                        status === 'in_progress' ? 'bg-amber-400' :
                          'bg-blue-400'
                      }`} />
                    <h3 className="font-bold text-slate-300 uppercase tracking-widest text-[10px]">{statusConfig.label}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    {statusQuotes.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-2 custom-scrollbar">
                  {statusQuotes.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                      Aucun devis
                    </div>
                  ) : (
                    statusQuotes.map((quote) => (
                      <div
                        key={quote.id}
                        className="p-4 rounded-xl border border-white/5 cursor-move hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 transition-all group relative"
                        style={{ backgroundColor: 'var(--color-dash-card)' }}
                      >
                        <div className="absolute top-3 right-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedQuoteIds.has(quote.id)}
                            onChange={(e) => toggleSelectQuote(e as unknown as React.MouseEvent, quote.id)}
                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-gold focus:ring-gold/50 cursor-pointer"
                          />
                        </div>

                        <div className="flex justify-between items-start mb-3 pr-6">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                              {getServiceIcon(quote.service)}
                            </div>
                            <span className="text-xs font-mono font-bold text-gold bg-gold/10 px-2 py-1 rounded-md border border-gold/20 flex flex-col items-start gap-1">
                              <span>#{quote.id.toString().padStart(4, '0')}</span>
                              {quote.service === 'Mise à dispo (3 jours)' && status === 'new' && (
                                <span className="text-[8px] px-1 py-0.5 bg-red-500/20 text-red-400 rounded">URGENT</span>
                              )}
                            </span>
                          </div>
                          <button className="p-1 text-slate-500 hover:text-white transition-opacity">
                            <MoreVertical size={16} />
                          </button>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-bold text-white mb-1 group-hover:text-gold transition-colors">{quote.customerName}</h4>
                          <p className="text-xs text-slate-400">{quote.service || (status === 'new' ? 'Mise à dispo (3 jours)' : status === 'in_progress' ? 'Transfert AIBD (VW)' : 'Circuit Touristique')}</p>
                        </div>

                        <div className="flex items-center justify-between text-xs mt-4 pt-4 border-t border-white/5">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Calendar size={14} className="text-slate-400" />
                            {formatDate(quote.createdAt)}
                          </div>
                          <span className="font-bold text-white font-mono">
                            {formatCurrency(quote.estimatedPrice)}
                          </span>
                        </div>

                        {status === 'new' && quote.message && (
                          <div className="mt-3 text-[10px] text-slate-500 font-mono">
                            Il y a 2h
                          </div>
                        )}

                        {status === 'in_progress' && (
                          <div className="mt-4 flex items-center gap-2">
                            <button className="flex-1 text-[10px] font-bold uppercase tracking-wider px-3 py-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-lg transition-colors border border-amber-500/20">
                              Calculer
                            </button>
                          </div>
                        )}
                        {status === 'sent' && (
                          <div className="mt-4 flex items-center gap-2">
                            <button className="flex-1 text-[10px] font-bold uppercase tracking-wider px-3 py-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20">
                              Relancer
                            </button>
                          </div>
                        )}
                        {status === 'accepted' && (
                          <div className="mt-4 flex items-center gap-2">
                            <span className="flex-1 text-center text-[10px] font-bold uppercase tracking-wider px-3 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 flex items-center justify-center gap-1.5">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Signé
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

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
              <div key={quote.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer relative">
                {/* Checkbox */}
                <div className="absolute top-2 right-2 text-gray-400 focus:outline-none" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedQuoteIds.has(quote.id)}
                    onChange={(e) => toggleSelectQuote(e as unknown as React.MouseEvent, quote.id)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300 cursor-pointer"
                  />
                </div>
                <div className="flex items-start justify-between mb-2 pr-6">
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
              <div key={quote.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer relative">
                {/* Checkbox */}
                <div className="absolute top-2 right-2 text-gray-400 focus:outline-none" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedQuoteIds.has(quote.id)}
                    onChange={(e) => toggleSelectQuote(e as unknown as React.MouseEvent, quote.id)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300 cursor-pointer"
                  />
                </div>
                <div className="flex items-start justify-between mb-2 pr-6">
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
        </div >
      )
}

{/* List View */ }
{
  viewMode === 'list' && (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="pl-6 w-12 py-4">
                <input
                  type="checkbox"
                  checked={quotes.length > 0 && selectedQuoteIds.size === quotes.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
              </th>
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
                  <td className="pl-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedQuoteIds.has(quote.id)}
                      onChange={(e) => toggleSelectQuote(e as unknown as React.MouseEvent, quote.id)}
                      className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                  </td>
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
  )
}

{/* Bulk Delete Modal */ }
<BulkDeleteModal
  isOpen={isBulkDeleteModalOpen}
  onClose={() => setIsBulkDeleteModalOpen(false)}
  onConfirm={handleBulkDelete}
  count={selectedQuoteIds.size}
  resourceName="devis"
/>
    </div >
  )
}
