"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AuthRedirectProps {
  children: React.ReactNode
}

export function AuthRedirect({ children }: AuthRedirectProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (session?.user) {
      // Redirection basée sur le rôle
      const userRole = (session.user as unknown as { role?: string })?.role
      if (userRole === 'admin') {
        router.push("/admin/dashboard")
      } else if (userRole === 'customer') {
        router.push("/client/dashboard")
      } else {
        router.push("/dashboard")
      }
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    )
  }

  return <>{children}</>
}
