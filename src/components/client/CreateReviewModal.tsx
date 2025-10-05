"use client"

import { useState, useEffect } from "react"

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
      setError("Veuillez donner une note")
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
        setError(data.error || "Erreur lors de la création de l'avis")
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      setError("Erreur de connexion. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1
      const isActive = starValue <= (hoverRating || rating)
      
      return (
        <button
          key={i}
          type="button"
          className={`text-3xl transition-colors ${
            isActive ? 'text-yellow-400' : 'text-gray-300'
          } hover:text-yellow-400`}
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
        >
          ⭐
        </button>
      )
    })
  }

  if (!isOpen || !booking) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              Évaluer votre trajet
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <span className="sr-only">Fermer</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Trip Info */}
          <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🚗</span>
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
            </div>
            
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
              <span className="text-lg">👤</span>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Chauffeur: {booking.driver.name}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {booking.driver.email}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Comment évaluez-vous ce trajet ?
              </label>
              <div className="flex items-center gap-1 mb-2">
                {renderStars()}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {rating === 0 && "Cliquez sur les étoiles pour noter"}
                {rating === 1 && "Très insatisfaisant"}
                {rating === 2 && "Insatisfaisant"}
                {rating === 3 && "Correct"}
                {rating === 4 && "Satisfaisant"}
                {rating === 5 && "Excellent"}
              </p>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Commentaire (optionnel)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Partagez votre expérience..."
                maxLength={500}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {comment.length}/500 caractères
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Publication...
                  </>
                ) : (
                  <>
                    <span className="text-lg">⭐</span>
                    Publier l'avis
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
