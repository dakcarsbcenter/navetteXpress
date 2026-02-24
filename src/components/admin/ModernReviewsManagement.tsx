"use client"

import React, { useState, useEffect } from "react"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { useNotification } from "@/hooks/useNotification"

interface Review {
  id: number
  customerName: string
  customerEmail: string
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
}

export function ModernReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'analytics' | 'reviews' | 'responses'>('analytics')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const { notifications, showSuccess, showError, removeNotification } = useNotification()
  
  const [filters, setFilters] = useState({
    rating: '',
    status: '',
    search: '',
    dateRange: '',
    service: '',
    tags: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })

  const [responseForm, setResponseForm] = useState({
    message: '',
    makePublic: true
  })

  useEffect(() => {
    fetchReviews()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [reviews, filters])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews')
      const result = await response.json()
      
      if (result.success) {
        setReviews(result.data)
      } else {
        showError('Erreur lors du chargement des avis', 'Erreur de chargement')
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      showError('Erreur lors du chargement des avis', 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...reviews]

    // Filtres
    if (filters.rating) {
      filtered = filtered.filter(review => review.rating === parseInt(filters.rating))
    }
    if (filters.status) {
      if (filters.status === 'approved') {
        filtered = filtered.filter(review => review.isApproved)
      } else if (filters.status === 'pending') {
        filtered = filtered.filter(review => !review.isApproved)
      } else if (filters.status === 'responded') {
        filtered = filtered.filter(review => review.response)
      } else if (filters.status === 'public') {
        filtered = filtered.filter(review => review.isPublic)
      }
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(review => 
        review.customerName.toLowerCase().includes(searchTerm) ||
        review.comment.toLowerCase().includes(searchTerm) ||
        review.service.toLowerCase().includes(searchTerm)
      )
    }
    if (filters.service) {
      filtered = filtered.filter(review => review.service.toLowerCase().includes(filters.service.toLowerCase()))
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue = a[filters.sortBy as keyof Review] as string | number
      let bValue = b[filters.sortBy as keyof Review] as string | number
      
      if (filters.sortBy === 'createdAt' || filters.sortBy === 'updatedAt') {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue)
        return filters.sortOrder === 'asc' ? result : -result
      } else {
        const result = (aValue as number) - (bValue as number)
        return filters.sortOrder === 'asc' ? result : -result
      }
    })

    setFilteredReviews(filtered)
  }

  const getStarDisplay = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-lg',
      lg: 'text-2xl'
    }
    
    return (
      <div className={`flex gap-1 ${sizeClasses[size]}`}>
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}>
            ⭐
          </span>
        ))}
      </div>
    )
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 dark:text-green-400'
    if (rating >= 3) return 'text-yellow-600 dark:text-yellow-400'
    if (rating >= 2) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getStats = () => {
    const total = reviews.length
    const approved = reviews.filter(r => r.isApproved).length
    const pending = reviews.filter(r => !r.isApproved).length
    const responded = reviews.filter(r => r.response).length
    const publicReviews = reviews.filter(r => r.isPublic).length
    
    const averageRating = total > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
      : '0'
    
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    }
    
    const satisfactionRate = total > 0 
      ? ((reviews.filter(r => r.rating >= 4).length / total) * 100).toFixed(1)
      : '0'
    
    return {
      total,
      approved,
      pending,
      responded,
      publicReviews,
      averageRating,
      ratingDistribution,
      satisfactionRate
    }
  }

  const handleApproval = async (reviewId: number, approve: boolean) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: approve })
      })
      
      if (response.ok) {
        await fetchReviews()
        showSuccess(
          `Avis ${approve ? 'approuvé' : 'rejeté'} avec succès`,
          'Mise à jour réussie'
        )
      }
    } catch (error) {
      showError('Erreur lors de la mise à jour', 'Erreur')
    }
  }

  const handleVisibilityToggle = async (reviewId: number, isPublic: boolean) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !isPublic })
      })
      
      if (response.ok) {
        await fetchReviews()
        showSuccess(
          `Avis ${!isPublic ? 'publié' : 'masqué'} avec succès`,
          'Visibilité mise à jour'
        )
      }
    } catch (error) {
      showError('Erreur lors de la mise à jour', 'Erreur')
    }
  }

  const submitResponse = async () => {
    if (!selectedReview || !responseForm.message.trim()) return
    
    try {
      const response = await fetch(`/api/reviews/${selectedReview.id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: responseForm.message,
          makePublic: responseForm.makePublic
        })
      })
      
      if (response.ok) {
        await fetchReviews()
        setShowResponseModal(false)
        setResponseForm({ message: '', makePublic: true })
        setSelectedReview(null)
        showSuccess('Réponse ajoutée avec succès', 'Réponse envoyée')
      }
    } catch (error) {
      showError('Erreur lors de l\'envoi de la réponse', 'Erreur')
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-pink-50/30 to-slate-50 dark:from-slate-900 dark:via-pink-900/10 dark:to-slate-900">
      <div className="p-3 sm:p-6 max-w-7xl mx-auto">
        
        {/* Header avec statistiques */}
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2">
                Gestion avis clients
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Suivez la satisfaction de vos clients et gérez les retours
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
              {/* Boutons de vue - Mode grille sur mobile */}
              <div className="grid grid-cols-3 sm:flex bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-700 gap-1 sm:gap-0">
                <button
                  onClick={() => setViewMode('analytics')}
                  className={`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    viewMode === 'analytics'
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="hidden sm:inline">Analytics</span>
                </button>
                <button
                  onClick={() => setViewMode('reviews')}
                  className={`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    viewMode === 'reviews'
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="hidden sm:inline">Avis</span>
                </button>
                <button
                  onClick={() => setViewMode('responses')}
                  className={`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    viewMode === 'responses'
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span className="hidden sm:inline">Réponses</span>
                </button>
              </div>
              
              {/* Export */}
              <button className="w-full sm:w-auto bg-linear-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Exporter</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Total avis</p>
                </div>
                <div className="text-xl sm:text-2xl">💬</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{stats.averageRating}/5</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Note moyenne</p>
                </div>
                <div className="text-2xl">⭐</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.satisfactionRate}%</p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Satisfaction</p>
                </div>
                <div className="text-xl sm:text-2xl">😊</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.approved}</p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Approuvés</p>
                </div>
                <div className="text-xl sm:text-2xl">✅</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">En attente</p>
                </div>
                <div className="text-xl sm:text-2xl">⏳</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.responded}</p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Répondus</p>
                </div>
                <div className="text-xl sm:text-2xl">💬</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.publicReviews}</p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Publics</p>
                </div>
                <div className="text-xl sm:text-2xl">🌐</div>
              </div>
            </div>
          </div>
        </div>

        {/* Vue Analytics */}
        {viewMode === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Graphique de distribution des notes */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                Distribution des notes
              </h3>
              <div className="space-y-4">
                {Object.entries(stats.ratingDistribution).reverse().map(([rating, count]) => {
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                  return (
                    <div key={rating} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 w-20">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {rating}
                        </span>
                        <span className="text-yellow-400">⭐</span>
                      </div>
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                        <div 
                          className="bg-linear-to-r from-pink-500 to-rose-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="w-16 text-right">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {count}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                          ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Métriques clés */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Performance
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Taux d'approbation</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Taux de réponse</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {stats.total > 0 ? ((stats.responded / stats.total) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Visibilité publique</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {stats.total > 0 ? ((stats.publicReviews / stats.total) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Tendances
                </h3>
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">📈</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Graphiques temporels à venir
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Recherche */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Filtre par note */}
            <select
              value={filters.rating}
              onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Toutes les notes</option>
              <option value="5">⭐⭐⭐⭐⭐ (5)</option>
              <option value="4">⭐⭐⭐⭐ (4)</option>
              <option value="3">⭐⭐⭐ (3)</option>
              <option value="2">⭐⭐ (2)</option>
              <option value="1">⭐ (1)</option>
            </select>

            {/* Filtre par statut */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">⏳ En attente</option>
              <option value="approved">✅ Approuvés</option>
              <option value="public">🌐 Publics</option>
              <option value="responded">💬 Répondus</option>
            </select>

            {/* Filtre par service */}
            <input
              type="text"
              placeholder="Service..."
              value={filters.service}
              onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value }))}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-white"
            />

            {/* Filtre par date */}
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Toutes les dates</option>
              <option value="today">📅 Aujourd'hui</option>
              <option value="week">📅 Cette semaine</option>
              <option value="month">📅 Ce mois</option>
            </select>

            {/* Tri */}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }))
              }}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="createdAt-desc">Plus récents</option>
              <option value="createdAt-asc">Plus anciens</option>
              <option value="rating-desc">Note décroissante</option>
              <option value="rating-asc">Note croissante</option>
              <option value="customerName-asc">Client A-Z</option>
            </select>
          </div>
        </div>

        {/* Vue des avis */}
        {viewMode === 'reviews' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredReviews.map((review) => (
              <div key={review.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="p-6">
                  {/* Header de l'avis */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-linear-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {review.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {review.customerName}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {review.service}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStarDisplay(review.rating, 'sm')}
                      <span className={`font-semibold ${getRatingColor(review.rating)}`}>
                        {review.rating}/5
                      </span>
                    </div>
                  </div>

                  {/* Contenu de l'avis */}
                  <div className="mb-4">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {review.comment}
                    </p>
                  </div>

                  {/* Badges de statut */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {review.isApproved ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        ✅ Approuvé
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                        ⏳ En attente
                      </span>
                    )}
                    
                    {review.isPublic && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        🌐 Public
                      </span>
                    )}
                    
                    {review.response && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        💬 Répondu
                      </span>
                    )}
                  </div>

                  {/* Réponse existante */}
                  {review.response && (
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4 border-l-4 border-pink-500">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {review.respondedBy || 'Équipe NavetteXpress'}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {review.respondedAt && new Date(review.respondedAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {review.response}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                    {!review.isApproved && (
                      <button
                        onClick={() => handleApproval(review.id, true)}
                        className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Approuver
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleVisibilityToggle(review.id, review.isPublic)}
                      className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        review.isPublic
                          ? 'bg-slate-600 text-white hover:bg-slate-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {review.isPublic ? 'Masquer' : 'Publier'}
                    </button>
                    
                    {!review.response && (
                      <button
                        onClick={() => {
                          setSelectedReview(review)
                          setShowResponseModal(true)
                        }}
                        className="text-sm bg-pink-600 text-white px-3 py-1.5 rounded-lg hover:bg-pink-700 transition-colors"
                      >
                        Répondre
                      </button>
                    )}
                    
                    <span className="text-xs text-slate-500 dark:text-slate-400 self-center ml-auto">
                      {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vue des réponses */}
        {viewMode === 'responses' && (
          <div className="space-y-6">
            {filteredReviews.filter(review => review.response).map((review) => (
              <div key={review.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6">
                  {/* Header de l'avis original */}
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-linear-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {review.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {review.customerName}
                        </h3>
                        <div className="flex items-center gap-2">
                          {getStarDisplay(review.rating, 'sm')}
                          <span className={`text-sm font-medium ${getRatingColor(review.rating)}`}>
                            {review.rating}/5
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  {/* Avis original */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Avis client :</h4>
                    <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-sm">
                      {review.comment}
                    </p>
                  </div>

                  {/* Réponse */}
                  <div className="bg-linear-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg p-4 border-l-4 border-pink-500">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">
                          {review.respondedBy || 'Équipe NavetteXpress'}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                          {review.respondedAt && new Date(review.respondedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {review.response}
                    </p>
                  </div>

                  {/* Badges de statut */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                      💬 Répondu
                    </span>
                    {review.isPublic && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        🌐 Public
                      </span>
                    )}
                    {review.isApproved && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        ✅ Approuvé
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message si aucun résultat */}
        {((viewMode === 'reviews' && filteredReviews.length === 0) || 
          (viewMode === 'responses' && filteredReviews.filter(r => r.response).length === 0)) && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {viewMode === 'responses' ? '💬' : '📝'}
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {viewMode === 'responses' ? 'Aucune réponse trouvée' : 'Aucun avis trouvé'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {viewMode === 'responses' 
                ? (filteredReviews.length === 0 
                    ? 'Aucun avis dans la base de données'
                    : 'Aucun avis avec réponse ne correspond aux critères de recherche')
                : (Object.values(filters).some(v => v !== '' && v !== 'createdAt' && v !== 'desc')
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Les avis clients apparaîtront ici')
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de réponse */}
      {showResponseModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Répondre à l'avis
                </h3>
                <button
                  onClick={() => {
                    setShowResponseModal(false)
                    setSelectedReview(null)
                    setResponseForm({ message: '', makePublic: true })
                  }}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
              
              {/* Avis original */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-slate-900 dark:text-white">
                    {selectedReview.customerName}
                  </span>
                  {getStarDisplay(selectedReview.rating, 'sm')}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {selectedReview.comment}
                </p>
              </div>
              
              {/* Formulaire de réponse */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Votre réponse
                  </label>
                  <textarea
                    value={responseForm.message}
                    onChange={(e) => setResponseForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-white"
                    placeholder="Rédigez votre réponse..."
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="makePublic"
                    checked={responseForm.makePublic}
                    onChange={(e) => setResponseForm(prev => ({ ...prev, makePublic: e.target.checked }))}
                    className="w-4 h-4 text-pink-600 bg-slate-100 border-slate-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                  />
                  <label htmlFor="makePublic" className="text-sm text-slate-900 dark:text-white">
                    Rendre cette réponse publique
                  </label>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={submitResponse}
                    disabled={!responseForm.message.trim()}
                    className="flex-1 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Envoyer la réponse
                  </button>
                  <button
                    onClick={() => {
                      setShowResponseModal(false)
                      setSelectedReview(null)
                      setResponseForm({ message: '', makePublic: true })
                    }}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <NotificationCenter
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  )
}
