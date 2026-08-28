'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { toIntlLocale } from '@/lib/intl-locale'
import { downloadInvoicePDF } from '@/lib/invoice-pdf'
import { CheckCircle, XCircle, Receipt, DownloadSimple, Clock, Funnel } from "@phosphor-icons/react"

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

const cardStyle = { backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px' }
const surfaceStyle = { backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px' }

export function ClientInvoicesView() {
  const { data: session } = useSession()
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)
  const t = useTranslations('client.invoices')
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
        issueDate: new Date(invoice.issueDate).toLocaleDateString(intlLocale),
        dueDate: new Date(invoice.dueDate).toLocaleDateString(intlLocale),
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

      await downloadInvoicePDF(invoiceData)
      setModalType('success')
      setModalMessage(t('downloadSuccess'))
      setShowModal(true)
      setTimeout(() => setShowModal(false), 3000)
    } catch (error) {
      setModalType('error')
      setModalMessage(t('downloadError'))
      setShowModal(true)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { label: t('status.pending'), color: '#B4643A', bg: 'rgba(180,100,58,.10)' },
      paid: { label: t('status.paid'), color: '#1F5245', bg: 'rgba(31,82,69,.10)' },
      cancelled: { label: t('status.cancelled'), color: '#B8493C', bg: 'rgba(184,73,60,.10)' },
      overdue: { label: t('status.overdue'), color: '#B8493C', bg: 'rgba(184,73,60,.10)' },
      draft: { label: t('status.draft'), color: '#6E6A63', bg: 'rgba(110,106,99,.10)' }
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
        <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#1F5245] animate-spin mb-4" />
        <p className="text-xs font-medium" style={{ color: '#6E6A63' }}>{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ padding: '18px 24px', borderBottom: '1px solid #E2DACD' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#12100E' }}>{t('title')}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6E6A63' }}>{t('subtitle')}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center px-3 py-2" style={surfaceStyle}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#12100E' }}>{stats.total}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6E6A63' }}>{t('total')}</div>
            </div>
            <div className="text-center px-3 py-2" style={surfaceStyle}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#B4643A' }}>{stats.pending}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6E6A63' }}>{t('toPay')}</div>
            </div>
            <div className="text-center px-3 py-2" style={surfaceStyle}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1F5245' }}>{stats.paid}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6E6A63' }}>{t('paid')}</div>
            </div>
            <div className="text-center px-3 py-2" style={{ backgroundColor: 'rgba(31,82,69,.08)', border: '1px solid rgba(31,82,69,.2)', borderRadius: '3px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1F5245', fontFamily: 'var(--font-mono)' }}>{stats.totalPaid.toLocaleString(intlLocale)}</div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1F5245' }}>{t('totalPaid')}</div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none" style={{ padding: '12px 24px', borderBottom: '1px solid #E2DACD' }}>
          {[
            { id: 'all', label: t('filters.all'), icon: <Funnel size={14} /> },
            { id: 'pending', label: t('filters.pending'), icon: <Clock size={14} /> },
            { id: 'paid', label: t('filters.paid'), icon: <CheckCircle size={14} /> },
            { id: 'overdue', label: t('filters.overdue'), icon: <XCircle size={14} /> }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id as any)}
              className="flex items-center gap-2 whitespace-nowrap"
              style={filter === item.id
                ? { padding: '0 16px', height: '36px', backgroundColor: '#1F5245', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }
                : { padding: '0 16px', height: '36px', backgroundColor: 'transparent', color: '#6E6A63', border: '1px solid #E2DACD', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        {/* Liste des factures */}
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '4px' }}>
              <Receipt size={28} weight="light" style={{ color: '#6E6A63' }} />
            </div>
            <h4 className="text-base font-semibold mb-1" style={{ color: '#12100E' }}>{t('noInvoiceYet')}</h4>
            <p className="text-sm max-w-xs mx-auto" style={{ color: '#6E6A63' }}>
              {t('noInvoiceDescription')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-6">
            {filteredInvoices.map((invoice) => {
              const config = getStatusConfig(invoice.status)
              return (
                <div key={invoice.id} style={cardStyle}>
                  <div className="px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                      <div>
                        <h3 className="text-base font-semibold" style={{ color: '#12100E', fontFamily: 'var(--font-mono)' }}>
                          {invoice.invoiceNumber}
                        </h3>
                        <p className="text-[10px] uppercase tracking-widest mt-1 font-bold" style={{ color: '#1F5245' }}>
                          {invoice.service}
                        </p>
                      </div>
                      <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-2 shrink-0"
                        style={{ backgroundColor: config.bg, color: config.color, borderRadius: '2px' }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                        {config.label}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="col-span-1 p-3" style={surfaceStyle}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6A63' }}>{t('issueDate')}</p>
                        <p className="text-sm font-semibold" style={{ color: '#12100E' }}>
                          {new Date(invoice.issueDate).toLocaleDateString(intlLocale, { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                      <div className="col-span-1 p-3" style={surfaceStyle}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6A63' }}>{t('dueDate')}</p>
                        <p className="text-sm font-semibold" style={{ color: invoice.status === 'overdue' ? '#B8493C' : '#12100E' }}>
                          {new Date(invoice.dueDate).toLocaleDateString(intlLocale, { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                      <div className="col-span-1 p-3" style={{ backgroundColor: 'rgba(31,82,69,.08)', border: '1px solid rgba(31,82,69,.2)', borderRadius: '3px' }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#1F5245' }}>{t('totalTtc')}</p>
                        <p className="text-xs font-bold" style={{ color: '#1F5245', fontFamily: 'var(--font-mono)' }}>
                          {parseFloat(invoice.totalAmount).toLocaleString(intlLocale)}
                        </p>
                      </div>
                    </div>

                    {invoice.paidDate && (
                      <div className="mb-4 p-3 flex items-center gap-3" style={{ backgroundColor: 'rgba(31,82,69,.06)', border: '1px solid rgba(31,82,69,.15)', borderRadius: '3px' }}>
                        <CheckCircle size={16} style={{ color: '#1F5245' }} weight="fill" />
                        <p className="text-sm font-medium" style={{ color: '#6E6A63' }}>
                          {t('paidOn')} {new Date(invoice.paidDate).toLocaleDateString(intlLocale)} {invoice.paymentMethod && `${t('paidVia')} ${invoice.paymentMethod}`}
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownloadPDF(invoice.id)}
                      className="w-full flex items-center justify-center gap-2 min-h-[40px]"
                      style={{ backgroundColor: '#F7F3EC', color: '#12100E', border: '1px solid #E2DACD', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}
                    >
                      <DownloadSimple size={16} /> {t('downloadPdf')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Notification */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="p-6 max-w-sm w-full mx-4" style={{ ...cardStyle, borderRadius: '6px' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 flex items-center justify-center mb-4"
                style={modalType === 'success' ? { backgroundColor: 'rgba(31,82,69,.10)', color: '#1F5245', borderRadius: '4px' } : { backgroundColor: 'rgba(184,73,60,.10)', color: '#B8493C', borderRadius: '4px' }}>
                {modalType === 'success' ? <CheckCircle size={32} weight="duotone" /> : <XCircle size={32} weight="duotone" />}
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#12100E' }}>
                {modalType === 'success' ? t('operationSuccess') : t('technicalError')}
              </h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#6E6A63' }}>
                {modalMessage}
              </p>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full py-3 font-semibold text-sm"
                style={{
                  backgroundColor: modalType === 'success' ? '#1F5245' : '#B8493C',
                  color: '#fff', border: 'none', borderRadius: '4px'
                }}
              >
                {t('continue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
