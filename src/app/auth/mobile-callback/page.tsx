'use client'

import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

function getSafeNextPath(rawNext: string | null): string {
  if (!rawNext) {
    return '/dashboard'
  }

  if (!rawNext.startsWith('/') || rawNext.startsWith('//')) {
    return '/dashboard'
  }

  return rawNext
}

export default function MobileOAuthCallbackPage() {
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
        <Loader2 className="animate-spin h-10 w-10 text-dash-nav-active-border mx-auto" />
        <p className="mt-4 text-[#8A8799] animate-pulse">Verification de la connexion...</p>
      </div>
    </div>
  )
}
