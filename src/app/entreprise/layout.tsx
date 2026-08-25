import { NextIntlClientProvider } from "next-intl"
import { getDashboardLocale } from "@/lib/dashboard-locale"
import { getDashboardMessages } from "@/i18n/dashboard-messages"

export default async function EntrepriseLayout({ children }: { children: React.ReactNode }) {
  const locale = await getDashboardLocale()
  const messages = await getDashboardMessages(locale, ["common", "entreprise"])

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div data-theme="light" className="min-h-screen bg-background font-archivo">
        {children}
      </div>
    </NextIntlClientProvider>
  )
}
