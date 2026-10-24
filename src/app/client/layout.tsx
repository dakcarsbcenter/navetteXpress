import { NextIntlClientProvider } from "next-intl"
import { getDashboardLocale } from "@/lib/dashboard-locale"
import { getDashboardMessages } from "@/i18n/dashboard-messages"
import { DashboardRootShell } from "@/components/layout/DashboardRootShell"
import { ClientShell } from "@/components/client/ClientShell"

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const locale = await getDashboardLocale()
  const messages = await getDashboardMessages(locale, ["common", "client", "statuses"])

  return (
    <DashboardRootShell>
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ClientShell>{children}</ClientShell>
    </NextIntlClientProvider>
    </DashboardRootShell>
  )
}
