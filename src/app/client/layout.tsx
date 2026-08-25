import { NextIntlClientProvider } from "next-intl"
import { getDashboardLocale } from "@/lib/dashboard-locale"
import { getDashboardMessages } from "@/i18n/dashboard-messages"
import { ClientLayoutInner } from "./ClientLayoutInner"

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const locale = await getDashboardLocale()
  const messages = await getDashboardMessages(locale, ["common"])

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ClientLayoutInner>{children}</ClientLayoutInner>
    </NextIntlClientProvider>
  )
}
