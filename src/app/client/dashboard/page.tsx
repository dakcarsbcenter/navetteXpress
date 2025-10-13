"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { CreateReviewModal } from "@/components/client/CreateReviewModal"
import { EditProfileModal } from "@/components/client/EditProfileModal"
import { ClientQuotesView } from "@/components/client/ClientQuotesView"
import UniversalProfilePhotoUpload from "@/components/ui/UniversalProfilePhotoUpload"

interface Booking {
  id: number
  customerName: string
  customerEmail: string
  pickupAddress: string
  dropoffAddress: string
  scheduledDateTime: string
  status: string
  price?: string
  notes?: string
  createdAt: string
}

interface Review {
  id: number
  bookingId: number
  rating: number
  comment?: string
  createdAt: string
  booking?: {
    pickupAddress: string
    dropoffAddress: string
    scheduledDateTime: string
  }
}

interface ReviewableBooking {
  id: number
  pickupAddress: string
  dropoffAddress: string
  scheduledDateTime: string
  createdAt: string
  driver: {
    id: string
    name: string
    email: string
  }
}

interface Quote {
  id: number
  customerName: string
  customerEmail: string
  customerPhone: string | null
  service: string
  preferredDate: string | null
  message: string
  status: 'pending' | 'in_progress' | 'sent' | 'accepted' | 'rejected' | 'expired'
  adminNotes: string | null
  estimatedPrice: string | null
  assignedTo: string | null
  createdAt: string
  updatedAt: string
}

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  createdAt: string
}

type TabType = 'overview' | 'bookings' | 'quotes' | 'reviews' | 'create-reviews' | 'profile'

function ClientDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewableBookings, setReviewableBookings] = useState<ReviewableBooking[]>([])
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<ReviewableBooking | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [userProfile] = useState<UserProfile | null>(null)
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false)
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    totalQuotes: 0,
    pendingQuotes: 0,
    acceptedQuotes: 0,
    totalReviews: 0,
    averageRating: 0,
    reviewableBookings: 0
  })

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    
    if (session?.user && (session.user as unknown as { role?: string }).role !== 'customer') {
      router.push("/dashboard") // Redirection vers dashboard générique
      return
    }
    
    setIsLoading(false)
  }, [session, status, router])

  // Charger les données client
  useEffect(() => {
    if (session?.user && (session.user as unknown as { id?: string }).id) {
      loadClientData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  // Gérer les paramètres d'URL pour l'onglet actif
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl && ['overview', 'bookings', 'quotes', 'create-reviews', 'reviews', 'profile'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl as TabType)
    }
  }, [searchParams])

  const loadClientData = async () => {
    try {
      // Charger les réservations
      const bookingsResponse = await fetch('/api/client/bookings')
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json()
        setBookings(bookingsData.bookings || [])
      }

      // Charger les avis
      const reviewsResponse = await fetch('/api/client/reviews')
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json()
        setReviews(reviewsData.reviews || [])
      }

      // Charger les réservations évaluables
      const reviewableResponse = await fetch('/api/client/bookings/reviewable')
      if (reviewableResponse.ok) {
        const reviewableData = await reviewableResponse.json()
        setReviewableBookings(reviewableData.bookings || [])
      }

      // Charger les devis
      const quotesResponse = await fetch(`/api/quotes/client?email=${encodeURIComponent(session?.user?.email || '')}`)
      if (quotesResponse.ok) {
        const quotesData = await quotesResponse.json()
        if (quotesData.success) {
          setQuotes(quotesData.data || [])
        }
      }

      // Calculer les statistiques
      const totalBookings = bookings.length
      const completedBookings = bookings.filter(b => b.status === 'completed').length
      const pendingBookings = bookings.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status)).length
      const totalQuotes = quotes.length
      const pendingQuotes = quotes.filter(q => ['pending', 'in_progress'].includes(q.status)).length
      const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length
      const totalReviews = reviews.length
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0

      setStats({
        totalBookings,
        completedBookings,
        pendingBookings,
        totalQuotes,
        pendingQuotes,
        acceptedQuotes,
        totalReviews,
        averageRating,
        reviewableBookings: reviewableBookings.length
      })
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-xl text-slate-600 dark:text-slate-300">Chargement...</div>
      </div>
    )
  }

  if (!session?.user || (session.user as unknown as { role?: string }).role !== 'customer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-xl text-red-600">Accès refusé. Page réservée aux clients.</div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Vue d\'ensemble', icon: '📊' },
    { id: 'bookings' as TabType, label: 'Mes réservations', icon: '📅' },
    { id: 'quotes' as TabType, label: 'Mes devis', icon: '📋' },
    { id: 'create-reviews' as TabType, label: 'Évaluer trajets', icon: '⭐', badge: stats.reviewableBookings > 0 ? stats.reviewableBookings : null },
    { id: 'reviews' as TabType, label: 'Mes avis', icon: '✅' },
    { id: 'profile' as TabType, label: 'Mon profil', icon: '👤' },
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Terminée', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { label: status, color: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ⭐
      </span>
    ))
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total réservations</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalBookings}</p>
                  </div>
                  <div className="text-3xl">📅</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Réservations terminées</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completedBookings}</p>
                  </div>
                  <div className="text-3xl">✅</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">En cours/En attente</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendingBookings}</p>
                  </div>
                  <div className="text-3xl">⏳</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total devis</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalQuotes}</p>
                  </div>
                  <div className="text-3xl">📋</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Devis en attente</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendingQuotes}</p>
                  </div>
                  <div className="text-3xl">⏱️</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Devis acceptés</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.acceptedQuotes}</p>
                  </div>
                  <div className="text-3xl">✅</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Note moyenne</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stats.averageRating.toFixed(1)} ⭐
                    </p>
                  </div>
                  <div className="text-3xl">⭐</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">À évaluer</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.reviewableBookings}</p>
                  </div>
                  <div className="text-3xl">🚗</div>
                </div>
                {stats.reviewableBookings > 0 && (
                  <button
                    onClick={() => setActiveTab('create-reviews')}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Évaluer maintenant →
                  </button>
                )}
              </div>
            </div>

            {/* Réservations récentes */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Réservations récentes</h3>
                  <Link 
                    href="#"
                    onClick={() => setActiveTab('bookings')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Voir tout
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {bookings.slice(0, 3).length > 0 ? (
                  <div className="space-y-4">
                    {bookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {booking.pickupAddress} → {booking.dropoffAddress}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500 dark:text-slate-400">Aucune réservation pour le moment</p>
                    <Link 
                      href="/reservation"
                      className="inline-block mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Faire une réservation
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 'bookings':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Toutes mes réservations</h3>
                <div className="flex gap-2">
                  <Link 
                    href="/quote-request"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Demander un devis
                  </Link>
                  <Link 
                    href="/reservation"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Nouvelle réservation
                  </Link>
                </div>
              </div>
            </div>
            <div className="p-6">
              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            Réservation #{booking.id}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {booking.pickupAddress} → {booking.dropoffAddress}
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-slate-700 dark:text-slate-300">Date et heure</p>
                          <p className="text-slate-600 dark:text-slate-400">
                            {new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        
                        {booking.price && (
                          <div>
                            <p className="font-medium text-slate-700 dark:text-slate-300">Prix</p>
                            <p className="text-slate-600 dark:text-slate-400">{booking.price} FCFA</p>
                          </div>
                        )}
                        
                        <div>
                          <p className="font-medium text-slate-700 dark:text-slate-300">Créée le</p>
                          <p className="text-slate-600 dark:text-slate-400">
                            {new Date(booking.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      
                      {booking.notes && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">Notes</p>
                          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{booking.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400">Aucune réservation trouvée</p>
                  <Link 
                    href="/reservation"
                    className="inline-block mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Faire ma première réservation
                  </Link>
                </div>
              )}
            </div>
          </div>
        )

      case 'create-reviews':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Trajets à évaluer</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Évaluez vos trajets terminés et aidez-nous à améliorer notre service
                  </p>
                </div>
                {stats.reviewableBookings > 0 && (
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                    {stats.reviewableBookings} à évaluer
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              {reviewableBookings.length > 0 ? (
                <div className="space-y-4">
                  {reviewableBookings.map((booking) => (
                    <div key={booking.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">🚗</span>
                            <h4 className="font-medium text-slate-900 dark:text-white">
                              Trajet #{booking.id}
                            </h4>
                          </div>
                          
                          <p className="text-slate-700 dark:text-slate-300 mb-2">
                            <strong>Itinéraire :</strong> {booking.pickupAddress} → {booking.dropoffAddress}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <p className="font-medium text-slate-700 dark:text-slate-300">Chauffeur</p>
                              <p className="text-slate-600 dark:text-slate-400">{booking.driver.name}</p>
                            </div>
                            
                            <div>
                              <p className="font-medium text-slate-700 dark:text-slate-300">Date du trajet</p>
                              <p className="text-slate-600 dark:text-slate-400">
                                {new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            setSelectedBookingForReview(booking)
                            setIsReviewModalOpen(true)
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <span className="text-lg">⭐</span>
                          Évaluer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">⭐</div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Aucun trajet à évaluer
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    Vous avez évalué tous vos trajets terminés !
                  </p>
                  <Link 
                    href="/reservation"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Faire une nouvelle réservation
                  </Link>
                </div>
              )}
            </div>
          </div>
        )

      case 'quotes':
        return <ClientQuotesView />

      case 'reviews':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Mes avis publiés</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Avis que vous avez donnés sur vos trajets
              </p>
            </div>
            <div className="p-6">
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            Avis pour la réservation #{review.bookingId}
                          </h4>
                          {review.booking && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {review.booking.pickupAddress} → {review.booking.dropoffAddress}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                          <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">
                            ({review.rating}/5)
                          </span>
                        </div>
                      </div>
                      
                      {review.comment && (
                        <div className="mb-3">
                          <p className="text-slate-700 dark:text-slate-300">{review.comment}</p>
                        </div>
                      )}
                      
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Publié le {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400">Aucun avis donné pour le moment</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    Vous pourrez évaluer vos trajets une fois qu&apos;ils seront terminés
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case 'profile':
        return (
          <div className="space-y-6">
            {/* Section Informations Personnelles */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="text-2xl">👤</span>
                      Mon profil
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Gérez vos informations personnelles
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditProfileModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <span className="text-lg">✏️</span>
                    Modifier
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Nom complet
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="text-slate-900 dark:text-white font-medium">
                          {userProfile?.name || session?.user?.name || "Non renseigné"}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Adresse email
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="text-slate-900 dark:text-white">
                          {userProfile?.email || session?.user?.email || "Non renseigné"}
                        </p>
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
                          ✓ Vérifié
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Téléphone
                      </label>
                      <p className="text-slate-900 dark:text-white">
                        {userProfile?.phone || "Non renseigné"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Section Photo de Profil */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Photo de profil
                      </label>
                      <UniversalProfilePhotoUpload
                        currentImage={session?.user?.image || undefined}
                        onImageUpdate={(imageUrl) => {
                          // La photo sera automatiquement mise à jour dans la session
                          console.log('✅ Photo mise à jour:', imageUrl)
                        }}
                        onSuccess={(message) => {
                          // Vous pouvez ajouter une notification de succès ici
                          console.log('✅ Photo mise à jour:', message)
                        }}
                        onError={(error) => {
                          // Vous pouvez ajouter une notification d'erreur ici
                          console.error('❌ Erreur upload:', error)
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Rôle
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-sm rounded-full font-medium">
                          👤 Client
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Verrouillé
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Membre depuis
                      </label>
                      <p className="text-slate-900 dark:text-white">
                        {userProfile?.createdAt ? 
                          new Date(userProfile.createdAt).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          }) : 
                          "Information non disponible"
                        }
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        ID Client
                      </label>
                      <p className="text-slate-600 dark:text-slate-400 text-sm font-mono">
                        {userProfile?.id?.slice(0, 8) || (session?.user as unknown as { id?: string })?.id?.slice(0, 8) || "N/A"}...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Statistiques du Profil */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Mon activité
                </h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.totalBookings}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Réservations
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.completedBookings}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Terminées
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.totalReviews}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Avis donnés
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {stats.averageRating.toFixed(1)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Note moy.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Sécurité (future extension) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-2xl">🔒</span>
                  Sécurité du compte
                </h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">Mot de passe</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Dernière modification il y a plus de 30 jours
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                      Changer
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div>
                      <h4 className="font-medium text-green-900 dark:text-green-400">Email vérifié</h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Votre adresse email est confirmée
                      </p>
                    </div>
                    <span className="text-green-600 dark:text-green-400 text-2xl">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return <div>Contenu non trouvé</div>
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation variant="solid" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Bonjour, {session.user.name} 👋
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Bienvenue dans votre espace client. Gérez vos réservations et consultez vos avis.
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Déconnexion
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 relative ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {tab.badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>

      {/* Modal de création d'avis */}
      <CreateReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false)
          setSelectedBookingForReview(null)
        }}
        booking={selectedBookingForReview}
        onSuccess={() => {
          // Recharger les données après création d'un avis
          loadClientData()
        }}
      />

      {/* Modal d'édition de profil */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSuccess={() => {
          // Recharger les données après mise à jour du profil
          loadClientData()
        }}
      />
    </div>
  )
}

export default function ClientDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Chargement du tableau de bord...</p>
        </div>
      </div>
    }>
      <ClientDashboardContent />
    </Suspense>
  )
}
