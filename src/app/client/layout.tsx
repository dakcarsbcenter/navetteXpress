import ClientSidebar from "@/components/client/ClientSidebar"
import { ClientTopbar } from "@/components/client/ClientTopbar"
import { Suspense } from "react"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
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
