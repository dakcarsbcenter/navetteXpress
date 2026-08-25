import { NextIntlClientProvider } from "next-intl"
import DriverSidebar from "@/components/driver/DriverSidebar"
import { DriverTopbar } from "@/components/driver/DriverTopbar"
import { DriverViewProvider } from "@/context/DriverViewContext"
import { getDashboardLocale } from "@/lib/dashboard-locale"
import { getDashboardMessages } from "@/i18n/dashboard-messages"

export default async function DriverLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const locale = await getDashboardLocale()
    const messages = await getDashboardMessages(locale, ["common", "driver"])

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <DriverViewProvider>
                <div className="flex h-screen overflow-hidden bg-(--bg-primary)" style={{ fontFamily: 'var(--font-body)' }}>

                    <DriverSidebar />

                    <div className="flex-1 flex flex-col overflow-hidden">
                        <DriverTopbar />
                        <main className="dash-scroll flex-1 overflow-y-auto p-4 pb-24 md:p-5 lg:p-6">
                            {children}
                        </main>
                    </div>

                </div>
            </DriverViewProvider>
        </NextIntlClientProvider>
    )
}
