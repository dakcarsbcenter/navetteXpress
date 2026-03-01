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
  List,
  Trash,
  CarProfile,
  Binoculars,
  AirplaneTilt,
  Crown,
  User,
  Confetti,
  Download
} from "@phosphor-icons/react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { BulkDeleteModal } from "@/components/ui/BulkDeleteModal"
import { useNotification } from "@/hooks/useNotification"
import { QuoteDetailModal } from "@/components/admin/QuoteDetailModal"

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

export function QuotesManagementRedesigned() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
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
    const pending = quotes.filter(q => q.status === 'pending').length
    const conversion = total > 0 ? Math.round((quotes.filter(q => q.status === 'accepted').length / total) * 100) : 0
    const totalValue = quotes
      .filter(q => q.status === 'accepted' && q.estimatedPrice)
      .reduce((sum, q) => sum + parseFloat(q.estimatedPrice || '0'), 0)

    return { total, pending, conversion, totalValue }
  }

  const getQuotesByStatus = (status: string) => {
    const statusMap: Record<string, string[]> = {
      new: ['pending', 'new'],
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
      pending: { label: 'Nouveau', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
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
    setSelectedQuoteIds((prev: Set<number>) => {
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

  const exportToPDF = () => {
    try {
      const doc = new jsPDF()
      doc.text("Liste des Devis - Navette Xpress", 14, 15)

      const tableColumn = ["Client", "Email", "Service", "Statut", "Date Prévue"]
      const tableRows: any[] = []

      quotes.forEach(quote => {
        const row = [
          quote.customerName,
          quote.customerEmail,
          quote.service,
          quote.status,
          quote.preferredDate ? new Date(quote.preferredDate).toLocaleDateString('fr-FR') : '-'
        ]
        tableRows.push(row)
      })

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        styles: { fontSize: 10 }
      })

      doc.save("devis_export.pdf")
      showSuccess("Devis exportés en PDF", "Export réussi")
    } catch (error) {
      showError("Erreur lors de l'export PDF", "Erreur technique")
    }
  }

  const stats = getStatsData()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-pulse"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>
            Navette Xpress
          </div>
        </div>
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
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" weight="bold" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
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
                        onClick={() => {
                          setSelectedQuote(quote)
                          setIsDetailModalOpen(true)
                        }}
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
                          <button
                            className="p-1 text-slate-500 hover:text-white transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
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
                          <div className="mt-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setSelectedQuote(quote)
                                setIsDetailModalOpen(true)
                              }}
                              className="flex-1 text-[10px] font-bold uppercase tracking-wider px-3 py-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-lg transition-colors border border-amber-500/20"
                            >
                              Calculer
                            </button>
                          </div>
                        )}
                        {status === 'sent' && (
                          <div className="mt-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setSelectedQuote(quote)
                                setIsDetailModalOpen(true)
                              }}
                              className="flex-1 text-[10px] font-bold uppercase tracking-wider px-3 py-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20"
                            >
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



      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ backgroundColor: 'var(--color-dash-card)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/[0.02] border-b border-white/5">
                <tr>
                  <th className="pl-6 w-12 py-4">
                    <input
                      type="checkbox"
                      checked={quotes.length > 0 && selectedQuoteIds.size === quotes.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 text-gold focus:ring-gold/50 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">ID</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Client</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Service</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Statut</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Montant</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {quotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                      Aucun devis trouvé.
                    </td>
                  </tr>
                ) : (
                  quotes.map((quote: Quote) => {
                    const statusBadge = getStatusBadge(quote.status)

                    return (
                      <tr
                        key={quote.id}
                        className="hover:bg-white/[0.01] transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedQuote(quote)
                          setIsDetailModalOpen(true)
                        }}
                      >
                        <td className="pl-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedQuoteIds.has(quote.id)}
                            onChange={(e) => toggleSelectQuote(e as unknown as React.MouseEvent, quote.id)}
                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-gold focus:ring-gold/50 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono font-bold text-gold bg-gold/10 px-2 py-1 rounded-md border border-gold/20">
                            #{quote.id.toString().padStart(4, '0')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-white group-hover:text-gold transition-colors">{quote.customerName}</div>
                          <div className="text-xs text-slate-500">{quote.customerEmail}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-400">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                              {getServiceIcon(quote.service)}
                            </div>
                            <span className="text-sm">{quote.service}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusBadge.bg} ${statusBadge.color}`}>
                            {quote.status === 'accepted' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            {quote.status === 'in_progress' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-white font-mono">
                            {formatCurrency(quote.estimatedPrice)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                            <Calendar size={14} className="text-slate-400" />
                            {formatDate(quote.createdAt)}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quote Detail Modal */}
      <QuoteDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        quote={selectedQuote as any}
        onUpdate={fetchQuotes}
      />

      {/* Bulk Delete Modal */}
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
