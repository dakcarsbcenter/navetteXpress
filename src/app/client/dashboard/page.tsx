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
  const [bookingsFilter, setBookingsFilter] = useState('pending')
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
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#1A1A1A]">
        <div className="text-xl text-gray-600 dark:text-gray-300">Chargement...</div>
      </div>
    )
  }

  if (!session?.user || (session.user as unknown as { role?: string }).role !== 'customer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#1A1A1A]">
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
    ...(canViewBookings ? [{ id: 'bookings' as TabType, label: 'Mes réservations', icon: '📅', badge: stats.pendingBookings > 0 ? stats.pendingBookings : null }] : []),
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
      confirmed: { label: 'Confirmée', color: 'bg-[#A73B3C]/20 text-[#A73B3C]' },
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
            {/* Welcome Banner - Style amélioré avec design professionnel */}
            <div className="bg-linear-to-r from-[#A73B3C] to-[#8B3032] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="text-3xl font-bold mb-2">
                  Bonjour, {session?.user?.name || 'Client'} 👋
                </h1>
                <p className="opacity-90">
                  Bienvenue dans votre espace client. Voici ce qui se passe avec vos trajets aujourd'hui.
                </p>
              </div>
              {/* Decorative Circle */}
              <div className="absolute right-0 top-0 h-64 w-64 bg-white opacity-5 rounded-full transform translate-x-20 -translate-y-20"></div>
            </div>

            {/* Stats Grid - Design modernisé avec icônes et effets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Total Réservations */}
              <div className="bg-white dark:bg-[#252525] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:transform hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Réservations</p>
                    <h3 className="text-3xl font-bold text-[#1A1A1A] dark:text-white mt-1">{stats.totalBookings}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="text-xs text-green-500 flex items-center font-medium">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  +{stats.totalBookings > 0 ? Math.ceil(stats.totalBookings * 0.2) : 0} cette semaine
                </div>
              </div>

              {/* Card 2: Terminées */}
              <div className="bg-white dark:bg-[#252525] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:transform hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Terminées</p>
                    <h3 className="text-3xl font-bold text-[#1A1A1A] dark:text-white mt-1">{stats.completedBookings}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full transition-all" 
                    style={{ width: `${stats.totalBookings > 0 ? (stats.completedBookings / stats.totalBookings) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Card 3: En Attente */}
              <div className="bg-white dark:bg-[#252525] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:transform hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">En Attente</p>
                    <h3 className="text-3xl font-bold text-[#1A1A1A] dark:text-white mt-1">{stats.pendingBookings}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.pendingBookings > 0 ? 'Prochain départ bientôt' : 'Aucun trajet en attente'}
                </p>
              </div>

              {/* Card 4: Total Devis */}
              <div className="bg-white dark:bg-[#252525] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:transform hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Devis</p>
                    <h3 className="text-3xl font-bold text-[#1A1A1A] dark:text-white mt-1">{stats.totalQuotes}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md font-medium">
                    {stats.acceptedQuotes} Acceptés
                  </span>
                  <span className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md font-medium">
                    {stats.pendingQuotes} En attente
                  </span>
                </div>
              </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Note Moyenne */}
              <div className="bg-white dark:bg-[#252525] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Note Moyenne</p>
                  <div className="flex items-center gap-2 mt-1">
                    <h3 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">
                      {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
                    </h3>
                    <div className="flex text-[#E5C16C] text-sm">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star}
                          className={`w-4 h-4 ${star <= Math.round(stats.averageRating) ? 'fill-current' : 'fill-gray-300 dark:fill-gray-600'}`}
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#E5C16C]/20 flex items-center justify-center text-[#E5C16C]">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
              </div>

              {/* À Évaluer */}
              <div className="bg-white dark:bg-[#252525] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between relative overflow-hidden group cursor-pointer hover:border-[#A73B3C] transition">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#A73B3C]"></div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Trajets à Évaluer</p>
                  <h3 className="text-2xl font-bold text-[#A73B3C] mt-1">{stats.reviewableBookings}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stats.reviewableBookings > 0 ? 'Partagez votre expérience' : 'Tout est à jour'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-[#A73B3C] group-hover:bg-[#A73B3C] group-hover:text-white transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>

              {/* Total Avis */}
              <div className="bg-white dark:bg-[#252525] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Mes Avis</p>
                  <h3 className="text-2xl font-bold text-[#1A1A1A] dark:text-white mt-1">{stats.totalReviews}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avis publiés</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Réservations récentes - Tableau professionnel */}
            <div className="bg-white dark:bg-[#252525] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-[#1A1A1A] dark:text-white text-lg">Réservations récentes</h3>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-sm text-[#A73B3C] font-medium hover:underline"
                >
                  Voir tout
                </button>
              </div>
              
              {bookings.slice(0, 5).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-[#1A1A1A]/50 text-left">
                      <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trajet</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Heure</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prix</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {bookings.slice(0, 5).map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-[#1A1A1A]/30 transition">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            #{booking.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded flex items-center justify-center text-xs ${
                                booking.pickupAddress?.toLowerCase().includes('aibd') || booking.pickupAddress?.toLowerCase().includes('aéroport')
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                  : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                              }`}>
                                {booking.pickupAddress?.toLowerCase().includes('aibd') || booking.pickupAddress?.toLowerCase().includes('aéroport') ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                )}
                              </div>
                              <div className="max-w-xs truncate">
                                <div className="font-medium text-[#1A1A1A] dark:text-white text-xs">
                                  {booking.pickupAddress?.substring(0, 30)}{booking.pickupAddress?.length > 30 ? '...' : ''}
                                </div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs">
                                  → {booking.dropoffAddress?.substring(0, 30)}{booking.dropoffAddress?.length > 30 ? '...' : ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                            {new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short'
                            })}, {new Date(booking.scheduledDateTime).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(booking.status)}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                            {booking.price ? `${parseFloat(booking.price).toLocaleString('fr-FR')} FCFA` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => {
                                setEditingBooking(booking)
                                setIsEditBookingModalOpen(true)
                              }}
                              className="text-gray-400 hover:text-[#A73B3C] transition"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-gray-900 dark:text-white font-medium mb-1">Aucune réservation récente</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Commencez par réserver votre premier trajet.</p>
                  <Link
                    href="/reservation"
                    className="inline-block text-[#A73B3C] font-semibold text-sm hover:underline"
                  >
                    Faire une réservation
                  </Link>
                </div>
              )}
            </div>
          </div>
        )

      case 'bookings':
        const filteredClientBookings = bookingsFilter === 'all' 
          ? bookings 
          : bookings.filter(b => b.status === bookingsFilter)
        
        return (
          <div className="bg-white dark:bg-[#252525] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-white">Mes réservations</h3>
                <div className="flex gap-2 items-center flex-wrap">
                  <select
                    value={bookingsFilter}
                    onChange={(e) => setBookingsFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
                  >
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmées</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminées</option>
                    <option value="cancelled">Annulées</option>
                    <option value="all">Toutes</option>
                  </select>
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
                      className="bg-[#A73B3C] hover:bg-[#8B3032] text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Nouvelle réservation
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6">
              {filteredClientBookings.length > 0 ? (
                <div className="space-y-4">
                  {filteredClientBookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-[#1A1A1A] dark:text-white">
                            Réservation #{booking.id}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
                              className="bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
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
                              className="text-[#A73B3C] hover:text-[#8B3032] text-sm font-medium px-2 py-1 rounded hover:bg-[#E5C16C]/10 transition-colors"
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
                          <p className="font-medium text-[#1A1A1A] dark:text-gray-300">Date et heure</p>
                          <p className="text-gray-600 dark:text-gray-400">
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
                            <p className="font-medium text-[#1A1A1A] dark:text-gray-300">Prix</p>
                            <p className="text-gray-600 dark:text-gray-400">{booking.price} FCFA</p>
                          </div>
                        )}
                        
                        <div>
                          <p className="font-medium text-[#1A1A1A] dark:text-gray-300">Créée le</p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {new Date(booking.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      
                      {booking.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="font-medium text-[#1A1A1A] dark:text-gray-300 text-sm">Notes</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{booking.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Aucune réservation trouvée</p>
                  {hasBookingsCreatePermission && (
                    <Link 
                      href="/reservation"
                      className="inline-block mt-2 bg-[#A73B3C] hover:bg-[#8B3032] text-white px-4 py-2 rounded-lg text-sm transition-colors"
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
          <div className="bg-white dark:bg-[#252525] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-white">Trajets à évaluer</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Évaluez vos trajets terminés et aidez-nous à améliorer notre service
                  </p>
                </div>
                {stats.reviewableBookings > 0 && (
                  <span className="bg-[#A73B3C]/20 text-[#A73B3C] px-3 py-1 rounded-full text-sm font-medium">
                    {stats.reviewableBookings} à évaluer
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              {reviewableBookings.length > 0 ? (
                <div className="space-y-4">
                  {reviewableBookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">🚗</span>
                            <h4 className="font-medium text-[#1A1A1A] dark:text-white">
                              Trajet #{booking.id}
                            </h4>
                          </div>
                          
                          <p className="text-[#1A1A1A] dark:text-gray-300 mb-2">
                            <strong>Itinéraire :</strong> {booking.pickupAddress} → {booking.dropoffAddress}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <p className="font-medium text-[#1A1A1A] dark:text-gray-300">Chauffeur</p>
                              <p className="text-gray-600 dark:text-gray-400">{booking.driver.name}</p>
                            </div>
                            
                            <div>
                              <p className="font-medium text-[#1A1A1A] dark:text-gray-300">Date du trajet</p>
                              <p className="text-gray-600 dark:text-gray-400">
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
                          className="bg-[#A73B3C] hover:bg-[#8B3032] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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
                  <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-white mb-2">
                    Aucun trajet à évaluer
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Vous avez évalué tous vos trajets terminés !
                  </p>
                  {hasBookingsCreatePermission && (
                    <Link 
                      href="/reservation"
                      className="inline-block bg-[#A73B3C] hover:bg-[#8B3032] text-white px-4 py-2 rounded-lg text-sm transition-colors"
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
          <div className="bg-white dark:bg-[#252525] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-white">Mes avis publiés</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Avis que vous avez donnés sur vos trajets
              </p>
            </div>
            <div className="p-6">
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-[#1A1A1A] dark:text-white">
                            Avis pour la réservation #{review.bookingId}
                          </h4>
                          {review.booking && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {review.booking.pickupAddress} → {review.booking.dropoffAddress}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                            ({review.rating}/5)
                          </span>
                        </div>
                      </div>
                      
                      {review.comment && (
                        <div className="mb-3">
                          <p className="text-[#1A1A1A] dark:text-gray-300">{review.comment}</p>
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Publié le {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Aucun avis donné pour le moment</p>
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
            <div className="bg-white dark:bg-[#252525] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-white flex items-center gap-2">
                      <span className="text-2xl">👤</span>
                      Mon profil
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Gérez vos informations personnelles
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditProfileModalOpen(true)}
                    className="bg-[#A73B3C] hover:bg-[#8B3032] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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
                      <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-300 mb-2">
                        Nom complet
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="text-[#1A1A1A] dark:text-white font-medium">
                          {userProfile?.name || session?.user?.name || "Non renseigné"}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-300 mb-2">
                        Adresse email
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="text-[#1A1A1A] dark:text-white">
                          {userProfile?.email || session?.user?.email || "Non renseigné"}
                        </p>
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
                          ✓ Vérifié
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-300 mb-2">
                        Téléphone
                      </label>
                      <p className="text-[#1A1A1A] dark:text-white">
                        {userProfile?.phone || "Non renseigné"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Section Photo de Profil */}
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-300 mb-2">
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
                      <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-300 mb-2">
                        Rôle
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 bg-[#A73B3C]/20 text-[#A73B3C] dark:bg-[#A73B3C]/30 dark:text-[#E5C16C] text-sm rounded-full font-medium">
                          👤 Client
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Verrouillé
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-300 mb-2">
                        Membre depuis
                      </label>
                      <p className="text-[#1A1A1A] dark:text-white">
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
                      <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-300 mb-2">
                        ID Client
                      </label>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-mono">
                        {userProfile?.id?.slice(0, 8) || (session?.user as unknown as { id?: string })?.id?.slice(0, 8) || "N/A"}...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Statistiques du Profil */}
            <div className="bg-white dark:bg-[#252525] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-white flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Mon activité
                </h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-slate-50 dark:bg-[#1A1A1A]/50 rounded-lg">
                    <div className="text-2xl font-bold text-[#A73B3C] dark:text-[#E5C16C]">
                      {stats.totalBookings}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Réservations
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-50 dark:bg-[#1A1A1A]/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.completedBookings}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Terminées
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-50 dark:bg-[#1A1A1A]/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.totalReviews}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Avis donnés
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-50 dark:bg-[#1A1A1A]/50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {stats.averageRating.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Note moy.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Sécurité (future extension) */}
            <div className="bg-white dark:bg-[#252525] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-white flex items-center gap-2">
                  <span className="text-2xl">🔒</span>
                  Sécurité du compte
                </h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#1A1A1A]/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-[#1A1A1A] dark:text-white">Mot de passe</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Dernière modification il y a plus de 30 jours
                      </p>
                    </div>
                    <button className="text-[#A73B3C] hover:text-[#8B3032] text-sm font-medium">
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
    <div className="flex h-screen overflow-hidden bg-[#F3F4F6] dark:bg-[#1A1A1A]">
      {/* SIDEBAR - Navigation Latérale Style Professionnel */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1A1A1A] shadow-2xl z-20 fixed left-0 top-0 h-screen">
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-center border-b border-gray-800">
          <Link href="/" className="text-2xl font-bold text-[#A73B3C] tracking-tight flex items-center gap-2">
            <span className="bg-white rounded-full w-8 h-8 flex items-center justify-center text-sm">NX</span>
            Navette Xpress
          </Link>
        </div>

        {/* User Profile Summary (Mini) */}
        <div className="p-6 flex items-center gap-3 border-b border-gray-800">
          <div className="w-10 h-10 rounded-full bg-[#E5C16C] flex items-center justify-center text-[#1A1A1A] font-bold text-sm">
            {session.user.name?.substring(0, 2).toUpperCase() || 'CL'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{session.user.name || 'Client'}</p>
            <p className="text-gray-500 text-xs truncate">Client Premium</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {/* Section principale */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`sidebar-link w-full flex items-center px-4 py-3 transition-all duration-300 border-l-3 ${
              activeTab === 'overview'
                ? 'bg-[#A73B3C]/10 text-[#E5C16C] border-l-[#E5C16C]'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-transparent'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="flex-1 text-left text-sm">Vue d'ensemble</span>
          </button>
          
          {canViewBookings && (
            <button
              onClick={() => setActiveTab('bookings')}
              className={`sidebar-link w-full flex items-center px-4 py-3 transition-all duration-300 border-l-3 ${
                activeTab === 'bookings'
                  ? 'bg-[#A73B3C]/10 text-[#E5C16C] border-l-[#E5C16C]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-transparent'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="flex-1 text-left text-sm">Mes réservations</span>
              {stats.pendingBookings > 0 && (
                <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {stats.pendingBookings}
                </span>
              )}
            </button>
          )}
          
          {canManageQuotes && (
            <button
              onClick={() => setActiveTab('quotes')}
              className={`sidebar-link w-full flex items-center px-4 py-3 transition-all duration-300 border-l-3 ${
                activeTab === 'quotes'
                  ? 'bg-[#A73B3C]/10 text-[#E5C16C] border-l-[#E5C16C]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-transparent'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="flex-1 text-left text-sm">Mes devis</span>
            </button>
          )}
          
          <button
            onClick={() => setActiveTab('invoices')}
            className={`sidebar-link w-full flex items-center px-4 py-3 transition-all duration-300 border-l-3 ${
              activeTab === 'invoices'
                ? 'bg-[#A73B3C]/10 text-[#E5C16C] border-l-[#E5C16C]'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-transparent'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="flex-1 text-left text-sm">Mes factures</span>
          </button>
          
          {/* Section FEEDBACK */}
          <div className="pt-4 pb-1 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Feedback
          </div>
          
          <button
            onClick={() => setActiveTab('create-reviews')}
            className={`sidebar-link w-full flex items-center px-4 py-3 transition-all duration-300 border-l-3 ${
              activeTab === 'create-reviews'
                ? 'bg-[#A73B3C]/10 text-[#E5C16C] border-l-[#E5C16C]'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-transparent'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="flex-1 text-left text-sm">Évaluer trajets</span>
            {stats.reviewableBookings > 0 && (
              <span className="bg-[#A73B3C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {stats.reviewableBookings}
              </span>
            )}
          </button>
          
          {canManageReviews && (
            <button
              onClick={() => setActiveTab('reviews')}
              className={`sidebar-link w-full flex items-center px-4 py-3 transition-all duration-300 border-l-3 ${
                activeTab === 'reviews'
                  ? 'bg-[#A73B3C]/10 text-[#E5C16C] border-l-[#E5C16C]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-transparent'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="flex-1 text-left text-sm">Mes avis</span>
            </button>
          )}
          
          {/* Sections additionnelles si permissions */}
          {(canManageVehicles || canManageUsers) && (
            <>
              {canManageVehicles && (
                <button
                  onClick={() => setActiveTab('vehicles')}
                  className={`sidebar-link w-full flex items-center px-4 py-3 transition-all duration-300 border-l-3 ${
                    activeTab === 'vehicles'
                      ? 'bg-[#A73B3C]/10 text-[#E5C16C] border-l-[#E5C16C]'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-transparent'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="flex-1 text-left text-sm">Véhicules</span>
                </button>
              )}
              
              {canManageUsers && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`sidebar-link w-full flex items-center px-4 py-3 transition-all duration-300 border-l-3 ${
                    activeTab === 'users'
                      ? 'bg-[#A73B3C]/10 text-[#E5C16C] border-l-[#E5C16C]'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-transparent'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="flex-1 text-left text-sm">Utilisateurs</span>
                </button>
              )}
            </>
          )}
        </nav>

        {/* Footer Sidebar - Déconnexion */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="sidebar-link w-full flex items-center px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        
        {/* TOP HEADER */}
        <header className="h-20 bg-white dark:bg-[#252525] shadow-sm flex items-center justify-between px-4 md:px-8 z-10 border-b border-gray-100 dark:border-gray-700">
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-600 dark:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Page Title */}
          <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-white hidden md:block">
            Tableau de Bord
          </h2>

          {/* Right Actions */}
          <div className="flex items-center gap-4 md:gap-6">
            <button className="relative text-gray-400 hover:text-[#A73B3C] transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {stats.reviewableBookings > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#A73B3C] rounded-full"></span>
              )}
            </button>
            
            {/* CTA Principal - Nouvelle Réservation */}
            <Link 
              href="/reservation"
              className="bg-[#A73B3C] text-white px-4 md:px-5 py-2.5 rounded-lg font-medium shadow-lg hover:bg-[#8B3032] transition flex items-center gap-2 text-sm md:text-base"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Nouvelle Réservation</span>
              <span className="sm:hidden">Réserver</span>
            </Link>
          </div>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#252525] border-b border-gray-200 dark:border-gray-700 shadow-lg">
            <nav className="px-4 py-3 space-y-1 max-h-[60vh] overflow-y-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                    activeTab === tab.id
                      ? 'bg-[#A73B3C] text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
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
            </nav>
          </div>
        )}

        {/* DASHBOARD CONTENT SCROLLABLE */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F3F4F6] dark:bg-[#1A1A1A] p-4 md:p-8">
          {renderContent()}
        </main>
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
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#FAFAFA] to-[#E5C16C]/10 dark:from-[#1A1A1A] dark:to-[#252525]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A73B3C] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement du tableau de bord...</p>
        </div>
      </div>
    }>
      <ClientDashboardContent />
    </Suspense>
  )
}







