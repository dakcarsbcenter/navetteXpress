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
import { useNotification } from "@/hooks/useNotification"

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

export default function ReviewsManagementRedesigned() {
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
  const { showSuccess, showError } = useNotification()

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
      if (response.ok) fetchReviews()
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
      if (response.ok) fetchReviews()
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
            className={star <= rating ? 'text-yellow-400' : 'text-white/20'}
          />
        ))}
      </div>
    )
  }

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)

  const getStatusBadge = (review: Review) => {
    if (review.isPublic) return { label: 'PUBLIÉ', classes: 'bg-green-500/10 text-green-400 border border-green-500/20' }
    if (!review.isApproved) return { label: 'EN ATTENTE', classes: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' }
    return { label: 'BROUILLON', classes: 'bg-white/5 text-slate-400 border border-white/10' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text animate-pulse"
          style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>
          Navette Xpress
        </div>
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="space-y-6">
      <NotificationCenter notifications={notifications} onRemove={removeNotification} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Avis & Satisfaction</h1>
          <p className="text-sm text-slate-400 mt-1">Modérez les retours et analysez la satisfaction client.</p>
        </div>
        <div className="flex gap-2">
          {selectedReviewIds.size > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              <Trash size={16} />
              <span className="hidden sm:inline">Supprimer ({selectedReviewIds.size})</span>
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-slate-400 hover:bg-white/5 transition-colors">
            <Download size={16} />
            Exporter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Note moyenne */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Note Moyenne</div>
          <div className="text-5xl font-bold text-white mb-1">
            {stats.averageRating.toFixed(1)}
            <span className="text-2xl text-slate-500"> / 5.0</span>
          </div>
          <div className="flex justify-center mb-4">
            {renderStars(Math.round(stats.averageRating), 'lg')}
          </div>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-gold/30" style={{ backgroundColor: 'rgba(201,168,76,0.1)' }}>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--color-gold)' }}>{Math.round(stats.satisfactionRate)}%</div>
              <div className="text-xs text-slate-400">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Distribution */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Distribution</div>
          <div className="space-y-3">
            {([5, 4, 3] as const).map(n => (
              <div key={n} className="flex items-center gap-2 text-sm">
                <span className="text-slate-400 w-8">{n} ★</span>
                <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${n === 5 ? 'bg-green-500' : n === 4 ? 'bg-green-400' : 'bg-yellow-400'}`}
                    style={{ width: `${stats.totalReviews > 0 ? (stats.distribution[n] / stats.totalReviews) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-slate-300 font-semibold w-9 text-right text-xs">
                  {stats.totalReviews > 0 ? Math.round((stats.distribution[n] / stats.totalReviews) * 100) : 0}%
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 w-8">1-2 ★</span>
              <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-400"
                  style={{ width: `${stats.totalReviews > 0 ? (stats.distribution['1-2'] / stats.totalReviews) * 100 : 0}%` }}
                />
              </div>
              <span className="text-slate-300 font-semibold w-9 text-right text-xs">
                {stats.totalReviews > 0 ? Math.round((stats.distribution['1-2'] / stats.totalReviews) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* À Modérer */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">À Modérer</div>
          <div className="text-5xl font-bold text-amber-400 mb-2">{stats.pendingReviews}</div>
          <div className="text-sm text-amber-400/70">Avis en attente de validation</div>
          {stats.pendingReviews > 0 && (
            <button
              onClick={() => setStatusFilter('pending')}
              className="mt-4 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-xl text-sm font-medium transition-colors"
            >
              Traiter maintenant
            </button>
          )}
        </div>

        {/* Statistiques */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Statistiques</div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total avis</span>
              <span className="text-lg font-bold text-white">{stats.totalReviews}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Avec réponse</span>
              <span className="text-lg font-bold text-white">{reviews.filter(r => r.response).length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Publiés</span>
              <span className="text-lg font-bold text-green-400">{reviews.filter(r => r.isPublic).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            checked={filteredReviews.length > 0 && selectedReviewIds.size === filteredReviews.length}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-gold focus:ring-gold cursor-pointer"
          />
          <span className="text-sm text-slate-400">Tout sélectionner</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Rechercher dans les avis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-gold/50 transition-colors"
          >
            <option value="all" className="bg-[#0D0D14]">Toutes les notes</option>
            <option value="5" className="bg-[#0D0D14]">5 étoiles</option>
            <option value="4" className="bg-[#0D0D14]">4 étoiles</option>
            <option value="3" className="bg-[#0D0D14]">3 étoiles</option>
            <option value="2" className="bg-[#0D0D14]">2 étoiles</option>
            <option value="1" className="bg-[#0D0D14]">1 étoile</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-gold/50 transition-colors"
          >
            <option value="all" className="bg-[#0D0D14]">Tous les statuts</option>
            <option value="published" className="bg-[#0D0D14]">Publiés</option>
            <option value="pending" className="bg-[#0D0D14]">En attente</option>
            <option value="responded" className="bg-[#0D0D14]">Avec réponse</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <Star className="mx-auto mb-3 opacity-20" size={48} />
            <p className="text-slate-500">Aucun avis trouvé</p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const statusBadge = getStatusBadge(review)
            return (
              <div
                key={review.id}
                className={`bg-white/5 border rounded-2xl p-5 relative transition-colors hover:bg-white/[0.07] ${!review.isApproved ? 'border-amber-500/30 border-l-2' : 'border-white/10'}`}
              >
                <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedReviewIds.has(review.id)}
                    onChange={(e) => toggleSelectReview(e as unknown as React.MouseEvent, review.id)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 cursor-pointer"
                  />
                </div>

                <div className="flex items-start justify-between gap-4 pl-7">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold" style={{ color: 'var(--color-gold)' }}>
                        {getInitials(review.customerName)}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-white">{review.customerName}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusBadge.classes}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 flex-wrap">
                        <span className="capitalize">{review.customerType || 'Client Premium'}</span>
                        <span>•</span>
                        <span>{new Date(review.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        {review.driverName && (
                          <>
                            <span>•</span>
                            <span>Chauffeur : {review.driverName}</span>
                          </>
                        )}
                      </div>

                      <div className="mb-3">
                        <div className="mb-1">{renderStars(review.rating)}</div>
                        <h4 className="font-semibold text-white mb-1 text-sm">{review.service || 'Service impeccable !'}</h4>
                        <p className="text-slate-300 text-sm leading-relaxed">{review.comment}</p>
                      </div>

                      {review.response && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-3">
                          <div className="flex items-start gap-2">
                            <MessageSquare size={16} className="text-slate-500 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="text-xs font-semibold text-slate-300 mb-1">Réponse de l'équipe</div>
                              <p className="text-sm text-slate-400">{review.response}</p>
                              {review.respondedAt && (
                                <div className="text-xs text-slate-600 mt-1">
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
                  <div className="flex flex-col gap-2 shrink-0">
                    {review.isPublic ? (
                      <button
                        onClick={() => handleMask(review.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        Masquer
                      </button>
                    ) : !review.isApproved ? (
                      <button
                        onClick={() => handlePublish(review.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                      >
                        Publier
                      </button>
                    ) : null}
                    <button
                      onClick={() => handleRespond(review)}
                      className="px-3 py-1.5 text-xs font-medium border border-white/10 text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {review.response ? 'Modifier' : 'Répondre'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedReview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-obsidian border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Répondre à l'avis de {selectedReview.customerName}
            </h2>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <div className="mb-2">{renderStars(selectedReview.rating)}</div>
              <p className="text-slate-300 text-sm">{selectedReview.comment}</p>
            </div>

            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Écrivez votre réponse..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-gold/50 transition-colors resize-none"
              rows={5}
            />

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowResponseModal(false)
                  setResponseText('')
                  setSelectedReview(null)
                }}
                className="px-4 py-2 border border-white/10 text-slate-300 font-medium rounded-xl hover:bg-white/5 transition-colors text-sm"
              >
                Annuler
              </button>
              <button
                onClick={submitResponse}
                disabled={!responseText.trim()}
                className="btn-gold px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
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
