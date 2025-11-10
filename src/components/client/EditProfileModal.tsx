"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ImageUploader } from "@/components/ImageUploader"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ProfileData {
  name: string
  email: string
  phone?: string
  image?: string
}

export function EditProfileModal({ isOpen, onClose, onSuccess }: EditProfileModalProps) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    image: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [hasUpdatePermission, setHasUpdatePermission] = useState(true)

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const response = await fetch('/api/client/profile')
        if (response.status === 403) {
          setHasUpdatePermission(false)
          setError("Vous n'avez pas la permission de modifier votre profil.")
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des permissions:', error)
      }
    }
    
    if (isOpen) {
      checkPermissions()
    }
  }, [isOpen])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && session?.user) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
        phone: (session.user as { phone?: string }).phone || "",
        image: (session.user as { image?: string }).image || ""
      })
      setError("")
    }
  }, [isOpen, session])

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError("") // Clear error when user types
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Le nom et l'email sont obligatoires")
      return
    }

    if (formData.email && !formData.email.includes('@')) {
      setError("Veuillez entrer un email valide")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone?.trim() || null,
          image: formData.image?.trim() || null
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Afficher le message de succès
        setSuccessMessage("✅ Votre profil a été mis à jour avec succès !")
        setError("")
        
        // Fermer le modal et recharger après 2 secondes
        setTimeout(() => {
          onSuccess()
          onClose()
          window.location.reload()
        }, 2000)
      } else {
        setError(data.error || "Erreur lors de la mise à jour du profil")
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      setError("Erreur de connexion. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              Modifier mon profil
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Votre nom complet"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Adresse email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="votre.email@exemple.com"
                required
              />
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!hasUpdatePermission}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:dark:bg-slate-600 disabled:cursor-not-allowed"
                placeholder="+33 X XX XX XX XX"
              />
            </div>

            {/* Photo Field */}
            {hasUpdatePermission && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Photo de profil
                </label>
                <ImageUploader
                  currentImage={formData.image || null}
                  onUploadComplete={(url: string) => setFormData(prev => ({ ...prev, image: url }))}
                  label="Photo de profil"
                  className="w-full"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  📷 Format recommandé : JPEG ou PNG, max 10 Mo
                </p>
              </div>
            )}

            {/* Role Field (locked) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Rôle
              </label>
              <div className="relative">
                <input
                  type="text"
                  value="Client"
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                🔒 Ce champ ne peut pas être modifié
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">{successMessage}</p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">La page va se recharger automatiquement...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !!successMessage}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !hasUpdatePermission || !!successMessage}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <span className="text-lg">💾</span>
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info note */}
          {hasUpdatePermission ? (
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <span className="text-lg">ℹ️</span>
                Les modifications seront enregistrées dans la base de données et prendront effet immédiatement
              </p>
            </div>
          ) : (
            <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                Vous n'avez pas la permission de modifier votre profil. Contactez un administrateur pour activer cette fonctionnalité.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
