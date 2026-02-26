'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { downloadInvoicePDF } from '@/lib/invoice-pdf'
import { CheckCircle, XCircle, X } from "@phosphor-icons/react"

type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'cancelled' | 'overdue'

interface Invoice {
  id: number
  invoiceNumber: string
  quoteId: number
  customerId: string
  customerName: string
  amountHT: number
  vatAmount: number
  amountTTC: number
  status: InvoiceStatus
  issueDate: Date
  dueDate: Date
  paidDate?: Date
  paymentMethod?: string
  notes?: string
}

interface InvoiceStats {
  total: number
  pending: number
  paid: number
  overdue: number
  totalAmountHT: number
  totalAmountTTC: number
  paidAmountTTC: number
}

export default function AdminInvoicesView() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | InvoiceStatus>('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'success' | 'error'>('success')
  const [modalMessage, setModalMessage] = useState('')

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

  const handleDownloadPDF = async (invoiceId: number) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la facture')
      }

      const data = await response.json()
      if (!data.success || !data.invoice) {
        throw new Error('Facture introuvable')
      }

      const invoice = data.invoice

      // Préparer les données pour le PDF
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

      // Télécharger le PDF
      downloadInvoicePDF(invoiceData)

      // Notification de succès
      setModalType('success')
      setModalMessage('PDF téléchargé avec succès!')
      setShowModal(true)
      setTimeout(() => setShowModal(false), 3000)
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error)
      setModalType('error')
      setModalMessage('Erreur lors du téléchargement du PDF')
      setShowModal(true)
      setTimeout(() => setShowModal(false), 3000)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const stats: InvoiceStats = {
    total: invoices.length,
    pending: invoices.filter(inv => inv.status === 'pending').length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
    totalAmountHT: invoices.reduce((sum, inv) => sum + inv.amountHT, 0),
    totalAmountTTC: invoices.reduce((sum, inv) => sum + inv.amountTTC, 0),
    paidAmountTTC: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amountTTC, 0),
  }

  const filteredInvoices = filter === 'all'
    ? invoices
    : invoices.filter(inv => inv.status === filter)

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'pending': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'overdue': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'draft': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      case 'cancelled': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getStatusLabel = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return 'Payée'
      case 'pending': return 'En attente'
      case 'overdue': return 'En retard'
      case 'draft': return 'Brouillon'
      case 'cancelled': return 'Annulée'
      default: return status
    }
  }

  const handleMarkAsPaid = async () => {
    if (!selectedInvoice || !paymentMethod) return

    try {
      const response = await fetch(`/api/invoices/${selectedInvoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          paymentMethod,
        }),
      })

      if (response.ok) {
        await fetchInvoices()
        setShowPaymentModal(false)
        setSelectedInvoice(null)
        setPaymentMethod('')
      }
    } catch (error) {
      console.error('Erreur lors du paiement:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des factures...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestion des Factures</h1>
          <p className="text-gray-400 mt-1">Gérez toutes les factures de vos clients</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Factures</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="text-4xl">🧾</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-linear-to-br from-blue-900/50 to-slate-900 rounded-xl p-6 border border-blue-500/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm">En attente</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.pending}</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-linear-to-br from-green-900/50 to-slate-900 rounded-xl p-6 border border-green-500/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm">Payées</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.paid}</p>
              <p className="text-xs text-green-400 mt-1">
                {stats.paidAmountTTC.toLocaleString()} FCFA
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-linear-to-br from-red-900/50 to-slate-900 rounded-xl p-6 border border-red-500/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-300 text-sm">En retard</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.overdue}</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
        >
          Toutes ({stats.total})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
        >
          En attente ({stats.pending})
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'paid'
              ? 'bg-green-600 text-white'
              : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
        >
          Payées ({stats.paid})
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'overdue'
              ? 'bg-red-600 text-white'
              : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
        >
          En retard ({stats.overdue})
        </button>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-gray-400 text-lg">Aucune facture trouvée</p>
          </div>
        ) : (
          filteredInvoices.map((invoice, index) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{invoice.invoiceNumber}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <p className="text-gray-400">
                      <span className="text-gray-500">Client:</span>{' '}
                      <span className="text-white">{invoice.customerName}</span>
                    </p>
                    <p className="text-gray-400">
                      <span className="text-gray-500">Devis #:</span>{' '}
                      <span className="text-white">{invoice.quoteId}</span>
                    </p>
                    <p className="text-gray-400">
                      <span className="text-gray-500">Émise le:</span>{' '}
                      <span className="text-white">{new Date(invoice.issueDate).toLocaleDateString()}</span>
                    </p>
                    <p className="text-gray-400">
                      <span className="text-gray-500">Échéance:</span>{' '}
                      <span className="text-white">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                    </p>
                    {invoice.paidDate && (
                      <p className="text-gray-400">
                        <span className="text-gray-500">Payée le:</span>{' '}
                        <span className="text-green-400">{new Date(invoice.paidDate).toLocaleDateString()}</span>
                      </p>
                    )}
                    {invoice.paymentMethod && (
                      <p className="text-gray-400">
                        <span className="text-gray-500">Moyen:</span>{' '}
                        <span className="text-white">{invoice.paymentMethod}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col lg:items-end gap-3">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Montant HT</p>
                    <p className="text-lg font-semibold text-gray-300">
                      {invoice.amountHT.toLocaleString()} FCFA
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">TVA (20%)</p>
                    <p className="text-lg font-semibold text-gray-300">
                      {invoice.vatAmount.toLocaleString()} FCFA
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Montant TTC</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {invoice.amountTTC.toLocaleString()} FCFA
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      onClick={() => handleDownloadPDF(invoice.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Télécharger PDF
                    </button>
                    {invoice.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice)
                          setShowPaymentModal(true)
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium"
                      >
                        Marquer comme payée
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-sm text-gray-400">
                    <span className="font-medium">Notes:</span> {invoice.notes}
                  </p>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl p-6 max-w-md w-full border border-slate-700"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              Marquer la facture comme payée
            </h2>
            <p className="text-gray-400 mb-4">
              Facture: <span className="text-white font-semibold">{selectedInvoice.invoiceNumber}</span>
            </p>
            <p className="text-gray-400 mb-6">
              Montant: <span className="text-blue-400 font-bold text-xl">{selectedInvoice.amountTTC.toLocaleString()} FCFA</span>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Moyen de paiement *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Sélectionner...</option>
                <option value="Carte bancaire">Carte bancaire</option>
                <option value="Espèces">Espèces</option>
                <option value="Virement">Virement</option>
                <option value="Chèque">Chèque</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setSelectedInvoice(null)
                  setPaymentMethod('')
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={!paymentMethod}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium"
              >
                Confirmer le paiement
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modale de notification moderne */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              {/* Icône */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${modalType === 'success'
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                {modalType === 'success' ? (
                  <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                )}
              </div>

              {/* Message */}
              <h3 className={`text-2xl font-bold mb-2 ${modalType === 'success'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
                }`}>
                {modalType === 'success' ? 'Succès!' : 'Erreur!'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {modalMessage}
              </p>

              {/* Bouton OK */}
              <button
                onClick={() => setShowModal(false)}
                className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 ${modalType === 'success'
                    ? 'bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/50'
                    : 'bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/50'
                  }`}
              >
                OK
              </button>

              {/* Bouton fermer en haut à droite */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

