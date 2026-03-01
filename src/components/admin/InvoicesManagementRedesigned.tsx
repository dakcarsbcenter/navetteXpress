'use client'

import { useEffect, useState } from 'react'
import {
  MagnifyingGlass as Search,
  Plus,
  CurrencyDollar as DollarSign,
  TrendUp as TrendingUp,
  WarningCircle as AlertCircle,
  Calendar,
  Download,
  DotsThreeVertical as MoreVertical,
  Funnel as Filter,
  FileText,
  Trash,
  X
} from "@phosphor-icons/react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { downloadInvoicePDF } from '@/lib/invoice-pdf'
import { BulkDeleteModal } from '@/components/ui/BulkDeleteModal'
import { NotificationCenter } from '@/components/ui/NotificationCenter'
import { useNotification } from '@/hooks/useNotification'

type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'cancelled' | 'overdue'

interface Invoice {
  id: number
  invoiceNumber: string
  quoteId: number
  customerId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  service?: string
  amountHT: number
  vatAmount: number
  amountTTC: number
  taxRate?: number
  status: InvoiceStatus
  issueDate: Date
  dueDate: Date
  paidDate?: Date
  paymentMethod?: string
  notes?: string
  quote?: any
}

export default function InvoicesManagementRedesigned() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | InvoiceStatus>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<number>>(new Set())
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quotes, setQuotes] = useState<any[]>([])

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    quoteId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    service: '',
    amount: '',
    taxRate: '20',
    taxAmount: '0',
    totalAmount: '0',
    dueDate: '',
    notes: ''
  })

  const { notifications, showSuccess, showError, showWarning, removeNotification } = useNotification()

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/invoices')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setInvoices(data.invoices || [])
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setQuotes(data.data || [])
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des devis:', error)
    }
  }

  useEffect(() => {
    fetchInvoices()
    fetchQuotes()
  }, [])

  const getStatsData = () => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amountTTC, 0)
    const paidThisMonth = invoices.filter(inv => {
      if (inv.status !== 'paid' || !inv.paidDate) return false
      const paidDate = new Date(inv.paidDate)
      const now = new Date()
      return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear()
    }).length
    const pending = invoices.filter(inv => inv.status === 'pending').length
    const overdue = invoices.filter(inv => inv.status === 'overdue').length

    return { totalRevenue, paidThisMonth, pending, overdue }
  }

  const filteredInvoices = invoices.filter(inv => {
    const matchesFilter = filter === 'all' || inv.status === filter
    const matchesSearch = searchTerm === '' ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Transformed for Dark Theme visibility
  const getStatusBadge = (status: InvoiceStatus) => {
    const configs: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
      paid: { label: 'Payée', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
      pending: { label: 'En Attente', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
      overdue: { label: 'En Retard', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
      draft: { label: 'Brouillon', color: 'text-slate-400', bg: 'bg-white/5 border-white/10' },
      cancelled: { label: 'Annulée', color: 'text-slate-400', bg: 'bg-white/5 border-white/10' }
    }
    return configs[status]
  }

  const formatDate = (dateString: Date | string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`
  }

  const handleDownloadPDF = async (invoiceId: number) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (!response.ok) throw new Error('Erreur lors de la récupération de la facture')

      const data = await response.json()
      if (!data.success || !data.invoice) throw new Error('Facture introuvable')

      const invoice = data.invoice

      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        customerPhone: invoice.customerPhone || '',
        service: invoice.service,
        amountHT: invoice.amountHT,
        vatAmount: invoice.vatAmount,
        amountTTC: invoice.amountTTC,
        taxRate: invoice.taxRate,
        issueDate: new Date(invoice.issueDate).toLocaleDateString('fr-FR'),
        dueDate: new Date(invoice.dueDate).toLocaleDateString('fr-FR'),
        status: invoice.status,
        items: invoice.quote?.message ? [
          {
            description: invoice.service + (invoice.quote.message ? ` - ${invoice.quote.message}` : ''),
            quantity: 1,
            price: invoice.amountHT,
            total: invoice.amountHT
          }
        ] : undefined,
        notes: invoice.notes || invoice.quote?.adminNotes || undefined
      }

      downloadInvoicePDF(invoiceData)
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error)
    }
  }

  const toggleSelectAll = () => {
    if (selectedInvoiceIds.size === filteredInvoices.length && filteredInvoices.length > 0) {
      setSelectedInvoiceIds(new Set())
    } else {
      setSelectedInvoiceIds(new Set(filteredInvoices.map(inv => inv.id)))
    }
  }

  const toggleSelectInvoice = (e: React.MouseEvent, invoiceId: number) => {
    e.stopPropagation()
    setSelectedInvoiceIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId)
      } else {
        newSet.add(invoiceId)
      }
      return newSet
    })
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Préparer les données pour l'API
      const payload = {
        invoiceNumber: formData.invoiceNumber,
        quoteId: parseInt(formData.quoteId),
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        service: formData.service,
        amount: formData.amount,
        taxRate: formData.taxRate,
        taxAmount: formData.taxAmount,
        totalAmount: formData.totalAmount,
        dueDate: new Date(formData.dueDate).toISOString(),
        notes: formData.notes,
        status: 'pending'
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        showSuccess('Facture créée avec succès', 'Succès')
        setIsCreateModalOpen(false)
        fetchInvoices()
      } else {
        showError(data.error || 'Erreur lors de la création', 'Erreur')
      }
    } catch (error) {
      showError('Erreur technique', 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openCreateModal = () => {
    const nextNumber = invoices.length + 1
    const today = new Date()
    const dueDate = new Date()
    dueDate.setDate(today.getDate() + 15) // Échéance à 15 jours par défaut

    setFormData({
      invoiceNumber: `INV-${today.getFullYear()}-${nextNumber.toString().padStart(5, '0')}`,
      quoteId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      service: '',
      amount: '',
      taxRate: '20',
      taxAmount: '0',
      totalAmount: '0',
      dueDate: dueDate.toISOString().split('T')[0],
      notes: ''
    })
    setIsCreateModalOpen(true)
  }

  const handleQuoteSelect = (quoteId: string) => {
    const quote = quotes.find(q => q.id.toString() === quoteId)
    if (quote) {
      const amount = quote.estimatedPrice || '0'
      const taxRate = 20
      const taxAmount = (parseFloat(amount) * taxRate) / 100
      const totalAmount = parseFloat(amount) + taxAmount

      setFormData(prev => ({
        ...prev,
        quoteId,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        customerPhone: quote.customerPhone || '',
        service: quote.service,
        amount: amount,
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        notes: quote.adminNotes || ''
      }))
    }
  }

  const handleAmountChange = (amount: string) => {
    const amt = parseFloat(amount) || 0
    const rate = parseFloat(formData.taxRate) || 0
    const tax = (amt * rate) / 100
    const total = amt + tax

    setFormData(prev => ({
      ...prev,
      amount,
      taxAmount: tax.toFixed(2),
      totalAmount: total.toFixed(2)
    }))
  }

  const handleBulkDelete = async () => {
    try {
      const response = await fetch('/api/invoices/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedInvoiceIds) })
      })

      const data = await response.json()

      if (response.ok) {
        showSuccess(data.message || 'Factures supprimées', 'Succès')
        setSelectedInvoiceIds(new Set())
        fetchInvoices()
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
      doc.text("Liste des Factures - Navette Xpress", 14, 15)

      const tableColumn = ["Facture", "Client", "Statut", "Date", "Montant"]
      const tableRows: any[] = []

      filteredInvoices.forEach(inv => {
        const row = [
          inv.invoiceNumber,
          inv.customerName,
          inv.status,
          new Date(inv.issueDate).toLocaleDateString('fr-FR'),
          `${inv.amountTTC.toLocaleString('fr-FR')} FCFA`
        ]
        tableRows.push(row)
      })

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        styles: { fontSize: 10 }
      })

      doc.save("factures_export.pdf")
      showSuccess("Factures exportées en PDF", "Export réussi")
    } catch (error) {
      showError("Erreur lors de l'export PDF", "Erreur technique")
    }
  }

  const stats = getStatsData()

  if (loading) {
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
            <h1 className="text-2xl font-bold text-white">Factures & Paiements</h1>
            <p className="text-xs text-slate-500 mt-1">Suivi de la facturation et des encaissements.</p>
          </div>
          <div className="flex gap-2">
            {selectedInvoiceIds.size > 0 && (
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors"
              >
                <Trash className="w-5 h-5" />
                <span className="hidden sm:inline">Supprimer ({selectedInvoiceIds.size})</span>
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
              onClick={openCreateModal}
              className="btn-gold flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-gold/10 whitespace-nowrap"
            >
              <Plus weight="bold" className="w-4 h-4" />
              Créer facture
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher facture, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-gold/50 transition-all placeholder-slate-500"
            />
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-gold/50 rounded-xl transition-all">
            <Filter className="w-4 h-4" />
            Filtrer
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-gold/50 rounded-xl transition-all">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "CHIFFRE D'AFFAIRES", value: `${(stats.totalRevenue / 1000000).toFixed(1)}M`, color: 'var(--color-gold)', icon: <DollarSign size={20} /> },
          { label: "PAYÉES (MOIS)", value: stats.paidThisMonth, color: '#10B981', icon: <TrendingUp size={20} /> },
          { label: "EN ATTENTE", value: stats.pending, color: '#F59E0B', icon: <Calendar size={20} /> },
          { label: "EN RETARD", value: stats.overdue, color: '#EF4444', icon: <AlertCircle size={20} /> },
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

      {/* Invoices Table */}
      <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ backgroundColor: 'var(--color-dash-card)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="pl-6 w-12 py-4">
                  <input
                    type="checkbox"
                    checked={filteredInvoices.length > 0 && selectedInvoiceIds.size === filteredInvoices.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-gold focus:ring-gold/50 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">N° Facture</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Client</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Échéance</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Montant TTC</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Statut</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Aucune facture trouvée
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const statusBadge = getStatusBadge(invoice.status)

                  return (
                    <tr key={invoice.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="pl-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedInvoiceIds.has(invoice.id)}
                          onChange={(e) => toggleSelectInvoice(e as unknown as React.MouseEvent, invoice.id)}
                          className="w-4 h-4 rounded border-white/10 bg-white/5 text-gold focus:ring-gold/50 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <FileText size={20} className="text-blue-500" />
                          </div>
                          <div>
                            <div className="font-bold text-white font-mono">{invoice.invoiceNumber}</div>
                            <div className="text-[10px] text-slate-500">{formatDate(invoice.issueDate)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{invoice.customerName}</div>
                        <div className="text-xs text-slate-500">{invoice.customerEmail}</div>
                        <div className="text-[10px] text-slate-600 mt-1">{invoice.service || 'Service Multiple'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${invoice.status === 'overdue' ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                          {formatDate(invoice.dueDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-white font-mono">
                          {formatCurrency(invoice.amountTTC)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusBadge.bg} ${statusBadge.color}`}>
                          {invoice.status === 'paid' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                          {invoice.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadPDF(invoice.id)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                            title="Télécharger PDF"
                          >
                            <Download size={18} />
                          </button>
                          <button
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                            title="Plus d'options"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
          <div>
            Affichage de 1-3 sur {filteredInvoices.length} factures
          </div>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">Préc.</button>
            <button className="px-3 py-1 bg-white/10 text-white rounded-lg">1</button>
            <button className="px-3 py-1 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">2</button>
            <button className="px-3 py-1 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">Suiv.</button>
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121A] rounded-2xl border border-white/10 shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Nouvelle Facture</h2>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Document financier officiel</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-inner"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Numéro & Devis */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Numéro de Facture</label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    readOnly
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-gold font-mono text-sm focus:outline-none focus:border-gold/30 transition-all opacity-70 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Lier à un Devis *</label>
                  <select
                    value={formData.quoteId}
                    onChange={(e) => handleQuoteSelect(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold/50 transition-all cursor-pointer [&>option]:bg-[#12121A]"
                  >
                    <option value="">Sélectionner un devis...</option>
                    {quotes.map(quote => (
                      <option key={quote.id} value={quote.id}>
                        #{quote.id} - {quote.customerName} ({quote.service})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Client Info */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Nom du Client</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold/50 transition-all placeholder-slate-600"
                    placeholder="Ex: Jean Dupont"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Email</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold/50 transition-all placeholder-slate-600"
                    placeholder="jean@example.com"
                  />
                </div>

                {/* Service & Date */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Service</label>
                  <input
                    type="text"
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold/50 transition-all placeholder-slate-600"
                    placeholder="Ex: Transfert Aéroport"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Date d'échéance</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold/50 transition-all"
                  />
                </div>
              </div>

              {/* Finance Section */}
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[40px] rounded-full" />

                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold mb-6 ml-1">Chiffrage & Taxes</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Montant HT (FCFA)</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-gold/50 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">TVA (20%)</label>
                    <input
                      type="text"
                      value={formData.taxAmount}
                      readOnly
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-slate-400 font-mono opacity-70"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total TTC</label>
                    <input
                      type="text"
                      value={formData.totalAmount}
                      readOnly
                      className="w-full px-4 py-3 bg-gold/10 border border-gold/20 rounded-xl text-gold font-bold font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Notes Internes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold/50 transition-all min-h-[100px] resize-none placeholder-slate-600"
                  placeholder="Notes optionnelles sur la facturation..."
                />
              </div>

              <div className="flex gap-4 pt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-6 py-4 border border-white/10 text-slate-400 rounded-2xl hover:bg-white/5 hover:text-white transition-all text-xs font-black uppercase tracking-[0.2em]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] btn-gold px-6 py-4 rounded-2xl shadow-2xl shadow-gold/20 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black animate-spin rounded-full" />
                  ) : (
                    <>
                      <FileText size={18} weight="bold" />
                      Générer la Facture
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        count={selectedInvoiceIds.size}
        resourceName="factures"
      />
    </div>
  )
}
