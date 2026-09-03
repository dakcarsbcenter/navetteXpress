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
  FileText,
  Trash,
  X
} from "@phosphor-icons/react"
import { downloadInvoicePDF } from '@/lib/invoice-pdf'
import { BulkDeleteModal } from '@/components/ui/BulkDeleteModal'
import { NotificationCenter } from '@/components/ui/NotificationCenter'
import { useNotification } from '@/hooks/useNotification'
import { StatusBadge } from '@/components/shared/StatusBadge'

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

const fieldLabel: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1F5245', marginBottom: '8px',
}
const fieldInput: React.CSSProperties = {
  width: '100%', height: '42px', padding: '0 14px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13.5px', color: '#12100E',
}

export default function InvoicesManagement() {
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

  const { notifications, showSuccess, showError, removeNotification } = useNotification()

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

      await downloadInvoicePDF(invoiceData)
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
      const payload = {
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
    const today = new Date()
    const dueDate = new Date()
    dueDate.setDate(today.getDate() + 15)

    setFormData({
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

  const exportToPDF = async () => {
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        // @ts-expect-error jspdf's ESM build has no type declarations; the shape matches the main 'jspdf' export
        import('jspdf/dist/jspdf.es.min.js'),
        import('jspdf-autotable')
      ])

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
            Facturation
          </span>
          <h2 style={{ margin: 0, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Factures &amp; paiements.
          </h2>
          <p style={{ margin: 0, fontSize: '15px', color: '#3d3a35' }}>
            Suivi de la facturation et des encaissements.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedInvoiceIds.size > 0 && (
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-2"
              style={{ height: '40px', padding: '0 16px', backgroundColor: 'rgba(184,73,60,.08)', border: '1px solid rgba(184,73,60,.25)', borderRadius: '4px', color: '#B8493C', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Trash size={15} />
              Supprimer ({selectedInvoiceIds.size})
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
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2"
            style={{ height: '40px', padding: '0 18px', backgroundColor: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <Plus size={15} weight="bold" />
            Créer facture
          </button>
        </div>
      </section>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '360px' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6E6A63' }} />
        <input
          type="text"
          placeholder="Rechercher facture, client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...fieldInput, paddingLeft: '40px' }}
        />
      </div>

      {/* Stats Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', borderTop: '1px solid #E2DACD', borderBottom: '1px solid #E2DACD' }}>
        {[
          { label: "Chiffre d'affaires", value: `${(stats.totalRevenue / 1000000).toFixed(1)}M`, icon: DollarSign },
          { label: "Payées (mois)", value: String(stats.paidThisMonth), icon: TrendingUp },
          { label: "En attente", value: String(stats.pending), icon: Calendar },
          { label: "En retard", value: String(stats.overdue), icon: AlertCircle },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} style={{ padding: '18px 20px', borderRight: i < 3 ? '1px solid #E2DACD' : 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Icon size={17} style={{ color: i === 3 ? '#B8493C' : '#1F5245' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '23px', fontWeight: 600, letterSpacing: '-0.01em', color: '#12100E' }}>{stat.value}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>{stat.label}</span>
            </div>
          )
        })}
      </section>

      {/* Invoices Table */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', overflow: 'hidden' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2DACD' }}>
                <th style={{ padding: '12px 16px', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={filteredInvoices.length > 0 && selectedInvoiceIds.size === filteredInvoices.length}
                    onChange={toggleSelectAll}
                    style={{ width: '15px', height: '15px', accentColor: '#1F5245' }}
                  />
                </th>
                {['N° Facture', 'Client', 'Échéance', 'Montant TTC', 'Statut', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: '#6E6A63', fontSize: '13px' }}>
                    Aucune facture trouvée
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} style={{ borderBottom: '1px solid #F0EAE0' }}>
                    <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedInvoiceIds.has(invoice.id)}
                        onChange={(e) => toggleSelectInvoice(e as unknown as React.MouseEvent, invoice.id)}
                        style={{ width: '15px', height: '15px', accentColor: '#1F5245' }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: '32px', height: '32px', borderRadius: '3px', backgroundColor: 'rgba(31,82,69,.08)', display: 'grid', placeItems: 'center' }}>
                          <FileText size={16} style={{ color: '#1F5245' }} />
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#12100E' }}>{invoice.invoiceNumber}</div>
                          <div style={{ fontSize: '10.5px', color: '#6E6A63' }}>{formatDate(invoice.issueDate)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#12100E' }}>{invoice.customerName}</div>
                      <div style={{ fontSize: '11.5px', color: '#6E6A63' }}>{invoice.customerEmail}</div>
                      <div style={{ fontSize: '10.5px', color: '#9a938a', marginTop: '2px' }}>{invoice.service || 'Service Multiple'}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '13px', color: invoice.status === 'overdue' ? '#B8493C' : '#6E6A63', fontWeight: invoice.status === 'overdue' ? 600 : 400 }}>
                        {formatDate(invoice.dueDate)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#12100E' }}>
                        {formatCurrency(invoice.amountTTC)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge domain="invoice" value={invoice.status} audience="admin" live={invoice.status === 'pending'} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF(invoice.id)}
                        title="Télécharger PDF"
                        style={{ display: 'grid', placeItems: 'center', width: '32px', height: '32px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63', cursor: 'pointer' }}
                      >
                        <Download size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between" style={{ padding: '14px 20px', borderTop: '1px solid #E2DACD', fontSize: '11.5px', color: '#6E6A63' }}>
          <div>Affichage de 1-3 sur {filteredInvoices.length} factures</div>
          <div className="flex items-center gap-1">
            <button style={{ padding: '4px 10px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63' }}>Préc.</button>
            <button style={{ padding: '4px 10px', backgroundColor: '#1F5245', color: '#FFFFFF', borderRadius: '3px' }}>1</button>
            <button style={{ padding: '4px 10px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63' }}>2</button>
            <button style={{ padding: '4px 10px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63' }}>Suiv.</button>
          </div>
        </div>
      </section>

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(18,16,14,.55)' }} onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative dash-scroll" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 600, color: '#12100E', letterSpacing: '-0.01em' }}>Nouvelle facture</h2>
                <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63' }}>Document financier officiel</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ display: 'grid', placeItems: 'center', width: '36px', height: '36px', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label style={fieldLabel}>Numéro de facture</label>
                  <input type="text" value="Généré automatiquement à la validation" readOnly style={{ ...fieldInput, fontFamily: 'var(--font-mono)', backgroundColor: '#F7F3EC', color: '#6E6A63' }} />
                </div>

                <div>
                  <label style={fieldLabel}>Lier à un devis *</label>
                  <select value={formData.quoteId} onChange={(e) => handleQuoteSelect(e.target.value)} required style={fieldInput}>
                    <option value="">Sélectionner un devis...</option>
                    {quotes.map(quote => (
                      <option key={quote.id} value={quote.id}>
                        #{quote.id} - {quote.customerName} ({quote.service})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={fieldLabel}>Nom du client</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                    placeholder="Ex: Jean Dupont"
                    style={fieldInput}
                  />
                </div>

                <div>
                  <label style={fieldLabel}>Email</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    required
                    placeholder="jean@example.com"
                    style={fieldInput}
                  />
                </div>

                <div>
                  <label style={fieldLabel}>Service</label>
                  <input
                    type="text"
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    required
                    placeholder="Ex: Transfert Aéroport"
                    style={fieldInput}
                  />
                </div>

                <div>
                  <label style={fieldLabel}>Date d&apos;échéance</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                    style={fieldInput}
                  />
                </div>
              </div>

              {/* Finance Section */}
              <div style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '4px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#1F5245' }}>
                  Chiffrage &amp; taxes
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label style={fieldLabel}>Montant HT (FCFA)</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      required
                      style={{ ...fieldInput, backgroundColor: '#FFFFFF', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <div>
                    <label style={fieldLabel}>TVA (20%)</label>
                    <input type="text" value={formData.taxAmount} readOnly style={{ ...fieldInput, backgroundColor: '#FFFFFF', fontFamily: 'var(--font-mono)', color: '#6E6A63' }} />
                  </div>

                  <div>
                    <label style={fieldLabel}>Total TTC</label>
                    <input type="text" value={formData.totalAmount} readOnly style={{ ...fieldInput, backgroundColor: 'rgba(31,82,69,.08)', border: '1px solid rgba(31,82,69,.3)', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#1F5245' }} />
                  </div>
                </div>
              </div>

              <div>
                <label style={fieldLabel}>Notes internes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes optionnelles sur la facturation..."
                  style={{ ...fieldInput, height: 'auto', minHeight: '100px', padding: '12px 14px', resize: 'none' }}
                />
              </div>

              <div className="flex gap-3" style={{ paddingTop: '16px', borderTop: '1px solid #E2DACD' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ flex: 1, height: '46px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', color: '#6E6A63', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2"
                  style={{ flex: 2, height: '46px', backgroundColor: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor: 'rgba(255,255,255,.35)', borderTopColor: '#FFFFFF' }} />
                  ) : (
                    <>
                      <FileText size={17} weight="bold" />
                      Générer la facture
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
