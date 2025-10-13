"use client"

import { useState, useEffect } from "react"

interface Review {
  id: number
  bookingId: number
  rating: number
  comment?: string
  createdAt: string
  booking?: {
    customerName: string
    customerEmail: string
    pickupAddress: string
    dropoffAddress: string
    scheduledDateTime: string
  }
}

export function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    bookingId: '',
    rating: 5,
    comment: ''
  })

  useEffect(() => {
    fetchReviews()
  }, [])

  // Fermer les dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.relative')) {
        setOpenDropdownId(null)
      }
    }

    if (openDropdownId !== null) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdownId])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/admin/reviews')
      if (response.ok) {
        const data = await response.json()
        setReviews(data)
      } else {
        console.error('Erreur HTTP:', response.status)
        setReviews([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error)
      setReviews([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchReviews()
        setIsModalOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error)
    }
  }

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReview) return
    
    try {
      const response = await fetch(`/api/admin/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchReviews()
        setIsModalOpen(false)
        setEditingReview(null)
        resetForm()
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) return
    
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchReviews()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      bookingId: '',
      rating: 5,
      comment: ''
    })
  }

  const openEditModal = (review: Review) => {
    setEditingReview(review)
    setFormData({
      bookingId: review.bookingId.toString(),
      rating: review.rating,
      comment: review.comment || ''
    })
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingReview(null)
    resetForm()
    setIsModalOpen(true)
  }

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 dark:text-green-400'
    if (rating >= 3) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestion des avis
        </h2>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Nouvel avis
        </button>
      </div>

      {/* Tableau des avis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Trajet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Note
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Commentaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {review.booking?.customerName || 'Client inconnu'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {review.booking?.customerEmail || ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="font-medium">📍 {review.booking?.pickupAddress || 'Adresse inconnue'}</div>
                      <div className="text-gray-500 dark:text-gray-400">↓</div>
                      <div className="font-medium">🎯 {review.booking?.dropoffAddress || 'Destination inconnue'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {review.booking?.scheduledDateTime ? 
                          new Date(review.booking.scheduledDateTime).toLocaleDateString('fr-FR') : 
                          'Date inconnue'
                        }
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-lg font-bold ${getRatingColor(review.rating)}`}>
                      {getRatingStars(review.rating)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {review.rating}/5
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs">
                      {review.comment ? (
                        <div className="truncate" title={review.comment}>
                          {review.comment}
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 italic">
                          Aucun commentaire
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === review.id ? null : review.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Actions
                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Menu déroulant */}
                      {openDropdownId === review.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                          <div className="py-1">
                            {/* Option Modifier */}
                            <button
                              onClick={() => {
                                openEditModal(review);
                                setOpenDropdownId(null);
                              }}
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 w-full text-left transition-colors duration-200"
                            >
                              <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Modifier
                              </span>
                            </button>

                            {/* Séparateur */}
                            <div className="border-t border-gray-100 dark:border-gray-600"></div>

                            {/* Option Supprimer */}
                            <button
                              onClick={() => {
                                handleDeleteReview(review.id);
                                setOpenDropdownId(null);
                              }}
                              className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 w-full text-left transition-colors duration-200"
                            >
                              <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Supprimer
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingReview ? 'Modifier l\'avis' : 'Nouvel avis'}
            </h3>
            
            <form onSubmit={editingReview ? handleUpdateReview : handleCreateReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID de la réservation
                </label>
                <input
                  type="number"
                  value={formData.bookingId}
                  onChange={(e) => setFormData({...formData, bookingId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Note (1-5)
                </label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value={1}>⭐ (1/5)</option>
                  <option value={2}>⭐⭐ (2/5)</option>
                  <option value={3}>⭐⭐⭐ (3/5)</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Commentaire
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Laissez un commentaire sur le service..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                >
                  {editingReview ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
