"use client"

import { useState, useEffect } from "react"

interface QuickSignupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  prefillData?: {
    name?: string
    email?: string
    phone?: string
  }
}

export function QuickSignupModal({ isOpen, onClose, prefillData }: QuickSignupModalProps) {
  const [formData, setFormData] = useState({
    name: prefillData?.name || "",
    email: prefillData?.email || "",
    password: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [registered, setRegistered] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      setIsLoading(false)
      return
    }

    if (formData.name.trim().length < 2) {
      setError("Le nom doit contenir au moins 2 caractères")
      setIsLoading(false)
      return
    }

    try {
      // Créer le compte utilisateur
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const registerData = await registerResponse.json()

      if (!registerResponse.ok) {
        console.error("Erreur d'inscription:", registerData)
        if (registerData.details) {
          // Afficher les erreurs de validation spécifiques
          const errorMessages = []
          if (registerData.details.name) errorMessages.push("Nom: " + registerData.details.name.join(", "))
          if (registerData.details.email) errorMessages.push("Email: " + registerData.details.email.join(", "))
          if (registerData.details.password) errorMessages.push("Mot de passe: " + registerData.details.password.join(", "))
          setError(errorMessages.length > 0 ? errorMessages.join(" • ") : registerData.error)
        } else {
            if (registerData.error === "Un compte avec cet email existe déjà") {
              setError("Vous avez déjà un compte, veuillez vous connecter.")
            } else {
              setError(registerData.error || "Erreur lors de la création du compte")
            }
        }
        return
      }

      // Le compte reste inactif tant que l'email n'est pas confirmé : pas de
      // connexion automatique, on affiche l'écran "vérifiez votre boîte mail"
      // et on laisse l'utilisateur continuer sa réservation en tant qu'invité.
      setRegistered(true)
    } catch (error) {
      setError("Une erreur est survenue")
      console.error("Erreur:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Gérer la fermeture avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              Créer un compte pour finaliser votre réservation
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <span className="sr-only">Fermer</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {registered ? (
            <div className="text-center py-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
                <p className="text-green-800 dark:text-green-200 text-sm flex items-center gap-2 justify-center">
                  <span className="text-lg">✉️</span>
                  Compte créé ! Un email d&apos;activation vient de vous être envoyé.
                </p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Cliquez sur le lien reçu par email pour activer votre compte. Vous pouvez continuer votre réservation en tant qu&apos;invité en attendant.
              </p>
              <button
                onClick={() => { setRegistered(false); onClose() }}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Continuer ma réservation
              </button>
            </div>
          ) : (
            <>
                {error && (
                  <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Nom complet
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
                      placeholder="Jean Dupont"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Mot de passe
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Confirmer le mot de passe
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                    >
                      {isLoading ? "Création..." : "Créer mon compte"}
                    </button>
                  </div>
                </form>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
            En créant un compte, vous pourrez suivre vos réservations et accéder à des fonctionnalités avancées.
          </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
