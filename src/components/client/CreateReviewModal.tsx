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

const surfaceStyle = { backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px' }

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
          <Star size={28} weight={isActive ? 'fill' : 'regular'} style={{ color: isActive ? '#F59E0B' : '#E2DACD' }} />
        </button>
      )
    })
  }

  if (!isOpen || !booking) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-[95vw] max-w-lg p-4 sm:p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACD', borderRadius: '6px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold" style={{ color: '#12100E' }}>
            {t('title')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ color: '#6E6A63' }}
          >
            <span className="sr-only">{t('close')}</span>
            <X size={22} />
          </button>
        </div>

        {/* Trip Info */}
        <div className="p-4 mb-6" style={surfaceStyle}>
          <div className="flex items-center gap-2 mb-2">
            <Car size={22} style={{ color: '#1F5245' }} />
            <div className="flex-1">
              <p className="font-medium" style={{ color: '#12100E' }}>
                {booking.pickupAddress} → {booking.dropoffAddress}
              </p>
              <p className="text-sm" style={{ color: '#6E6A63' }}>
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

          <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #E2DACD' }}>
            <User size={18} style={{ color: '#6E6A63' }} />
            <div>
              <p className="font-medium" style={{ color: '#12100E' }}>
                {t('driverLabel')}: {booking.driver.name}
              </p>
              <p className="text-sm" style={{ color: '#6E6A63' }}>
                {booking.driver.email}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3" style={{ color: '#12100E' }}>
              {t('ratingLabel')}
            </label>
            <div className="flex items-center gap-1 mb-2">
              {renderStars()}
            </div>
            <p className="text-sm" style={{ color: '#6E6A63' }}>
              {ratingHints[rating]}
            </p>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: '#12100E' }}>
              {t('commentLabel')}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 outline-none transition-all"
              style={{ backgroundColor: '#F7F3EC', border: '1px solid #E2DACD', borderRadius: '3px', color: '#12100E' }}
              rows={4}
              placeholder={t('commentPlaceholder')}
              maxLength={500}
            />
            <p className="text-xs mt-1" style={{ color: '#6E6A63' }}>
              {t('commentCounter', { count: comment.length })}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3" style={{ backgroundColor: 'rgba(184,73,60,.08)', border: '1px solid rgba(184,73,60,.2)', borderRadius: '3px' }}>
              <p className="text-sm" style={{ color: '#B8493C' }}>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 font-medium transition-colors min-h-[44px]"
              style={{ backgroundColor: '#F7F3EC', color: '#12100E', border: '1px solid #E2DACD', borderRadius: '4px' }}
              disabled={isSubmitting}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 px-4 py-3 font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
              style={{ backgroundColor: '#1F5245', color: '#fff', border: 'none', borderRadius: '4px' }}
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
  )
}
