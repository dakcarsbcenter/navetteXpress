"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { CreateReviewModal } from "@/components/client/CreateReviewModal"
import { ReservationForm } from "@/app/reservation/ReservationClient"
import { EditProfileModal } from "@/components/client/EditProfileModal"
import { BookingDetailsModal } from "@/components/client/BookingDetailsModal"
import { PriceApprovalModal } from "@/components/client/PriceApprovalModal"
import { ClientQuotesView } from "@/components/client/ClientQuotesView"
import { ClientInvoicesView } from "@/components/client/ClientInvoicesView"
import UniversalProfilePhotoUpload from "@/components/ui/UniversalProfilePhotoUpload"
import { VehiclesManagement } from "@/components/client/VehiclesManagement"
import { ClientUsersManagement } from "@/components/client/ClientUsersManagement"
import { TripStatusBadge } from "@/components/client/TripStatusBadge"
import { SquaresFour, CalendarBlank, FileText, Receipt, Star, ChatCircle, Car, Users, Plus, MapPin, Clock, AirplaneTakeoff, Eye, Phone, Wallet, Calendar, ClipboardText, CaretRight, NavigationArrow, DownloadSimple, PencilSimple, Trash, X, CheckCircle, Envelope, Buildings, IdentificationCard } from "@phosphor-icons/react"

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
  image?: string
  address?: string
  isCompany?: boolean
  companyName?: string
  ninea?: string
  raisonSociale?: string
  companyAddress?: string
  companyPhone?: string
  bp?: string
  role: string
  createdAt: string
}

type TabType = 'overview' | 'bookings' | 'quotes' | 'invoices' | 'reviews' | 'create-reviews' | 'profile' | 'vehicles' | 'users'

// URL validation helper to prevent XSS attacks
function isValidImageUrl(url: string): boolean {
  if (!url) return false

  try {
    // Allow data URLs for safe raster formats only — SVG is excluded because
    // data:image/svg+xml can embed <script> tags that execute in browsers.
    const safeDataPrefixes = [
      'data:image/png;base64,',
      'data:image/jpeg;base64,',
      'data:image/gif;base64,',
      'data:image/webp;base64,',
    ]
    if (url.startsWith('data:')) {
      return safeDataPrefixes.some(prefix => url.startsWith(prefix))
    }

    // Parse and validate URL
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname.toLowerCase()

    // Allow trusted domains (Cloudinary, common CDNs, and relative URLs)
    const trustedDomains = [
      'res.cloudinary.com',
      'cloudinary.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'lh3.googleusercontent.com', // Google profile images
      'avatars.githubusercontent.com', // GitHub avatars
    ]

    return trustedDomains.some(domain => hostname.endsWith(domain)) ||
      parsedUrl.protocol === 'https:' && hostname !== ''
  } catch {
    // Invalid URL
    return false
  }
}

/**
 * Sanitizes profile image URL to prevent XSS attacks
 * Returns the URL only if it passes validation, otherwise returns null
 */
function getSafeProfileImageUrl(imageUrl: string | undefined): string | null {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null
  }

  // Trim whitespace
  const trimmedUrl = imageUrl.trim()

  // Explicitly validate before returning
  if (!isValidImageUrl(trimmedUrl)) {
    return null
  }

  // Additional safety: ensure URL is properly formatted
  try {
    if (trimmedUrl.startsWith('data:')) {
      // Only safe raster data: URIs pass isValidImageUrl — return as-is
      return trimmedUrl
    }

    // For http/https URLs, validate and return as string
    const urlObj = new URL(trimmedUrl)
    return urlObj.href  // Return the normalized URL string
  } catch {
    // If URL parsing fails, return null
    return null
  }
}

/**
 * Sanitizes text for use in HTML attributes (like alt)
 * Escapes dangerous characters to prevent XSS
 */
function getSafeTextForAttribute(text: string | undefined): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  // Escape HTML special characters
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Sanitizes text for rendering as text content
 * Although React auto-escapes JSX text, this is a defense-in-depth measure
 */
function getSafeTextContent(text: string | undefined | null): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  // Trim and ensure proper encoding
  return String(text).trim()
}

// snyk:ignore[javascript/DOMXSS] - UserProfile data is validated through getSafeProfileImageUrl, getSafeTextForAttribute, and getSafeTextContent helper functions
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
  const [bookingsFilter, setBookingsFilter] = useState('pending')
  const [showReservationModal, setShowReservationModal] = useState(false)
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
          console.log('ðŸ“‹ Permissions utilisateur:', data.permissions)
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
    const pendingBookings = bookings.filter(b => b.status === 'pending').length
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-bg)' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-transparent mx-auto mb-3 animate-spin" style={{ borderTopColor: 'var(--color-client-accent)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session?.user || (session.user as unknown as { role?: string }).role !== 'customer') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-bg)' }}>
        <div className="text-sm font-medium" style={{ color: 'var(--color-trip-cancelled)' }}>Accès refusé. Page réservée aux clients.</div>
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
  console.log('ðŸ” Bookings Permissions Debug:', {
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
    { id: 'overview' as TabType, label: 'Vue d\'ensemble', icon: 'ðŸ“Š' },
    ...(canViewBookings ? [{ id: 'bookings' as TabType, label: 'Mes réservations', icon: 'ðŸ“…', badge: stats.pendingBookings > 0 ? stats.pendingBookings : null }] : []),
    // Ajouter l'onglet devis si l'utilisateur a les permissions
    ...(canManageQuotes ? [{ id: 'quotes' as TabType, label: 'Mes devis', icon: 'ðŸ“‹' }] : []),
    // Ajouter l'onglet factures
    { id: 'invoices' as TabType, label: 'Mes factures', icon: 'ðŸ§¾' },
    { id: 'create-reviews' as TabType, label: 'Évaluer trajets', icon: '⭐', badge: stats.reviewableBookings > 0 ? stats.reviewableBookings : null },
    // Ajouter l'onglet avis si l'utilisateur a les permissions
    ...(canManageReviews ? [{ id: 'reviews' as TabType, label: 'Mes avis', icon: 'âœ…' }] : []),
    // Ajouter l'onglet véhicules si l'utilisateur a les permissions
    ...(canManageVehicles ? [{ id: 'vehicles' as TabType, label: 'Véhicules', icon: '🚗' }] : []),
    // Ajouter l'onglet utilisateurs si l'utilisateur a les permissions
    ...(canManageUsers ? [{ id: 'users' as TabType, label: 'Utilisateurs', icon: 'ðŸ‘¥' }] : []),
    { id: 'profile' as TabType, label: 'Mon profil', icon: 'ðŸ‘¤' },
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmée', color: 'bg-[#A73B3C]/20 text-[#A73B3C]' },
      in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Terminée', color: 'bg-red-100 text-red-800' },
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
      <Star key={i} weight={i < rating ? "fill" : "regular"} className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : ''}`} style={i >= rating ? { color: 'var(--color-text-secondary)' } : undefined} />
    ))
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Hero Greeting */}
            <div className="client-card-enter relative rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%)', border: '1px solid #e2e8f0' }}>
              <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, var(--color-client-accent), transparent)' }} />
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] mb-1" style={{ color: '#64748b' }}>
                      {new Date().getHours() < 12 ? 'Bonjour' : new Date().getHours() < 18 ? 'Bon après-midi' : 'Bonsoir'}
                    </p>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium truncate" style={{ color: '#0f172a' }}>
                      {session?.user?.name || 'Bienvenue'}
                    </h1>
                    <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                      {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748b' }}>En attente</p>
                      <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: '#0f172a' }}>{stats.pendingBookings}</p>
                    </div>
                    <button
                      onClick={() => setShowReservationModal(true)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px]"
                      style={{ backgroundColor: 'var(--color-client-accent)', color: '#fff' }}>
                      <Plus size={15} weight="bold" /> <span className="hidden xs:inline">Nouveau</span> trajet
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Total Réservations', value: stats.totalBookings, icon: <CalendarBlank size={16} weight="light" />, color: 'var(--color-client-accent)' },
                { label: 'Terminées', value: stats.completedBookings, icon: <MapPin size={16} weight="light" />, color: 'var(--color-client-accent)' },
                { label: 'En Attente', value: stats.pendingBookings, icon: <Clock size={16} weight="light" />, color: '#F59E0B' },
                { label: 'Total Devis', value: stats.totalQuotes, icon: <FileText size={16} weight="light" />, color: '#8B5CF6' },
              ].map((stat, i) => (
                <div key={i} className="client-card-enter group p-3 sm:p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                  style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: stat.color }} />
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 sm:mb-3" style={{ backgroundColor: `${stat.color}18`, color: stat.color }}>
                    {stat.icon}
                  </div>
                  {/* truncate prevents text overflow on narrow 2-col mobile grid */}
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.06em] mb-1 truncate" style={{ color: 'var(--color-client-text-secondary)' }}>{stat.label}</p>
                  <h3 className="text-lg sm:text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-client-text-primary)' }}>{stat.value}</h3>
                </div>
              ))}
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="client-card-enter rounded-2xl p-5 flex items-center justify-between"
                style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--color-client-text-secondary)' }}>Note Moyenne</p>
                  <div className="flex items-center gap-2 mt-1">
                    <h3 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-client-text-primary)' }}>
                      {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
                    </h3>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={12} className={s <= Math.round(stats.averageRating) ? 'fill-current' : ''} style={{ color: s <= Math.round(stats.averageRating) ? '#F59E0B' : '#4A4759' }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                  <Star size={18} weight="fill" />
                </div>
              </div>

              <div className="client-card-enter rounded-2xl p-5 flex items-center justify-between cursor-pointer group"
                onClick={() => setActiveTab('create-reviews')}
                style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--color-client-text-secondary)' }}>Trajets à Évaluer</p>
                  <h3 className="text-2xl font-bold mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-client-accent)' }}>{stats.reviewableBookings}</h3>
                  <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-client-text-secondary)' }}>
                    {stats.reviewableBookings > 0 ? 'Partagez votre expérience' : 'Tout est à jour'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)' }}>
                  <PencilSimple size={18} weight="light" />
                </div>
              </div>

              <div className="client-card-enter rounded-2xl p-5 flex items-center justify-between"
                style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--color-client-text-secondary)' }}>Mes Avis</p>
                  <h3 className="text-2xl font-bold mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-client-text-primary)' }}>{stats.totalReviews}</h3>
                  <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-client-text-secondary)' }}>Avis publiés</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                  <ChatCircle size={18} weight="light" />
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="client-card-enter rounded-2xl overflow-hidden"
              style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-client-border)' }}>
                <h3 className="text-base font-bold" style={{ color: 'var(--color-client-text-primary)' }}>Réservations récentes</h3>
                <button onClick={() => setActiveTab('bookings')} className="text-xs font-medium transition-colors flex items-center gap-1 hover:opacity-80" style={{ color: 'var(--color-client-accent)' }}>
                  Voir tout <span className="text-base leading-none">→</span>
                </button>
              </div>

              {bookings.slice(0, 5).length > 0 ? (
                <div className="divide-y" style={{ borderColor: 'var(--color-client-border)' }}>
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-3.5 transition-colors duration-150 hover:bg-white/3 cursor-pointer" onClick={() => { setEditingBooking(booking); setIsEditBookingModalOpen(true) }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: booking.status === 'in_progress' ? 'var(--color-trip-inprogress-bg)' : booking.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'var(--color-client-border)', color: booking.status === 'in_progress' ? 'var(--color-trip-inprogress)' : booking.status === 'pending' ? '#F59E0B' : '#6B7280' }}>
                        <MapPin size={14} weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>
                          <span className="truncate" title={booking.pickupAddress}>{booking.pickupAddress}</span>
                          <span className="shrink-0 text-xs" style={{ color: 'var(--color-client-accent)' }}>→</span>
                          <span className="truncate" title={booking.dropoffAddress}>{booking.dropoffAddress}</span>
                        </div>
                        <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--color-client-text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
                          {new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}, {new Date(booking.scheduledDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <TripStatusBadge statut={booking.status} />
                      <p className="text-xs font-semibold shrink-0 hidden sm:block" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-client-text-primary)' }}>
                        {booking.price ? `${parseFloat(booking.price).toLocaleString('fr-FR')} FCFA` : '—'}
                      </p>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 hover:bg-white/10"
                        style={{ color: 'var(--color-text-secondary)' }}>
                        <Eye size={13} weight="regular" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--color-client-surface)' }}>
                    <Calendar size={20} weight="light" style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-client-text-primary)' }}>Aucune réservation récente</p>
                  <p className="text-sm mb-4" style={{ color: 'var(--color-client-text-secondary)' }}>Commencez par réserver votre premier trajet.</p>
                  <button
                    onClick={() => setShowReservationModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)', border: '1px solid var(--color-client-accent-border)' }}>
                    Réserver un trajet
                  </button>
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
          <div className="space-y-6">
            <div className="client-card-enter rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5" style={{ borderBottom: '1px solid var(--color-client-border)' }}>
                <div>
                  <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--color-client-text-primary)' }}>Mes réservations</h3>
                  <p className="text-xs sm:text-sm mt-0.5 font-medium" style={{ color: 'var(--color-client-text-secondary)' }}>Gérez l'historique et le statut de vos trajets</p>
                </div>
                <div className="flex gap-3 items-center flex-wrap">
                  <select
                    value={bookingsFilter}
                    onChange={(e) => setBookingsFilter(e.target.value)}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 rounded-xl text-xs outline-none transition-all min-h-[44px]"
                    style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmées</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminées</option>
                    <option value="cancelled">Annulées</option>
                    <option value="all">Toutes</option>
                  </select>
                  {hasBookingsCreatePermission && (
                    <button
                      onClick={() => setShowReservationModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all hover:brightness-110 min-h-[44px]"
                      style={{ backgroundColor: 'var(--color-client-accent)', color: '#fff' }}>
                      <Plus size={14} weight="bold" /> Nouvelle réservation
                    </button>
                  )}
                </div>
              </div>

              <div className="p-0">
                {filteredClientBookings.length > 0 ? (
                  <div className="divide-y" style={{ borderColor: 'var(--color-client-border)' }}>
                    {filteredClientBookings.map((booking) => (
                      <div key={booking.id} className="p-4 sm:p-6 transition-colors duration-150 hover:bg-white/1">
                        <div className="flex flex-col gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: 'var(--color-client-surface)', color: 'var(--color-text-secondary)' }}>
                                <ClipboardText size={18} weight="light" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-sm" style={{ color: 'var(--color-client-text-primary)' }}>
                                  Réservation <span style={{ fontFamily: 'var(--font-mono)' }}>#{booking.id}</span>
                                </h4>
                                <p className="text-xs font-medium uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-client-text-secondary)' }}>
                                  Créée le {new Date(booking.createdAt).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <TripStatusBadge statut={booking.status} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-client-accent)' }} />
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>Départ</p>
                                  <p className="text-sm font-medium line-clamp-1" style={{ color: 'var(--color-client-text-primary)' }}>{booking.pickupAddress}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#EF4444' }} />
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>Arrivée</p>
                                  <p className="text-sm font-medium line-clamp-1" style={{ color: 'var(--color-client-text-primary)' }}>{booking.dropoffAddress}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex flex-wrap gap-4 sm:gap-6">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>Date & Heure</p>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <Calendar size={13} style={{ color: 'var(--color-client-accent)' }} />
                                  <p className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>
                                    {new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                  </p>
                                  <Clock size={13} className="ml-0.5" style={{ color: 'var(--color-client-accent)' }} />
                                  <p className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>
                                    {new Date(booking.scheduledDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>

                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>Montant</p>
                                <p className="text-base sm:text-lg font-bold" style={{ color: 'var(--color-client-text-primary)', fontFamily: 'var(--font-mono)' }}>
                                  {booking.price ? `${parseFloat(booking.price).toLocaleString('fr-FR')} FCFA` : '---'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Price Approval Action */}
                              {booking.clientResponse === 'pending' && booking.price && parseFloat(booking.price) > 0 && (
                                <button
                                  onClick={() => { setBookingForPriceApproval(booking); setIsPriceApprovalModalOpen(true) }}
                                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all live-badge min-h-[44px]"
                                  style={{ backgroundColor: 'var(--color-client-accent)', color: '#fff' }}
                                >
                                  <Wallet size={14} weight="bold" /> Accepter le prix
                                </button>
                              )}

                              {/* Edit Action */}
                              {hasBookingsUpdatePermission && !['confirmed', 'in_progress', 'completed', 'cancelled'].includes(booking.status) && (
                                <button
                                  onClick={() => { setEditingBooking(booking); setIsEditBookingModalOpen(true) }}
                                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all min-h-[44px]"
                                  style={{ backgroundColor: 'var(--color-client-border)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-client-border)' }}
                                  title="Modifier"
                                >
                                  <PencilSimple size={16} />
                                </button>
                              )}

                              {/* View Details */}
                              <button
                                onClick={() => { setEditingBooking(booking); setIsEditBookingModalOpen(true) }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-(--color-client-accent-bg) hover:text-(--color-client-accent) min-h-[44px]"
                                style={{ backgroundColor: 'var(--color-client-border)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-client-border)' }}
                                title="Voir détails"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Price Status Messages */}
                        <div className="mt-4 flex flex-wrap gap-2 ml-0 lg:ml-13">
                          {booking.clientResponse === 'pending' && booking.price && parseFloat(booking.price) > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                              <Clock size={12} /> Proposition de prix reçue - En attente de votre validation
                            </span>
                          )}
                          {booking.clientResponse === 'accepted' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium" style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)', border: '1px solid var(--color-client-accent-border)' }}>
                              <CheckCircle size={12} weight="fill" /> Prix accepté
                            </span>
                          )}
                          {booking.clientResponse === 'rejected' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                              <X size={12} weight="bold" /> Prix refusé
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 px-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                      <CalendarBlank size={28} weight="light" style={{ color: 'var(--color-text-secondary)' }} />
                    </div>
                    <h4 className="text-base font-semibold mb-1" style={{ color: 'var(--color-client-text-primary)' }}>Aucune réservation trouvée</h4>
                    <p className="text-sm max-w-xs mx-auto mb-6" style={{ color: 'var(--color-client-text-secondary)' }}>
                      {bookingsFilter === 'all' ? "Vous n'avez pas encore effectué de réservation." : `Aucune réservation avec le statut "${bookingsFilter}".`}
                    </p>
                    {hasBookingsCreatePermission && (
                      <button
                        onClick={() => setShowReservationModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)', border: '1px solid var(--color-client-accent-glow)' }}>
                        <Plus size={16} weight="bold" /> Réserver un trajet
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 'create-reviews':
        return (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-client-border)' }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--color-client-text-primary)' }}>Trajets à évaluer</h3>
                <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-client-text-secondary)' }}>Évaluez vos trajets terminés</p>
              </div>
              {stats.reviewableBookings > 0 && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)' }}>
                  {stats.reviewableBookings} à évaluer
                </span>
              )}
            </div>
            <div className="p-5">
              {reviewableBookings.length > 0 ? (
                <div className="space-y-3">
                  {reviewableBookings.map((booking) => (
                    <div key={booking.id} className="rounded-xl p-4 transition-all hover:bg-white/2" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)' }}>
                              <Car size={14} weight="light" />
                            </div>
                            <h4 className="text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>Trajet <span style={{ fontFamily: 'var(--font-mono)' }}>#{booking.id}</span></h4>
                          </div>
                          <p className="text-sm mb-2 font-medium" style={{ color: 'var(--color-client-text-secondary)' }}>
                            {booking.pickupAddress} <span style={{ color: 'var(--color-client-accent)' }}>→</span> {booking.dropoffAddress}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-client-text-secondary)' }}>Chauffeur</p>
                              <p className="font-medium" style={{ color: 'var(--color-client-text-primary)' }}>{booking.driver.name}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-client-text-secondary)' }}>Date du trajet</p>
                              <p className="font-medium" style={{ color: 'var(--color-client-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                {new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => { setSelectedBookingForReview(booking); setIsReviewModalOpen(true) }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all shrink-0 ml-3"
                          style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}
                          disabled={!hasReviewsCreatePermission}
                          title={hasReviewsCreatePermission ? "Évaluer ce trajet" : "Vous n'avez pas la permission de créer des avis"}
                        >
                          <Star size={13} /> Évaluer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}>
                    <Star size={20} style={{ color: '#F59E0B' }} />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-client-text-primary)' }}>Aucun trajet à évaluer</p>
                  <p className="text-sm mb-4" style={{ color: 'var(--color-client-text-secondary)' }}>Vous avez évalué tous vos trajets terminés !</p>
                  {hasBookingsCreatePermission && (
                    <button
                      onClick={() => setShowReservationModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                      style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      Faire une nouvelle réservation
                    </button>
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
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
            <div className="p-5" style={{ borderBottom: '1px solid var(--color-client-border)' }}>
              <h3 className="text-base font-bold" style={{ color: 'var(--color-client-text-primary)' }}>Mes avis publiés</h3>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-client-text-secondary)' }}>Avis que vous avez donnés sur vos trajets</p>
            </div>
            <div className="p-5">
              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>Réservation <span style={{ fontFamily: 'var(--font-mono)' }}>#{review.bookingId}</span></h4>
                          {review.booking && (
                            <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--color-client-text-secondary)' }}>
                              {getSafeTextContent(review.booking.pickupAddress)} <span style={{ color: 'var(--color-client-accent)' }}>→</span> {getSafeTextContent(review.booking.dropoffAddress)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                          <span className="text-xs ml-1 font-semibold" style={{ color: 'var(--color-client-text-secondary)', fontFamily: 'var(--font-mono)' }}>({review.rating}/5)</span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm mb-2 font-medium" style={{ color: 'var(--color-client-text-secondary)' }}>{getSafeTextContent(review.comment)}</p>
                      )}
                      <p className="text-xs font-medium" style={{ color: 'var(--color-client-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        Publié le {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>Aucun avis donné pour le moment</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-client-text-secondary)' }}>Vous pourrez évaluer vos trajets une fois qu&apos;ils seront terminés</p>
                </div>
              )}
            </div>
          </div>
        )

      case 'profile':
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Profil Header Card */}
            <div className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-white dark:bg-[#111E1A] border border-gray-200 dark:border-[#10B981]/10 px-4 py-6 sm:px-8 sm:py-10 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-20 -mt-20" />

              <div className="relative flex flex-col md:flex-row items-center gap-6 sm:gap-10">
                <div className="relative group shrink-0">
                  <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="relative w-32 h-32 rounded-4xl border-4 border-red-500 p-1 bg-gray-100 dark:bg-[#111E1A] overflow-hidden">
                    {(() => {
                      const safeImageUrl = getSafeProfileImageUrl(userProfile?.image)
                      const safeAltText = getSafeTextForAttribute(userProfile?.name) || 'Profile'
                      return safeImageUrl ? (() => {
                        // snyk:ignore[javascript/DOMXSS] - URL validated by getSafeProfileImageUrl() which enforces http/https and rejects private IPs
                        const validatedSrc: string = safeImageUrl;
                        return (
                          <img src={/* snyk:ignore[javascript/DOMXSS] */validatedSrc} alt={safeAltText} className="w-full h-full object-cover rounded-3xl" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        );
                      })() : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-3xl font-bold text-emerald-500">
                          {userProfile?.name?.slice(0, 2).toUpperCase()}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{userProfile?.name}</h2>
                      {userProfile?.isCompany && (
                        <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest border border-red-500/20">
                          Compte Business
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-white/40 flex items-center justify-center md:justify-start gap-2 text-sm font-medium">
                      <Envelope size={16} weight="duotone" /> {userProfile?.email}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                    <button
                      onClick={() => setIsEditProfileModalOpen(true)}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 min-h-[44px]"
                    >
                      <PencilSimple size={18} weight="bold" /> Modifier mon profil
                    </button>
                    <button className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-white/70 font-bold text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2 min-h-[44px]">
                      <IdentificationCard size={18} /> Voir ma carte
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informations de contact */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-4 sm:p-8 rounded-3xl sm:rounded-4xl bg-white dark:bg-client-card border border-gray-200 dark:border-white/5 space-y-6 sm:space-y-8">
                  <div className="flex items-center gap-3 text-black dark:text-white">
                    <IdentificationCard size={20} weight="bold" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em]">Détails du compte</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/30">Numéro de téléphone</p>
                      <p className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                        <Phone size={16} className="text-red-500" /> {userProfile?.phone || "Non renseigné"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/30">Adresse de résidence</p>
                      <p className="text-gray-900 dark:text-white font-medium flex items-center gap-2 line-clamp-1">
                        <MapPin size={16} className="text-red-500" /> {userProfile?.address || "Dakar, Sénégal"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/30">Membre depuis</p>
                      <p className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                        <CalendarBlank size={16} className="text-red-500" /> {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : "---"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/30">Statut du compte</p>
                      <p className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                        <CheckCircle size={16} className="text-red-500" weight="fill" /> Vérifié & Actif
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section Entreprise (Si applicable) */}
                {userProfile?.isCompany ? (
                  <div className="p-8 rounded-4xl bg-emerald-50 dark:bg-emerald-500/3 border border-emerald-200 dark:border-emerald-500/10 space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Buildings size={120} weight="duotone" />
                    </div>

                    <div className="flex items-center gap-3 text-red-500">
                      <Buildings size={20} weight="bold" />
                      <h4 className="text-xs font-black uppercase tracking-[0.2em]">Informations Entreprise</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 relative">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/30">Nom de l'entreprise</p>
                        <p className="text-gray-900 dark:text-white text-lg font-bold">{userProfile.companyName || "Non renseigné"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/30">NINEA</p>
                        <p className="text-gray-900 dark:text-white font-mono font-medium tracking-wider">{userProfile.ninea || "Non renseigné"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/30">Raison Sociale</p>
                        <p className="text-gray-900 dark:text-white font-medium">{userProfile.raisonSociale || "Non renseigné"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/30">Boîte Postale (BP)</p>
                        <p className="text-gray-900 dark:text-white font-medium">{userProfile.bp || "Aucune"}</p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/30">Siège Social</p>
                        <p className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                          <MapPin size={16} className="text-red-500" /> {userProfile.companyAddress || "Non renseignée"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/30">Téléphone pro</p>
                        <p className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                          <Phone size={16} className="text-red-500" /> {userProfile.companyPhone || "Non renseigné"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-4xl bg-gray-50 dark:bg-white/2 border border-gray-200 dark:border-white/5 border-dashed flex flex-col items-center justify-center text-center py-12">
                    <Buildings size={40} weight="thin" className="text-gray-400 dark:text-white/20 mb-4" />
                    <h4 className="text-sm font-bold text-gray-700 dark:text-white/60">Vous êtes un professionnel ?</h4>
                    <p className="text-xs text-gray-600 dark:text-white/30 mt-1 max-w-xs">
                      Activez le mode entreprise dans vos réglages pour bénéficier d'une facturation professionnelle et de services dédiés.
                    </p>
                    <button
                      onClick={() => setIsEditProfileModalOpen(true)}
                      className="mt-6 px-5 py-2 rounded-xl bg-gray-200 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-white/60 text-xs font-bold hover:bg-gray-300 dark:hover:bg-white/10 transition-all uppercase tracking-widest"
                    >
                      Passer au compte Pro
                    </button>
                  </div>
                )}
              </div>

              {/* Sidebar: Sécurité & Statut */}
              <div className="space-y-6">
                {/* Activité Quick Stats */}
                <div className="p-6 rounded-4xl bg-white dark:bg-client-card border border-gray-200 dark:border-white/5 space-y-6">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/30">Résumé activité</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/2 border border-gray-200 dark:border-white/5">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'var(--font-mono)' }}>{stats.totalBookings}</p>
                      <p className="text-[9px] uppercase tracking-widest text-gray-500 dark:text-white/30 mt-1">Trajets</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/2 border border-gray-200 dark:border-white/5">
                      <p className="text-2xl font-bold text-red-500" style={{ fontFamily: 'var(--font-mono)' }}>{stats.completedBookings}</p>
                      <p className="text-[9px] uppercase tracking-widest text-gray-500 dark:text-white/30 mt-1">Réussis</p>
                    </div>
                  </div>
                </div>

                {/* Sécurité */}
                <div className="p-6 rounded-4xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/10 space-y-4">
                  <div className="flex items-center gap-2 text-black dark:text-white">
                    <CheckCircle size={18} weight="fill" className="text-red-500" />
                    <h5 className="text-[10px] font-black uppercase tracking-widest">Confiance & Sécurité</h5>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-white/50 dark:bg-black/20">
                      <span className="text-gray-600 dark:text-white/50">Email vérifié</span>
                      <span className="text-red-500 font-bold">OUI</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-white/50 dark:bg-black/20">
                      <span className="text-gray-600 dark:text-white/50">Double Auth</span>
                      <span className="text-gray-500 dark:text-white/30">NON ACTIF</span>
                    </div>
                  </div>
                  <button className="w-full py-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-white/50 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all mt-2">
                    Changer le mot de passe
                  </button>
                </div>

                {/* ID Unique */}
                <div className="p-6 rounded-4xl bg-gray-50 dark:bg-white/2 border border-gray-200 dark:border-white/5 flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                    <IdentificationCard size={32} weight="thin" className="text-gray-400 dark:text-white/40" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/30 mb-1">ID Client Unique</p>
                    <p className="text-xs font-mono text-gray-600 dark:text-white/50 select-all cursor-pointer hover:text-emerald-400 transition-colors">
                      {userProfile?.id || "N/A"}
                    </p>
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
    <>
      {renderContent()}

      {/* Modal de création d'avis */}
      <CreateReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false)
          setSelectedBookingForReview(null)
        }}
        booking={selectedBookingForReview}
        onSuccess={() => {
          loadClientData()
        }}
      />

      {/* Modal d'édition de profil */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        initialData={userProfile}
        onSuccess={() => {
          loadClientData()
        }}
      />

      {/* Modal de détails et édition de réservation */}
      <BookingDetailsModal
        isOpen={isEditBookingModalOpen}
        onClose={() => {
          setIsEditBookingModalOpen(false)
          setEditingBooking(null)
        }}
        booking={editingBooking}
        onSuccess={() => {
          loadClientData()
        }}
      />

      {/* Modal formulaire nouvelle réservation */}
      {showReservationModal && (
        <div className="fixed inset-0 z-[80] flex flex-col" style={{ backgroundColor: 'var(--color-client-bg)' }}>
          <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--color-client-border)', backgroundColor: 'var(--color-client-card)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)' }}>
                <CalendarBlank size={16} weight="duotone" />
              </div>
              <h2 className="text-base font-bold" style={{ color: 'var(--color-client-text-primary)' }}>Nouvelle réservation</h2>
            </div>
            <button
              onClick={() => setShowReservationModal(false)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <X size={18} weight="bold" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--color-client-accent)' }} /></div>}>
              <ReservationForm
                isEmbedded
                onClose={() => { setShowReservationModal(false); loadClientData() }}
              />
            </Suspense>
          </div>
        </div>
      )}

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
            loadClientData()
            setIsPriceApprovalModalOpen(false)
            setBookingForPriceApproval(null)
          }}
        />
      )}
    </>
  )
}

export default function ClientDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-bg)' }}>
        <div className="text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-linear-to-r from-gold via-white to-gold animate-pulse"
              style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>
              Navette Xpress
            </div>
          </div>
          <p className="mt-4 text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>Chargement de votre espace...</p>
        </div>
      </div>
    }>
      <ClientDashboardContent />
    </Suspense>
  )
}









