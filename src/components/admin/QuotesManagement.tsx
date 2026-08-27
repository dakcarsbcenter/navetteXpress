"use client"

import React, { useState, useEffect } from "react"
import {
  MagnifyingGlass as Search,
  FileText,
  TrendUp as TrendingUp,
  CurrencyDollar as DollarSign,
  Calendar,
  SquaresFour as Grid,
  List,
  Trash,
  CarProfile,
  Binoculars,
  AirplaneTilt,
  Crown,
  User,
  Confetti,
  Download,
  CheckCircle,
} from "@phosphor-icons/react"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { BulkDeleteModal } from "@/components/ui/BulkDeleteModal"
import { useNotification } from "@/hooks/useNotification"
import { QuoteDetailModal } from "@/components/admin/QuoteDetailModal"
import { StatusBadge } from "@/components/shared/StatusBadge"

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

const KANBAN_COLUMNS = [
  { key: 'pending', label: 'En attente' },
  { key: 'in_progress', label: 'En cours de traitement' },
  { key: 'sent', label: 'Devis envoyé' },
  { key: 'accepted', label: 'Accepté' },
] as const

export function QuotesManagement() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<Set<number>>(new Set())
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)

  const { notifications, showSuccess, showError, removeNotification } = useNotification()

  const [filters, setFilters] = useState({ search: '' })

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

  const getQuotesByStatus = (status: string) => quotes.filter(q => q.status === status)

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

  const exportToPDF = async () => {
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        // @ts-expect-error jspdf's ESM build has no type declarations; the shape matches the main 'jspdf' export
        import('jspdf/dist/jspdf.es.min.js'),
        import('jspdf-autotable')
      ])

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

  const filteredQuotes = quotes.filter(q =>
    filters.search === '' ||
    q.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
    q.id.toString().includes(filters.search)
  )

  const stats = getStatsData()

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "#E2DACD", borderTopColor: "#1F5245" }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      <NotificationCenter notifications={notifications} onRemove={removeNotification} />

      {/* Header */}
      <section style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#1F5245' }}>
            Pipeline commercial
          </span>
          <h2 style={{ margin: 0, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Gestion des devis.
          </h2>
          <p style={{ margin: 0, fontSize: '15px', color: '#3d3a35' }}>
            Suivez le pipeline commercial et les conversions.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedQuoteIds.size > 0 && (
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-2"
              style={{ height: '40px', padding: '0 16px', backgroundColor: 'rgba(184,73,60,.08)', border: '1px solid rgba(184,73,60,.25)', borderRadius: '4px', color: '#B8493C', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Trash size={15} />
              Supprimer ({selectedQuoteIds.size})
            </button>
          )}
          <button
            type="button"
            onClick={exportToPDF}
            className="flex items-center gap-2"
            style={{ height: '40px', padding: '0 16px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', color: '#6E6A63', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <Download size={15} weight="bold" />
            Export PDF
          </button>
        </div>
      </section>

      {/* Stats Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', borderTop: '1px solid #E2DACD', borderBottom: '1px solid #E2DACD' }}>
        {[
          { label: "Total devis", value: String(stats.total), icon: FileText },
          { label: "En attente", value: String(stats.pending), icon: Calendar },
          { label: "Convertis (mois)", value: `${stats.conversion}%`, icon: TrendingUp },
          { label: "Pipeline valeur", value: `${(stats.totalValue / 1000000).toFixed(1)}M`, icon: DollarSign },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} style={{ padding: '18px 20px', borderRight: i < 3 ? '1px solid #E2DACD' : 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Icon size={17} style={{ color: '#1F5245' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '23px', fontWeight: 600, letterSpacing: '-0.01em', color: '#12100E' }}>{stat.value}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>{stat.label}</span>
            </div>
          )
        })}
      </section>

      {/* Filters */}
      <section className="flex flex-wrap items-center gap-3">
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6E6A63' }} />
          <input
            type="text"
            placeholder="Rechercher par client, ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: '100%', height: '42px', padding: '0 14px 0 40px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13.5px', color: '#12100E' }}
          />
        </div>

        <div className="flex items-center gap-1" style={{ border: '1px solid #E2DACD', borderRadius: '4px', padding: '3px', backgroundColor: '#FFFFFF' }}>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className="flex items-center gap-1.5"
            style={{ padding: '7px 12px', borderRadius: '3px', fontSize: '12.5px', fontWeight: 600, backgroundColor: viewMode === 'kanban' ? '#1F5245' : 'transparent', color: viewMode === 'kanban' ? '#FFFFFF' : '#6E6A63' }}
          >
            <Grid size={15} />
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className="flex items-center gap-1.5"
            style={{ padding: '7px 12px', borderRadius: '3px', fontSize: '12.5px', fontWeight: 600, backgroundColor: viewMode === 'list' ? '#1F5245' : 'transparent', color: viewMode === 'list' ? '#FFFFFF' : '#6E6A63' }}
          >
            <List size={15} />
            Liste
          </button>
        </div>
      </section>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-5 overflow-x-auto pb-2">
          {KANBAN_COLUMNS.map(({ key: status, label }) => {
            const statusQuotes = getQuotesByStatus(status).filter(q =>
              filters.search === '' || filteredQuotes.includes(q)
            )

            return (
              <div key={status} style={{ flex: '1 1 280px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="flex items-center justify-between px-1">
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>
                    {label}
                  </h3>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, color: '#6E6A63', backgroundColor: '#F0EAE0', padding: '2px 8px', borderRadius: '2px' }}>
                    {statusQuotes.length}
                  </span>
                </div>

                <div className="dash-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 'calc(100vh - 400px)', overflowY: 'auto', paddingRight: '4px' }}>
                  {statusQuotes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '28px 0', color: '#9a938a', fontSize: '12.5px', border: '1px dashed #E2DACD', borderRadius: '4px' }}>
                      Aucun devis
                    </div>
                  ) : (
                    statusQuotes.map((quote) => (
                      <div
                        key={quote.id}
                        onClick={() => { setSelectedQuote(quote); setIsDetailModalOpen(true) }}
                        className="group relative"
                        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', padding: '14px', cursor: 'pointer' }}
                      >
                        <div className="flex justify-between items-start" style={{ marginBottom: '10px' }}>
                          <div className="flex items-center gap-2">
                            <div style={{ width: '30px', height: '30px', borderRadius: '3px', backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', display: 'grid', placeItems: 'center', color: '#6E6A63' }}>
                              {getServiceIcon(quote.service)}
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: '#1F5245', backgroundColor: 'rgba(31,82,69,.08)', padding: '3px 8px', borderRadius: '2px' }}>
                              #{quote.id.toString().padStart(4, '0')}
                            </span>
                          </div>
                          <div onClick={(e) => { e.stopPropagation(); toggleSelectQuote(e, quote.id) }}>
                            <input
                              type="checkbox"
                              checked={selectedQuoteIds.has(quote.id)}
                              onChange={() => {}}
                              style={{ width: '15px', height: '15px', accentColor: '#1F5245' }}
                            />
                          </div>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <h4 style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: 600, color: '#12100E' }}>{quote.customerName}</h4>
                          <p style={{ margin: 0, fontSize: '11.5px', color: '#6E6A63' }}>{quote.service}</p>
                        </div>

                        <div className="flex items-center justify-between" style={{ fontSize: '11.5px', paddingTop: '10px', borderTop: '1px solid #F0EAE0' }}>
                          <div className="flex items-center gap-1.5" style={{ color: '#6E6A63' }}>
                            <Calendar size={13} />
                            {formatDate(quote.createdAt)}
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#12100E' }}>
                            {formatCurrency(quote.estimatedPrice)}
                          </span>
                        </div>

                        {status === 'in_progress' && (
                          <div style={{ marginTop: '12px' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => { setSelectedQuote(quote); setIsDetailModalOpen(true) }}
                              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 12px', backgroundColor: 'rgba(180,100,58,.08)', color: '#B4643A', border: '1px solid rgba(180,100,58,.3)', borderRadius: '3px' }}
                            >
                              Calculer
                            </button>
                          </div>
                        )}
                        {status === 'sent' && (
                          <div style={{ marginTop: '12px' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => { setSelectedQuote(quote); setIsDetailModalOpen(true) }}
                              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 12px', backgroundColor: 'rgba(31,82,69,.08)', color: '#1F5245', border: '1px solid rgba(31,82,69,.3)', borderRadius: '3px' }}
                            >
                              Relancer
                            </button>
                          </div>
                        )}
                        {status === 'accepted' && (
                          <div className="flex items-center justify-center gap-1.5" style={{ marginTop: '12px', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 12px', backgroundColor: 'rgba(31,82,69,.08)', color: '#1F5245', borderRadius: '3px' }}>
                            <CheckCircle size={13} weight="fill" />
                            Signé
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
        <section style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2DACD' }}>
                  <th style={{ padding: '12px 16px', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={quotes.length > 0 && selectedQuoteIds.size === quotes.length}
                      onChange={toggleSelectAll}
                      style={{ width: '15px', height: '15px', accentColor: '#1F5245' }}
                    />
                  </th>
                  {['ID', 'Client', 'Service', 'Statut', 'Montant', 'Date'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: '#6E6A63', fontSize: '13px' }}>
                      Aucun devis trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredQuotes.map((quote: Quote) => (
                    <tr
                      key={quote.id}
                      onClick={() => { setSelectedQuote(quote); setIsDetailModalOpen(true) }}
                      style={{ borderBottom: '1px solid #F0EAE0', cursor: 'pointer' }}
                    >
                      <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedQuoteIds.has(quote.id)}
                          onChange={(e) => toggleSelectQuote(e as unknown as React.MouseEvent, quote.id)}
                          style={{ width: '15px', height: '15px', accentColor: '#1F5245' }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: '#1F5245', backgroundColor: 'rgba(31,82,69,.08)', padding: '3px 8px', borderRadius: '2px' }}>
                          #{quote.id.toString().padStart(4, '0')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#12100E' }}>{quote.customerName}</div>
                        <div style={{ fontSize: '11.5px', color: '#6E6A63' }}>{quote.customerEmail}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="flex items-center gap-2" style={{ color: '#6E6A63' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '3px', backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', display: 'grid', placeItems: 'center' }}>
                            {getServiceIcon(quote.service)}
                          </div>
                          <span style={{ fontSize: '13px' }}>{quote.service}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge domain="quote" value={quote.status} audience="admin" live={quote.status === 'in_progress'} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#12100E' }}>
                          {formatCurrency(quote.estimatedPrice)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="flex items-center gap-1.5" style={{ color: '#6E6A63', fontSize: '12px' }}>
                          <Calendar size={13} />
                          {formatDate(quote.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
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
    </div>
  )
}
