'use client'

import { useEffect, useState } from 'react'
import {
  Star,
  MagnifyingGlass as Search,
  Download,
  ChatCircleDots as MessageSquare,
  Trash
} from "@phosphor-icons/react"
import { BulkDeleteModal } from "@/components/ui/BulkDeleteModal"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { useNotification } from "@/hooks/useNotification"
import { TONE_STYLE } from "@/components/shared/StatusBadge"

interface Review {
  id: number
  customerName: string
  customerEmail: string
  customerType?: string
  service: string
  rating: number
  comment: string
  isPublic: boolean
  isApproved: boolean
  response: string | null
  respondedBy: string | null
  respondedAt: string | null
  createdAt: string
  updatedAt: string
  bookingId: number | null
  tags: string[]
  driverName?: string
}

const selectStyle: React.CSSProperties = {
  height: '42px', padding: '0 12px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13px', color: '#12100E', backgroundColor: '#FFFFFF',
}

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [responseText, setResponseText] = useState('')

  const [selectedReviewIds, setSelectedReviewIds] = useState<Set<number>>(new Set())
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const { notifications, removeNotification, showSuccess, showError } = useNotification()

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reviews')
      if (!response.ok) return
      const text = await response.text()
      if (!text) return
      const result = JSON.parse(text)
      if (result.success) {
        setReviews(result.data || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (reviewId: number) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: true, isApproved: true })
      })
      if (response.ok) {
        showSuccess('Avis publié', 'Succès')
        fetchReviews()
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleRespond = (review: Review) => {
    setSelectedReview(review)
    setResponseText(review.response || '')
    setShowResponseModal(true)
  }

  const submitResponse = async () => {
    if (!selectedReview) return
    try {
      const response = await fetch(`/api/reviews/${selectedReview.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: responseText })
      })
      if (response.ok) {
        showSuccess('Réponse envoyée', 'Succès')
        setShowResponseModal(false)
        setResponseText('')
        fetchReviews()
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleMask = async (reviewId: number) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: false })
      })
      if (response.ok) {
        showSuccess('Avis masqué', 'Succès')
        fetchReviews()
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const getStats = () => {
    const totalReviews = reviews.length
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0
    const satisfactionRate = reviews.length > 0
      ? (reviews.filter(r => r.rating >= 4).length / reviews.length) * 100
      : 0
    const pendingReviews = reviews.filter(r => !r.isApproved).length
    const distribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      '1-2': reviews.filter(r => r.rating <= 2).length
    }
    return { totalReviews, averageRating, satisfactionRate, pendingReviews, distribution }
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = searchTerm === '' ||
      review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'published' && review.isPublic) ||
      (statusFilter === 'pending' && !review.isApproved) ||
      (statusFilter === 'responded' && review.response)
    return matchesSearch && matchesRating && matchesStatus
  })

  const toggleSelectAll = () => {
    if (selectedReviewIds.size === filteredReviews.length && filteredReviews.length > 0) {
      setSelectedReviewIds(new Set())
    } else {
      setSelectedReviewIds(new Set(filteredReviews.map(r => r.id)))
    }
  }

  const toggleSelectReview = (e: React.MouseEvent, reviewId: number) => {
    e.stopPropagation()
    setSelectedReviewIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(reviewId)) newSet.delete(reviewId)
      else newSet.add(reviewId)
      return newSet
    })
  }

  const handleBulkDelete = async () => {
    try {
      const response = await fetch('/api/reviews/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedReviewIds) })
      })
      const text = await response.text()
      const data = text ? JSON.parse(text) : {}
      if (response.ok) {
        showSuccess(data.message || 'Avis supprimés', 'Succès')
        setSelectedReviewIds(new Set())
        fetchReviews()
      } else {
        showError(data.error || 'Erreur lors de la suppression', 'Erreur')
      }
    } catch (error) {
      showError('Erreur technique', 'Erreur')
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const sz = size === 'lg' ? 20 : 14
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={sz}
            weight={star <= rating ? 'fill' : 'regular'}
            style={{ color: star <= rating ? '#B4643A' : '#E2DACD' }}
          />
        ))}
      </div>
    )
  }

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)

  const getStatusTone = (review: Review) => {
    if (review.isPublic) return { label: 'Publié', ...TONE_STYLE.valide }
    if (!review.isApproved) return { label: 'En attente', ...TONE_STYLE.attente }
    return { label: 'Brouillon', ...TONE_STYLE.clos }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "#E2DACD", borderTopColor: "#1F5245" }} />
      </div>
    )
  }

  const stats = getStats()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      <NotificationCenter notifications={notifications} onRemove={removeNotification} />

      {/* Header */}
      <section style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#1F5245' }}>
            Retours clients
          </span>
          <h2 style={{ margin: 0, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Avis &amp; satisfaction.
          </h2>
          <p style={{ margin: 0, fontSize: '15px', color: '#3d3a35' }}>
            Modérez les retours et analysez la satisfaction client.
          </p>
        </div>
        <div className="flex gap-2">
          {selectedReviewIds.size > 0 && (
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-2"
              style={{ height: '40px', padding: '0 16px', backgroundColor: 'rgba(184,73,60,.08)', border: '1px solid rgba(184,73,60,.25)', borderRadius: '4px', color: '#B8493C', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Trash size={15} />
              Supprimer ({selectedReviewIds.size})
            </button>
          )}
          <button
            type="button"
            className="flex items-center gap-2"
            style={{ height: '40px', padding: '0 16px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', color: '#6E6A63', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Download size={15} />
            Exporter
          </button>
        </div>
      </section>

      {/* Stats Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
        {/* Note moyenne */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', padding: '22px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63', marginBottom: '12px' }}>Note moyenne</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '34px', fontWeight: 600, color: '#12100E', marginBottom: '6px' }}>
            {stats.averageRating.toFixed(1)}
            <span style={{ fontSize: '17px', color: '#6E6A63' }}> / 5.0</span>
          </div>
          <div className="flex justify-center" style={{ marginBottom: '14px' }}>
            {renderStars(Math.round(stats.averageRating), 'lg')}
          </div>
          <div className="mx-auto" style={{ width: '76px', height: '76px', borderRadius: '50%', border: '3px solid rgba(31,82,69,.25)', display: 'grid', placeItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '17px', fontWeight: 600, color: '#1F5245' }}>{Math.round(stats.satisfactionRate)}%</div>
              <div style={{ fontSize: '10px', color: '#6E6A63' }}>Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Distribution */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', padding: '20px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63', marginBottom: '14px' }}>Distribution</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {([5, 4, 3] as const).map(n => (
              <div key={n} className="flex items-center gap-2" style={{ fontSize: '13px' }}>
                <span style={{ color: '#6E6A63', width: '32px' }}>{n} ★</span>
                <div style={{ flex: 1, backgroundColor: '#F0EAE0', borderRadius: '2px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '2px', backgroundColor: '#1F5245', width: `${stats.totalReviews > 0 ? (stats.distribution[n] / stats.totalReviews) * 100 : 0}%` }} />
                </div>
                <span style={{ color: '#3d3a35', fontWeight: 600, width: '36px', textAlign: 'right', fontSize: '11.5px' }}>
                  {stats.totalReviews > 0 ? Math.round((stats.distribution[n] / stats.totalReviews) * 100) : 0}%
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2" style={{ fontSize: '13px' }}>
              <span style={{ color: '#6E6A63', width: '32px' }}>1-2 ★</span>
              <div style={{ flex: 1, backgroundColor: '#F0EAE0', borderRadius: '2px', height: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '2px', backgroundColor: '#B8493C', width: `${stats.totalReviews > 0 ? (stats.distribution['1-2'] / stats.totalReviews) * 100 : 0}%` }} />
              </div>
              <span style={{ color: '#3d3a35', fontWeight: 600, width: '36px', textAlign: 'right', fontSize: '11.5px' }}>
                {stats.totalReviews > 0 ? Math.round((stats.distribution['1-2'] / stats.totalReviews) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* À Modérer */}
        <div style={{ backgroundColor: 'rgba(180,100,58,.08)', border: '1px solid rgba(180,100,58,.25)', borderRadius: '4px', padding: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B4643A', marginBottom: '8px' }}>À modérer</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '34px', fontWeight: 600, color: '#B4643A', marginBottom: '6px' }}>{stats.pendingReviews}</div>
          <div style={{ fontSize: '12.5px', color: '#8a5a3d' }}>Avis en attente de validation</div>
          {stats.pendingReviews > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              style={{ marginTop: '14px', height: '36px', padding: '0 16px', backgroundColor: 'rgba(180,100,58,.15)', border: '1px solid rgba(180,100,58,.35)', borderRadius: '4px', color: '#B4643A', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
            >
              Traiter maintenant
            </button>
          )}
        </div>

        {/* Statistiques */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', padding: '20px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6A63', marginBottom: '14px' }}>Statistiques</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: '13px', color: '#6E6A63' }}>Total avis</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 600, color: '#12100E' }}>{stats.totalReviews}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: '13px', color: '#6E6A63' }}>Avec réponse</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 600, color: '#12100E' }}>{reviews.filter(r => r.response).length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: '13px', color: '#6E6A63' }}>Publiés</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 600, color: '#1F5245' }}>{reviews.filter(r => r.isPublic).length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', padding: '16px 20px' }}>
        <label className="flex items-center gap-3" style={{ marginBottom: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={filteredReviews.length > 0 && selectedReviewIds.size === filteredReviews.length}
            onChange={toggleSelectAll}
            style={{ width: '16px', height: '16px', accentColor: '#1F5245' }}
          />
          <span style={{ fontSize: '13px', color: '#6E6A63' }}>Tout sélectionner</span>
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6E6A63' }} />
            <input
              type="text"
              placeholder="Rechercher dans les avis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...selectStyle, width: '100%', paddingLeft: '40px' }}
            />
          </div>
          <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} style={selectStyle}>
            <option value="all">Toutes les notes</option>
            <option value="5">5 étoiles</option>
            <option value="4">4 étoiles</option>
            <option value="3">3 étoiles</option>
            <option value="2">2 étoiles</option>
            <option value="1">1 étoile</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">Tous les statuts</option>
            <option value="published">Publiés</option>
            <option value="pending">En attente</option>
            <option value="responded">Avec réponse</option>
          </select>
        </div>
      </section>

      {/* Reviews List */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredReviews.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', padding: '48px 24px', textAlign: 'center' }}>
            <Star size={32} style={{ color: '#E2DACD', margin: '0 auto 10px' }} />
            <p style={{ margin: 0, fontSize: '13px', color: '#6E6A63' }}>Aucun avis trouvé</p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const tone = getStatusTone(review)
            return (
              <div
                key={review.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2DACD',
                  borderLeft: !review.isApproved ? '3px solid #B4643A' : '1px solid #E2DACD',
                  borderRadius: '4px',
                  padding: '18px 20px',
                  position: 'relative',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4" style={{ flex: 1 }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ paddingTop: '2px' }}>
                      <input
                        type="checkbox"
                        checked={selectedReviewIds.has(review.id)}
                        onChange={(e) => toggleSelectReview(e as unknown as React.MouseEvent, review.id)}
                        style={{ width: '16px', height: '16px', accentColor: '#1F5245' }}
                      />
                    </div>

                    {/* Avatar */}
                    <div style={{ width: '40px', height: '40px', borderRadius: '3px', backgroundColor: 'rgba(31,82,69,.08)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#1F5245' }}>
                        {getInitials(review.customerName)}
                      </span>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: '4px' }}>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#12100E' }}>{review.customerName}</h3>
                        <span
                          className="inline-flex items-center gap-1.5"
                          style={{ height: '22px', padding: '0 8px', borderRadius: '2px', fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', backgroundColor: tone.bg, color: tone.color }}
                        >
                          {tone.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: '11.5px', color: '#6E6A63', marginBottom: '10px' }}>
                        <span className="capitalize">{review.customerType || 'Client Premium'}</span>
                        <span>·</span>
                        <span>{new Date(review.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        {review.driverName && (
                          <>
                            <span>·</span>
                            <span>Chauffeur : {review.driverName}</span>
                          </>
                        )}
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ marginBottom: '4px' }}>{renderStars(review.rating)}</div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '13.5px', fontWeight: 600, color: '#12100E' }}>{review.service || 'Service impeccable !'}</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#3d3a35', lineHeight: 1.5 }}>{review.comment}</p>
                      </div>

                      {review.response && (
                        <div style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px', padding: '12px 14px', marginTop: '10px' }}>
                          <div className="flex items-start gap-2">
                            <MessageSquare size={15} style={{ color: '#6E6A63', marginTop: '2px', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#3d3a35', marginBottom: '2px' }}>Réponse de l&apos;équipe</div>
                              <p style={{ margin: 0, fontSize: '12.5px', color: '#6E6A63' }}>{review.response}</p>
                              {review.respondedAt && (
                                <div style={{ fontSize: '10.5px', color: '#9a938a', marginTop: '4px' }}>
                                  {new Date(review.respondedAt).toLocaleDateString('fr-FR')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                    {review.isPublic ? (
                      <button
                        type="button"
                        onClick={() => handleMask(review.id)}
                        style={{ padding: '6px 12px', fontSize: '11.5px', fontWeight: 600, backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', color: '#6E6A63', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        Masquer
                      </button>
                    ) : !review.isApproved ? (
                      <button
                        type="button"
                        onClick={() => handlePublish(review.id)}
                        style={{ padding: '6px 12px', fontSize: '11.5px', fontWeight: 600, backgroundColor: 'rgba(31,82,69,.08)', border: '1px solid rgba(31,82,69,.3)', color: '#1F5245', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        Publier
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleRespond(review)}
                      style={{ padding: '6px 12px', fontSize: '11.5px', fontWeight: 600, backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', color: '#6E6A63', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      {review.response ? 'Modifier' : 'Répondre'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </section>

      {/* Response Modal */}
      {showResponseModal && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(18,16,14,.55)' }} onClick={() => setShowResponseModal(false)} />
          <div className="relative w-full max-w-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px', padding: '24px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '17px', fontWeight: 600, color: '#12100E' }}>
              Répondre à l&apos;avis de {selectedReview.customerName}
            </h2>

            <div style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '6px' }}>{renderStars(selectedReview.rating)}</div>
              <p style={{ margin: 0, fontSize: '13px', color: '#3d3a35' }}>{selectedReview.comment}</p>
            </div>

            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Écrivez votre réponse..."
              rows={5}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #E2DACD', borderRadius: '3px', fontSize: '13.5px', color: '#12100E', resize: 'none' }}
            />

            <div className="flex items-center justify-end gap-3" style={{ marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowResponseModal(false)
                  setResponseText('')
                  setSelectedReview(null)
                }}
                style={{ height: '40px', padding: '0 18px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submitResponse}
                disabled={!responseText.trim()}
                style={{ height: '40px', padding: '0 18px', backgroundColor: '#1F5245', border: 'none', borderRadius: '3px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: !responseText.trim() ? 0.5 : 1 }}
              >
                Envoyer la réponse
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        count={selectedReviewIds.size}
        resourceName="avis"
      />
    </div>
  )
}
