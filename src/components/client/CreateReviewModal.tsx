"use client"

import { useState, useEffect } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toIntlLocale } from "@/lib/intl-locale"
import { X, Star, Car, User } from "@phosphor-icons/react"

interface Booking {
  id: number
  pickupAddress: string
  dropoffAddress: string
  scheduledDateTime: string
  driver: {
    id: string
    name: string
    email: string
  }
}

interface CreateReviewModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking | null
  onSuccess: () => void
}

export function CreateReviewModal({ isOpen, onClose, booking, onSuccess }: CreateReviewModalProps) {
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)
  const t = useTranslations('client.createReview')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setRating(0)
      setHoverRating(0)
      setComment("")
      setError("")
    }
  }, [isOpen])

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!booking) return

    if (rating === 0) {
      setError(t('ratingRequired'))
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch('/api/client/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          rating,
          comment: comment.trim() || null
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onSuccess()
        onClose()
      } else {
        setError(data.error || t('submitError'))
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      setError(t('connectionError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const ratingHints: Record<number, string> = {
    0: t('ratingHint0'),
    1: t('ratingHint1'),
    2: t('ratingHint2'),
    3: t('ratingHint3'),
    4: t('ratingHint4'),
    5: t('ratingHint5'),
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1
      const isActive = starValue <= (hoverRating || rating)

      return (
        <button
          key={i}
          type="button"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
        >
          <Star size={28} weight={isActive ? 'fill' : 'regular'} style={{ color: isActive ? '#F59E0B' : 'var(--color-client-border)' }} />
        </button>
      )
    })
  }

  if (!isOpen || !booking) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-[95vw] max-w-lg transform overflow-hidden rounded-2xl p-4 sm:p-6 text-left transition-all"
          style={{ backgroundColor: 'var(--color-client-card)', border: '1px solid var(--color-client-border)' }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>
              {t('title')}
            </h3>
            <button
              onClick={onClose}
              className="transition-colors"
              style={{ color: 'var(--color-client-text-secondary)' }}
            >
              <span className="sr-only">{t('close')}</span>
              <X size={22} />
            </button>
          </div>

          {/* Trip Info */}
          <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Car size={22} style={{ color: 'var(--color-client-accent)' }} />
              <div className="flex-1">
                <p className="font-medium" style={{ color: 'var(--color-client-text-primary)' }}>
                  {booking.pickupAddress} → {booking.dropoffAddress}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-client-text-secondary)' }}>
                  {new Date(booking.scheduledDateTime).toLocaleDateString(intlLocale, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-client-border)' }}>
              <User size={18} style={{ color: 'var(--color-client-text-secondary)' }} />
              <div>
                <p className="font-medium" style={{ color: 'var(--color-client-text-primary)' }}>
                  {t('driverLabel')}: {booking.driver.name}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-client-text-secondary)' }}>
                  {booking.driver.email}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-client-text-primary)' }}>
                {t('ratingLabel')}
              </label>
              <div className="flex items-center gap-1 mb-2">
                {renderStars()}
              </div>
              <p className="text-sm" style={{ color: 'var(--color-client-text-secondary)' }}>
                {ratingHints[rating]}
              </p>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-client-text-primary)' }}>
                {t('commentLabel')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg outline-none transition-all"
                style={{ backgroundColor: 'var(--color-client-surface)', border: '1px solid var(--color-client-border)', color: 'var(--color-client-text-primary)' }}
                rows={4}
                placeholder={t('commentPlaceholder')}
                maxLength={500}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-client-text-secondary)' }}>
                {t('commentCounter', { count: comment.length })}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors min-h-[44px]"
                style={{ backgroundColor: 'var(--color-client-surface)', color: 'var(--color-client-text-primary)', border: '1px solid var(--color-client-border)' }}
                disabled={isSubmitting}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-client-accent)', color: '#fff' }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('publishing')}
                  </>
                ) : (
                  <>
                    <Star size={16} weight="fill" />
                    {t('publish')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
