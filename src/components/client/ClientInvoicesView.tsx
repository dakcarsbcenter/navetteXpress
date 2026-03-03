'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { downloadInvoicePDF } from '@/lib/invoice-pdf'
import { CheckCircle, XCircle, X, Receipt, DownloadSimple, Calendar, Clock, CurrencyDollar, FileText, Funnel, Wallet } from "@phosphor-icons/react"

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
  quote?: {
    message: string
    clientNotes: string
  }
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
        notes: invoice.notes || invoice.quote?.clientNotes || undefined
      }

      downloadInvoicePDF(invoiceData)
      setModalType('success')
      setModalMessage('Facture téléchargée avec succès !')
      setShowModal(true)
      setTimeout(() => setShowModal(false), 3000)
    } catch (error) {
      setModalType('error')
      setModalMessage('Erreur lors du téléchargement du PDF')
      setShowModal(true)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { label: 'En attente', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
      paid: { label: 'Payée', color: 'var(--color-client-accent)', bg: 'rgba(16,185,129,0.1)' },
      cancelled: { label: 'Annulée', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
      overdue: { label: 'En retard', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
      draft: { label: 'Brouillon', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' }
    }
    return configs[status as keyof typeof configs] || configs.pending
  }

  const filteredInvoices = filter === 'all'
    ? invoices
    : invoices.filter(inv => inv.status === filter)

  const stats = {
    total: invoices.length,
    pending: invoices.filter(inv => inv.status === 'pending').length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    totalPaid: invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[var(--color-client-accent)] animate-spin mb-4" />
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Chargement de vos factures...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Premium */}
      <div className="client-card-enter relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #111E1A 0%, var(--color-client-card) 60%)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, var(--color-client-accent), transparent)' }} />
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-[var(--color-client-accent-bg)] rounded-2xl flex items-center justify-center shadow-lg border border-[var(--color-client-accent-glow)]">
                <Receipt size={28} weight="duotone" style={{ color: 'var(--color-client-accent)' }} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#ffffff' }}>Mes Factures</h1>
                <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Suivez vos paiements et téléchargez vos justificatifs fiscaux.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center px-4 py-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                <div className="text-xl font-bold" style={{ color: '#ffffff' }}>{stats.total}</div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>Total</div>
              </div>
              <div className="text-center px-4 py-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                <div className="text-xl font-bold text-yellow-500">{stats.pending}</div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>À payer</div>
              </div>
              <div className="text-center px-4 py-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                <div className="text-xl font-bold" style={{ color: 'var(--color-client-accent)' }}>{stats.paid}</div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>Payées</div>
              </div>
              <div className="text-center px-4 py-3 bg-[var(--color-client-accent-bg)] rounded-xl border border-[var(--color-client-accent-glow)]">
                <div className="text-lg font-bold" style={{ color: 'var(--color-client-accent)', fontFamily: 'var(--font-mono)' }}>{stats.totalPaid.toLocaleString()}</div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-client-accent)' }}>Total Payé</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres Navigation */}
      <div className="flex items-center gap-2 p-1 rounded-2xl w-fit" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
        {[
          { id: 'all', label: 'Toutes', icon: <Funnel size={14} /> },
          { id: 'pending', label: 'En attente', icon: <Clock size={14} /> },
          { id: 'paid', label: 'Payées', icon: <CheckCircle size={14} /> },
          { id: 'overdue', label: 'En retard', icon: <XCircle size={14} /> }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${filter === item.id
                ? 'bg-[var(--color-client-accent)] text-[#000]'
                : 'hover:text-[var(--color-text-primary)] hover:bg-white/[0.03]'
              }`}
            style={filter !== item.id ? { color: 'var(--color-text-secondary)' } : undefined}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {/* Liste des Factures */}
      {filteredInvoices.length === 0 ? (
        <div className="client-card-enter text-center py-20 px-6 rounded-3xl"
          style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-client-border)' }}>
            <Receipt size={40} weight="light" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: '#ffffff' }}>Aucune facture pour le moment</h3>
          <p className="text-sm font-medium max-w-sm mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Vos factures seront générées automatiquement dès la confirmation de vos prestations de transport.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredInvoices.map((invoice) => {
            const config = getStatusConfig(invoice.status)
            return (
              <div key={invoice.id} className="client-card-enter group rounded-2xl overflow-hidden transition-all duration-300 hover:border-[var(--color-client-accent-glow)]"
                style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-black italic tracking-tighter" style={{ color: '#ffffff' }}>
                        {invoice.invoiceNumber}
                      </h3>
                      <p className="text-[10px] uppercase tracking-widest mt-1 font-bold" style={{ color: 'var(--color-client-accent)' }}>
                        {invoice.service}
                      </p>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
                      style={{ backgroundColor: config.bg, color: config.color, border: `1px solid ${config.color}20` }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                      {config.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="col-span-1 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Émission</p>
                      <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>
                        {new Date(invoice.issueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <div className="col-span-1 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Échéance</p>
                      <p className="text-sm font-semibold" style={{ color: invoice.status === 'overdue' ? '#EF4444' : '#ffffff' }}>
                        {new Date(invoice.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <div className="col-span-1 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-client-accent-bg)', border: '1px solid var(--color-client-accent-glow)' }}>
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-client-accent)' }}>Total TTC</p>
                      <p className="text-xs font-bold" style={{ color: 'var(--color-client-accent)', fontFamily: 'var(--font-mono)' }}>
                        {parseFloat(invoice.totalAmount).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {invoice.paidDate && (
                    <div className="mb-6 p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                      <CheckCircle size={16} className="text-[var(--color-client-accent)]" weight="fill" />
                      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        Réglée le {new Date(invoice.paidDate).toLocaleDateString('fr-FR')} {invoice.paymentMethod && `par ${invoice.paymentMethod}`}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleDownloadPDF(invoice.id)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all bg-[var(--color-client-surface)] hover:bg-[var(--color-client-accent-bg)] hover:text-[var(--color-client-accent)] hover:border-[var(--color-client-accent-glow)]"
                    style={{ color: 'var(--color-text-primary)', border: '1px solid var(--color-client-border)' }}
                  >
                    <DownloadSimple size={18} /> Télécharger la facture PDF
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Premium Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-scaleIn border"
            style={{ backgroundColor: 'var(--color-client-card)', borderColor: modalType === 'success' ? 'var(--color-client-accent-glow)' : 'rgba(239,68,68,0.2)' }}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg ${modalType === 'success' ? 'bg-[var(--color-client-accent-bg)] text-[var(--color-client-accent)]' : 'bg-red-500/10 text-red-500'
                }`}>
                {modalType === 'success' ? <CheckCircle size={44} weight="duotone" /> : <XCircle size={44} weight="duotone" />}
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {modalType === 'success' ? 'Opération réussie' : 'Erreur technique'}
              </h3>
              <p className="text-sm font-medium leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {modalMessage}
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg hover:brightness-110"
                style={{
                  backgroundColor: modalType === 'success' ? 'var(--color-client-accent)' : '#EF4444',
                  color: modalType === 'success' ? '#000' : '#FFF'
                }}
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
