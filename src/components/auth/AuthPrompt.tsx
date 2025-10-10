"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { QuickSignupModal } from "./QuickSignupModal"

interface AuthPromptProps {
  onAuthSuccess: () => void
  prefillData?: {
    name?: string
    email?: string
    phone?: string
  }
}

export function AuthPrompt({ onAuthSuccess, prefillData }: AuthPromptProps) {
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showSigninForm, setShowSigninForm] = useState(false)
  const [signinData, setSigninData] = useState({ email: "", password: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const getErrorMessage = (errorType: string): string => {
    switch (errorType) {
      case 'CredentialsSignin':
      case 'UserNotFound':
      case 'InvalidPassword':
      case 'NoPassword':
        return "Votre email ou mot de passe est incorrect"
      case 'CredentialsMissing':
        return "Veuillez remplir tous les champs"
      case 'ServerError':
        return "Une erreur serveur s'est produite, veuillez réessayer"
      case 'Configuration':
        return "Erreur de configuration du système"
      case 'AccessDenied':
        return "Accès refusé"
      case 'Verification':
        return "Email non vérifié"
      default:
        return "Une erreur de connexion s'est produite"
    }
  }

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validation côté client
    if (!signinData.email.trim() || !signinData.password.trim()) {
      setError("Veuillez remplir tous les champs")
      setIsLoading(false)
      return
    }

    if (!signinData.email.includes('@')) {
      setError("Veuillez entrer un email valide")
      setIsLoading(false)
      return
    }

    try {
      const result = await signIn("credentials", {
        email: signinData.email.trim(),
        password: signinData.password,
        redirect: false,
      })

      if (result?.error) {
        console.error("Erreur NextAuth:", result.error)
        setError(getErrorMessage(result.error))
      } else if (result?.ok) {
        onAuthSuccess()
        setShowSigninForm(false)
      } else {
        setError("Une erreur de connexion s'est produite")
      }
    } catch (error) {
      console.error("Erreur:", error)
      setError("Une erreur inattendue s'est produite")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignupSuccess = () => {
    onAuthSuccess()
    setShowSignupModal(false)
  }

  if (showSigninForm) {
    return (
      <div className="mb-8 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Connectez-vous à votre compte
          </h3>
          <button
            onClick={() => setShowSigninForm(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={signinData.email}
              onChange={(e) => setSigninData({ ...signinData, email: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={signinData.password}
              onChange={(e) => setSigninData({ ...signinData, password: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="••••••••"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSigninForm(false)
                setShowSignupModal(true)
              }}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Créer un compte
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="text-center">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            🚀 Accélérez votre réservation
          </h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
            Connectez-vous ou créez un compte pour un processus plus rapide et un suivi de vos réservations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowSigninForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              J&apos;ai déjà un compte
            </button>
            <button
              onClick={() => setShowSignupModal(true)}
              className="border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Créer un compte
            </button>
          </div>
          
          <button
            onClick={() => {}}
            className="mt-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm underline"
          >
            Continuer sans compte
          </button>
        </div>
      </div>

      <QuickSignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={handleSignupSuccess}
        prefillData={prefillData}
      />
    </>
  )
}
