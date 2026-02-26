'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { downloadInvoicePDF } from '@/lib/invoice-pdf'
import { CheckCircle, XCircle, X } from "@phosphor-icons/react"

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
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      draft: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
    }

    const labels = {
      pending: 'En attente',
      paid: 'Payée',
      cancelled: 'Annulée',
      overdue: 'En retard',
      draft: 'Brouillon'
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {status === 'paid' && (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
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
      {/* En-tête avec statistiques - Style capture Bordeaux */}
      <div className="bg-linear-to-br from-[#A73B3C] via-[#8B3032] to-[#6B2428] rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
        {/* Motif de fond décoratif */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-[#E5C16C] rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Mes factures</h1>
              <p className="text-white/80 mt-1">
                Consultez et gérez vos factures, suivez vos paiements en temps réel.
              </p>
            </div>
          </div>

          {/* Statistiques avec badges blancs transparents */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 border border-white/30 hover:bg-white/25 transition-all">
              <div className="text-4xl font-bold mb-1">{stats.total}</div>
              <div className="text-sm text-white/90 uppercase tracking-wide font-medium">TOTAL</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 border border-white/30 hover:bg-white/25 transition-all">
              <div className="text-4xl font-bold text-yellow-300 mb-1">{stats.pending}</div>
              <div className="text-sm text-white/90 uppercase tracking-wide font-medium">EN ATTENTE</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 border border-white/30 hover:bg-white/25 transition-all">
              <div className="text-4xl font-bold text-green-300 mb-1">{stats.paid}</div>
              <div className="text-sm text-white/90 uppercase tracking-wide font-medium">PAYÉES</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 border border-white/30 hover:bg-white/25 transition-all">
              <div className="text-2xl font-bold mb-1">{stats.totalAmount.toLocaleString()} FCFA</div>
              <div className="text-sm text-white/90 uppercase tracking-wide font-medium">TOTAL PAYÉ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres - Style onglets capture */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 text-sm font-semibold transition-all relative ${
              filter === 'all'
                ? 'text-white bg-[#A73B3C] rounded-t-xl'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#A73B3C] hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            Toutes ({stats.total})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-6 py-3 text-sm font-semibold transition-all relative ${
              filter === 'pending'
                ? 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#A73B3C] hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            En attente ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-6 py-3 text-sm font-semibold transition-all relative ${
              filter === 'paid'
                ? 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#A73B3C] hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            Payées ({stats.paid})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-6 py-3 text-sm font-semibold transition-all relative ${
              filter === 'overdue'
                ? 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#A73B3C] hover:bg-slate-50 dark:hover:bg-slate-700/50'
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
          <div className="p-6 space-y-4">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="bg-white dark:bg-slate-800 rounded-xl border-l-4 border-green-500 shadow-sm hover:shadow-md transition-all p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </h3>
                    {getStatusBadge(invoice.status)}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wide font-medium mb-1">
                    SERVICE DE TRANSPORT PREMIUM
                  </p>
                  <p className="text-base text-slate-800 dark:text-slate-200 font-medium">
                    {invoice.service}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Date d'émission</div>
                    <div className="text-sm text-slate-900 dark:text-white font-semibold">
                      {new Date(invoice.issueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Date d'échéance</div>
                    <div className="text-sm text-slate-900 dark:text-white font-semibold">
                      {new Date(invoice.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Montant TTC</div>
                    <div className="text-base text-[#A73B3C] dark:text-[#E5C16C] font-bold">
                      {parseFloat(invoice.totalAmount).toLocaleString()} FCFA
                    </div>
                  </div>
                </div>

                {invoice.paidDate && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">
                      Payée le {new Date(invoice.paidDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {invoice.paymentMethod && ` via ${invoice.paymentMethod}`}
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => handleDownloadPDF(invoice.id)}
                    className="w-full bg-[#1A1A1A] hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Télécharger PDF
                  </button>
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

