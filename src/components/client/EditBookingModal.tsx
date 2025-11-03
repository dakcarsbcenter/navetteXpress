"use client"

import { useState, useEffect } from "react"
import { ConfirmationModal } from "@/components/ui/ConfirmationModal"

interface Booking {
  id: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  pickupAddress: string
  dropoffAddress: string
  scheduledDateTime: string
  status: string
  price?: string
  notes?: string
  createdAt: string
}

interface EditBookingModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking | null
  onSuccess: () => void
}

export function EditBookingModal({ isOpen, onClose, booking, onSuccess }: EditBookingModalProps) {
  const [formData, setFormData] = useState({
    pickupAddress: '',
    dropoffAddress: '',
    scheduledDateTime: '',
    customerPhone: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorModal, setErrorModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' })
  const [successModal, setSuccessModal] = useState(false)

  useEffect(() => {
    if (booking && isOpen) {
      // Convertir la date ISO en format datetime-local
      const dateTime = new Date(booking.scheduledDateTime)
      const localDateTime = new Date(dateTime.getTime() - dateTime.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)

      setFormData({
        pickupAddress: booking.pickupAddress || '',
        dropoffAddress: booking.dropoffAddress || '',
        scheduledDateTime: localDateTime,
        customerPhone: booking.customerPhone || '',
        notes: booking.notes || ''
      })
    }
  }, [booking, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!booking) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/client/bookings/${booking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickupAddress: formData.pickupAddress,
          dropoffAddress: formData.dropoffAddress,
          scheduledDateTime: new Date(formData.scheduledDateTime).toISOString(),
          customerPhone: formData.customerPhone,
          notes: formData.notes
        }),
      })

      const result = await response.json()

      if (result.success) {
        setIsSubmitting(false)
        setSuccessModal(true)
      } else {
        setIsSubmitting(false)
        setErrorModal({
          open: true,
          message: result.error || 'Erreur lors de la mise à jour de la réservation'
        })
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      setIsSubmitting(false)
      setErrorModal({
        open: true,
        message: 'Une erreur est survenue. Veuillez réessayer.'
      })
    }
  }

  if (!isOpen || !booking) return null

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-2xl transition-all w-full max-w-2xl">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Modifier la réservation #{booking.id}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Vous pouvez modifier cette réservation car elle n'est pas encore confirmée
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Adresse de départ *
                </label>
                <input
                  type="text"
                  value={formData.pickupAddress}
                  onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                  placeholder="Ex: Aéroport International Blaise Diagne"
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Adresse de destination *
                </label>
                <input
                  type="text"
                  value={formData.dropoffAddress}
                  onChange={(e) => setFormData({ ...formData, dropoffAddress: e.target.value })}
                  placeholder="Ex: Hôtel Radisson Blu, Dakar"
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date et heure *
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDateTime}
                  onChange={(e) => setFormData({ ...formData, scheduledDateTime: e.target.value })}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Téléphone de contact
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="77 650 01 02"
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Notes / Demandes spéciales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ajoutez des informations supplémentaires..."
                  rows={4}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Important :</strong> Une fois votre réservation confirmée par notre équipe, 
                  vous ne pourrez plus la modifier directement. Contactez le service client si nécessaire.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enregistrement...
                    </span>
                  ) : (
                    'Enregistrer les modifications'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <ConfirmationModal
        isOpen={successModal}
        onClose={() => {
          setSuccessModal(false)
          onSuccess()
          onClose()
        }}
        title="Réservation mise à jour !"
        message="Vos modifications ont été enregistrées avec succès. Notre équipe en sera informée."
        type="success"
        confirmText="Parfait !"
        onConfirm={() => {
          setSuccessModal(false)
          onSuccess()
          onClose()
        }}
      />

      {/* Error Modal */}
      <ConfirmationModal
        isOpen={errorModal.open}
        onClose={() => setErrorModal({ open: false, message: '' })}
        title="Erreur"
        message={errorModal.message}
        type="error"
        confirmText="Fermer"
        onConfirm={() => setErrorModal({ open: false, message: '' })}
      />
    </>
  )
}
