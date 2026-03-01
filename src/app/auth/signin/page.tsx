"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Loader2 } from "lucide-react"

function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="min-h-screen flex"
      style={{ backgroundColor: 'var(--color-midnight)', fontFamily: 'var(--font-body)' }}>

      {/* ── PANNEAU GAUCHE DÉCORATIF (hidden mobile) ── */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden flex-col"
        style={{ backgroundColor: '#08080E' }}>

        {/* Orbes flottantes */}
        <div className="orb-float absolute w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            top: '-10%', left: '-15%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 65%)',
            filter: 'blur(40px)',
          }} />
        <div className="orb-float-delay absolute w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{
            bottom: '5%', right: '-20%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 65%)',
            filter: 'blur(50px)',
          }} />

        {/* Motif géométrique discret (grille de points) */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #C9A84C 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />

        {/* Contenu panneau gauche */}
        <div className="relative z-10 flex flex-col h-full px-10 py-12">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-auto transition-opacity hover:opacity-80">
            <div className="w-10 h-10 bg-[#1A1A1A] border border-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">NX</span>
            </div>
            <div>
              <p className="text-lg font-semibold"
                style={{ color: '#F0EDE8' }}>
                Navette <span style={{ color: 'var(--color-gold)' }}>Xpress</span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6B6880' }}>
                Dakar · Service Premium 24h/24
              </p>
            </div>
          </Link>

          {/* Citation centrale */}
          <div className="my-auto">
            <p className="text-4xl leading-tight mb-8"
              style={{
                fontFamily: 'var(--font-display)',
                color: '#E8E4DF',
                fontWeight: 300,
              }}>
              Votre chauffeur privé,{' '}
              <span style={{ color: 'var(--color-gold)', fontStyle: 'italic' }}>
                toujours là
              </span>{' '}
              quand vous en avez besoin.
            </p>

            {/* Témoignage statique */}
            <div className="rounded-2xl p-6"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <svg key={i} width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M10 1l2.39 4.84L18 6.76l-4 3.9.94 5.5L10 13.77 5.06 16.16 6 10.66 2 6.76l5.61-.92L10 1z"
                      fill="var(--color-gold)" />
                  </svg>
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-3"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  color: '#A09CB0',
                  fontWeight: 300,
                }}>
                "Ponctuel, professionnel et véhicule impeccable.
                Mon transfert AIBD s'est passé parfaitement."
              </p>
              <p className="text-xs font-medium" style={{ color: '#6B6880' }}>
                — Aminata D., Dakar
              </p>
            </div>
          </div>

          {/* Stats en bas */}
          <div className="flex gap-12 mt-auto pt-8"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { value: '1 000+', label: 'Transferts' },
              { value: '4.9/5', label: 'Satisfaction' },
              { value: '24h/7', label: 'Disponible' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-xl font-semibold"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-gold)' }}>
                  {stat.value}
                </p>
                <p className="text-[10px] uppercase tracking-widest mt-0.5"
                  style={{ color: '#6B6880' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PANNEAU DROIT : FORMULAIRE ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Orbe subtile mobile (visible seulement sur mobile) */}
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />

        <div className="auth-enter w-full max-w-[420px]">
          {/* Logo mobile */}
          <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden transition-opacity hover:opacity-80">
            <div className="w-8 h-8 bg-white/10 border border-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">NX</span>
            </div>
            <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Navette <span style={{ color: 'var(--color-gold)' }}>Xpress</span>
            </p>
          </Link>

          <div className="mb-10">
            <h1 className="text-3xl mb-3"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-primary)',
                fontWeight: 400,
              }}>
              Bon retour{' '}
              <span style={{ color: 'var(--color-gold)', fontStyle: 'italic' }}>👋</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Connectez-vous pour accéder à votre espace.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-6"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}>
                <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />
                <div className="flex-1">
                  <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
                  {showResetOption && (
                    <Link href="/auth/reset-password"
                      className="inline-block text-xs font-medium mt-2 underline transition-colors"
                      style={{ color: 'var(--color-gold)' }}>
                      Réinitialiser mon mot de passe →
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="mb-5">
              <label htmlFor="email"
                className="block text-[10px] tracking-[0.12em] uppercase mb-2.5"
                style={{ color: 'var(--color-text-secondary)' }}>
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--color-text-muted)' }}>
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div className="mb-7">
              <div className="flex items-center justify-between mb-2.5">
                <label htmlFor="password"
                  className="text-[10px] tracking-[0.12em] uppercase"
                  style={{ color: 'var(--color-text-secondary)' }}>
                  Mot de passe
                </label>
                <Link href="/auth/reset-password"
                  className="text-[10px] transition-colors hover:opacity-80"
                  style={{ color: 'var(--color-gold)' }}>
                  Oublié ?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--color-text-muted)' }}>
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
                  style={{ color: 'var(--color-text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold w-full py-3.5 rounded-xl text-base font-semibold transition-all duration-200"
              style={{ opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Connexion...
                </span>
              ) : (
                'Se connecter →'
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>ou</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
          </div>

          <button
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 mb-8"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--color-text-primary)',
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuer avec Google
          </button>

          <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Pas encore de compte ?{' '}
            <Link href="/auth/signup"
              className="font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--color-gold)' }}>
              Créer un compte
            </Link>
          </p>

          <p className="text-center mt-6">
            <Link href="/"
              className="inline-flex items-center justify-center gap-1.5 text-xs transition-colors hover:opacity-80"
              style={{ color: 'var(--color-text-muted)' }}>
              <ArrowLeft size={12} />
              Retour au site
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-dash-nav-active-border mx-auto" />
          <p className="mt-4 text-[#8A8799] animate-pulse">Chargement...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
