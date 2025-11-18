"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { CreateReviewModal } from "@/components/client/CreateReviewModal"
import { EditProfileModal } from "@/components/client/EditProfileModal"
import { EditBookingModal } from "@/components/client/EditBookingModal"
import { PriceApprovalModal } from "@/components/client/PriceApprovalModal"
import { ClientQuotesView } from "@/components/client/ClientQuotesView"
import { ClientInvoicesView } from "@/components/client/ClientInvoicesView"
import UniversalProfilePhotoUpload from "@/components/ui/UniversalProfilePhotoUpload"
import { VehiclesManagement } from "@/components/client/VehiclesManagement"
import { ClientUsersManagement } from "@/components/client/ClientUsersManagement"

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
  priceProposedAt?: string
  clientResponse?: string
  clientResponseAt?: string
  clientResponseMessage?: string
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

type TabType = 'overview' | 'bookings' | 'quotes' | 'invoices' | 'reviews' | 'create-reviews' | 'profile' | 'vehicles' | 'users'

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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false)
  const [userPermissions, setUserPermissions] = useState<Record<string, string[]>>({})
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [isEditBookingModalOpen, setIsEditBookingModalOpen] = useState(false)
  const [bookingForPriceApproval, setBookingForPriceApproval] = useState<Booking | null>(null)
  const [isPriceApprovalModalOpen, setIsPriceApprovalModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
      loadUserPermissions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const loadUserPermissions = async () => {
    try {
      const response = await fetch('/api/auth/permissions')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log('📋 Permissions utilisateur:', data.permissions)
          setUserPermissions(data.permissions || {})
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des permissions:', error)
    }
  }

  // Gérer les paramètres d'URL pour l'onglet actif
  useEffect(() => {
    const tabFromUrl = searchParams?.get('tab')
    if (tabFromUrl && ['overview', 'bookings', 'quotes', 'invoices', 'create-reviews', 'reviews', 'profile', 'vehicles', 'users'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl as TabType)
    }
  }, [searchParams])

  const loadClientData = async () => {
    try {
      // Charger le profil utilisateur
      const profileResponse = await fetch('/api/client/profile')
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        if (profileData.success) {
          setUserProfile(profileData.user)
        }
      }

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
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  // Recalculer les statistiques chaque fois que les données changent
  useEffect(() => {
    const totalBookings = bookings.length
    const completedBookings = bookings.filter(b => b.status === 'completed').length
    const pendingBookings = bookings.filter(b => ['pending', 'confirmed', 'in_progress', 'assigned'].includes(b.status)).length
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
  }, [bookings, quotes, reviews, reviewableBookings])

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

  // Fonctions pour vérifier les permissions de manière précise
  const isAdmin = (session?.user as any)?.role === 'admin'
  
  // Bookings permissions - Chaque permission est indépendante
  const hasBookingsManagePermission = userPermissions.bookings?.includes('manage')
  const hasBookingsReadPermission = userPermissions.bookings?.includes('read') || hasBookingsManagePermission
  const hasBookingsCreatePermission = userPermissions.bookings?.includes('create') || hasBookingsManagePermission
  const hasBookingsUpdatePermission = userPermissions.bookings?.includes('update') || hasBookingsManagePermission
  const hasBookingsDeletePermission = userPermissions.bookings?.includes('delete') || hasBookingsManagePermission
  const canViewBookings = hasBookingsReadPermission || hasBookingsCreatePermission || hasBookingsUpdatePermission || hasBookingsDeletePermission

  // Debug permissions
  console.log('🔍 Bookings Permissions Debug:', {
    raw: userPermissions.bookings,
    manage: hasBookingsManagePermission,
    read: hasBookingsReadPermission,
    create: hasBookingsCreatePermission,
    update: hasBookingsUpdatePermission,
    delete: hasBookingsDeletePermission,
    canView: canViewBookings
  })

  // Quotes permissions - Chaque permission est indépendante
  const hasQuotesManagePermission = userPermissions.quotes?.includes('manage')
  const hasQuotesReadPermission = userPermissions.quotes?.includes('read') || hasQuotesManagePermission
  const hasQuotesCreatePermission = userPermissions.quotes?.includes('create') || hasQuotesManagePermission
  const hasQuotesUpdatePermission = userPermissions.quotes?.includes('update') || hasQuotesManagePermission
  const hasQuotesDeletePermission = userPermissions.quotes?.includes('delete') || hasQuotesManagePermission
  const canManageQuotes = hasQuotesReadPermission || hasQuotesCreatePermission || hasQuotesUpdatePermission || hasQuotesDeletePermission

  // Reviews permissions - Chaque permission est indépendante
  const hasReviewsManagePermission = userPermissions.reviews?.includes('manage')
  const hasReviewsReadPermission = userPermissions.reviews?.includes('read') || hasReviewsManagePermission
  const hasReviewsCreatePermission = userPermissions.reviews?.includes('create') || hasReviewsManagePermission
  const hasReviewsUpdatePermission = userPermissions.reviews?.includes('update') || hasReviewsManagePermission
  const hasReviewsDeletePermission = userPermissions.reviews?.includes('delete') || hasReviewsManagePermission
  const canManageReviews = hasReviewsReadPermission || hasReviewsCreatePermission || hasReviewsUpdatePermission || hasReviewsDeletePermission

  // Vérifier si l'utilisateur peut gérer les véhicules
  const canManageVehicles = userPermissions.vehicles?.includes('manage') || 
                           userPermissions.vehicles?.includes('read') ||
                           userPermissions.vehicles?.includes('create') ||
                           userPermissions.vehicles?.includes('update')

  // Vérifier si l'utilisateur peut gérer les utilisateurs
  const canManageUsers = userPermissions.users?.includes('manage') || 
                        userPermissions.users?.includes('read') ||
                        userPermissions.users?.includes('create') ||
                        userPermissions.users?.includes('update')

  const tabs = [
    { id: 'overview' as TabType, label: 'Vue d\'ensemble', icon: '📊' },
    ...(canViewBookings ? [{ id: 'bookings' as TabType, label: 'Mes réservations', icon: '📅' }] : []),
    // Ajouter l'onglet devis si l'utilisateur a les permissions
    ...(canManageQuotes ? [{ id: 'quotes' as TabType, label: 'Mes devis', icon: '📋' }] : []),
    // Ajouter l'onglet factures
    { id: 'invoices' as TabType, label: 'Mes factures', icon: '🧾' },
    { id: 'create-reviews' as TabType, label: 'Évaluer trajets', icon: '⭐', badge: stats.reviewableBookings > 0 ? stats.reviewableBookings : null },
    // Ajouter l'onglet avis si l'utilisateur a les permissions
    ...(canManageReviews ? [{ id: 'reviews' as TabType, label: 'Mes avis', icon: '✅' }] : []),
    // Ajouter l'onglet véhicules si l'utilisateur a les permissions
    ...(canManageVehicles ? [{ id: 'vehicles' as TabType, label: 'Véhicules', icon: '🚗' }] : []),
    // Ajouter l'onglet utilisateurs si l'utilisateur a les permissions
    ...(canManageUsers ? [{ id: 'users' as TabType, label: 'Utilisateurs', icon: '👥' }] : []),
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
          <div className="space-y-8">
            {/* Section titre avec message de bienvenue */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                Bonjour, {session?.user?.name || 'Client'} 👋
              </h2>
              <p className="text-purple-100 text-sm sm:text-base">
                Bienvenue dans votre espace client. Gérez vos réservations et consultez vos statistiques.
              </p>
            </div>

            {/* Grille de statistiques optimisée */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {/* Total réservations */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total réservations</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.totalBookings}</p>
                  </div>
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <span className="text-2xl">📅</span>
                  </span>
                </div>
              </div>

              {/* Réservations terminées */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Terminées</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.completedBookings}</p>
                  </div>
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20">
                    <span className="text-2xl">✅</span>
                  </span>
                </div>
              </div>

              {/* En cours/En attente */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">En attente</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{stats.pendingBookings}</p>
                  </div>
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
                    <span className="text-2xl">⏳</span>
                  </span>
                </div>
              </div>

              {/* Total devis */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total devis</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.totalQuotes}</p>
                  </div>
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                    <span className="text-2xl">📋</span>
                  </span>
                </div>
              </div>

              {/* Devis en attente */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Devis en attente</p>
                    <p className="text-3xl font-bold text-pink-600 dark:text-pink-400 mt-2">{stats.pendingQuotes}</p>
                  </div>
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-900/20">
                    <span className="text-2xl">⏱️</span>
                  </span>
                </div>
              </div>

              {/* Devis acceptés */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Devis acceptés</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.acceptedQuotes}</p>
                  </div>
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20">
                    <span className="text-2xl">✅</span>
                  </span>
                </div>
              </div>

              {/* Note moyenne */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Note moyenne</p>
                    <p className="text-3xl font-bold text-yellow-500 dark:text-yellow-400 mt-2">
                      {stats.averageRating.toFixed(1)} ⭐
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
                    <span className="text-2xl">⭐</span>
                  </span>
                </div>
              </div>

              {/* À évaluer - avec CTA */}
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-5 rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-red-400">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold text-red-100 uppercase tracking-wide">À évaluer</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.reviewableBookings}</p>
                  </div>
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
                    <span className="text-2xl">🚗</span>
                  </span>
                </div>
                {stats.reviewableBookings > 0 && (
                  <button
                    onClick={() => setActiveTab('create-reviews')}
                    className="mt-2 w-full bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    Évaluer maintenant
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
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
                  {hasQuotesCreatePermission && (
                    <Link 
                      href="/quote-request"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Demander un devis
                    </Link>
                  )}
                  {hasBookingsCreatePermission && (
                    <Link 
                      href="/reservation"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Nouvelle réservation
                    </Link>
                  )}
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
                          {/* Badge pour prix en attente d'approbation */}
                          {booking.clientResponse === 'pending' && booking.price && parseFloat(booking.price) > 0 && (
                            <div className="mt-2">
                              <span className="inline-flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full text-xs font-medium border border-yellow-200 dark:border-yellow-700">
                                💰 En attente de votre réponse
                              </span>
                            </div>
                          )}
                          {booking.clientResponse === 'accepted' && (
                            <div className="mt-2">
                              <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium border border-green-200 dark:border-green-700">
                                ✅ Prix accepté
                              </span>
                            </div>
                          )}
                          {booking.clientResponse === 'rejected' && (
                            <div className="mt-2">
                              <span className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium border border-red-200 dark:border-red-700">
                                ❌ Prix refusé
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(booking.status)}
                          {/* Bouton pour répondre à la proposition de prix */}
                          {booking.clientResponse === 'pending' && booking.price && parseFloat(booking.price) > 0 && (
                            <button
                              onClick={() => {
                                setBookingForPriceApproval(booking)
                                setIsPriceApprovalModalOpen(true)
                              }}
                              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
                              title="Répondre à la proposition de prix"
                            >
                              💰 Répondre
                            </button>
                          )}
                          {/* Bouton éditer visible seulement si la réservation n'est pas confirmée/terminée/annulée */}
                          {hasBookingsUpdatePermission && !['confirmed', 'in_progress', 'completed', 'cancelled'].includes(booking.status) && (
                            <button
                              onClick={() => {
                                setEditingBooking(booking)
                                setIsEditBookingModalOpen(true)
                              }}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="Modifier la réservation"
                            >
                              ✏️ Modifier
                            </button>
                          )}
                          {hasBookingsDeletePermission && (
                            <button
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                              title="Supprimer la réservation"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
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
                  {hasBookingsCreatePermission && (
                    <Link 
                      href="/reservation"
                      className="inline-block mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Faire ma première réservation
                    </Link>
                  )}
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
                          disabled={!hasReviewsCreatePermission}
                          title={hasReviewsCreatePermission ? "Évaluer ce trajet" : "Vous n'avez pas la permission de créer des avis"}
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
                  {hasBookingsCreatePermission && (
                    <Link 
                      href="/reservation"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Faire une nouvelle réservation
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case 'quotes':
        return <ClientQuotesView />

      case 'invoices':
        return <ClientInvoicesView />

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

      case 'vehicles':
        return <VehiclesManagement />

      case 'users':
        return <ClientUsersManagement />

      default:
        return <div>Contenu non trouvé</div>
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Sidebar gauche - Navigation épurée */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-20 xl:w-64 bg-gradient-to-b from-purple-900 to-purple-950 dark:from-purple-950 dark:to-black border-r border-purple-700 shadow-2xl z-50 transition-all duration-300">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center xl:justify-start gap-3 p-6 border-b border-purple-700">
          <img 
            src="/logo.svg" 
            alt="NavetteXpress" 
            className="h-10 w-10 flex-shrink-0"
          />
          <span className="hidden xl:block text-white font-bold text-lg">NavetteXpress</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 relative ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/50'
                  : 'text-purple-300 hover:text-white hover:bg-purple-800'
              }`}
              title={tab.label}
            >
              <span className="text-2xl flex-shrink-0">{tab.icon}</span>
              <span className="hidden xl:block font-semibold text-sm">{tab.label}</span>
              {tab.badge && (
                <span className="hidden xl:flex ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 items-center justify-center font-bold">
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="hidden xl:block ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-purple-700">
          <div className="hidden xl:block mb-3">
            <div className="px-4 py-3 bg-purple-800 rounded-xl">
              <p className="text-white font-semibold text-sm truncate">{session.user.name || 'Client'}</p>
              <p className="text-purple-300 text-xs truncate">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center justify-center xl:justify-start gap-3 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden xl:inline">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-b-2 border-slate-200 dark:border-slate-700 shadow-md">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center">
                <img 
                  src="/logo.svg" 
                  alt="NavetteXpress" 
                  className="h-9 w-auto"
                />
              </Link>
              <span className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 text-purple-800 dark:text-purple-200 rounded-full text-xs font-bold whitespace-nowrap shadow-sm border border-purple-300 dark:border-purple-700">
                👤 CLIENT
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile dropdown */}
        {mobileMenuOpen && (
          <div className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-t border-slate-200 dark:border-slate-700 shadow-lg">
            <div className="px-4 py-3 space-y-2 max-h-[70vh] overflow-y-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 relative ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 lg:ml-20 xl:ml-64 lg:pt-0 pt-16 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Content */}
          {renderContent()}
        </div>
      </main>

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

      {/* Modal d'édition de réservation */}
      <EditBookingModal
        isOpen={isEditBookingModalOpen}
        onClose={() => {
          setIsEditBookingModalOpen(false)
          setEditingBooking(null)
        }}
        booking={editingBooking}
        onSuccess={() => {
          // Recharger les réservations après modification
          loadClientData()
        }}
      />

      {/* Modal d'approbation de prix */}
      {bookingForPriceApproval && (
        <PriceApprovalModal
          bookingId={bookingForPriceApproval.id}
          price={bookingForPriceApproval.price || '0'}
          customerName={bookingForPriceApproval.customerName}
          pickupAddress={bookingForPriceApproval.pickupAddress}
          dropoffAddress={bookingForPriceApproval.dropoffAddress}
          scheduledDateTime={bookingForPriceApproval.scheduledDateTime}
          isOpen={isPriceApprovalModalOpen}
          onClose={() => {
            setIsPriceApprovalModalOpen(false)
            setBookingForPriceApproval(null)
          }}
          onSuccess={() => {
            // Recharger les réservations après réponse
            loadClientData()
            setIsPriceApprovalModalOpen(false)
            setBookingForPriceApproval(null)
          }}
        />
      )}
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
