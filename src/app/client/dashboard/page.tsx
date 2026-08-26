"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useEffect, useState, Suspense } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toIntlLocale } from "@/lib/intl-locale"
import { CreateReviewModal } from "@/components/client/CreateReviewModal"
import { ClientReservationForm as ReservationForm } from "@/components/client-reservation-form"
import { EditProfileModal } from "@/components/client/EditProfileModal"
import { BookingDetailsModal } from "@/components/client/BookingDetailsModal"
import { PriceApprovalModal } from "@/components/client/PriceApprovalModal"
import { ClientQuotesView } from "@/components/client/ClientQuotesView"
import { ClientInvoicesView } from "@/components/client/ClientInvoicesView"
import { VehiclesManagement } from "@/components/client/VehiclesManagement"
import { ClientUsersManagement } from "@/components/client/ClientUsersManagement"
import { TripStatusBadge } from "@/components/client/TripStatusBadge"
import { SquaresFour, CalendarBlank, FileText, Receipt, Star, ChatCircle, Car, Users, Plus, MapPin, Clock, Eye, Phone, Wallet, Calendar, ClipboardText, DownloadSimple, PencilSimple, X, CheckCircle, Envelope, Buildings, IdentificationCard } from "@phosphor-icons/react"

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
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)
  const t = useTranslations('client')
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
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!session?.user || (session.user as unknown as { role?: string }).role !== 'customer') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-bg)' }}>
        <div className="text-sm font-medium" style={{ color: 'var(--color-trip-cancelled)' }}>{t('accessDenied')}</div>
      </div>
    )
  }

  // Bookings permissions - Chaque permission est indépendante
  const hasBookingsManagePermission = userPermissions.bookings?.includes('manage')
  const hasBookingsReadPermission = userPermissions.bookings?.includes('read') || hasBookingsManagePermission
  const hasBookingsCreatePermission = userPermissions.bookings?.includes('create') || hasBookingsManagePermission
  const hasBookingsUpdatePermission = userPermissions.bookings?.includes('update') || hasBookingsManagePermission
  const hasBookingsDeletePermission = userPermissions.bookings?.includes('delete') || hasBookingsManagePermission
  const canViewBookings = hasBookingsReadPermission || hasBookingsCreatePermission || hasBookingsUpdatePermission || hasBookingsDeletePermission

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
    { id: 'overview' as TabType, label: t('tabs.overview'), icon: <SquaresFour size={16} /> },
    ...(canViewBookings ? [{ id: 'bookings' as TabType, label: t('tabs.bookings'), icon: <CalendarBlank size={16} />, badge: stats.pendingBookings > 0 ? stats.pendingBookings : null }] : []),
    ...(canManageQuotes ? [{ id: 'quotes' as TabType, label: t('tabs.quotes'), icon: <FileText size={16} /> }] : []),
    { id: 'invoices' as TabType, label: t('tabs.invoices'), icon: <Receipt size={16} /> },
    { id: 'create-reviews' as TabType, label: t('tabs.createReviews'), icon: <PencilSimple size={16} />, badge: stats.reviewableBookings > 0 ? stats.reviewableBookings : null },
    ...(canManageReviews ? [{ id: 'reviews' as TabType, label: t('tabs.reviews'), icon: <Star size={16} /> }] : []),
    ...(canManageVehicles ? [{ id: 'vehicles' as TabType, label: t('tabs.vehicles'), icon: <Car size={16} /> }] : []),
    ...(canManageUsers ? [{ id: 'users' as TabType, label: t('tabs.users'), icon: <Users size={16} /> }] : []),
    { id: 'profile' as TabType, label: t('tabs.profile'), icon: <IdentificationCard size={16} /> },
  ]

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
                      {new Date().getHours() < 12 ? t('greeting.morning') : new Date().getHours() < 18 ? t('greeting.afternoon') : t('greeting.evening')}
                    </p>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium truncate" style={{ color: '#0f172a' }}>
                      {session?.user?.name || t('greeting.welcome')}
                    </h1>
                    <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                      {new Date().toLocaleDateString(intlLocale, { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748b' }}>{t('overview.pendingLabel')}</p>
                      <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: '#0f172a' }}>{stats.pendingBookings}</p>
                    </div>
                    <button
                      onClick={() => setShowReservationModal(true)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px]"
                      style={{ backgroundColor: 'var(--color-client-accent)', color: '#fff' }}>
                      <Plus size={15} weight="bold" /> {t('overview.newTrip')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: t('overview.stats.totalBookings'), value: stats.totalBookings, icon: <CalendarBlank size={16} weight="light" />, color: 'var(--color-client-accent)' },
                { label: t('overview.stats.completed'), value: stats.completedBookings, icon: <MapPin size={16} weight="light" />, color: 'var(--color-client-accent)' },
                { label: t('overview.stats.pending'), value: stats.pendingBookings, icon: <Clock size={16} weight="light" />, color: '#F59E0B' },
                { label: t('overview.stats.totalQuotes'), value: stats.totalQuotes, icon: <FileText size={16} weight="light" />, color: '#8B5CF6' },
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
                  <p className="text-xs font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--color-client-text-secondary)' }}>{t('overview.averageRating')}</p>
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
                  <p className="text-xs font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--color-client-text-secondary)' }}>{t('overview.tripsToEvaluate')}</p>
                  <h3 className="text-2xl font-bold mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-client-accent)' }}>{stats.reviewableBookings}</h3>
                  <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-client-text-secondary)' }}>
                    {stats.reviewableBookings > 0 ? t('overview.shareExperience') : t('overview.allUpToDate')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)' }}>
                  <PencilSimple size={18} weight="light" />
                </div>
              </div>

              <div className="client-card-enter rounded-2xl p-5 flex items-center justify-between"
                style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--color-client-text-secondary)' }}>{t('overview.myReviews')}</p>
                  <h3 className="text-2xl font-bold mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-client-text-primary)' }}>{stats.totalReviews}</h3>
                  <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-client-text-secondary)' }}>{t('overview.reviewsPublished')}</p>
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
                <h3 className="text-base font-bold" style={{ color: 'var(--color-client-text-primary)' }}>{t('overview.recentBookings')}</h3>
                <button onClick={() => setActiveTab('bookings')} className="text-xs font-medium transition-colors flex items-center gap-1 hover:opacity-80" style={{ color: 'var(--color-client-accent)' }}>
                  {t('overview.viewAll')} <span className="text-base leading-none">→</span>
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
                          {new Date(booking.scheduledDateTime).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' })}, {new Date(booking.scheduledDateTime).toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <TripStatusBadge statut={booking.status} />
                      <p className="text-xs font-semibold shrink-0 hidden sm:block" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-client-text-primary)' }}>
                        {booking.price ? `${parseFloat(booking.price).toLocaleString(intlLocale)} FCFA` : '—'}
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
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-client-text-primary)' }}>{t('overview.noRecentBooking')}</p>
                  <p className="text-sm mb-4" style={{ color: 'var(--color-client-text-secondary)' }}>{t('overview.startBooking')}</p>
                  <button
                    onClick={() => setShowReservationModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)', border: '1px solid var(--color-client-accent-border)' }}>
                    {t('overview.bookTrip')}
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
                  <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--color-client-text-primary)' }}>{t('bookings.title')}</h3>
                  <p className="text-xs sm:text-sm mt-0.5 font-medium" style={{ color: 'var(--color-client-text-secondary)' }}>{t('bookings.subtitle')}</p>
                </div>
                <div className="flex gap-3 items-center flex-wrap">
                  <select
                    value={bookingsFilter}
                    onChange={(e) => setBookingsFilter(e.target.value)}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 rounded-xl text-xs outline-none transition-all min-h-[44px]"
                    style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="pending">{t('bookings.filters.pending')}</option>
                    <option value="confirmed">{t('bookings.filters.confirmed')}</option>
                    <option value="in_progress">{t('bookings.filters.inProgress')}</option>
                    <option value="completed">{t('bookings.filters.completed')}</option>
                    <option value="cancelled">{t('bookings.filters.cancelled')}</option>
                    <option value="all">{t('bookings.filters.all')}</option>
                  </select>
                  {hasBookingsCreatePermission && (
                    <button
                      onClick={() => setShowReservationModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all hover:brightness-110 min-h-[44px]"
                      style={{ backgroundColor: 'var(--color-client-accent)', color: '#fff' }}>
                      <Plus size={14} weight="bold" /> {t('bookings.newBooking')}
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
                                  {t('bookings.bookingNumber')} <span style={{ fontFamily: 'var(--font-mono)' }}>#{booking.id}</span>
                                </h4>
                                <p className="text-xs font-medium uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-client-text-secondary)' }}>
                                  {t('bookings.createdOn')} {new Date(booking.createdAt).toLocaleDateString(intlLocale)}
                                </p>
                              </div>
                              <TripStatusBadge statut={booking.status} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-client-accent)' }} />
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('bookings.departure')}</p>
                                  <p className="text-sm font-medium line-clamp-1" style={{ color: 'var(--color-client-text-primary)' }}>{booking.pickupAddress}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#EF4444' }} />
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('bookings.arrival')}</p>
                                  <p className="text-sm font-medium line-clamp-1" style={{ color: 'var(--color-client-text-primary)' }}>{booking.dropoffAddress}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex flex-wrap gap-4 sm:gap-6">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('bookings.dateTime')}</p>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <Calendar size={13} style={{ color: 'var(--color-client-accent)' }} />
                                  <p className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>
                                    {new Date(booking.scheduledDateTime).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' })}
                                  </p>
                                  <Clock size={13} className="ml-0.5" style={{ color: 'var(--color-client-accent)' }} />
                                  <p className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>
                                    {new Date(booking.scheduledDateTime).toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>

                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('bookings.amount')}</p>
                                <p className="text-base sm:text-lg font-bold" style={{ color: 'var(--color-client-text-primary)', fontFamily: 'var(--font-mono)' }}>
                                  {booking.price ? `${parseFloat(booking.price).toLocaleString(intlLocale)} FCFA` : '---'}
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
                                  <Wallet size={14} weight="bold" /> {t('bookings.acceptPrice')}
                                </button>
                              )}

                              {/* Edit Action */}
                              {hasBookingsUpdatePermission && !['confirmed', 'in_progress', 'completed', 'cancelled'].includes(booking.status) && (
                                <button
                                  onClick={() => { setEditingBooking(booking); setIsEditBookingModalOpen(true) }}
                                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all min-h-[44px]"
                                  style={{ backgroundColor: 'var(--color-client-border)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-client-border)' }}
                                  title={t('bookings.edit')}
                                >
                                  <PencilSimple size={16} />
                                </button>
                              )}

                              {/* View Details */}
                              <button
                                onClick={() => { setEditingBooking(booking); setIsEditBookingModalOpen(true) }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-(--color-client-accent-bg) hover:text-(--color-client-accent) min-h-[44px]"
                                style={{ backgroundColor: 'var(--color-client-border)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-client-border)' }}
                                title={t('bookings.viewDetails')}
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
                              <Clock size={12} /> {t('bookings.priceProposalReceived')}
                            </span>
                          )}
                          {booking.clientResponse === 'accepted' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium" style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)', border: '1px solid var(--color-client-accent-border)' }}>
                              <CheckCircle size={12} weight="fill" /> {t('bookings.priceAccepted')}
                            </span>
                          )}
                          {booking.clientResponse === 'rejected' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                              <X size={12} weight="bold" /> {t('bookings.priceRejected')}
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
                    <h4 className="text-base font-semibold mb-1" style={{ color: 'var(--color-client-text-primary)' }}>{t('bookings.noBookingFound')}</h4>
                    <p className="text-sm max-w-xs mx-auto mb-6" style={{ color: 'var(--color-client-text-secondary)' }}>
                      {bookingsFilter === 'all' ? t('bookings.noBookingYet') : t('bookings.noBookingWithStatus', { status: t(`bookings.filters.${bookingsFilter === 'in_progress' ? 'inProgress' : bookingsFilter}` as any) })}
                    </p>
                    {hasBookingsCreatePermission && (
                      <button
                        onClick={() => setShowReservationModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)', border: '1px solid var(--color-client-accent-glow)' }}>
                        <Plus size={16} weight="bold" /> {t('bookings.bookTrip')}
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
                <h3 className="text-base font-bold" style={{ color: 'var(--color-client-text-primary)' }}>{t('createReviews.title')}</h3>
                <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-client-text-secondary)' }}>{t('createReviews.subtitle')}</p>
              </div>
              {stats.reviewableBookings > 0 && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)' }}>
                  {t('createReviews.toEvaluate', { count: stats.reviewableBookings })}
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
                            <h4 className="text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>{t('createReviews.trip')} <span style={{ fontFamily: 'var(--font-mono)' }}>#{booking.id}</span></h4>
                          </div>
                          <p className="text-sm mb-2 font-medium" style={{ color: 'var(--color-client-text-secondary)' }}>
                            {booking.pickupAddress} <span style={{ color: 'var(--color-client-accent)' }}>→</span> {booking.dropoffAddress}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-client-text-secondary)' }}>{t('createReviews.driver')}</p>
                              <p className="font-medium" style={{ color: 'var(--color-client-text-primary)' }}>{booking.driver.name}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-client-text-secondary)' }}>{t('createReviews.tripDate')}</p>
                              <p className="font-medium" style={{ color: 'var(--color-client-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                {new Date(booking.scheduledDateTime).toLocaleDateString(intlLocale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => { setSelectedBookingForReview(booking); setIsReviewModalOpen(true) }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all shrink-0 ml-3"
                          style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}
                          disabled={!hasReviewsCreatePermission}
                          title={hasReviewsCreatePermission ? t('createReviews.evaluateTrip') : t('createReviews.evaluateNoPermission')}
                        >
                          <Star size={13} /> {t('createReviews.evaluate')}
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
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-client-text-primary)' }}>{t('createReviews.noTripToEvaluate')}</p>
                  <p className="text-sm mb-4" style={{ color: 'var(--color-client-text-secondary)' }}>{t('createReviews.allEvaluated')}</p>
                  {hasBookingsCreatePermission && (
                    <button
                      onClick={() => setShowReservationModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                      style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      {t('createReviews.newBooking')}
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
              <h3 className="text-base font-bold" style={{ color: 'var(--color-client-text-primary)' }}>{t('reviews.title')}</h3>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-client-text-secondary)' }}>{t('reviews.subtitle')}</p>
            </div>
            <div className="p-5">
              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>{t('reviews.booking')} <span style={{ fontFamily: 'var(--font-mono)' }}>#{review.bookingId}</span></h4>
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
                        {t('reviews.publishedOn')} {new Date(review.createdAt).toLocaleDateString(intlLocale)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>{t('reviews.noReviewYet')}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('reviews.willBeAbleToEvaluate')}</p>
                </div>
              )}
            </div>
          </div>
        )

      case 'profile':
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Profil Header Card */}
            <div className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden px-4 py-6 sm:px-8 sm:py-10"
              style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
              <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full -mr-20 -mt-20" style={{ backgroundColor: 'var(--color-client-accent-bg)' }} />

              <div className="relative flex flex-col md:flex-row items-center gap-6 sm:gap-10">
                <div className="relative group shrink-0">
                  <div className="relative w-32 h-32 rounded-4xl border-4 p-1 overflow-hidden" style={{ borderColor: 'var(--color-client-accent)', backgroundColor: 'var(--color-client-surface)' }}>
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
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold" style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)' }}>
                          {userProfile?.name?.slice(0, 2).toUpperCase()}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                      <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-client-text-primary)' }}>{userProfile?.name}</h2>
                      {userProfile?.isCompany && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)', border: '1px solid var(--color-client-accent-border)' }}>
                          {t('profile.businessAccount')}
                        </span>
                      )}
                    </div>
                    <p className="flex items-center justify-center md:justify-start gap-2 text-sm font-medium" style={{ color: 'var(--color-client-text-secondary)' }}>
                      <Envelope size={16} weight="duotone" /> {userProfile?.email}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                    <button
                      onClick={() => setIsEditProfileModalOpen(true)}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[44px]"
                      style={{ backgroundColor: 'var(--color-client-accent)', color: '#fff' }}
                    >
                      <PencilSimple size={18} weight="bold" /> {t('profile.editProfile')}
                    </button>
                    <button className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 min-h-[44px]"
                      style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}>
                      <IdentificationCard size={18} /> {t('profile.viewCard')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informations de contact */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-4 sm:p-8 rounded-3xl sm:rounded-4xl space-y-6 sm:space-y-8" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
                  <div className="flex items-center gap-3" style={{ color: 'var(--color-client-text-primary)' }}>
                    <IdentificationCard size={20} weight="bold" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em]">{t('profile.accountDetails')}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.phoneNumber')}</p>
                      <p className="font-medium flex items-center gap-2" style={{ color: 'var(--color-client-text-primary)' }}>
                        <Phone size={16} style={{ color: 'var(--color-client-accent)' }} /> {userProfile?.phone || t('profile.notProvided')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.residenceAddress')}</p>
                      <p className="font-medium flex items-center gap-2 line-clamp-1" style={{ color: 'var(--color-client-text-primary)' }}>
                        <MapPin size={16} style={{ color: 'var(--color-client-accent)' }} /> {userProfile?.address || "Dakar, Sénégal"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.memberSince')}</p>
                      <p className="font-medium flex items-center gap-2" style={{ color: 'var(--color-client-text-primary)' }}>
                        <CalendarBlank size={16} style={{ color: 'var(--color-client-accent)' }} /> {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString(intlLocale, { day: 'numeric', month: 'long', year: 'numeric' }) : "---"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.accountStatus')}</p>
                      <p className="font-medium flex items-center gap-2" style={{ color: 'var(--color-client-text-primary)' }}>
                        <CheckCircle size={16} style={{ color: 'var(--color-client-accent)' }} weight="fill" /> {t('profile.verifiedActive')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section Entreprise (Si applicable) */}
                {userProfile?.isCompany ? (
                  <div className="p-8 rounded-4xl space-y-8 relative overflow-hidden group" style={{ backgroundColor: 'var(--color-client-accent-bg)', border: '1px solid var(--color-client-accent-border)' }}>
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Buildings size={120} weight="duotone" />
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3" style={{ color: 'var(--color-client-accent)' }}>
                        <Buildings size={20} weight="bold" />
                        <h4 className="text-xs font-black uppercase tracking-[0.2em]">{t('profile.companyInfo')}</h4>
                      </div>
                      <Link
                        href="/entreprise/dashboard"
                        className="text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--color-client-accent)' }}
                      >
                        {t('profile.accessEnterpriseSpace')}
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 relative">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.companyName')}</p>
                        <p className="text-lg font-bold" style={{ color: 'var(--color-client-text-primary)' }}>{userProfile.companyName || t('profile.notProvided')}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.ninea')}</p>
                        <p className="font-mono font-medium tracking-wider" style={{ color: 'var(--color-client-text-primary)' }}>{userProfile.ninea || t('profile.notProvided')}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.raisonSociale')}</p>
                        <p className="font-medium" style={{ color: 'var(--color-client-text-primary)' }}>{userProfile.raisonSociale || t('profile.notProvided')}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.poBox')}</p>
                        <p className="font-medium" style={{ color: 'var(--color-client-text-primary)' }}>{userProfile.bp || t('profile.none')}</p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.headOffice')}</p>
                        <p className="font-medium flex items-center gap-2" style={{ color: 'var(--color-client-text-primary)' }}>
                          <MapPin size={16} style={{ color: 'var(--color-client-accent)' }} /> {userProfile.companyAddress || t('profile.notSpecified')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.companyPhone')}</p>
                        <p className="font-medium flex items-center gap-2" style={{ color: 'var(--color-client-text-primary)' }}>
                          <Phone size={16} style={{ color: 'var(--color-client-accent)' }} /> {userProfile.companyPhone || t('profile.notProvided')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-4xl border-dashed flex flex-col items-center justify-center text-center py-12" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px dashed var(--color-client-border)' }}>
                    <Buildings size={40} weight="thin" style={{ color: 'var(--color-client-text-secondary)' }} className="mb-4" />
                    <h4 className="text-sm font-bold" style={{ color: 'var(--color-client-text-primary)' }}>{t('profile.becomeCompany')}</h4>
                    <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--color-client-text-secondary)' }}>
                      {t('profile.activateCompanyHint')}
                    </p>
                    <button
                      onClick={() => setIsEditProfileModalOpen(true)}
                      className="mt-6 px-5 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest"
                      style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                    >
                      {t('profile.switchToPro')}
                    </button>
                  </div>
                )}
              </div>

              {/* Sidebar: Sécurité & Statut */}
              <div className="space-y-6">
                {/* Activité Quick Stats */}
                <div className="p-6 rounded-4xl space-y-6" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
                  <h5 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.activitySummary')}</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                      <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-client-text-primary)' }}>{stats.totalBookings}</p>
                      <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.trips')}</p>
                    </div>
                    <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                      <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-client-accent)' }}>{stats.completedBookings}</p>
                      <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.successful')}</p>
                    </div>
                  </div>
                </div>

                {/* Sécurité */}
                <div className="p-6 rounded-4xl space-y-4" style={{ backgroundColor: 'var(--color-client-accent-bg)', border: '1px solid var(--color-client-accent-border)' }}>
                  <div className="flex items-center gap-2" style={{ color: 'var(--color-client-text-primary)' }}>
                    <CheckCircle size={18} weight="fill" style={{ color: 'var(--color-client-accent)' }} />
                    <h5 className="text-[10px] font-black uppercase tracking-widest">{t('profile.trustSecurity')}</h5>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs p-3 rounded-xl" style={{ backgroundColor: 'var(--color-client-card)' }}>
                      <span style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.emailVerified')}</span>
                      <span className="font-bold" style={{ color: 'var(--color-client-accent)' }}>{t('profile.yes')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-3 rounded-xl" style={{ backgroundColor: 'var(--color-client-card)' }}>
                      <span style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.twoFactor')}</span>
                      <span style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.notActive')}</span>
                    </div>
                  </div>
                  <button className="w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all mt-2"
                    style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-secondary)' }}>
                    {t('profile.changePassword')}
                  </button>
                </div>

                {/* ID Unique */}
                <div className="p-6 rounded-4xl flex flex-col items-center gap-4 py-8" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-card)' }}>
                    <IdentificationCard size={32} weight="thin" style={{ color: 'var(--color-client-text-secondary)' }} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-client-text-secondary)' }}>{t('profile.uniqueClientId')}</p>
                    <p className="text-xs font-mono select-all cursor-pointer transition-colors" style={{ color: 'var(--color-client-text-secondary)' }}>
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
              <h2 className="text-base font-bold" style={{ color: 'var(--color-client-text-primary)' }}>{t('reservationModal.title')}</h2>
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
  const t = useTranslations('client')
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
          <p className="mt-4 text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>{t('loadingSpace')}</p>
        </div>
      </div>
    }>
      <ClientDashboardContent />
    </Suspense>
  )
}
