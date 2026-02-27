"use client"

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { Lock, Eye, EyeSlash, ArrowLeft, WarningCircle, CircleNotch, ShieldCheck, CheckCircle } from "@phosphor-icons/react"
import Link from "next/link"

function ConfirmResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successOpen, setSuccessOpen] = useState(false)

  useEffect(() => {
    const t = searchParams?.get('token') ?? null
    setToken(t)
    if (!t) {
      setError('Lien invalide ou expiré. Veuillez recommencer la procédure.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('Lien invalide. Recommencez la procédure de réinitialisation.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Impossible de réinitialiser le mot de passe')
        return
      }
      setSuccessOpen(true)
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-midnight)', fontFamily: 'var(--font-body)' }}>

      {/* ── PANNEAU GAUCHE DÉCORATIF (hidden mobile) ── */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden flex-col" style={{ backgroundColor: '#08080E' }}>
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

        <div className="relative z-10 flex flex-col h-full px-10 py-12">
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(201,168,76,0.3)]">
              <span className="text-midnight font-bold text-lg">NX</span>
            </div>
            <p className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Navette <span style={{ color: 'var(--color-gold)' }}>Xpress</span>
            </p>
          </div>

          <div className="my-auto">
            <h2 className="text-4xl leading-tight mb-8"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-primary)',
                fontWeight: 300,
              }}>
              Reprenez le{' '}
              <span style={{ color: 'var(--color-gold)', fontStyle: 'italic' }}>contrôle</span>{' '}
              de votre compte.
            </h2>
            <div className="p-6 rounded-2xl bg-surface/30 border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-4 mb-4">
                <ShieldCheck size={24} className="text-gold" />
                <p className="text-sm font-bold uppercase tracking-widest text-gold">Sécurité Activée</p>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Votre compte est protégé par notre système de sécurité multicouche. Choisissez un mot de passe complexe pour une protection maximale.
              </p>
            </div>
          </div>

          <div className="mt-auto py-8 border-t border-white/5 opacity-50">
            <p className="text-[10px] uppercase tracking-widest">Dernière connexion détectée: Dakar, Sénégal</p>
          </div>
        </div>
      </div>

      {/* ── PANNEAU DROIT : FORMULAIRE ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden bg-midnight">
        <div className="lg:hidden absolute top-0 right-1 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />

        <div className="auth-enter w-full max-w-[420px] relative z-10">

          <div className="mb-10">
            <h1 className="text-4xl mb-3"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-primary)',
                fontWeight: 400,
              }}>
              Nouveau{' '}
              <span style={{ color: 'var(--color-gold)', fontStyle: 'italic' }}>départ</span>
            </h1>
            <p className="text-text-secondary">
              Définissez votre nouveau mot de passe sécurisé.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 px-4 py-4 rounded-2xl mb-6 shadow-lg shadow-error/10"
              style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}>
              <WarningCircle size={20} className="text-error shrink-0 mt-0.5" />
              <p className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] tracking-[0.15em] uppercase font-bold ml-1" style={{ color: 'var(--color-text-secondary)' }}>
                Nouveau mot de passe
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 group-within:text-gold"
                  style={{ color: 'var(--color-text-muted)' }}>
                  <Lock size={20} weight="thin" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimum 8 caractères"
                  className="w-full pl-12 pr-12 py-4 rounded-xl text-sm outline-none transition-all duration-300 bg-surface border-border focus:border-gold/50 focus:bg-surface-2"
                  style={{ color: 'var(--color-text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-gold"
                  style={{ color: 'var(--color-text-muted)' }}>
                  {showPassword ? <EyeSlash size={20} weight="thin" /> : <Eye size={20} weight="thin" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] tracking-[0.15em] uppercase font-bold ml-1" style={{ color: 'var(--color-text-secondary)' }}>
                Confirmer le mot de passe
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 group-within:text-gold"
                  style={{ color: 'var(--color-text-muted)' }}>
                  <Lock size={20} weight="thin" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-sm outline-none transition-all duration-300 bg-surface border-border focus:border-gold/50 focus:bg-surface-2"
                  style={{ color: 'var(--color-text-primary)' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="btn-gold w-full py-4 rounded-xl text-base font-bold shadow-[0_10px_30px_rgba(201,168,76,0.15)] flex items-center justify-center gap-3 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <CircleNotch size={20} className="animate-spin" />
                  <span>En cours...</span>
                </>
              ) : (
                <>
                  <span>Mettre à jour</span>
                  <ShieldCheck size={20} weight="bold" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <Link href="/auth/signin"
              className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:text-white"
              style={{ color: 'var(--color-text-muted)' }}>
              <ArrowLeft size={14} weight="bold" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Succès */}
      <ConfirmationModal
        isOpen={successOpen}
        onClose={() => router.push('/auth/signin')}
        title="Mot de passe mis à jour"
        message="Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter."
        type="success"
        confirmText="Se connecter"
        onConfirm={() => router.push('/auth/signin')}
      />
    </div>
  )
}

export default function ConfirmResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-midnight">
        <div className="text-center space-y-4">
          <CircleNotch size={48} className="animate-spin text-gold mx-auto" />
          <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-gold/60">Sécurisation...</p>
        </div>
      </div>
    }>
      <ConfirmResetPasswordContent />
    </Suspense>
  )
}
