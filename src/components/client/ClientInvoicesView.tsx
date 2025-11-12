'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { downloadInvoicePDF } from '@/lib/invoice-pdf'
import { CheckCircle, XCircle, X } from 'lucide-react'

interface Invoice {
  id: number
  invoiceNumber: string
  quoteId: number
  customerName: string
  customerEmail: string
  service: string
  amount: string
  taxRate: string
  taxAmount: string
  totalAmount: string
  status: 'draft' | 'pending' | 'paid' | 'cancelled' | 'overdue'
  issueDate: string
  dueDate: string
  paidDate: string | null
  paymentMethod: string | null
  notes: string | null
  createdAt: string
}

export function ClientInvoicesView() {
  const { data: session } = useSession()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'success' | 'error'>('success')
  const [modalMessage, setModalMessage] = useState('')

  useEffect(() => {
    if (session?.user) {
      loadInvoices()
    }
  }, [session])

  const loadInvoices = async () => {
    try {
      setIsLoading(true)
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
      setIsLoading(false)
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
        notes: invoice.notes || invoice.quote?.clientNotes || undefined
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

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      draft: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300'
    }

    const labels = {
      pending: 'En attente',
      paid: 'Payée',
      cancelled: 'Annulée',
      overdue: 'En retard',
      draft: 'Brouillon'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const filteredInvoices = filter === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status === filter)

  const stats = {
    total: invoices.length,
    pending: invoices.filter(inv => inv.status === 'pending').length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
    totalAmount: invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600 dark:text-slate-400">Chargement des factures...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">🧾</span>
          <div>
            <h1 className="text-3xl font-bold">Mes factures</h1>
            <p className="text-blue-100 dark:text-blue-200 mt-1">
              Consultez et gérez vos factures
            </p>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm text-blue-100">Total</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold text-yellow-300">{stats.pending}</div>
            <div className="text-sm text-blue-100">En attente</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold text-green-300">{stats.paid}</div>
            <div className="text-sm text-blue-100">Payées</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">{stats.totalAmount.toLocaleString()} FCFA</div>
            <div className="text-sm text-blue-100">Total payé</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Toutes ({stats.total})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            En attente ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'paid'
                ? 'bg-green-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Payées ({stats.paid})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'overdue'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            En retard ({stats.overdue})
          </button>
        </div>
      </div>

      {/* Liste des factures */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🧾</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Aucune facture
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {filter === 'all' 
                ? "Vous n'avez pas encore de factures. Les factures sont générées automatiquement lorsque vous acceptez un devis."
                : `Vous n'avez pas de factures avec le statut "${filter}".`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {invoice.invoiceNumber}
                      </h3>
                      {getStatusBadge(invoice.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-slate-600 dark:text-slate-400">Service</div>
                        <div className="text-slate-900 dark:text-white font-medium">{invoice.service}</div>
                      </div>

                      <div>
                        <div className="text-slate-600 dark:text-slate-400">Date d'émission</div>
                        <div className="text-slate-900 dark:text-white font-medium">
                          {new Date(invoice.issueDate).toLocaleDateString('fr-FR')}
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-600 dark:text-slate-400">Date d'échéance</div>
                        <div className="text-slate-900 dark:text-white font-medium">
                          {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-600 dark:text-slate-400">Montant TTC</div>
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {parseFloat(invoice.totalAmount).toLocaleString()} FCFA
                        </div>
                      </div>
                    </div>

                    {invoice.paidDate && (
                      <div className="mt-3 text-sm text-green-600 dark:text-green-400">
                        ✅ Payée le {new Date(invoice.paidDate).toLocaleDateString('fr-FR')}
                        {invoice.paymentMethod && ` via ${invoice.paymentMethod}`}
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => handleDownloadPDF(invoice.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Télécharger PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale de notification moderne */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              {/* Icône */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                modalType === 'success' 
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
              <h3 className={`text-2xl font-bold mb-2 ${
                modalType === 'success' 
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
                className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 ${
                  modalType === 'success'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/50'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/50'
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
