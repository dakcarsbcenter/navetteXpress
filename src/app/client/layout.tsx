"use client"

import ClientSidebar from "@/components/client/ClientSidebar"
import { ClientTopbar } from "@/components/client/ClientTopbar"
import { Suspense } from "react"
import { useTheme } from "@/components/theme-provider"
import { useEffect, useState } from "react"

function ClientLayoutInner({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Force light theme as default for client dashboard if no preference saved
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('nx-theme')
    if (!stored) {
      setTheme('light')
    }
  }, [])

  return (
    <div
      data-theme={mounted ? theme : 'light'}
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--color-client-bg)', fontFamily: 'var(--font-body)' }}
    >
      <Suspense fallback={null}>
        <ClientSidebar />
      </Suspense>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Suspense fallback={null}>
          <ClientTopbar />
        </Suspense>
        <main className="dash-scroll flex-1 overflow-y-auto p-4 pb-24 md:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayoutInner>{children}</ClientLayoutInner>
}
