import { NextIntlClientProvider } from "next-intl"
import { getDashboardLocale } from "@/lib/dashboard-locale"
import { getDashboardMessages } from "@/i18n/dashboard-messages"
import { AdminShell } from "@/components/admin/AdminShell"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getDashboardLocale()
  const messages = await getDashboardMessages(locale, ["common", "admin", "statuses"])

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AdminShell>{children}</AdminShell>
    </NextIntlClientProvider>
  )
}
