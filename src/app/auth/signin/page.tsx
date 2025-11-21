"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [showResetOption, setShowResetOption] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Gestion des erreurs depuis les paramètres URL
  useEffect(() => {
    const urlError = searchParams?.get('error')
    if (urlError) {
      setError(getErrorMessage(urlError))
    }
  }, [searchParams])

  const getErrorMessage = (errorType: string): string => {
    // Gérer les erreurs avec informations supplémentaires
    if (errorType.startsWith('InvalidPassword:')) {
      const attemptsRemaining = errorType.split(':')[1]
      setShowResetOption(true)
      return `Mot de passe incorrect. Il vous reste ${attemptsRemaining} tentative(s) avant le blocage du compte.`
    }
    
    if (errorType.startsWith('AccountLocked:')) {
      const minutesRemaining = errorType.split(':')[1]
      setShowResetOption(true)
      return `Compte temporairement bloqué après 3 tentatives échouées. Réessayez dans ${minutesRemaining} minute(s) ou réinitialisez votre mot de passe.`
    }
    
    switch (errorType) {
      case 'AccountLockedAfter3Attempts':
        setShowResetOption(true)
        return "Compte bloqué après 3 tentatives échouées. Veuillez réinitialiser votre mot de passe ou réessayer dans 15 minutes."
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validation côté client
    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs")
      setIsLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError("Veuillez entrer un email valide")
      setIsLoading(false)
      return
    }

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      })

      if (result?.error) {
        console.error("Erreur NextAuth:", result.error)
        setError(getErrorMessage(result.error))
        
        // Incrémenter le compteur de tentatives échouées
        const newAttempts = failedAttempts + 1
        setFailedAttempts(newAttempts)
        
        // Afficher l'option de réinitialisation après 2 tentatives
        if (newAttempts >= 2) {
          setShowResetOption(true)
        }
      } else if (result?.ok) {
        // Réinitialiser le compteur en cas de succès
        setFailedAttempts(0)
        setShowResetOption(false)
        // Redirection automatique basée sur le rôle
        // Le middleware s'occupera de la redirection
        router.push("/dashboard")
      } else {
        setError("Une erreur de connexion s'est produite")
        const newAttempts = failedAttempts + 1
        setFailedAttempts(newAttempts)
        if (newAttempts >= 2) {
          setShowResetOption(true)
        }
      }
    } catch (error) {
      console.error("Erreur:", error)
      setError("Une erreur inattendue s'est produite")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError("")
    try {
      const result = await signIn("google", { 
        callbackUrl: "/dashboard",
        redirect: false 
      })
      
      if (result?.error) {
        console.error("Erreur Google SignIn:", result.error)
        setError("Erreur lors de la connexion avec Google. Veuillez réessayer.")
      } else if (result?.ok) {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Erreur Google SignIn:", error)
      setError("Erreur lors de la connexion avec Google. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#1A1A1A] py-8 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#1A1A1A] dark:bg-white rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-[#1A1A1A] font-bold text-xl">NX</span>
            </div>
            <h1 className="text-3xl font-bold text-[#A73B3C]">
              Navette Xpress
            </h1>
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-white mb-2">
            Ravi de vous revoir
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Entrez vos coordonnées pour accéder à votre compte.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-200 dark:border-slate-700">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
              {showResetOption && (
                <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-700">
                  <p className="text-sm font-medium mb-2">
                    Vous avez oublié votre mot de passe ?
                  </p>
                  <Link 
                    href="/auth/reset-password"
                    className="inline-block text-sm text-[#A73B3C] hover:text-[#8B3032] font-semibold underline"
                  >
                    Réinitialiser mon mot de passe →
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1A1A1A] dark:text-slate-300 mb-2">
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#A73B3C] focus:border-[#A73B3C] dark:bg-slate-700 dark:text-white transition-all"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-[#1A1A1A] dark:text-slate-300">
                  Mot de passe
                </label>
                <Link
                  href="/auth/reset-password"
                  className="text-sm text-[#A73B3C] hover:text-[#8B3032] font-medium"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#A73B3C] focus:border-[#A73B3C] dark:bg-slate-700 dark:text-white transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 text-[#A73B3C] border-slate-300 rounded focus:ring-[#A73B3C] focus:ring-2"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                Se souvenir de moi
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#A73B3C] hover:bg-[#8B3032] text-white py-3 px-4 rounded-lg font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="mt-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white dark:bg-slate-800 text-slate-500">Ou continuer avec</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="mt-5 w-full bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 px-4 rounded-lg font-medium text-base transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Pas encore de compte ?{" "}
              <Link href="/auth/signup" className="text-[#A73B3C] hover:text-[#8B3032] font-semibold">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        {/* Pied de page */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © 2025 Navette Xpress. Politique de confidentialité
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#1A1A1A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A73B3C] mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
