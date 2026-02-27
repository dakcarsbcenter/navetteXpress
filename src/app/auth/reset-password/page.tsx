"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, ArrowLeft, AlertCircle, Loader2, Send, CheckCircle2 } from "lucide-react"

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

    if (!email.trim() || !email.includes('@')) {
      setError("Veuillez entrer un email valide")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (response.ok) {
        setSuccess(true)
        setEmail("")
      } else {
        const data = await response.json()
        setError(data.error || "Une erreur s'est produite lors de la demande.")
      }
    } catch (error) {
      console.error("Erreur Reset Password:", error)
      setError("Une erreur inattendue s'est produite. Veuillez réessayer.")
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

        {/* Motif géométrique discret */}
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
                style={{ color: 'var(--color-text-primary)' }}>
                Navette <span style={{ color: 'var(--color-gold)' }}>Xpress</span>
              </p>
            </div>
          </Link>

          {/* Slogan central */}
          <div className="my-auto">
            <p className="text-4xl leading-tight mb-8"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-primary)',
                fontWeight: 300,
              }}>
              Sécurité et{' '}
              <span style={{ color: 'var(--color-gold)', fontStyle: 'italic' }}>
                confidentialité
              </span>{' '}
              avant tout.
            </p>
            <p className="text-sm font-light leading-relaxed max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Nous utilisons des protocoles de chiffrement de pointe pour garantir la protection de vos données personnelles et de vos accès.
            </p>
          </div>

          {/* Badge de sécurité */}
          <div className="mt-auto flex items-center gap-3 py-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center border border-white/10"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              Connexion SSL 256-bit sécurisée
            </p>
          </div>
        </div>
      </div>

      {/* ── PANNEAU DROIT : FORMULAIRE ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Orbe subtile mobile */}
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />

        <div className="auth-enter w-full max-w-[420px]">
          {/* Logo mobile */}
          <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden text-center justify-center transition-opacity hover:opacity-80">
            <div className="w-8 h-8 bg-white/10 border border-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">NX</span>
            </div>
            <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Navette <span style={{ color: 'var(--color-gold)' }}>Xpress</span>
            </p>
          </Link>

          {!success ? (
            <>
              <div className="mb-10 text-center lg:text-left">
                <h1 className="text-3xl mb-3"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--color-text-primary)',
                    fontWeight: 400,
                  }}>
                  Mot de passe{' '}
                  <span style={{ color: 'var(--color-gold)', fontStyle: 'italic' }}>oublié ?</span>
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Renseignez votre email et nous vous enverrons un lien de réinitialisation sécurisé.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-6"
                    style={{
                      backgroundColor: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                    }}>
                    <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
                  </div>
                )}

                <div className="space-y-2">
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-gold w-full py-4 rounded-xl text-base font-semibold transition-all duration-200"
                  style={{ opacity: isLoading ? 0.7 : 1 }}>
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Traitement...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Envoyer le lien <Send size={16} />
                    </span>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.2)' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--color-success)' }} />
              </div>
              <h2 className="text-2xl mb-3"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-text-primary)',
                  fontWeight: 400,
                }}>
                Email <span style={{ color: 'var(--color-gold)', fontStyle: 'italic' }}>envoyé !</span>
              </h2>
              <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                Si un compte est associé à cette adresse, vous recevrez un lien de réinitialisation dans quelques instants.
              </p>
              <button
                onClick={() => router.push('/auth/signin')}
                className="btn-gold w-full py-3.5 rounded-xl text-sm font-semibold mb-4"
              >
                Retour à la connexion
              </button>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Vous n'avez rien reçu ? Vérifiez vos spams ou{' '}
                <button
                  onClick={() => setSuccess(false)}
                  className="font-medium underline hover:opacity-80"
                  style={{ color: 'var(--color-gold)' }}>
                  réessayez
                </button>
              </p>
            </div>
          )}

          {!success && (
            <div className="mt-10 text-center">
              <Link href="/auth/signin"
                className="inline-flex items-center justify-center gap-2 text-xs transition-colors hover:opacity-80"
                style={{ color: 'var(--color-text-muted)' }}>
                <ArrowLeft size={14} />
                Retour à la connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
