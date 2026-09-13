"use client"

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/navigation"
import { Envelope, CheckCircle, WarningCircle, CircleNotch, ArrowLeft } from "@phosphor-icons/react"

type Status = 'verifying' | 'success' | 'error'

function VerifyEmailContent() {
  const t = useTranslations("auth")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('verifying')
  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams?.get('token')
    if (!token) {
      setStatus('error')
      return
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        setStatus(res.ok ? 'success' : 'error')
      })
      .catch(() => setStatus('error'))
  }, [searchParams])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setResendLoading(true)
    setResendMessage(null)
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
      })
      const data = await res.json().catch(() => ({}))
      setResendMessage(data.message || t('verifyEmail.resendSuccessMessage'))
    } catch {
      setResendMessage(t('verifyEmail.resendSuccessMessage'))
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ backgroundColor: 'var(--color-midnight)', fontFamily: 'var(--font-body)' }}>
      <div className="auth-enter w-full max-w-[440px] text-center">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-10 transition-opacity hover:opacity-80">
          <div className="w-8 h-8 bg-[#1A1A1A] border border-white/10 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">NX</span>
          </div>
          <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Navette <span style={{ color: 'var(--color-gold-deep)' }}>Xpress</span>
          </p>
        </Link>

        {status === 'verifying' && (
          <div className="space-y-4">
            <CircleNotch size={48} className="animate-spin mx-auto" style={{ color: 'var(--color-gold)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t('verifyEmail.verifying')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <CheckCircle size={56} className="mx-auto" style={{ color: 'var(--color-success)' }} />
            <div>
              <h1 className="text-3xl mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)', fontWeight: 400 }}>
                {t('verifyEmail.successHeadingBefore')}{' '}
                <span style={{ color: 'var(--color-gold-deep)', fontStyle: 'italic' }}>{t('verifyEmail.successHeadingHighlight')}</span>
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t('verifyEmail.successMessage')}</p>
            </div>
            <button
              onClick={() => router.push('/auth/signin')}
              className="btn-gold w-full py-3.5 rounded-xl text-base font-semibold transition-all duration-200">
              {t('verifyEmail.goToSigninButton')}
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl text-left"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <WarningCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {t('verifyEmail.errorHeadingBefore')} {t('verifyEmail.errorHeadingHighlight')}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>{t('verifyEmail.errorMessage')}</p>
              </div>
            </div>

            {resendMessage ? (
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{resendMessage}</p>
            ) : (
              <form onSubmit={handleResend} className="space-y-4 text-left">
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold tracking-[0.1em] uppercase" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('verifyEmail.resendLabel')}
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }}>
                      <Envelope size={16} />
                    </div>
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      required
                      className="auth-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
                      style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid rgba(18,16,14,0.14)', color: 'var(--color-text-primary)' }}
                      placeholder={t('verifyEmail.resendPlaceholder')}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="btn-gold w-full py-3.5 rounded-xl text-base font-semibold transition-all duration-200"
                  style={{ opacity: resendLoading ? 0.7 : 1 }}>
                  {resendLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <CircleNotch size={18} className="animate-spin" />
                      {t('verifyEmail.resendLoadingButton')}
                    </span>
                  ) : (
                    t('verifyEmail.resendButton')
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        <p className="text-center mt-10">
          <Link href="/auth/signin"
            className="inline-flex items-center justify-center gap-1.5 text-xs transition-colors hover:opacity-80"
            style={{ color: 'var(--color-text-muted)' }}>
            <ArrowLeft size={12} />
            {t('verifyEmail.backToSignin')}
          </Link>
        </p>
      </div>
    </div>
  )
}

function VerifyEmailFallback() {
  const t = useTranslations("auth")
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-midnight)' }}>
      <div className="text-center">
        <CircleNotch className="animate-spin h-10 w-10 mx-auto" style={{ color: 'var(--color-gold)' }} />
        <p className="mt-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t('verifyEmail.loadingFallback')}</p>
      </div>
    </div>
  )
}

export default function VerifyEmailClient() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
