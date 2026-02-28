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
import { TripStatusBadge } from "@/components/client/TripStatusBadge"
import { SquaresFour, CalendarBlank, FileText, Receipt, Star, ChatCircle, Car, Users, SignOut, Bell, Plus, MapPin, Clock, AirplaneTakeoff, Eye, Phone, Wallet, Calendar, UserCircle, ClipboardText, CaretRight, NavigationArrow, DownloadSimple, PencilSimple, Trash, List, CreditCard, X } from "@phosphor-icons/react"

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
      <Star key={i} weight={i < rating ? "fill" : "regular"} className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} />
    ))
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Hero Greeting */}
            <div className="client-card-enter relative rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #111E1A 0%, var(--color-client-card) 60%)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, var(--color-client-accent), transparent)' }} />
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] mb-1" style={{ color: 'var(--color-client-accent)' }}>
                      {new Date().getHours() < 12 ? 'Bonjour' : new Date().getHours() < 18 ? 'Bon après-midi' : 'Bonsoir'}
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {session?.user?.name || 'Bienvenue'}
                    </h1>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--color-text-muted)' }}>En attente</p>
                      <p className="text-xl font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-client-accent)' }}>{stats.pendingBookings}</p>
                    </div>
                    <Link href="/reservation"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{ backgroundColor: 'var(--color-client-accent)', color: '#000' }}>
                      <Plus size={15} weight="bold" /> Nouveau trajet
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Réservations', value: stats.totalBookings, icon: <CalendarBlank size={16} weight="light" />, color: 'var(--color-client-accent)' },
                { label: 'Terminées', value: stats.completedBookings, icon: <MapPin size={16} weight="light" />, color: '#10B981' },
                { label: 'En Attente', value: stats.pendingBookings, icon: <Clock size={16} weight="light" />, color: '#F59E0B' },
                { label: 'Total Devis', value: stats.totalQuotes, icon: <FileText size={16} weight="light" />, color: '#8B5CF6' },
              ].map((stat, i) => (
                <div key={i} className="client-card-enter group p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                  style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: stat.color }} />
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${stat.color}18`, color: stat.color }}>
                    {stat.icon}
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.08em] mb-1" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</p>
                  <h3 className="text-xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{stat.value}</h3>
                </div>
              ))}
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="client-card-enter rounded-2xl p-5 flex items-center justify-between"
                style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>Note Moyenne</p>
                  <div className="flex items-center gap-2 mt-1">
                    <h3 className="text-xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
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
                  <p className="text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>Trajets à Évaluer</p>
                  <h3 className="text-xl font-bold mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-client-accent)' }}>{stats.reviewableBookings}</h3>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
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
                  <p className="text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>Mes Avis</p>
                  <h3 className="text-xl font-bold mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{stats.totalReviews}</h3>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Avis publiés</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                  <ChatCircle size={18} weight="light" />
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="client-card-enter rounded-2xl overflow-hidden"
              style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Réservations récentes</h3>
                <button onClick={() => setActiveTab('bookings')} className="text-xs transition-colors" style={{ color: 'var(--color-client-accent)' }}>
                  Voir tout →
                </button>
              </div>

              {bookings.slice(0, 5).length > 0 ? (
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center gap-4 px-6 py-4 transition-colors duration-150 hover:bg-white/[0.02]">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: booking.status === 'in_progress' ? 'var(--color-trip-inprogress-bg)' : booking.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)', color: booking.status === 'in_progress' ? 'var(--color-trip-inprogress)' : booking.status === 'pending' ? '#F59E0B' : '#6B7280' }}>
                        <MapPin size={16} weight="light" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {booking.pickupAddress?.substring(0, 30)}{booking.pickupAddress?.length > 30 ? '...' : ''}
                          <span style={{ color: 'var(--color-text-muted)', margin: '0 6px' }}>→</span>
                          {booking.dropoffAddress?.substring(0, 30)}{booking.dropoffAddress?.length > 30 ? '...' : ''}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(booking.scheduledDateTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}, {new Date(booking.scheduledDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <TripStatusBadge statut={booking.status} />
                      <p className="text-sm shrink-0 hidden sm:block" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                        {booking.price ? `${parseFloat(booking.price).toLocaleString('fr-FR')} FCFA` : 'N/A'}
                      </p>
                      <button
                        onClick={() => { setEditingBooking(booking); setIsEditBookingModalOpen(true) }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0"
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--color-text-muted)' }}>
                        <Eye size={14} weight="regular" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <Calendar size={20} weight="light" style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>Aucune réservation récente</p>
                  <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>Commencez par réserver votre premier trajet.</p>
                  <Link href="/reservation" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    Réserver un trajet
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
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
            <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Mes réservations</h3>
                <div className="flex gap-2 items-center flex-wrap">
                  <select
                    value={bookingsFilter}
                    onChange={(e) => setBookingsFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-text-primary)' }}
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
                              <Wallet weight="light" /> Répondre
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
                              <PencilSimple size={14} weight="light" className="inline mr-1" /> Modifier
                            </button>
                          )}
                          {hasBookingsDeletePermission && (
                            <button
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                              title="Supprimer la réservation"
                            >
                              <Trash size={14} weight="light" />
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
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Trajets à évaluer</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Évaluez vos trajets terminés</p>
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
                    <div key={booking.id} className="rounded-xl p-4 transition-all hover:bg-white/[0.02]" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-client-border)' }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)' }}>
                              <Car size={14} weight="light" />
                            </div>
                            <h4 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Trajet <span style={{ fontFamily: 'var(--font-mono)' }}>#{booking.id}</span></h4>
                          </div>
                          <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                            {booking.pickupAddress} <span style={{ color: 'var(--color-text-muted)' }}>→</span> {booking.dropoffAddress}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>Chauffeur</p>
                              <p style={{ color: 'var(--color-text-secondary)' }}>{booking.driver.name}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>Date du trajet</p>
                              <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
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
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>Aucun trajet à évaluer</p>
                  <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>Vous avez évalué tous vos trajets terminés !</p>
                  {hasBookingsCreatePermission && (
                    <Link href="/reservation" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                      style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)', border: '1px solid rgba(16,185,129,0.2)' }}>
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
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
            <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Mes avis publiés</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Avis que vous avez donnés sur vos trajets</p>
            </div>
            <div className="p-5">
              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-client-border)' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Réservation <span style={{ fontFamily: 'var(--font-mono)' }}>#{review.bookingId}</span></h4>
                          {review.booking && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                              {review.booking.pickupAddress} <span style={{ color: 'var(--color-text-muted)' }}>→</span> {review.booking.dropoffAddress}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                          <span className="text-xs ml-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>({review.rating}/5)</span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>{review.comment}</p>
                      )}
                      <p className="text-[10px]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Publié le {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Aucun avis donné pour le moment</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Vous pourrez évaluer vos trajets une fois qu&apos;ils seront terminés</p>
                </div>
              )}
            </div>
          </div>
        )

      case 'profile':
        return (
          <div className="space-y-5">
            {/* Informations Personnelles */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
              <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                    <UserCircle size={15} weight="light" style={{ color: 'var(--color-client-accent)' }} /> Mon profil
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Gérez vos informations personnelles</p>
                </div>
                <button onClick={() => setIsEditProfileModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                  style={{ backgroundColor: 'var(--color-client-accent)', color: '#000' }}>
                  <PencilSimple size={12} weight="bold" /> Modifier
                </button>
              </div>
              <div className="p-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.08em] mb-1" style={{ color: 'var(--color-text-muted)' }}>Nom complet</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {userProfile?.name || session?.user?.name || "Non renseigné"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.08em] mb-1" style={{ color: 'var(--color-text-muted)' }}>Adresse email</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {userProfile?.email || session?.user?.email || "Non renseigné"}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)' }}>
                          ✓ Vérifié
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.08em] mb-1" style={{ color: 'var(--color-text-muted)' }}>Téléphone</p>
                      <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {userProfile?.phone || "Non renseigné"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.08em] mb-1" style={{ color: 'var(--color-text-muted)' }}>Photo de profil</p>
                      <UniversalProfilePhotoUpload
                        currentImage={session?.user?.image || undefined}
                        onImageUpdate={(imageUrl) => { console.log('✅ Photo mise à jour:', imageUrl) }}
                        onSuccess={(message) => { console.log('✅ Photo mise à jour:', message) }}
                        onError={(error) => { console.error('❌ Erreur upload:', error) }}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.08em] mb-1" style={{ color: 'var(--color-text-muted)' }}>Rôle</p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                          style={{ backgroundColor: 'var(--color-client-accent-bg)', color: 'var(--color-client-accent)' }}>
                          <UserCircle size={11} weight="fill" /> Client
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.08em] mb-1" style={{ color: 'var(--color-text-muted)' }}>Membre depuis</p>
                      <p className="text-sm" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {userProfile?.createdAt ?
                          new Date(userProfile.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) :
                          "Information non disponible"
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.08em] mb-1" style={{ color: 'var(--color-text-muted)' }}>ID Client</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {userProfile?.id?.slice(0, 8) || (session?.user as unknown as { id?: string })?.id?.slice(0, 8) || "N/A"}...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activité */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
              <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                  <ClipboardText size={15} weight="light" style={{ color: 'var(--color-client-accent)' }} /> Mon activité
                </h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Réservations', value: stats.totalBookings, color: 'var(--color-client-accent)' },
                    { label: 'Terminées', value: stats.completedBookings, color: '#10B981' },
                    { label: 'Avis donnés', value: stats.totalReviews, color: '#8B5CF6' },
                    { label: 'Note moy.', value: stats.averageRating.toFixed(1), color: '#F59E0B' },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-client-border)' }}>
                      <div className="text-lg font-bold" style={{ fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
                      <div className="text-[10px] uppercase tracking-[0.08em] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sécurité */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
              <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                  <Eye size={15} weight="light" style={{ color: 'var(--color-client-accent)' }} /> Sécurité du compte
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-client-border)' }}>
                  <div>
                    <h4 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Mot de passe</h4>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Dernière modification il y a plus de 30 jours</p>
                  </div>
                  <button className="text-xs font-medium" style={{ color: 'var(--color-client-accent)' }}>Changer</button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--color-client-accent-bg)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div>
                    <h4 className="text-sm font-medium" style={{ color: 'var(--color-client-accent)' }}>Email vérifié</h4>
                    <p className="text-xs" style={{ color: 'var(--color-client-accent-light)' }}>Votre adresse email est confirmée</p>
                  </div>
                  <span className="text-lg" style={{ color: 'var(--color-client-accent)' }}>✓</span>
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
      <aside className="hidden md:flex flex-col w-64 shadow-2xl z-20 fixed left-0 top-0 h-screen overflow-y-auto" style={{ backgroundColor: '#090D12', borderRight: '1px solid var(--color-client-border)' }}>
        {/* Logo Area */}
        <div className="h-24 flex items-center px-6 mb-2">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#090D12] font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform group-hover:scale-105">
              NX
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-tight">NAVETTE</span>
              <span className="text-[10px] font-medium tracking-[0.2em] text-[#10B981] leading-tight">XPRESS</span>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="px-5 mb-8">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#10B981] p-0.5 overflow-hidden">
                {session?.user?.image ? (
                  <img src={session.user.image} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs font-bold text-[#10B981]">
                    {session?.user?.name?.slice(0, 2).toUpperCase() || 'CX'}
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">{session?.user?.name || 'Client'}</span>
                <span className="text-[10px] text-gray-500 font-medium">Membre Premium</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#10B981]">
              <span className="w-1 h-1 rounded-full bg-[#10B981] animate-pulse"></span>
              En ligne
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          <div className="px-4 mb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Navigation</div>
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: SquaresFour },
            { id: 'bookings', label: 'Mes Réservations', icon: CalendarBlank },
            { id: 'quotes', label: 'Mes Devis', icon: FileText },
            { id: 'invoices', label: 'Mes Factures', icon: CreditCard },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${activeTab === item.id
                ? 'bg-[#10B981]/10 text-white border-l-2 border-[#10B981]'
                : 'text-gray-500 hover:bg-white/[0.02] hover:text-gray-300 border-l-2 border-transparent'
                }`}
            >
              <item.icon size={18} weight={activeTab === item.id ? "fill" : "light"} className={activeTab === item.id ? 'text-[#10B981]' : 'group-hover:text-gray-300'} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}

          <div className="px-4 mt-6 mb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Expérience</div>
          <button
            onClick={() => setActiveTab('create-reviews')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${activeTab === 'create-reviews'
              ? 'bg-[#10B981]/10 text-white border-l-2 border-[#10B981]'
              : 'text-gray-500 hover:bg-white/[0.02] hover:text-gray-300 border-l-2 border-transparent'
              }`}
          >
            <Star size={18} weight={activeTab === 'create-reviews' ? "fill" : "light"} className={activeTab === 'create-reviews' ? 'text-[#10B981]' : 'group-hover:text-gray-300'} />
            <span className="flex-1 text-left text-sm font-medium">Évaluer trajets</span>
            {stats.reviewableBookings > 0 && (
              <span className="bg-[#10B981] text-black text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {stats.reviewableBookings}
              </span>
            )}
          </button>

          {canManageReviews && (
            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${activeTab === 'reviews'
                ? 'bg-[#10B981]/10 text-white border-l-2 border-[#10B981]'
                : 'text-gray-500 hover:bg-white/[0.02] hover:text-gray-300 border-l-2 border-transparent'
                }`}
            >
              <ChatCircle size={18} weight={activeTab === 'reviews' ? "fill" : "light"} className={activeTab === 'reviews' ? 'text-[#10B981]' : 'group-hover:text-gray-300'} />
              <span className="text-sm font-medium">Mes avis</span>
            </button>
          )}

          {(canManageVehicles || canManageUsers) && (
            <>
              <div className="px-4 mt-6 mb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Gestion</div>
              {canManageVehicles && (
                <button
                  onClick={() => setActiveTab('vehicles')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${activeTab === 'vehicles'
                    ? 'bg-[#10B981]/10 text-white border-l-2 border-[#10B981]'
                    : 'text-gray-500 hover:bg-white/[0.02] hover:text-gray-300 border-l-2 border-transparent'
                    }`}
                >
                  <Car size={18} weight={activeTab === 'vehicles' ? "fill" : "light"} className={activeTab === 'vehicles' ? 'text-[#10B981]' : 'group-hover:text-gray-300'} />
                  <span className="text-sm font-medium">Véhicules</span>
                </button>
              )}
              {canManageUsers && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${activeTab === 'users'
                    ? 'bg-[#10B981]/10 text-white border-l-2 border-[#10B981]'
                    : 'text-gray-500 hover:bg-white/[0.02] hover:text-gray-300 border-l-2 border-transparent'
                    }`}
                >
                  <Users size={18} weight={activeTab === 'users' ? "fill" : "light"} className={activeTab === 'users' ? 'text-[#10B981]' : 'group-hover:text-gray-300'} />
                  <span className="text-sm font-medium">Utilisateurs</span>
                </button>
              )}
            </>
          )}
        </nav>

        {/* CTA Sidebar */}
        <div className="p-4 mt-4">
          <Link href="/reservation" className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-black font-bold text-sm shadow-[0_4px_20_rgba(16,185,129,0.2)] transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <Plus size={16} weight="bold" /> Réserver un trajet
          </Link>
        </div>

        {/* Footer Sidebar */}
        <div className="p-4 mt-auto border-t border-white/5">
          <button
            onClick={async () => { await signOut({ callbackUrl: '/', redirect: true }) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
          >
            <SignOut size={18} weight="light" />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">

        {/* TOP HEADER */}
        <header className="h-20 flex items-center justify-between px-4 md:px-8 z-10 sticky top-0" style={{ backgroundColor: '#0B0F14', borderBottom: '1px solid var(--color-client-border)' }}>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-gray-400"
          >
            {mobileMenuOpen ? <X size={20} weight="light" /> : <List size={20} weight="light" />}
          </button>

          {/* Dynamic Greeting */}
          <div className="hidden md:block">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {new Date().getHours() < 12 ? 'Bonjour' : new Date().getHours() < 18 ? 'Bon après-midi' : 'Bonsoir'}, <span style={{ color: 'var(--color-client-accent)' }}>{session?.user?.name?.split(' ')[0] || 'Voyageur'}</span>
            </h2>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-[0.15em]">Où allons-nous aujourd'hui ?</p>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 md:gap-5">
            <button className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:text-[#10B981] transition group" title="Notifications">
              <Bell size={20} weight="light" className="group-hover:scale-110 transition-transform" />
              {stats.reviewableBookings > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#10B981] rounded-full ring-[3px] ring-[#0B0F14]"></span>
              )}
            </button>

            {/* CTA Header mobile only or secondary */}
            <Link
              href="/reservation"
              className="px-4 py-2.5 rounded-xl bg-[#E5C16C] text-black font-bold text-xs shadow-lg hover:shadow-[#E5C16C]/10 transition-all active:scale-95"
            >
              Réserver
            </Link>
          </div>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden overflow-hidden transition-all duration-300" style={{ backgroundColor: '#090D12', borderBottom: '1px solid var(--color-client-border)' }}>
            <nav className="px-4 py-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = {
                  overview: SquaresFour,
                  bookings: CalendarBlank,
                  quotes: FileText,
                  invoices: CreditCard,
                  'create-reviews': Star,
                  reviews: ChatCircle,
                  profile: UserCircle,
                  vehicles: Car,
                  users: Users
                }[tab.id] || SquaresFour;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === tab.id
                      ? 'bg-[#10B981]/10 text-[#10B981]'
                      : 'text-gray-400 hover:bg-white/5'
                      }`}
                  >
                    <Icon size={20} weight={activeTab === tab.id ? "fill" : "light"} />
                    <span className="flex-1 text-left text-sm">{tab.label}</span>
                    {tab.badge && (
                      <span className="bg-[#10B981] text-black text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* DASHBOARD CONTENT SCROLLABLE */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 noise-bg" style={{ backgroundColor: 'var(--color-client-bg)' }}>
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-bg)' }}>
        <div className="text-center">
          <div className="flex flex-col items-center gap-4">
  <div className="text-xl sm:text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold animate-pulse"
       style={{ backgroundImage: 'linear-gradient(to right, var(--color-gold), #ffffff, var(--color-gold))', textTransform: 'uppercase' }}>
    Navette Xpress
  </div>
</div>
          <p className="mt-4 text-xs font-medium uppercase tracking-widest text-gray-500">Chargement de votre espace...</p>
        </div>
      </div>
    }>
      <ClientDashboardContent />
    </Suspense>
  )
}







