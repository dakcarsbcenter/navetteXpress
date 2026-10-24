import { NextIntlClientProvider } from "next-intl"
import { DriverShell } from "@/components/driver/DriverShell"
import { DriverViewProvider } from "@/context/DriverViewContext"
import { getDashboardLocale } from "@/lib/dashboard-locale"
import { getDashboardMessages } from "@/i18n/dashboard-messages"
import { DashboardRootShell } from "@/components/layout/DashboardRootShell"

export default async function DriverLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const locale = await getDashboardLocale()
    const messages = await getDashboardMessages(locale, ["common", "driver", "statuses"])

    return (
        <DashboardRootShell>
        <NextIntlClientProvider locale={locale} messages={messages}>
            <DriverViewProvider>
                <DriverShell>{children}</DriverShell>
            </DriverViewProvider>
        </NextIntlClientProvider>
        </DashboardRootShell>
    )
}
