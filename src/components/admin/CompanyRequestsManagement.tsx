"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Buildings,
  Clock,
  CheckCircle,
  XCircle,
  Envelope,
  Phone,
  MapPin,
  IdentificationCard,
} from "@phosphor-icons/react"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { useNotification } from "@/hooks/useNotification"

type CompanyStatus = 'pending' | 'approved' | 'rejected'

interface CompanyRequest {
  id: string
  name: string
  email: string
  phone?: string | null
  companyType?: 'hotel' | 'entreprise' | 'ong' | null
  companyName?: string | null
  ninea?: string | null
  raisonSociale?: string | null
  companyAddress?: string | null
  companyPhone?: string | null
  bp?: string | null
  companyStatus: CompanyStatus
  companyRequestedAt?: string | null
  companyReviewedAt?: string | null
  companyRejectionReason?: string | null
}

const COMPANY_TYPE_META: Record<string, { label: string; color: string }> = {
  hotel: { label: 'Hôtel', color: '#2F6690' },
  entreprise: { label: 'Entreprise', color: '#6B4FA0' },
  ong: { label: 'ONG', color: '#3D8361' },
}

const STATUS_TABS: { id: CompanyStatus; label: string }[] = [
  { id: 'pending', label: 'En attente' },
  { id: 'approved', label: 'Approuvées' },
  { id: 'rejected', label: 'Refusées' },
]

const fieldLabel: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63',
}

export default function CompanyRequestsManagement() {
  const [requests, setRequests] = useState<CompanyRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<CompanyStatus>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const { notifications, showSuccess, showError, removeNotification } = useNotification()

  const loadRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/company-requests?status=all')
      const data = await response.json()
      if (data.success) {
        setRequests(data.requests)
      } else {
        showError(data.error || "Impossible de charger les demandes")
      }
    } catch {
      showError("Erreur réseau lors du chargement des demandes")
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDecision = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    setProcessingId(id)
    try {
      const response = await fetch(`/api/admin/company-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        showSuccess(data.message)
        setRejectingId(null)
        setRejectReason('')
        await loadRequests()
      } else {
        showError(data.error || "Échec du traitement de la demande")
      }
    } catch {
      showError("Erreur réseau lors du traitement de la demande")
    } finally {
      setProcessingId(null)
    }
  }

  const filtered = requests.filter((r) => r.companyStatus === activeTab)
  const pendingCount = requests.filter((r) => r.companyStatus === 'pending').length

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
            Comptes &amp; accès
          </span>
          <h2 style={{ margin: 0, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Demandes compte pro.
          </h2>
          <p style={{ margin: 0, fontSize: '15px', color: '#3d3a35' }}>
            Validez les demandes de passage en compte hôtel / entreprise / ONG.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #E2DACD', flexWrap: 'wrap' }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '10px 16px', cursor: 'pointer', border: 'none', background: 'none', position: 'relative',
              color: activeTab === tab.id ? '#1F5245' : '#6E6A63',
              borderBottom: activeTab === tab.id ? '2px solid #1F5245' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
            {tab.id === 'pending' && pendingCount > 0 && (
              <span style={{ marginLeft: '8px', padding: '2px 7px', borderRadius: '20px', backgroundColor: activeTab === tab.id ? '#1F5245' : '#E2DACD', color: activeTab === tab.id ? '#FFFFFF' : '#12100E', fontSize: '10px' }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </section>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ backgroundColor: '#F7F3EC', border: '1px dashed #E2DACD', borderRadius: '4px', padding: '48px' }} className="flex flex-col items-center justify-center text-center">
          <Buildings size={32} weight="thin" style={{ color: '#6E6A63' }} className="mb-3" />
          <p className="text-sm font-semibold" style={{ color: '#12100E' }}>Aucune demande {activeTab === 'pending' ? 'en attente' : activeTab === 'approved' ? 'approuvée' : 'refusée'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((req) => {
            const typeMeta = req.companyType ? COMPANY_TYPE_META[req.companyType] : null
            const isProcessing = processingId === req.id

            return (
              <div key={req.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', padding: '20px 24px' }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: '#F7F3EC', color: '#1F5245', border: '1px solid #E2DACD', borderRadius: '3px' }}>
                      <Buildings size={18} weight="duotone" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold" style={{ color: '#12100E' }}>{req.companyName || req.name}</h4>
                        {typeMeta && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '2px', backgroundColor: `${typeMeta.color}15`, color: typeMeta.color }}>
                            {typeMeta.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: '#6E6A63' }}>
                        <IdentificationCard size={13} /> {req.name}
                      </p>
                    </div>
                  </div>

                  {req.companyStatus === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleDecision(req.id, 'approve')}
                        className="flex items-center gap-2 disabled:opacity-50"
                        style={{ height: '36px', padding: '0 16px', backgroundColor: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <CheckCircle size={15} weight="bold" /> Approuver
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => { setRejectingId(req.id); setRejectReason('') }}
                        className="flex items-center gap-2 disabled:opacity-50"
                        style={{ height: '36px', padding: '0 16px', backgroundColor: 'rgba(184,73,60,.08)', border: '1px solid rgba(184,73,60,.25)', borderRadius: '4px', color: '#B8493C', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <XCircle size={15} weight="bold" /> Refuser
                      </button>
                    </div>
                  )}

                  {req.companyStatus === 'approved' && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#1F5245' }}>
                      <CheckCircle size={15} weight="fill" /> Approuvée
                    </span>
                  )}
                  {req.companyStatus === 'rejected' && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#B8493C' }}>
                      <XCircle size={15} weight="fill" /> Refusée
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 mt-5 pt-5" style={{ borderTop: '1px solid #F7F3EC' }}>
                  <div className="space-y-1">
                    <p style={fieldLabel}>Contact</p>
                    <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: '#12100E' }}><Envelope size={13} style={{ color: '#1F5245' }} /> {req.email}</p>
                  </div>
                  {req.phone && (
                    <div className="space-y-1">
                      <p style={fieldLabel}>Téléphone</p>
                      <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: '#12100E' }}><Phone size={13} style={{ color: '#1F5245' }} /> {req.phone}</p>
                    </div>
                  )}
                  {req.ninea && (
                    <div className="space-y-1">
                      <p style={fieldLabel}>NINEA</p>
                      <p className="text-xs font-medium font-mono" style={{ color: '#12100E' }}>{req.ninea}</p>
                    </div>
                  )}
                  {req.raisonSociale && (
                    <div className="space-y-1">
                      <p style={fieldLabel}>Raison sociale</p>
                      <p className="text-xs font-medium" style={{ color: '#12100E' }}>{req.raisonSociale}</p>
                    </div>
                  )}
                  {req.companyAddress && (
                    <div className="space-y-1 sm:col-span-2">
                      <p style={fieldLabel}>Adresse entreprise</p>
                      <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: '#12100E' }}><MapPin size={13} style={{ color: '#1F5245' }} /> {req.companyAddress}</p>
                    </div>
                  )}
                  {req.companyRequestedAt && (
                    <div className="space-y-1">
                      <p style={fieldLabel}>Demandée le</p>
                      <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: '#12100E' }}><Clock size={13} style={{ color: '#1F5245' }} /> {new Date(req.companyRequestedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  )}
                  {req.companyStatus === 'rejected' && req.companyRejectionReason && (
                    <div className="space-y-1 sm:col-span-2 lg:col-span-4">
                      <p style={fieldLabel}>Motif du refus</p>
                      <p className="text-xs font-medium" style={{ color: '#B8493C' }}>{req.companyRejectionReason}</p>
                    </div>
                  )}
                </div>

                {rejectingId === req.id && (
                  <div className="mt-5 pt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3" style={{ borderTop: '1px solid #F7F3EC' }}>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Motif du refus (optionnel)"
                      className="flex-1"
                      style={{ height: '38px', padding: '0 12px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '12.5px', color: '#12100E' }}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleDecision(req.id, 'reject', rejectReason)}
                        className="disabled:opacity-50"
                        style={{ height: '38px', padding: '0 16px', backgroundColor: '#B8493C', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Confirmer le refus
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRejectingId(null); setRejectReason('') }}
                        style={{ height: '38px', padding: '0 16px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', color: '#12100E', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
