'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, DollarSign, TrendingUp, AlertCircle, Calendar, Download, MoreVertical, Filter, FileText } from 'lucide-react'
import { downloadInvoicePDF } from '@/lib/invoice-pdf'

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

  useEffect(() => {
    fetchInvoices()
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

  const getStatusBadge = (status: InvoiceStatus) => {
    const configs: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
      paid: { label: 'Payée', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
      pending: { label: 'En Attente', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
      overdue: { label: 'En Retard', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
      draft: { label: 'Brouillon', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
      cancelled: { label: 'Annulée', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' }
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

  const stats = getStatsData()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Factures & Paiements</h1>
            <p className="text-sm text-gray-500 mt-1">Suivi de la facturation et des encaissements.</p>
          </div>
          <button
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Créer facture
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">CHIFFRE D'AFFAIRES</div>
                <div className="text-3xl font-bold text-gray-900">{(stats.totalRevenue / 1000000).toFixed(1)}M</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-700 mb-1">PAYÉES (MOIS)</div>
                <div className="text-3xl font-bold text-green-600">{stats.paidThisMonth}</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
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

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-red-700 mb-1">EN RETARD</div>
                <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
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
              placeholder="Rechercher facture, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filtrer
          </button>

          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase">N° Facture</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase">Client</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase">Date Émission</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase">Échéance</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase">Montant TTC</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase">Statut</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Aucune facture trouvée
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const statusBadge = getStatusBadge(invoice.status)
                  
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-blue-700">
                              {invoice.customerName.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{invoice.invoiceNumber}</div>
                            <div className="text-xs text-gray-500">{invoice.service || 'Service'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{invoice.customerName}</div>
                        <div className="text-sm text-gray-500">{invoice.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{formatDate(invoice.issueDate)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${invoice.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {formatDate(invoice.dueDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(invoice.amountTTC)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusBadge.bg} ${statusBadge.color}`}>
                          {invoice.status === 'paid' && '✓ '}
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadPDF(invoice.id)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Télécharger PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Plus d'options"
                          >
                            <MoreVertical className="w-4 h-4" />
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
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Affichage de 1-3 sur {filteredInvoices.length} factures
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Préc.
            </button>
            <button className="px-3 py-1 text-sm bg-red-600 text-white rounded">
              1
            </button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              2
            </button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Suiv.
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
