"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    // Validation côté client
    if (!email.trim()) {
      setError("Veuillez entrer votre adresse email")
      setIsLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError("Veuillez entrer un email valide")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setEmail("")
      } else {
        setError(data.error || "Une erreur s'est produite")
      }
    } catch (error) {
      console.error("Erreur:", error)
      setError("Une erreur inattendue s'est produite")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#1A1A1A] py-8 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-[#1A1A1A] dark:bg-white rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-[#1A1A1A] font-bold text-xl">NX</span>
            </div>
            <h1 className="text-3xl font-bold text-[#A73B3C]">
              Navette Xpress
            </h1>
          </Link>
          <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-white mb-2">
            Réinitialiser le mot de passe
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Entrez votre email pour recevoir les instructions
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-200 dark:border-slate-700">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm">
              <p className="font-semibold mb-2">✓ Email envoyé avec succès !</p>
              <p>
                Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation dans quelques instants.
              </p>
              <p className="mt-2">
                Vérifiez également votre dossier de spam si vous ne le voyez pas.
              </p>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1A1A1A] dark:text-slate-300 mb-2">
                  Adresse email
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#A73B3C] hover:bg-[#8B3032] text-white py-3 px-4 rounded-lg font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => router.push('/auth/signin')}
                className="w-full bg-[#A73B3C] hover:bg-[#8B3032] text-white py-3 px-4 rounded-lg font-semibold text-base transition-all duration-200 shadow-md"
              >
                Retour à la connexion
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Vous vous souvenez de votre mot de passe ?{" "}
              <Link href="/auth/signin" className="text-[#A73B3C] hover:text-[#8B3032] font-semibold">
                Se connecter
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

