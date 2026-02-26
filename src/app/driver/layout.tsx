import DriverSidebar from "@/components/driver/DriverSidebar"
import { DriverTopbar } from "@/components/driver/DriverTopbar"
import { DriverViewProvider } from "@/context/DriverViewContext"

export default function DriverLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <DriverViewProvider>
            <div className="flex h-screen overflow-hidden"
                style={{ backgroundColor: 'var(--color-driver-bg)', fontFamily: 'var(--font-body)' }}>

                <DriverSidebar />

                <div className="flex-1 flex flex-col overflow-hidden">
                    <DriverTopbar />
                    <main className="flex-1 overflow-y-auto dash-scroll p-5 lg:p-6">
                        {children}
                    </main>
                </div>

            </div>
        </DriverViewProvider>
    )
}
