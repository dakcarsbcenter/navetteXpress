"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState, Suspense } from "react"
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
import { StatusBadge } from "@/components/shared/StatusBadge"
import {
  CalendarBlank, Star, PencilSimple, CheckCircle, X, Plus, MapPin, Clock,
  Eye, Phone, Wallet, Calendar, ClipboardText, DownloadSimple, Envelope, Buildings,
  IdentificationCard, ChatCircle, Car,
} from "@phosphor-icons/react"

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
  driver?: { id: string; name: string; phone: string | null } | null
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

interface Invoice {
  id: number
  invoiceNumber: string
  totalAmount: string
  status: 'draft' | 'pending' | 'paid' | 'cancelled' | 'overdue'
  issueDate: string
  dueDate: string
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

const UPCOMING_STATUSES = ['pending', 'assigned', 'confirmed', 'in_progress']
const NEXT_TRIP_STATUSES = ['assigned', 'confirmed', 'in_progress']

const cardStyle = { backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '4px' }
const mono10Muted = { fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#6E6A63' }

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

function getInitials(name?: string | null) {
  if (!name) return '—'
  return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)
}

function waLink(phone: string | null | undefined) {
  if (!phone) return null
  const digits = phone.replace(/[^0-9]/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}`
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
  const [invoices, setInvoices] = useState<Invoice[]>([])
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
  const [priceApprovalInitialMode, setPriceApprovalInitialMode] = useState<'accept' | 'reject'>('accept')
  const [priceActionBusy, setPriceActionBusy] = useState(false)
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
    } else {
      setActiveTab('overview')
    }
  }, [searchParams])

  // Change d'onglet en poussant l'URL : le shell (titre, navigation active) et le
  // contenu de la page lisent tous deux ?tab=, donc toute navigation interne doit
  // passer par ici plutôt que par un setActiveTab direct, sous peine de désynchroniser
  // le titre de la barre du haut de l'onglet réellement affiché.
  const goToTab = (tab: TabType) => {
    router.push(tab === 'overview' ? '/client/dashboard' : `/client/dashboard?tab=${tab}`)
  }

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

      // Charger les factures
      const invoicesResponse = await fetch('/api/invoices')
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json()
        if (invoicesData.success) {
          setInvoices(invoicesData.invoices || [])
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
    const pendingQuotes = quotes.filter(q => ['pending', 'in_progress', 'sent'].includes(q.status)).length
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

  const upcomingBookings = useMemo(
    () => bookings.filter(b => UPCOMING_STATUSES.includes(b.status)),
    [bookings]
  )

  const nextTripBooking = useMemo(() => {
    const candidates = bookings.filter(b => NEXT_TRIP_STATUSES.includes(b.status))
    const inProgress = candidates.find(b => b.status === 'in_progress')
    if (inProgress) return inProgress
    return [...candidates].sort(
      (a, b) => new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime()
    )[0]
  }, [bookings])

  const pendingPriceBookings = useMemo(
    () => bookings
      .filter(b => b.clientResponse === 'pending' && b.price && parseFloat(b.price) > 0)
      .sort((a, b) => new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime()),
    [bookings]
  )
  const primaryPendingPrice = pendingPriceBookings[0]

  const dueInvoices = useMemo(
    () => invoices.filter(i => i.status === 'pending' || i.status === 'overdue'),
    [invoices]
  )

  const latestQuoteInProgress = useMemo(
    () => [...quotes]
      .filter(q => ['pending', 'in_progress', 'sent'].includes(q.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
    [quotes]
  )

  const respondToPrice = async (bookingId: number, response: 'accepted' | 'rejected', message?: string) => {
    setPriceActionBusy(true)
    try {
      const res = await fetch(`/api/client/bookings/${bookingId}/respond-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response, message }),
      })
      const data = await res.json()
      if (data.success) {
        await loadClientData()
      }
    } catch (error) {
      console.error('Erreur lors de la réponse au prix:', error)
    } finally {
      setPriceActionBusy(false)
    }
  }

  const openPriceModal = (booking: Booking, mode: 'accept' | 'reject') => {
    setBookingForPriceApproval(booking)
    setPriceApprovalInitialMode(mode)
    setIsPriceApprovalModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2" style={{ borderColor: '#E2DACD', borderTopColor: '#1F5245' }} />
          <p className="text-sm" style={{ color: '#6E6A63' }}>{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!session?.user || (session.user as unknown as { role?: string }).role !== 'customer') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm font-medium" style={{ color: '#B8493C' }}>{t('accessDenied')}</div>
      </div>
    )
  }

  // Bookings permissions - Chaque permission est indépendante
  const hasBookingsManagePermission = userPermissions.bookings?.includes('manage')
  const hasBookingsCreatePermission = userPermissions.bookings?.includes('create') || hasBookingsManagePermission
  const hasBookingsUpdatePermission = userPermissions.bookings?.includes('update') || hasBookingsManagePermission

  // Reviews permissions - Chaque permission est indépendante
  const hasReviewsManagePermission = userPermissions.reviews?.includes('manage')
  const hasReviewsCreatePermission = userPermissions.reviews?.includes('create') || hasReviewsManagePermission

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} weight={i < rating ? "fill" : "regular"} size={13} style={{ color: i < rating ? '#B4643A' : '#6E6A63' }} />
    ))
  }

  const formatWhen = (dateInput: string) => {
    const d = new Date(dateInput)
    return `${d.toLocaleDateString(intlLocale, { weekday: 'long', day: 'numeric', month: 'long' })}, ${d.toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })}`
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': {
        const firstName = session?.user?.name?.split(' ')[0] ?? ''
        const hour = new Date().getHours()
        const greetingWord = hour < 12 ? t('greeting.morning') : hour < 18 ? t('greeting.afternoon') : t('greeting.evening')
        const subtitle = nextTripBooking
          ? t('home.subtitleNextTrip', { route: `${nextTripBooking.pickupAddress} → ${nextTripBooking.dropoffAddress}`, when: formatWhen(nextTripBooking.scheduledDateTime) })
          : t('home.subtitleEmpty')

        const homeKpis = [
          {
            value: String(upcomingBookings.length),
            label: t('home.kpis.upcoming'),
            note: nextTripBooking ? t('home.kpis.upcomingNote', { when: formatWhen(nextTripBooking.scheduledDateTime) }) : t('home.kpis.upcomingNoteEmpty'),
          },
          { value: String(stats.completedBookings), label: t('home.kpis.completed'), note: t('home.kpis.completedNote') },
          {
            value: String(stats.pendingQuotes),
            label: t('home.kpis.quotes'),
            note: stats.pendingQuotes > 0 ? t('home.kpis.quotesNote', { count: stats.pendingQuotes }) : t('home.kpis.quotesNoteEmpty'),
          },
          {
            value: String(dueInvoices.length),
            label: t('home.kpis.invoicesDue'),
            note: dueInvoices.length > 0 ? t('home.kpis.invoicesDueNote', { count: dueInvoices.length }) : t('home.kpis.invoicesDueNoteEmpty'),
          },
        ]

        const nextTripPhone = nextTripBooking?.driver?.phone ?? null
        const nextTripWaLink = waLink(nextTripPhone)

        return (
          <div className="flex flex-col gap-6">
            <section className="flex flex-wrap items-baseline justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#1F5245' }}>
                  {t('home.eyebrow')}
                </span>
                <h2 style={{ margin: 0, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1, color: '#12100E' }}>
                  {greetingWord}, {firstName}.
                </h2>
                <p style={{ margin: 0, fontSize: '15px', color: '#3d3a35', lineHeight: 1.5 }}>{subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => goToTab('bookings')}
                style={{ fontSize: '13px', fontWeight: 600, color: '#12100E', borderBottom: '2px solid #12100E', paddingBottom: '2px', background: 'none', border: 'none', borderBottomWidth: '2px', borderBottomStyle: 'solid', borderBottomColor: '#12100E', cursor: 'pointer' }}
              >
                {t('home.viewAllBookings')}
              </button>
            </section>

            {/* Bandeau d'approbation de prix — priorité de l'écran */}
            {primaryPendingPrice && (
              <section style={{ backgroundColor: '#E8DCC8', borderRadius: '4px', padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '28px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', minWidth: 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#12100E' }}>
                    {t('home.priceBanner.eyebrow')}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.015em', color: '#12100E' }}>
                    {primaryPendingPrice.pickupAddress} → {primaryPendingPrice.dropoffAddress} · {formatWhen(primaryPendingPrice.scheduledDateTime)}
                  </span>
                  <span style={{ fontSize: '13px', color: '#3d3a35' }}>
                    {t('home.priceBanner.proposedOn', { date: primaryPendingPrice.priceProposedAt ? new Date(primaryPendingPrice.priceProposedAt).toLocaleDateString(intlLocale, { day: 'numeric', month: 'long' }) : '—' })}
                  </span>
                  {pendingPriceBookings.length > 1 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B4643A' }}>
                      {pendingPriceBookings.length === 2 ? t('home.priceBanner.moreOne') : t('home.priceBanner.moreMany', { count: pendingPriceBookings.length - 1 })}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em', color: '#12100E' }}>
                      {Math.round(parseFloat(primaryPendingPrice.price || '0')).toLocaleString(intlLocale)}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', color: '#3d3a35' }}>{t('home.priceBanner.currency')}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      disabled={priceActionBusy}
                      onClick={() => respondToPrice(primaryPendingPrice.id, 'accepted')}
                      style={{ height: '46px', padding: '0 20px', background: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: priceActionBusy ? 'wait' : 'pointer', whiteSpace: 'nowrap', opacity: priceActionBusy ? 0.7 : 1 }}
                    >
                      {t('home.priceBanner.accept')}
                    </button>
                    <button
                      type="button"
                      disabled={priceActionBusy}
                      onClick={() => openPriceModal(primaryPendingPrice, 'reject')}
                      style={{ height: '46px', padding: '0 20px', background: 'transparent', border: '1px solid #12100E', borderRadius: '4px', color: '#12100E', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {t('home.priceBanner.reject')}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Prochain trajet — trait du corridor */}
            {nextTripBooking ? (
              <section style={{ ...cardStyle, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '14px 24px', borderBottom: '1px solid #E2DACD', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <StatusBadge domain="booking" value={nextTripBooking.status} audience="client" live={nextTripBooking.status === 'in_progress'} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', color: '#6E6A63' }}>{t('home.nextTrip.ref', { id: nextTripBooking.id })}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '1px', background: '#E2DACD' }}>
                  <div style={{ padding: '28px 24px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
                        <span style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid #1F5245', background: '#FFFFFF' }} />
                        <span style={mono10Muted}>{t('home.nextTrip.departure')}</span>
                      </div>
                      <span style={{ flex: 1, height: '1.5px', background: '#12100E', margin: '0 16px 22px' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
                        <span style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid #B4643A', background: '#FFFFFF' }} />
                        <span style={mono10Muted}>{t('home.nextTrip.arrival')}</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3, color: '#12100E' }}>{nextTripBooking.pickupAddress}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', color: '#12100E', marginTop: '2px' }}>
                          {new Date(nextTripBooking.scheduledDateTime).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' }).toUpperCase()} · {new Date(nextTripBooking.scheduledDateTime).toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right' }}>
                        <span style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3, color: '#12100E' }}>{nextTripBooking.dropoffAddress}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '14px 16px', background: '#F7F3EC', borderRadius: '3px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', border: '1px solid #E2DACD', borderRadius: '3px', background: '#FFFFFF', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: '#12100E' }}>{getInitials(nextTripBooking.driver?.name)}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#12100E' }}>{nextTripBooking.driver?.name ?? t('home.nextTrip.driverUnassigned')}</span>
                          {nextTripBooking.driver && <span style={mono10Muted}>{t('home.nextTrip.driverLabel')}</span>}
                        </div>
                      </div>
                      {nextTripBooking.driver && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {nextTripPhone && (
                            <a href={`tel:${nextTripPhone}`} title={t('home.nextTrip.call')} style={{ width: '40px', height: '40px', background: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', display: 'grid', placeItems: 'center' }}>
                              <Phone size={17} style={{ color: '#12100E' }} />
                            </a>
                          )}
                          {nextTripWaLink && (
                            <a href={nextTripWaLink} target="_blank" rel="noreferrer" title={t('home.nextTrip.message')} style={{ width: '40px', height: '40px', background: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', display: 'grid', placeItems: 'center' }}>
                              <ChatCircle size={17} style={{ color: '#12100E' }} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '28px 24px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                      <span style={mono10Muted}>{t('home.nextTrip.priceLabel')}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 600, letterSpacing: '-0.01em', color: '#12100E' }}>
                        {nextTripBooking.price && parseFloat(nextTripBooking.price) > 0
                          ? <>{Math.round(parseFloat(nextTripBooking.price)).toLocaleString(intlLocale)} <span style={{ fontSize: '12px', fontWeight: 400, color: '#6E6A63' }}>FCFA</span></>
                          : <span style={{ fontSize: '14px', fontWeight: 500, color: '#6E6A63' }}>{t('home.nextTrip.priceUnset')}</span>}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setEditingBooking(nextTripBooking); setIsEditBookingModalOpen(true) }}
                      style={{ height: '46px', background: '#FFFFFF', border: '1px solid #12100E', borderRadius: '4px', color: '#12100E', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: 'auto' }}
                    >
                      {t('home.nextTrip.viewDetails')}
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <section style={{ ...cardStyle, padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#12100E' }}>{t('home.nextTrip.emptyTitle')}</p>
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6E6A63' }}>{t('home.nextTrip.emptyDescription')}</p>
              </section>
            )}

            {/* Bandeau de 4 indicateurs */}
            <section style={{ display: 'flex', flexWrap: 'wrap', borderTop: '1px solid #E2DACD', borderBottom: '1px solid #E2DACD' }}>
              {homeKpis.map((kpi) => (
                <div key={kpi.label} style={{ flex: '1 1 168px', minWidth: '168px', padding: '20px 22px', borderRight: '1px solid #E2DACD', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em', color: '#12100E' }}>{kpi.value}</span>
                  <span style={mono10Muted}>{kpi.label}</span>
                  <span style={{ fontSize: '12px', color: '#3d3a35' }}>{kpi.note}</span>
                </div>
              ))}
            </section>

            {/* Réservations + colonne étroite */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '24px', alignItems: 'start' }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px', padding: '18px 24px', borderBottom: '1px solid #E2DACD' }}>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, letterSpacing: '-0.01em', color: '#12100E' }}>{t('home.bookingsList.title')}</h3>
                  <span style={mono10Muted}>{t('home.bookingsList.totalCount', { count: bookings.length })}</span>
                </div>
                {bookings.length > 0 ? (
                  bookings.slice(0, 6).map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => { setEditingBooking(booking); setIsEditBookingModalOpen(true) }}
                      style={{ display: 'grid', gridTemplateColumns: '82px minmax(0, 1fr) auto auto', alignItems: 'center', gap: '16px', padding: '16px 24px', borderBottom: '1px solid #F0EAE0', cursor: 'pointer' }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500, color: '#12100E' }}>NX-{booking.id}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.005em', color: '#12100E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {booking.pickupAddress} → {booking.dropoffAddress}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6E6A63' }}>
                          {new Date(booking.scheduledDateTime).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' })} · {new Date(booking.scheduledDateTime).toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', color: '#12100E' }}>
                        {booking.price ? `${parseFloat(booking.price).toLocaleString(intlLocale)} F` : '—'}
                      </span>
                      <StatusBadge domain="booking" value={booking.status} audience="client" live={booking.status === 'in_progress'} />
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6E6A63' }}>{t('home.bookingsList.empty')}</p>
                  </div>
                )}
                <div style={{ padding: '16px 24px' }}>
                  <button
                    type="button"
                    onClick={() => goToTab('bookings')}
                    style={{ fontSize: '13px', fontWeight: 600, color: '#12100E', borderBottom: '2px solid #12100E', paddingBottom: '2px', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {t('home.bookingsList.viewHistory')}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {reviewableBookings[0] && (
                  <div
                    onClick={() => { setSelectedBookingForReview(reviewableBookings[0]); setIsReviewModalOpen(true) }}
                    style={{ background: '#12100E', borderRadius: '4px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer' }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#B4643A' }}>{t('home.reviewPrompt.eyebrow')}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#F7F3EC' }}>
                        {reviewableBookings[0].pickupAddress} → {reviewableBookings[0].dropoffAddress}
                      </span>
                      <span style={{ fontSize: '13px', color: '#9a938a', lineHeight: 1.5 }}>
                        {t('home.reviewPrompt.withDriver', { driver: reviewableBookings[0].driver.name })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} style={{ width: '38px', height: '38px', border: '1px solid #3a3631', borderRadius: '3px', display: 'grid', placeItems: 'center' }}>
                          <Star size={17} style={{ color: '#6E6A63' }} />
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ ...cardStyle, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', color: '#12100E' }}>{t('home.quotesCard.title')}</h3>
                    {stats.pendingQuotes > 0 && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B4643A' }}>
                        {t('home.quotesCard.sentBadge', { count: stats.pendingQuotes })}
                      </span>
                    )}
                  </div>
                  {latestQuoteInProgress ? (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#12100E' }}>{latestQuoteInProgress.service}</span>
                        <span style={mono10Muted}>{t('home.quotesCard.requestedOn', { date: new Date(latestQuoteInProgress.createdAt).toLocaleDateString(intlLocale, { day: 'numeric', month: 'long' }), id: latestQuoteInProgress.id })}</span>
                      </div>
                      {latestQuoteInProgress.estimatedPrice && (
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', paddingTop: '14px', borderTop: '1px solid #E2DACD' }}>
                          <span style={mono10Muted}>{t('home.quotesCard.amountLabel')}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '17px', fontWeight: 600, color: '#12100E' }}>
                            {parseFloat(latestQuoteInProgress.estimatedPrice).toLocaleString(intlLocale)} <span style={{ fontSize: '11px', fontWeight: 400, color: '#6E6A63' }}>FCFA</span>
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => goToTab('quotes')}
                        style={{ height: '44px', background: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {t('home.quotesCard.viewQuote')}
                      </button>
                    </>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', color: '#6E6A63' }}>{t('home.quotesCard.emptyDescription')}</p>
                  )}
                </div>

                <div style={{ ...cardStyle, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', color: '#12100E' }}>{t('home.invoicesCard.title')}</h3>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: dueInvoices.length > 0 ? '#B4643A' : '#1F5245' }}>
                      {dueInvoices.length > 0 ? t('home.invoicesCard.due', { count: dueInvoices.length }) : t('home.invoicesCard.noneDue')}
                    </span>
                  </div>
                  {invoices.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#E2DACD', border: '1px solid #E2DACD', borderRadius: '3px', overflow: 'hidden' }}>
                      {invoices.slice(0, 3).map((invoice) => (
                        <div key={invoice.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 14px', background: '#FFFFFF' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500, color: '#12100E' }}>{invoice.invoiceNumber}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', color: '#6E6A63' }}>
                              {new Date(invoice.issueDate).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', fontWeight: 500, color: '#12100E' }}>
                              {parseFloat(invoice.totalAmount).toLocaleString(intlLocale)} F
                            </span>
                            <button
                              type="button"
                              onClick={() => goToTab('invoices')}
                              style={{ width: '34px', height: '34px', background: 'transparent', border: '1px solid #E2DACD', borderRadius: '3px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                            >
                              <DownloadSimple size={15} style={{ color: '#12100E' }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', color: '#6E6A63' }}>{t('home.invoicesCard.empty')}</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        )
      }

      case 'bookings': {
        const filteredClientBookings = bookingsFilter === 'all'
          ? bookings
          : bookings.filter(b => b.status === bookingsFilter)

        return (
          <div className="flex flex-col gap-6">
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ padding: '18px 24px', borderBottom: '1px solid #E2DACD' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#12100E' }}>{t('bookings.title')}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6E6A63' }}>{t('bookings.subtitle')}</p>
                </div>
                <div className="flex gap-3 items-center flex-wrap">
                  <select
                    value={bookingsFilter}
                    onChange={(e) => setBookingsFilter(e.target.value)}
                    className="flex-1 sm:flex-none outline-none"
                    style={{ height: '40px', padding: '0 12px', fontSize: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '3px', color: '#12100E' }}
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
                      type="button"
                      onClick={() => setShowReservationModal(true)}
                      className="flex items-center gap-2"
                      style={{ height: '40px', padding: '0 16px', background: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      <Plus size={14} weight="bold" /> {t('bookings.newBooking')}
                    </button>
                  )}
                </div>
              </div>

              {filteredClientBookings.length > 0 ? (
                <div>
                  {filteredClientBookings.map((booking) => (
                    <div key={booking.id} className="p-4 sm:p-6" style={{ borderBottom: '1px solid #F0EAE0' }}>
                      <div className="flex flex-col gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px', color: '#6E6A63' }}>
                              <ClipboardText size={18} weight="light" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-sm" style={{ color: '#12100E' }}>
                                {t('bookings.bookingNumber')} <span style={{ fontFamily: 'var(--font-mono)' }}>#{booking.id}</span>
                              </h4>
                              <p className="text-xs font-medium uppercase tracking-wider mt-0.5" style={{ color: '#6E6A63' }}>
                                {t('bookings.createdOn')} {new Date(booking.createdAt).toLocaleDateString(intlLocale)}
                              </p>
                            </div>
                            <StatusBadge domain="booking" value={booking.status} audience="client" live={booking.status === 'in_progress'} />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#1F5245' }} />
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6A63' }}>{t('bookings.departure')}</p>
                                <p className="text-sm font-medium line-clamp-1" style={{ color: '#12100E' }}>{booking.pickupAddress}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#B4643A' }} />
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6A63' }}>{t('bookings.arrival')}</p>
                                <p className="text-sm font-medium line-clamp-1" style={{ color: '#12100E' }}>{booking.dropoffAddress}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex flex-wrap gap-4 sm:gap-6">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6A63' }}>{t('bookings.dateTime')}</p>
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <Calendar size={13} style={{ color: '#1F5245' }} />
                                <p className="text-xs sm:text-sm font-semibold" style={{ color: '#12100E' }}>
                                  {new Date(booking.scheduledDateTime).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' })}
                                </p>
                                <Clock size={13} className="ml-0.5" style={{ color: '#1F5245' }} />
                                <p className="text-xs sm:text-sm font-semibold" style={{ color: '#12100E' }}>
                                  {new Date(booking.scheduledDateTime).toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6A63' }}>{t('bookings.amount')}</p>
                              <p className="text-base sm:text-lg font-bold" style={{ color: '#12100E', fontFamily: 'var(--font-mono)' }}>
                                {booking.price ? `${parseFloat(booking.price).toLocaleString(intlLocale)} FCFA` : '---'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {booking.clientResponse === 'pending' && booking.price && parseFloat(booking.price) > 0 && (
                              <button
                                type="button"
                                onClick={() => openPriceModal(booking, 'accept')}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px]"
                                style={{ padding: '0 14px', background: '#1F5245', border: 'none', borderRadius: '4px', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                              >
                                <Wallet size={14} weight="bold" /> {t('bookings.acceptPrice')}
                              </button>
                            )}

                            {hasBookingsUpdatePermission && !['confirmed', 'in_progress', 'completed', 'cancelled'].includes(booking.status) && (
                              <button
                                type="button"
                                onClick={() => { setEditingBooking(booking); setIsEditBookingModalOpen(true) }}
                                className="w-10 h-10 flex items-center justify-center min-h-[44px]"
                                style={{ backgroundColor: '#FFFFFF', color: '#12100E', border: '1px solid #E2DACD', borderRadius: '4px' }}
                                title={t('bookings.edit')}
                              >
                                <PencilSimple size={16} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => { setEditingBooking(booking); setIsEditBookingModalOpen(true) }}
                              className="w-10 h-10 flex items-center justify-center min-h-[44px]"
                              style={{ backgroundColor: '#FFFFFF', color: '#12100E', border: '1px solid #E2DACD', borderRadius: '4px' }}
                              title={t('bookings.viewDetails')}
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {booking.clientResponse === 'pending' && booking.price && parseFloat(booking.price) > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium" style={{ backgroundColor: 'rgba(180,100,58,.10)', color: '#B4643A', borderRadius: '2px' }}>
                            <Clock size={12} /> {t('bookings.priceProposalReceived')}
                          </span>
                        )}
                        {booking.clientResponse === 'accepted' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium" style={{ backgroundColor: 'rgba(31,82,69,.10)', color: '#1F5245', borderRadius: '2px' }}>
                            <CheckCircle size={12} weight="fill" /> {t('bookings.priceAccepted')}
                          </span>
                        )}
                        {booking.clientResponse === 'rejected' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium" style={{ backgroundColor: 'rgba(184,73,60,.10)', color: '#B8493C', borderRadius: '2px' }}>
                            <X size={12} weight="bold" /> {t('bookings.priceRejected')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 px-6">
                  <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '4px' }}>
                    <CalendarBlank size={28} weight="light" style={{ color: '#6E6A63' }} />
                  </div>
                  <h4 className="text-base font-semibold mb-1" style={{ color: '#12100E' }}>{t('bookings.noBookingFound')}</h4>
                  <p className="text-sm max-w-xs mx-auto mb-6" style={{ color: '#6E6A63' }}>
                    {bookingsFilter === 'all' ? t('bookings.noBookingYet') : t('bookings.noBookingWithStatus', { status: t(`bookings.filters.${bookingsFilter === 'in_progress' ? 'inProgress' : bookingsFilter}` as any) })}
                  </p>
                  {hasBookingsCreatePermission && (
                    <button
                      type="button"
                      onClick={() => setShowReservationModal(true)}
                      className="inline-flex items-center gap-2"
                      style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #1F5245', borderRadius: '4px', color: '#1F5245', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      <Plus size={16} weight="bold" /> {t('bookings.bookTrip')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      }

      case 'create-reviews':
        return (
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div className="flex items-center justify-between" style={{ padding: '18px 24px', borderBottom: '1px solid #E2DACD' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#12100E' }}>{t('createReviews.title')}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6E6A63' }}>{t('createReviews.subtitle')}</p>
              </div>
              {stats.reviewableBookings > 0 && (
                <span className="px-2.5 py-1 text-[11px] font-medium" style={{ backgroundColor: 'rgba(180,100,58,.10)', color: '#B4643A', borderRadius: '2px' }}>
                  {t('createReviews.toEvaluate', { count: stats.reviewableBookings })}
                </span>
              )}
            </div>
            <div className="p-5">
              {reviewableBookings.length > 0 ? (
                <div className="space-y-3">
                  {reviewableBookings.map((booking) => (
                    <div key={booking.id} className="p-4" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px' }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 flex items-center justify-center" style={{ backgroundColor: 'rgba(31,82,69,.10)', color: '#1F5245', borderRadius: '3px' }}>
                              <Car size={14} weight="light" />
                            </div>
                            <h4 className="text-sm font-semibold" style={{ color: '#12100E' }}>{t('createReviews.trip')} <span style={{ fontFamily: 'var(--font-mono)' }}>#{booking.id}</span></h4>
                          </div>
                          <p className="text-sm mb-2 font-medium" style={{ color: '#6E6A63' }}>
                            {booking.pickupAddress} <span style={{ color: '#1F5245' }}>→</span> {booking.dropoffAddress}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <p style={mono10Muted}>{t('createReviews.driver')}</p>
                              <p className="font-medium" style={{ color: '#12100E' }}>{booking.driver.name}</p>
                            </div>
                            <div>
                              <p style={mono10Muted}>{t('createReviews.tripDate')}</p>
                              <p className="font-medium" style={{ color: '#6E6A63', fontFamily: 'var(--font-mono)' }}>
                                {new Date(booking.scheduledDateTime).toLocaleDateString(intlLocale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSelectedBookingForReview(booking); setIsReviewModalOpen(true) }}
                          className="flex items-center gap-1.5 shrink-0 ml-3"
                          style={{ padding: '8px 12px', backgroundColor: 'rgba(180,100,58,.10)', color: '#B4643A', border: '1px solid rgba(180,100,58,.25)', borderRadius: '3px', fontSize: '12px', fontWeight: 500 }}
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
                  <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(180,100,58,.10)', borderRadius: '3px' }}>
                    <Star size={20} style={{ color: '#B4643A' }} />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#12100E' }}>{t('createReviews.noTripToEvaluate')}</p>
                  <p className="text-sm mb-4" style={{ color: '#6E6A63' }}>{t('createReviews.allEvaluated')}</p>
                  {hasBookingsCreatePermission && (
                    <button
                      type="button"
                      onClick={() => setShowReservationModal(true)}
                      className="inline-flex items-center gap-2"
                      style={{ padding: '8px 16px', backgroundColor: 'rgba(31,82,69,.10)', color: '#1F5245', border: '1px solid rgba(31,82,69,.2)', borderRadius: '4px', fontSize: '13px', fontWeight: 500 }}
                    >
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
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2DACD' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#12100E' }}>{t('reviews.title')}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6E6A63' }}>{t('reviews.subtitle')}</p>
            </div>
            <div className="p-5">
              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold" style={{ color: '#12100E' }}>{t('reviews.booking')} <span style={{ fontFamily: 'var(--font-mono)' }}>#{review.bookingId}</span></h4>
                          {review.booking && (
                            <p className="text-sm mt-0.5 font-medium" style={{ color: '#6E6A63' }}>
                              {getSafeTextContent(review.booking.pickupAddress)} <span style={{ color: '#1F5245' }}>→</span> {getSafeTextContent(review.booking.dropoffAddress)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                          <span className="text-xs ml-1 font-semibold" style={{ color: '#6E6A63', fontFamily: 'var(--font-mono)' }}>({review.rating}/5)</span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm mb-2 font-medium" style={{ color: '#3d3a35' }}>{getSafeTextContent(review.comment)}</p>
                      )}
                      <p className="text-xs font-medium" style={{ color: '#6E6A63', fontFamily: 'var(--font-mono)' }}>
                        {t('reviews.publishedOn')} {new Date(review.createdAt).toLocaleDateString(intlLocale)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm font-semibold" style={{ color: '#12100E' }}>{t('reviews.noReviewYet')}</p>
                  <p className="text-sm mt-1" style={{ color: '#6E6A63' }}>{t('reviews.willBeAbleToEvaluate')}</p>
                </div>
              )}
            </div>
          </div>
        )

      case 'profile':
        return (
          <div className="flex flex-col gap-6">
            <div style={{ ...cardStyle, padding: '24px 20px' }} className="sm:!p-10">
              <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-10">
                <div className="relative group shrink-0">
                  <div className="relative w-28 h-28 border-2 p-1 overflow-hidden" style={{ borderColor: '#1F5245', backgroundColor: '#F7F3EC', borderRadius: '4px' }}>
                    {(() => {
                      const safeImageUrl = getSafeProfileImageUrl(userProfile?.image)
                      const safeAltText = getSafeTextForAttribute(userProfile?.name) || 'Profile'
                      return safeImageUrl ? (() => {
                        // snyk:ignore[javascript/DOMXSS] - URL validated by getSafeProfileImageUrl() which enforces http/https and rejects private IPs
                        const validatedSrc: string = safeImageUrl;
                        return (
                          <img src={/* snyk:ignore[javascript/DOMXSS] */validatedSrc} alt={safeAltText} className="w-full h-full object-cover" style={{ borderRadius: '3px' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        );
                      })() : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: 'rgba(31,82,69,.10)', color: '#1F5245' }}>
                          {userProfile?.name?.slice(0, 2).toUpperCase()}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                      <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#12100E' }}>{userProfile?.name}</h2>
                      {userProfile?.isCompany && (
                        <span className="px-2.5 py-1 font-mono text-[10px] font-bold uppercase" style={{ backgroundColor: 'rgba(31,82,69,.10)', color: '#1F5245', border: '1px solid rgba(31,82,69,.25)', borderRadius: '2px', letterSpacing: '0.14em' }}>
                          {t('profile.businessAccount')}
                        </span>
                      )}
                    </div>
                    <p className="flex items-center justify-center md:justify-start gap-2 text-sm font-medium" style={{ color: '#6E6A63' }}>
                      <Envelope size={16} weight="duotone" /> {userProfile?.email}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditProfileModalOpen(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 min-h-[44px]"
                      style={{ padding: '0 20px', backgroundColor: '#1F5245', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: '13px' }}
                    >
                      <PencilSimple size={16} weight="bold" /> {t('profile.editProfile')}
                    </button>
                    <button
                      type="button"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 min-h-[44px]"
                      style={{ padding: '0 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', color: '#12100E', borderRadius: '4px', fontWeight: 600, fontSize: '13px' }}
                    >
                      <IdentificationCard size={16} /> {t('profile.viewCard')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div style={{ ...cardStyle, padding: '24px' }} className="space-y-6">
                  <div className="flex items-center gap-3" style={{ color: '#12100E' }}>
                    <IdentificationCard size={20} weight="bold" />
                    <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{t('profile.accountDetails')}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p style={mono10Muted}>{t('profile.phoneNumber')}</p>
                      <p className="font-medium flex items-center gap-2" style={{ color: '#12100E' }}>
                        <Phone size={16} style={{ color: '#1F5245' }} /> {userProfile?.phone || t('profile.notProvided')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p style={mono10Muted}>{t('profile.residenceAddress')}</p>
                      <p className="font-medium flex items-center gap-2 line-clamp-1" style={{ color: '#12100E' }}>
                        <MapPin size={16} style={{ color: '#1F5245' }} /> {userProfile?.address || "Dakar, Sénégal"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p style={mono10Muted}>{t('profile.memberSince')}</p>
                      <p className="font-medium flex items-center gap-2" style={{ color: '#12100E' }}>
                        <CalendarBlank size={16} style={{ color: '#1F5245' }} /> {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString(intlLocale, { day: 'numeric', month: 'long', year: 'numeric' }) : "---"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p style={mono10Muted}>{t('profile.accountStatus')}</p>
                      <p className="font-medium flex items-center gap-2" style={{ color: '#12100E' }}>
                        <CheckCircle size={16} style={{ color: '#1F5245' }} weight="fill" /> {t('profile.verifiedActive')}
                      </p>
                    </div>
                  </div>
                </div>

                {userProfile?.isCompany ? (
                  <div style={{ backgroundColor: 'rgba(31,82,69,.06)', border: '1px solid rgba(31,82,69,.25)', borderRadius: '4px', padding: '24px' }} className="space-y-8 relative overflow-hidden">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3" style={{ color: '#1F5245' }}>
                        <Buildings size={20} weight="bold" />
                        <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{t('profile.companyInfo')}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push('/entreprise/dashboard')}
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: '#1F5245', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {t('profile.accessEnterpriseSpace')}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative">
                      <div className="space-y-1">
                        <p style={mono10Muted}>{t('profile.companyName')}</p>
                        <p className="text-lg font-bold" style={{ color: '#12100E' }}>{userProfile.companyName || t('profile.notProvided')}</p>
                      </div>
                      <div className="space-y-1">
                        <p style={mono10Muted}>{t('profile.ninea')}</p>
                        <p className="font-mono font-medium tracking-wider" style={{ color: '#12100E' }}>{userProfile.ninea || t('profile.notProvided')}</p>
                      </div>
                      <div className="space-y-1">
                        <p style={mono10Muted}>{t('profile.raisonSociale')}</p>
                        <p className="font-medium" style={{ color: '#12100E' }}>{userProfile.raisonSociale || t('profile.notProvided')}</p>
                      </div>
                      <div className="space-y-1">
                        <p style={mono10Muted}>{t('profile.poBox')}</p>
                        <p className="font-medium" style={{ color: '#12100E' }}>{userProfile.bp || t('profile.none')}</p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <p style={mono10Muted}>{t('profile.headOffice')}</p>
                        <p className="font-medium flex items-center gap-2" style={{ color: '#12100E' }}>
                          <MapPin size={16} style={{ color: '#1F5245' }} /> {userProfile.companyAddress || t('profile.notSpecified')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p style={mono10Muted}>{t('profile.companyPhone')}</p>
                        <p className="font-medium flex items-center gap-2" style={{ color: '#12100E' }}>
                          <Phone size={16} style={{ color: '#1F5245' }} /> {userProfile.companyPhone || t('profile.notProvided')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#F7F3EC', border: '1px dashed #E2DACD', borderRadius: '4px', padding: '32px' }} className="flex flex-col items-center justify-center text-center">
                    <Buildings size={36} weight="thin" style={{ color: '#6E6A63' }} className="mb-4" />
                    <h4 className="text-sm font-bold" style={{ color: '#12100E' }}>{t('profile.becomeCompany')}</h4>
                    <p className="text-xs mt-1 max-w-xs" style={{ color: '#6E6A63' }}>
                      {t('profile.activateCompanyHint')}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsEditProfileModalOpen(true)}
                      className="mt-6 text-xs font-bold uppercase tracking-widest"
                      style={{ padding: '8px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', color: '#12100E', borderRadius: '4px' }}
                    >
                      {t('profile.switchToPro')}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div style={{ ...cardStyle, padding: '20px' }} className="space-y-6">
                  <h5 style={mono10Muted}>{t('profile.activitySummary')}</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px' }}>
                      <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: '#12100E' }}>{stats.totalBookings}</p>
                      <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: '#6E6A63' }}>{t('profile.trips')}</p>
                    </div>
                    <div className="p-4" style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px' }}>
                      <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: '#1F5245' }}>{stats.completedBookings}</p>
                      <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: '#6E6A63' }}>{t('profile.successful')}</p>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(31,82,69,.06)', border: '1px solid rgba(31,82,69,.25)', borderRadius: '4px', padding: '20px' }} className="space-y-4">
                  <div className="flex items-center gap-2" style={{ color: '#12100E' }}>
                    <CheckCircle size={18} weight="fill" style={{ color: '#1F5245' }} />
                    <h5 style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{t('profile.trustSecurity')}</h5>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs p-3" style={{ backgroundColor: '#FFFFFF', borderRadius: '3px' }}>
                      <span style={{ color: '#6E6A63' }}>{t('profile.emailVerified')}</span>
                      <span className="font-bold" style={{ color: '#1F5245' }}>{t('profile.yes')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-3" style={{ backgroundColor: '#FFFFFF', borderRadius: '3px' }}>
                      <span style={{ color: '#6E6A63' }}>{t('profile.twoFactor')}</span>
                      <span style={{ color: '#6E6A63' }}>{t('profile.notActive')}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full py-3 text-[10px] font-bold uppercase tracking-widest mt-2"
                    style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', color: '#6E6A63', borderRadius: '4px' }}
                  >
                    {t('profile.changePassword')}
                  </button>
                </div>

                <div style={{ ...cardStyle, padding: '20px' }} className="flex flex-col items-center gap-4 py-8">
                  <div className="w-14 h-14 flex items-center justify-center" style={{ backgroundColor: '#F7F3EC', borderRadius: '4px' }}>
                    <IdentificationCard size={28} weight="thin" style={{ color: '#6E6A63' }} />
                  </div>
                  <div className="text-center">
                    <p style={mono10Muted}>{t('profile.uniqueClientId')}</p>
                    <p className="text-xs font-mono select-all cursor-pointer mt-1" style={{ color: '#6E6A63' }}>
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
        <div className="fixed inset-0 z-[80] flex flex-col" style={{ backgroundColor: '#F7F3EC' }}>
          <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #E2DACD', backgroundColor: '#FFFFFF' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center" style={{ backgroundColor: 'rgba(31,82,69,.10)', color: '#1F5245', borderRadius: '3px' }}>
                <CalendarBlank size={16} weight="duotone" />
              </div>
              <h2 className="text-base font-bold" style={{ color: '#12100E' }}>{t('reservationModal.title')}</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowReservationModal(false)}
              className="w-9 h-9 flex items-center justify-center"
              style={{ color: '#6E6A63', border: '1px solid #E2DACD', borderRadius: '3px' }}
            >
              <X size={18} weight="bold" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#E2DACD', borderTopColor: '#1F5245' }} /></div>}>
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
          initialMode={priceApprovalInitialMode}
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#6E6A63' }}>{t('loadingSpace')}</p>
      </div>
    }>
      <ClientDashboardContent />
    </Suspense>
  )
}
