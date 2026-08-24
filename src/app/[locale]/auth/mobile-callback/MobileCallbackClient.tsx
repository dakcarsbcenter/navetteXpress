'use client'

import { CircleNotch } from '@phosphor-icons/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useEffect, Suspense } from 'react'

function getSafeNextPath(rawNext: string | null): string {
  if (!rawNext) {
    return '/dashboard'
  }

  if (!rawNext.startsWith('/') || rawNext.startsWith('//')) {
    return '/dashboard'
  }

  return rawNext
}

function MobileOAuthCallbackContent() {
  const t = useTranslations('auth')
  // This page is a pure OAuth redirect relay driven by the NextAuth mobile
  // flow. Every destination here is either an out-of-scope, unlocalized
  // route ("/dashboard" and whatever dynamic "next" path the native app
  // supplies) or the documented "/auth/signin" exception (see
  // src/lib/auth.ts authOptions.pages.signIn), which always resolves at its
  // bare, unprefixed path regardless of locale. The routing logic is left
  // untouched intentionally — only the loading text below is translated.
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()

  useEffect(() => {
    const oauthError = searchParams.get('error')

    if (oauthError) {
      router.replace(`/auth/signin?error=${encodeURIComponent(oauthError)}`)
      return
    }

    if (status === 'authenticated') {
      const nextPath = getSafeNextPath(searchParams.get('next'))
      router.replace(nextPath)
      return
    }

    if (status === 'unauthenticated') {
      router.replace('/auth/signin?error=OAuthCallbackFailed')
    }
  }, [router, searchParams, status])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
      <div className="text-center">
        <CircleNotch className="animate-spin h-10 w-10 text-dash-nav-active-border mx-auto" weight="bold" />
        <p className="mt-4 text-[#8A8799] animate-pulse">{t('mobileCallback.loadingText')}</p>
      </div>
    </div>
  )
}

export default function MobileCallbackClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <CircleNotch className="animate-spin h-10 w-10 text-[#8A8799]" weight="bold" />
      </div>
    }>
      <MobileOAuthCallbackContent />
    </Suspense>
  )
}
