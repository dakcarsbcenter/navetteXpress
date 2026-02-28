'use client'

import { useEffect, useState } from 'react'
import {
  Star,
  MagnifyingGlass as Search,
  Download,
  ChatCircleDots as MessageSquare,
  CheckCircle,
  Clock,
  TrendUp as TrendingUp,
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
  const { notifications, showSuccess, showError, removeNotification } = useNotification()

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reviews')
      const result = await response.json()

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

    const matchesRating = ratingFilter === 'all' ||
      (ratingFilter === 'all' ? true : review.rating.toString() === ratingFilter)

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
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId)
      } else {
        newSet.add(reviewId)
      }
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

      const data = await response.json()

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
    const sizeClass = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
          />
        ))}
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getStatusBadge = (review: Review) => {
    if (review.isPublic) {
      return { label: 'PUBLIÉ', bg: 'bg-green-100', text: 'text-green-700' }
    } else if (!review.isApproved) {
      return { label: 'EN ATTENTE', bg: 'bg-orange-100', text: 'text-orange-700' }
    }
    return { label: 'BROUILLON', bg: 'bg-gray-100', text: 'text-gray-700' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
  <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-pulse"
       style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>
    Navette Xpress
  </div>
</div>
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Avis & Satisfaction</h1>
            <p className="text-sm text-gray-500 mt-1">Modérez les retours et analysez la satisfaction client.</p>
          </div>
          <div className="flex gap-2">
            {selectedReviewIds.size > 0 && (
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-2 bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Trash className="w-5 h-5" />
                <span className="hidden sm:inline">Supprimer ({selectedReviewIds.size})</span>
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2 uppercase font-medium">Note Moyenne</div>
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {stats.averageRating.toFixed(1)}
                <span className="text-2xl text-gray-400"> / 5.0</span>
              </div>
              <div className="flex justify-center mb-3">
                {renderStars(Math.round(stats.averageRating), 'lg')}
              </div>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 border-4 border-yellow-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-700">{Math.round(stats.satisfactionRate)}%</div>
                  <div className="text-xs text-yellow-600">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-3 uppercase font-medium">Distribution</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span>5 ★</span>
                </span>
                <div className="flex items-center gap-2 flex-1 mx-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full"
                      style={{ width: `${stats.totalReviews > 0 ? (stats.distribution[5] / stats.totalReviews) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-700 font-semibold min-w-[35px] text-right">
                    {stats.totalReviews > 0 ? Math.round((stats.distribution[5] / stats.totalReviews) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span>4 ★</span>
                </span>
                <div className="flex items-center gap-2 flex-1 mx-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-green-400 h-full rounded-full"
                      style={{ width: `${stats.totalReviews > 0 ? (stats.distribution[4] / stats.totalReviews) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-700 font-semibold min-w-[35px] text-right">
                    {stats.totalReviews > 0 ? Math.round((stats.distribution[4] / stats.totalReviews) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span>3 ★</span>
                </span>
                <div className="flex items-center gap-2 flex-1 mx-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full rounded-full"
                      style={{ width: `${stats.totalReviews > 0 ? (stats.distribution[3] / stats.totalReviews) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-700 font-semibold min-w-[35px] text-right">
                    {stats.totalReviews > 0 ? Math.round((stats.distribution[3] / stats.totalReviews) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span>1-2 ★</span>
                </span>
                <div className="flex items-center gap-2 flex-1 mx-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-red-400 h-full rounded-full"
                      style={{ width: `${stats.totalReviews > 0 ? (stats.distribution['1-2'] / stats.totalReviews) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-700 font-semibold min-w-[35px] text-right">
                    {stats.totalReviews > 0 ? Math.round((stats.distribution['1-2'] / stats.totalReviews) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <div className="text-sm text-orange-700 mb-2 uppercase font-medium">À Modérer</div>
            <div className="text-5xl font-bold text-orange-600 mb-2">{stats.pendingReviews}</div>
            <div className="text-sm text-orange-600">Avis en attente de validation</div>
            {stats.pendingReviews > 0 && (
              <button className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors">
                Traiter maintenant
              </button>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-3 uppercase font-medium">Statistiques</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total avis</span>
                <span className="text-lg font-bold text-gray-900">{stats.totalReviews}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avec réponse</span>
                <span className="text-lg font-bold text-gray-900">
                  {reviews.filter(r => r.response).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Publiés</span>
                <span className="text-lg font-bold text-green-600">
                  {reviews.filter(r => r.isPublic).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={filteredReviews.length > 0 && selectedReviewIds.size === filteredReviews.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
            />
            <span className="text-sm text-gray-600">Tout sélectionner</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans les avis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Toutes les notes</option>
            <option value="5">5 étoiles</option>
            <option value="4">4 étoiles</option>
            <option value="3">3 étoiles</option>
            <option value="2">2 étoiles</option>
            <option value="1">1 étoile</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="published">Publiés</option>
            <option value="pending">En attente</option>
            <option value="responded">Avec réponse</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <p className="text-gray-500">Aucun avis trouvé</p>
            </div>
          ) : (
            filteredReviews.map((review) => {
              const statusBadge = getStatusBadge(review)
              const borderColor = !review.isApproved ? 'border-l-4 border-l-orange-400' : ''

              return (
                <div key={review.id} className={`bg-white border border-gray-200 rounded-xl p-6 relative ${borderColor}`}>
                  {/* Select Checkbox */}
                  <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedReviewIds.has(review.id)}
                      onChange={(e) => toggleSelectReview(e as unknown as React.MouseEvent, review.id)}
                      className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-start justify-between gap-4 pl-6">
                    {/* Left: User Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-blue-700">
                          {getInitials(review.customerName)}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-gray-900">{review.customerName}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusBadge.bg} ${statusBadge.text} font-medium`}>
                            {statusBadge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
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
                          <div className="flex items-center gap-2 mb-2">
                            {renderStars(review.rating)}
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">{review.service || 'Service impeccable !'}</h4>
                          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                        </div>

                        {review.response && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900 mb-1">Réponse de l'équipe</div>
                                <p className="text-sm text-gray-700">{review.response}</p>
                                {review.respondedAt && (
                                  <div className="text-xs text-gray-500 mt-2">
                                    {new Date(review.respondedAt).toLocaleDateString('fr-FR')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2">
                      {review.isPublic ? (
                        <button
                          onClick={() => handleMask(review.id)}
                          className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
                        >
                          Masquer
                        </button>
                      ) : !review.isApproved ? (
                        <button
                          onClick={() => handlePublish(review.id)}
                          className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Publier
                        </button>
                      ) : null}

                      <button
                        onClick={() => handleRespond(review)}
                        className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
                      >
                        {review.response ? 'Modifier réponse' : 'Répondre'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Répondre à l'avis de {selectedReview.customerName}
            </h2>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                {renderStars(selectedReview.rating)}
              </div>
              <p className="text-gray-700 text-sm">{selectedReview.comment}</p>
            </div>

            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Écrivez votre réponse..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={6}
            />

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowResponseModal(false)
                  setResponseText('')
                  setSelectedReview(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={submitResponse}
                disabled={!responseText.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Envoyer la réponse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
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
