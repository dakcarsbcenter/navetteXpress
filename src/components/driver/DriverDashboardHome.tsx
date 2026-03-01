"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Session } from 'next-auth'
import { CancelBookingModal } from './CancelBookingModal'
import { MissionStatusBadge } from './MissionStatusBadge'
import {
  CheckCircle,
  Money as Banknote,
  RoadHorizon as Route,
  Star,
  NavigationArrow,
  Clock,
  Users,
  Car,
  Phone,
  ChatCircle,
  Play,
  CaretRight
} from "@phosphor-icons/react"

interface Stats {
  weeklyRides: number
  hoursWorked: number
  earnings: number
  rating: number
  ridesGrowth: number
  hoursGrowth: number
  earningsGrowth: number
}

interface BookingData {
  id: number
  customerName: string
  customerPhone: string
  pickupAddress: string
  dropoffAddress: string
  scheduledDateTime: string
  status: string
  price: string | number
  cancellationReason?: string
  cancelledBy?: string
  cancelledAt?: string
  vehicle?: {
    make: string
    model: string
    licensePlate: string
    color: string
  }
}

interface APIResponse {
  success: boolean
  data: Array<{
    booking: BookingData
    vehicle: any
  }>
}

interface DriverDashboardHomeProps {
  onNavigate: (view: 'planning' | 'vehicle-report' | 'stats' | 'profile') => void
  hasPermission?: (resource: string, action: string) => boolean
  permissionsLoading?: boolean
}

// Fonction pour formater la date
const formatGreeting = () => {
  const now = new Date()
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

  const dayName = dayNames[now.getDay()]
  const day = now.getDate()
  const month = monthNames[now.getMonth()]
  const year = now.getFullYear()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  return {
    greeting: `${dayName} ${day} ${month} ${year}`,
    time: `${hours}:${minutes}`
  }
}

// Validate and sanitize phone numbers to prevent injection attacks
const isValidPhoneNumber = (phone: string | null | undefined): boolean => {
  if (!phone || typeof phone !== 'string') return false
  // Only allow digits, spaces, dashes, parentheses, and plus sign
  // Prevent javascript:, data:, and other protocols
  return /^[+\d\s()\-]{7,20}$/.test(phone) && !phone.toLowerCase().includes('javascript:') && !phone.toLowerCase().includes('data:')
}

// Sanitize phone for tel: and URL usage
const sanitizePhoneNumber = (phone: string | null | undefined): string => {
  if (!isValidPhoneNumber(phone)) return ''
  // Remove all non-digit characters except the leading +
  return (phone || '').replace(/[^+\d]/g, '')
}

// Safe URL builders for phone-based links
const getSafePhoneUrl = (phone: string | null | undefined): string => {
  if (!isValidPhoneNumber(phone)) return '#'
  const sanitized = sanitizePhoneNumber(phone)
  return sanitized ? `tel:${sanitized}` : '#'
}

const getSafeWhatsAppUrl = (phone: string | null | undefined): string => {
  if (!isValidPhoneNumber(phone)) return '#'
  const sanitized = sanitizePhoneNumber(phone)
  return sanitized ? `https://wa.me/${sanitized}` : '#'
}

export function DriverDashboardHome({ onNavigate, hasPermission, permissionsLoading }: DriverDashboardHomeProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState(formatGreeting())

  const [bookings, setBookings] = useState<BookingData[]>([])
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // États pour la modal d'annulation
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<BookingData | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // États pour le filtrage
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('pending')

  const [stats, setStats] = useState<Stats>({
    weeklyRides: 0,
    hoursWorked: 0,
    earnings: 0,
    rating: 4.9,
    ridesGrowth: 0,
    hoursGrowth: 0,
    earningsGrowth: 0,
  })

  // Récupérer les réservations du chauffeur
  useEffect(() => {
    if (session?.user && 'role' in session.user && session.user.role === 'driver') {
      fetchDriverBookings()
    }
  }, [session])

  const fetchDriverBookings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/driver/bookings')

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des réservations')
      }

      const data: APIResponse = await response.json()

      if (data.success && data.data) {
        // Transformer les données pour l'affichage
        const transformedBookings: BookingData[] = data.data.map(item => ({
          id: item.booking.id,
          customerName: item.booking.customerName,
          customerPhone: item.booking.customerPhone,
          pickupAddress: item.booking.pickupAddress,
          dropoffAddress: item.booking.dropoffAddress,
          scheduledDateTime: item.booking.scheduledDateTime,
          status: item.booking.status,
          price: item.booking.price || 0,
          vehicle: item.vehicle ? {
            make: item.vehicle.make,
            model: item.vehicle.model,
            licensePlate: item.vehicle.licensePlate,
            color: item.vehicle.color,
          } : undefined
        }))

        setBookings(transformedBookings)

        // Calculer les statistiques basées sur les données réelles
        const totalEarnings = transformedBookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (typeof b.price === 'string' ? parseFloat(b.price) : b.price), 0)

        setStats(prev => ({
          ...prev,
          weeklyRides: transformedBookings.length,
          earnings: totalEarnings,
        }))
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour formater la date/heure
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTimeOnly = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'assigned': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'completed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return 'En cours'
      case 'confirmed': return 'Confirmé'
      case 'assigned': return 'Assigné'
      case 'completed': return 'Terminé'
      case 'cancelled': return 'Annulé'
      default: return status
    }
  }

  // Fonction pour mettre à jour le statut d'une réservation
  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/driver/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour')
      }

      // Mettre à jour l'état local
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: newStatus }
            : booking
        )
      )

      // Fermer la modal si elle est ouverte
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus })
      }

      return { success: true }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
    }
  }

  // Fonction pour mettre à jour le statut avec motif d'annulation
  const updateBookingStatusWithReason = async (bookingId: number, newStatus: string, cancellationReason?: string) => {
    try {
      const response = await fetch(`/api/driver/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          cancellationReason: cancellationReason
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour')
      }

      // Mettre à jour l'état local
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: newStatus, cancellationReason }
            : booking
        )
      )

      // Fermer la modal si elle est ouverte
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus, cancellationReason })
      }

      return { success: true }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
    }
  }

  const handleViewDetails = (ride: BookingData) => {
    setSelectedBooking(ride)
    setIsModalOpen(true)
  }

  const handleCallClient = (phone: string) => {
    const safeUrl = getSafePhoneUrl(phone)
    if (safeUrl !== '#') {
      window.location.href = safeUrl
    }
  }

  // Fonctions pour la modal d'annulation
  const openCancelModal = (booking: BookingData) => {
    setBookingToCancel(booking)
    setIsCancelModalOpen(true)
  }

  const closeCancelModal = () => {
    setIsCancelModalOpen(false)
    setBookingToCancel(null)
  }

  const handleCancelConfirm = async (reason: string) => {
    if (!bookingToCancel) return

    setIsCancelling(true)
    try {
      const result = await updateBookingStatusWithReason(bookingToCancel.id, 'cancelled', reason)
      if (result.success) {
        closeCancelModal()
        if (selectedBooking && selectedBooking.id === bookingToCancel.id) {
          setIsModalOpen(false)
          setSelectedBooking(null)
        }
      } else {
        alert('Erreur: ' + result.error)
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error)
      alert('Erreur lors de l\'annulation de la réservation')
    } finally {
      setIsCancelling(false)
    }
  }

  // Mettre à jour l'heure chaque minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(formatGreeting())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Dériver missionActive et prochaineMission
  const missionActive = bookings.find(b => b.status === 'in_progress')
  const prochaineMission = bookings.find(b => b.status === 'assigned' || b.status === 'confirmed')
  const missionsAVenir = bookings.filter(b => b.status === 'assigned' || b.status === 'confirmed').slice(0, 5)
  const historique = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled').slice(0, 5)

  // Mock isOnline state (devrait ideally venir de la session ou d'un store)
  const isOnline = true

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* ── SECTION HERO : MISSION ACTIVE OU PROCHAINE ── */}
      {missionActive && (
        <div className="driver-card-enter rounded-4xl overflow-hidden mb-8 relative border-2 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)] group"
          style={{
            background: 'linear-gradient(135deg, #0A1520 0%, var(--color-driver-card) 100%)',
          }}>

          {/* Barre de progression colorée en haut */}
          <div className="h-1"
            style={{ background: 'linear-gradient(to right, var(--color-success), rgba(16,185,129,0.2))' }} />

          <div className="p-5 sm:p-7">

            {/* En-tête mission */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-2"
                  style={{
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}>
                  {/* Point pulsant */}
                  <span className="avail-online w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-success)' }} />
                  <span className="text-[11px] font-medium"
                    style={{ color: 'var(--color-success)' }}>
                    Mission en cours
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  #{missionActive.id}
                </p>
              </div>
              {/* Heure de prise en charge */}
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest mb-0.5"
                  style={{ color: 'var(--color-text-muted)' }}>Prise en charge</p>
                <p className="text-lg font-semibold"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                  {formatTimeOnly(missionActive.scheduledDateTime)}
                </p>
              </div>
            </div>

            {/* Trajet — format visuel fort */}
            <div className="flex items-center gap-4 mb-6 p-4 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="w-3 h-3 rounded-full border-2"
                  style={{ borderColor: 'var(--color-driver-accent)', backgroundColor: 'transparent' }} />
                <div className="w-px flex-1 min-h-5"
                  style={{ backgroundColor: 'rgba(59,130,246,0.3)' }} />
                <span className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: 'var(--color-success)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate mb-3"
                  style={{ color: 'var(--color-text-primary)' }}>
                  {missionActive.pickupAddress}
                </p>
                <p className="text-sm font-medium truncate"
                  style={{ color: 'var(--color-text-primary)' }}>
                  {missionActive.dropoffAddress}
                </p>
              </div>
            </div>

            {/* Infos client */}
            <div className="flex items-center gap-4 mb-8 p-5 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {missionActive.customerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-white uppercase tracking-tight">
                  {missionActive.customerName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">
                    {missionActive.price} FCFA
                  </div>
                  <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
                    Cash
                  </div>
                </div>
              </div>
              <a href={getSafePhoneUrl(missionActive.customerPhone)}
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 bg-white/5 border border-white/10 text-blue-400 hover:bg-blue-500 hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
              >
                <Phone size={22} weight="fill" />
              </a>
            </div>

            {/* ── BOUTON D'ACTION WORKFLOW ── */}
            <button
              onClick={() => updateBookingStatus(missionActive.id, 'completed')}
              className="btn-mission w-full py-5 rounded-2xl text-base font-bold transition-all duration-200"
              style={{
                backgroundColor: 'var(--color-success)',
                color: '#000',
                fontSize: '17px',
                letterSpacing: '0.01em',
                boxShadow: '0 4px 24px rgba(16,185,129,0.3)',
              }}>
              Terminer la course →
            </button>

            {/* Bouton secondaire (navigation GPS) */}
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(missionActive.dropoffAddress)}`}
              target="_blank" rel="noopener noreferrer"
              className="btn-mission w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium mt-3 transition-all"
              style={{
                backgroundColor: 'var(--color-driver-surface)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-driver-border)',
              }}>
              <NavigationArrow size={16} weight="bold" className="text-blue-500" />
              Naviguer vers la destination
            </a>

          </div>
        </div>
      )}

      {!missionActive && prochaineMission && (
        <div className="driver-card-enter rounded-2xl overflow-hidden mb-6"
          style={{
            background: 'linear-gradient(135deg, #0C1220 0%, var(--color-driver-card) 55%)',
            border: '1px solid rgba(59,130,246,0.2)',
            boxShadow: '0 0 40px rgba(59,130,246,0.04)',
          }}>

          {/* Barre top bleue */}
          <div className="h-1"
            style={{ background: 'linear-gradient(to right, var(--color-driver-accent), transparent)' }} />

          <div className="p-5 sm:p-7">

            {/* Badge + heure */}
            <div className="flex items-center justify-between mb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: 'var(--color-driver-accent-bg)',
                  border: '1px solid rgba(59,130,246,0.2)',
                }}>
                <Clock size={12} weight="bold" className="text-blue-500" />
                <span className="text-[11px] font-medium" style={{ color: 'var(--color-driver-accent)' }}>
                  Prochaine mission
                </span>
              </div>
              <p className="text-xl font-bold"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-driver-accent)' }}>
                {formatTimeOnly(prochaineMission.scheduledDateTime)}
              </p>
            </div>

            {/* Trajet */}
            <div className="flex items-center gap-4 mb-6 p-4 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="w-3 h-3 rounded-full border-2"
                  style={{ borderColor: 'var(--color-driver-accent)', backgroundColor: 'transparent' }} />
                <div className="w-px flex-1 min-h-5"
                  style={{ backgroundColor: 'rgba(59,130,246,0.3)' }} />
                <span className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: 'var(--color-driver-accent)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate mb-3"
                  style={{ color: 'var(--color-text-primary)' }}>
                  {prochaineMission.pickupAddress}
                </p>
                <p className="text-sm font-medium truncate"
                  style={{ color: 'var(--color-text-primary)' }}>
                  {prochaineMission.dropoffAddress}
                </p>
              </div>
            </div>

            {/* Infos client */}
            <div className="flex items-center gap-4 mb-6 p-4 rounded-xl"
              style={{
                backgroundColor: 'var(--color-driver-surface)',
                border: '1px solid var(--color-driver-border)',
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0"
                style={{
                  backgroundColor: 'rgba(59,130,246,0.12)',
                  color: 'var(--color-driver-accent)',
                }}>
                {prochaineMission.customerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {prochaineMission.customerName}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {prochaineMission.price} FCFA
                </p>
              </div>
              <button
                onClick={() => handleCallClient(prochaineMission.customerPhone)}
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0"
                style={{
                  backgroundColor: 'rgba(59,130,246,0.12)',
                  color: 'var(--color-driver-accent)',
                  border: '1px solid rgba(59,130,246,0.2)',
                }}>
                <Phone size={18} weight="fill" />
              </button>
            </div>

            {/* Bouton d'action */}
            {prochaineMission.status === 'assigned' ? (
              <button
                onClick={() => updateBookingStatus(prochaineMission.id, 'confirmed')}
                className="btn-mission w-full py-5 rounded-2xl text-base font-bold mt-5 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--color-driver-accent)',
                  color: '#fff',
                  fontSize: '17px',
                  boxShadow: '0 4px 24px rgba(59,130,246,0.3)',
                }}>
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Accepter la mission
              </button>
            ) : (
              <button
                onClick={() => updateBookingStatus(prochaineMission.id, 'in_progress')}
                className="btn-mission w-full py-5 rounded-2xl text-base font-bold mt-5 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--color-driver-accent)',
                  color: '#fff',
                  fontSize: '17px',
                  boxShadow: '0 4px 24px rgba(59,130,246,0.3)',
                }}>
                <Play size={20} weight="fill" />
                Démarrer la mission
              </button>
            )}

          </div>
        </div>
      )}

      {!missionActive && !prochaineMission && isOnline && (
        <div className="driver-card-enter rounded-2xl p-8 text-center mb-6"
          style={{
            backgroundColor: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.04) 100%)',
            border: '2px solid rgba(59,130,246,0.3)',
          }}>
          {/* Icône Radar ou Navigation animée */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ 
              backgroundColor: 'rgba(59,130,246,0.15)', 
              boxShadow: '0 0 20px rgba(59,130,246,0.2)'
            }}>
            <NavigationArrow size={28} weight="light" className="text-blue-400" />
          </div>
          <p className="text-lg font-bold mb-2" style={{ color: 'rgba(255,255,255,0.95)' }}>
            En attente de mission
          </p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Vous serez notifié dès qu'une mission vous sera assignée.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── FILE D'ATTENTE ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="driver-card-enter rounded-2xl overflow-hidden"
            style={{
              backgroundColor: 'var(--color-driver-card)',
              border: '1px solid var(--color-driver-border)',
            }}>

            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Missions à venir
              </h3>
              {missionsAVenir.length > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: 'var(--color-driver-accent-bg)',
                    color: 'var(--color-driver-accent)',
                  }}>
                  {missionsAVenir.length} assignée{missionsAVenir.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {missionsAVenir.map((mission, i) => (
                <div key={mission.id}
                  className="px-5 py-5 transition-colors cursor-pointer hover:bg-blue-500/5 group"
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => handleViewDetails(mission)}
                >
                  <div className="flex items-start gap-4">

                    {/* Heure */}
                    <div className="shrink-0 text-center w-14">
                      <p className="text-base font-bold"
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-driver-accent)' }}>
                        {formatTimeOnly(mission.scheduledDateTime)}
                      </p>
                      <p className="text-[9px] uppercase font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        {new Date(mission.scheduledDateTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>

                    {/* Séparateur vertical */}
                    <div className="w-px self-stretch mt-1"
                      style={{ backgroundColor: 'rgba(59,130,246,0.2)' }} />

                    {/* Infos mission */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate mb-0.5"
                        style={{ color: 'var(--color-text-primary)' }}>
                        {mission.customerName}
                      </p>
                      <p className="text-xs truncate mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                        {mission.pickupAddress.split(',')[0]} → {mission.dropoffAddress.split(',')[0]}
                      </p>
                      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <span className="flex items-center gap-1.5"><Users size={12} weight="light" /> 1-4</span>
                        <span className="flex items-center gap-1.5"><Car size={12} weight="light" /> Standard</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between self-stretch">
                      <MissionStatusBadge statut={mission.status} />
                      <CaretRight size={16} weight="bold" className="text-gray-600 group-hover:text-blue-500 transition-colors" />
                    </div>

                  </div>
                </div>
              ))}

              {missionsAVenir.length === 0 && (
                <div className="text-center py-12 px-5">
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    Aucune mission programmée
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Restez disponible pour recevoir de nouvelles missions.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── HISTORIQUE RÉCENT ── */}
          <div className="driver-card-enter rounded-2xl overflow-hidden mt-6"
            style={{
              backgroundColor: 'var(--color-driver-card)',
              border: '1px solid var(--color-driver-border)',
            }}>

            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Historique récent
              </h3>
              <button
                onClick={() => onNavigate('planning')}
                className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-driver-accent)' }}>
                Voir tout →
              </button>
            </div>

            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {historique.map(mission => (
                <div key={mission.id}
                  className="flex items-center gap-4 px-5 py-4 transition-colors cursor-pointer hover:bg-white/2 group"
                  onClick={() => handleViewDetails(mission)}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: mission.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: mission.status === 'completed' ? 'var(--color-success)' : 'var(--color-error)',
                    }}>
                    <CheckCircle size={18} weight="fill" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {mission.pickupAddress.split(',')[0]} → {mission.dropoffAddress.split(',')[0]}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {formatDateTime(mission.scheduledDateTime)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-gold)' }}>
                      {mission.price} FCFA
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <Star size={10} weight="fill" className="fill-yellow-500 text-yellow-500" />
                      <span className="text-[10px] font-bold text-yellow-500">5.0</span>
                    </div>
                  </div>
                </div>
              ))}

              {historique.length === 0 && (
                <div className="text-center py-10 px-5 text-sm text-gray-500">
                  Aucun historique disponible
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS DU JOUR ── */}
        <div className="space-y-6">
          <div className="driver-card-enter space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
                Aujourd'hui
              </p>
              <p className="text-[10px] font-medium"
                style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>

            {[
              {
                label: 'Missions',
                value: stats.weeklyRides,
                icon: <CheckCircle size={18} />,
                color: 'var(--color-success)',
                bg: 'rgba(16,185,129,0.08)',
                textColor: '#10B981',
              },
              {
                label: 'Revenus',
                value: `${stats.earnings.toLocaleString('fr-FR')} FCFA`,
                icon: <Banknote size={18} />,
                color: 'var(--color-gold)',
                bg: 'rgba(201,168,76,0.08)',
                textColor: '#C9A84C',
              },
              {
                label: 'Km parcourus',
                value: '42 km', // Mock value
                icon: <Route size={18} />,
                color: 'var(--color-driver-accent)',
                bg: 'rgba(59,130,246,0.08)',
                textColor: '#3B82F6',
              },
              {
                label: 'Note moyenne',
                value: '4.9/5',
                icon: <Star size={18} weight="fill" />,
                color: '#F59E0B',
                bg: 'rgba(245,158,11,0.08)',
                textColor: '#FBBF24',
              },
            ].map(stat => (
              <div key={stat.label}
                className="flex items-center gap-4 px-4 py-5 rounded-2xl transition-all hover:shadow-lg"
                style={{
                  backgroundColor: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: stat.bg, color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold mt-1.5"
                    style={{ fontFamily: 'var(--font-mono)', color: stat.textColor }}>
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions (Optional but good for mobile) */}
          <div className="driver-card-enter rounded-2xl p-5 space-y-3"
            style={{ backgroundColor: 'var(--color-driver-surface)', border: '1px solid var(--color-driver-border)' }}>
            <p className="text-xs font-bold text-white uppercase tracking-widest mb-3 text-center">Raccourcis</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onNavigate('vehicle-report')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                <Car size={20} weight="light" className="text-blue-400 mb-2" />
                <span className="text-[10px] font-bold text-white">Rapport</span>
              </button>
              <button
                onClick={() => onNavigate('profile')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                <Users size={20} weight="light" className="text-purple-400 mb-2" />
                <span className="text-[10px] font-bold text-white">Profil</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Modal de détails */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-driver-card border border-white/10 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            style={{ color: 'var(--color-text-primary)' }}>

            <div className="p-6 border-b border-white/5">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center font-bold text-xl">
                    {selectedBooking.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Détails Mission</h2>
                    <p className="text-xs text-gray-500 font-mono">#{selectedBooking.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white"
                >
                  ×
                </button>
              </div>

              <div className="flex gap-2">
                <MissionStatusBadge statut={selectedBooking.status} />
                <span className="px-3 py-1 rounded-full bg-white/5 text-[11px] font-bold text-gold tracking-wider">
                  {selectedBooking.price} FCFA
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Itinéraire */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Départ</p>
                    <p className="text-sm font-medium">{selectedBooking.pickupAddress}</p>
                  </div>
                </div>
                <div className="ml-2 w-px h-8 bg-blue-500/30" />
                <div className="flex items-start gap-4">
                  <div className="w-4 h-4 rounded-full bg-green-500 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Arrivée</p>
                    <p className="text-sm font-medium">{selectedBooking.dropoffAddress}</p>
                  </div>
                </div>
              </div>

              {/* Infos Client */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3">Passager</p>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold">{selectedBooking.customerName}</span>
                  <div className="flex gap-2">
                    <a href={getSafePhoneUrl(selectedBooking.customerPhone)} className="p-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
                      <Phone size={18} weight="fill" className="text-white" />
                    </a>
                    <a href={getSafeWhatsAppUrl(selectedBooking.customerPhone)} className="p-3 bg-green-600 hover:bg-green-700 rounded-xl transition-colors">
                      <ChatCircle size={18} weight="fill" className="text-white" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Actions de workflow */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                {selectedBooking.status === 'assigned' && (
                  <button onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-transform">
                    Accepter la mission
                  </button>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <button onClick={() => updateBookingStatus(selectedBooking.id, 'in_progress')}
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-transform">
                    Démarrer la mission
                  </button>
                )}
                {selectedBooking.status === 'in_progress' && (
                  <button onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                    className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-600/20 active:scale-[0.98] transition-transform">
                    Terminer la mission
                  </button>
                )}

                {['assigned', 'confirmed'].includes(selectedBooking.status) && (
                  <button onClick={() => openCancelModal(selectedBooking)}
                    className="w-full py-3 text-red-500 font-bold hover:bg-red-500/10 rounded-2xl transition-colors">
                    Désister / Annuler
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal d'annulation améliorée */}
      <CancelBookingModal
        isOpen={isCancelModalOpen}
        onClose={closeCancelModal}
        onConfirm={handleCancelConfirm}
        bookingId={bookingToCancel?.id}
        customerName={bookingToCancel?.customerName}
        isLoading={isCancelling}
      />
    </div>
  )
}
